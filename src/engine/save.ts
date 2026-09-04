import { GENERATOR_BY_ID, UPGRADE_BY_ID } from './data';
import { createInitialState, SAVE_VERSION } from './engine';
import { ENTITLEMENT_IDS } from './shop';
import { maxLevel, STARDUST_UPGRADE_BY_ID } from './stardust';
import { GameState } from './types';

export const SAVE_KEY = 'hvezdny-dul.save';

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/**
 * Načte uložený stav. Neznámé nebo poškozené hodnoty nahradí výchozími,
 * neznámé generátory a vylepšení (např. z budoucí verze) zahodí.
 * Vrací null, když data nejdou rozumně přečíst.
 */
export function deserialize(raw: string | null | undefined, now: number = Date.now()): GameState | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const data = parsed as Record<string, unknown>;
  const base = createInitialState(now);

  const generators: Record<string, number> = {};
  if (data.generators && typeof data.generators === 'object') {
    for (const [id, count] of Object.entries(data.generators as Record<string, unknown>)) {
      if (GENERATOR_BY_ID[id]) generators[id] = Math.floor(finiteNumber(count, 0));
    }
  }

  const upgrades = Array.isArray(data.upgrades)
    ? Array.from(new Set(data.upgrades.filter((id): id is string => typeof id === 'string' && !!UPGRADE_BY_ID[id])))
    : [];

  const entitlements = Array.isArray(data.entitlements)
    ? Array.from(new Set(data.entitlements.filter((id): id is string => typeof id === 'string' && ENTITLEMENT_IDS.includes(id))))
    : [];

  const stardustUpgrades: Record<string, number> = {};
  if (data.stardustUpgrades && typeof data.stardustUpgrades === 'object') {
    for (const [id, level] of Object.entries(data.stardustUpgrades as Record<string, unknown>)) {
      const def = STARDUST_UPGRADE_BY_ID[id];
      if (!def) continue;
      const clamped = Math.min(maxLevel(def), Math.floor(finiteNumber(level, 0)));
      if (clamped > 0) stardustUpgrades[id] = clamped;
    }
  }
  const stardust = Math.floor(finiteNumber(data.stardust, base.stardust));

  return {
    version: SAVE_VERSION,
    crystals: finiteNumber(data.crystals, base.crystals),
    runCrystals: finiteNumber(data.runCrystals, base.runCrystals),
    allTimeCrystals: finiteNumber(data.allTimeCrystals, base.allTimeCrystals),
    generators,
    upgrades,
    entitlements,
    stardust,
    // Starší uložení pole nemají – získaný prach je pak aspoň aktuální zůstatek.
    stardustEarned: Math.max(stardust, Math.floor(finiteNumber(data.stardustEarned, 0))),
    stardustUpgrades,
    prestigeCount: Math.floor(finiteNumber(data.prestigeCount, base.prestigeCount)),
    clicks: Math.floor(finiteNumber(data.clicks, base.clicks)),
    lastSeenAt: finiteNumber(data.lastSeenAt, now),
    startedAt: finiteNumber(data.startedAt, now),
    playTimeSeconds: finiteNumber(data.playTimeSeconds, 0),
  };
}
