import {
  GENERATORS,
  GENERATOR_BY_ID,
  OFFLINE_CAP_SECONDS,
  OFFLINE_EFFICIENCY,
  PRESTIGE_BASE,
  STARDUST_BONUS,
  UPGRADES,
  UPGRADE_BY_ID,
} from './data';
import { GameState, GeneratorDef, OfflineResult, UpgradeDef } from './types';

export const SAVE_VERSION = 1;

export function createInitialState(now: number = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    crystals: 0,
    runCrystals: 0,
    allTimeCrystals: 0,
    generators: {},
    upgrades: [],
    stardust: 0,
    prestigeCount: 0,
    clicks: 0,
    lastSeenAt: now,
    startedAt: now,
    playTimeSeconds: 0,
  };
}

// ---------------------------------------------------------------------------
// Pomocné výpočty
// ---------------------------------------------------------------------------

export function ownedCount(state: GameState, generatorId: string): number {
  return state.generators[generatorId] ?? 0;
}

export function hasUpgrade(state: GameState, upgradeId: string): boolean {
  return state.upgrades.includes(upgradeId);
}

function ownedUpgrades(state: GameState): UpgradeDef[] {
  return state.upgrades.map((id) => UPGRADE_BY_ID[id]).filter((u): u is UpgradeDef => !!u);
}

/** Násobitel z hvězdného prachu. */
export function stardustMultiplier(state: GameState): number {
  return 1 + state.stardust * STARDUST_BONUS;
}

/** Globální násobitel (vylepšení + prestiž). */
export function globalMultiplier(state: GameState): number {
  let mult = stardustMultiplier(state);
  for (const u of ownedUpgrades(state)) {
    if (u.effect.type === 'global') mult *= u.effect.multiplier;
  }
  return mult;
}

export function generatorMultiplier(state: GameState, generatorId: string): number {
  let mult = 1;
  for (const u of ownedUpgrades(state)) {
    if (u.effect.type === 'generator' && u.effect.generatorId === generatorId) {
      mult *= u.effect.multiplier;
    }
  }
  return mult;
}

/** Produkce jednoho generátoru (všech jeho jednotek) za sekundu včetně násobitelů. */
export function generatorProduction(state: GameState, generatorId: string): number {
  const def = GENERATOR_BY_ID[generatorId];
  if (!def) return 0;
  return (
    ownedCount(state, generatorId) *
    def.baseProduction *
    generatorMultiplier(state, generatorId) *
    globalMultiplier(state)
  );
}

/** Celková produkce za sekundu. */
export function productionPerSecond(state: GameState): number {
  let total = 0;
  for (const g of GENERATORS) total += generatorProduction(state, g.id);
  return total;
}

/** Kolik krystalů dá jedno klepnutí. */
export function clickValue(state: GameState): number {
  let base = 1;
  let percent = 0;
  for (const u of ownedUpgrades(state)) {
    if (u.effect.type === 'click') base *= u.effect.multiplier;
    if (u.effect.type === 'clickFromProduction') percent += u.effect.percent;
  }
  base *= stardustMultiplier(state);
  return base + (productionPerSecond(state) * percent) / 100;
}

/** Cena `count` jednotek generátoru počínaje aktuálně vlastněným počtem. */
export function generatorCost(state: GameState, generatorId: string, count: number = 1): number {
  const def = GENERATOR_BY_ID[generatorId];
  if (!def || count <= 0) return 0;
  const owned = ownedCount(state, generatorId);
  return bulkCost(def, owned, count);
}

function bulkCost(def: GeneratorDef, owned: number, count: number): number {
  // Součet geometrické řady: base * r^owned * (r^count - 1) / (r - 1)
  const r = def.costGrowth;
  return (def.baseCost * Math.pow(r, owned) * (Math.pow(r, count) - 1)) / (r - 1);
}

/** Kolik jednotek generátoru si hráč může aktuálně dovolit. */
export function maxAffordable(state: GameState, generatorId: string): number {
  const def = GENERATOR_BY_ID[generatorId];
  if (!def) return 0;
  const owned = ownedCount(state, generatorId);
  const r = def.costGrowth;
  const first = def.baseCost * Math.pow(r, owned);
  if (state.crystals < first) return 0;
  // Inverze vzorce pro součet geometrické řady.
  const n = Math.floor(Math.log((state.crystals * (r - 1)) / first + 1) / Math.log(r));
  // Kvůli zaokrouhlení plovoucí čárky pro jistotu ověříme.
  let count = Math.max(1, n);
  while (count > 1 && bulkCost(def, owned, count) > state.crystals) count -= 1;
  while (bulkCost(def, owned, count + 1) <= state.crystals) count += 1;
  return count;
}

// ---------------------------------------------------------------------------
// Přechody stavu – všechny funkce vrací nový stav, původní nemění.
// ---------------------------------------------------------------------------

function addCrystals(state: GameState, amount: number): GameState {
  if (amount <= 0) return state;
  return {
    ...state,
    crystals: state.crystals + amount,
    runCrystals: state.runCrystals + amount,
    allTimeCrystals: state.allTimeCrystals + amount,
  };
}

/** Posune hru o `dtSeconds` reálného hraní. */
export function tick(state: GameState, dtSeconds: number, now: number = Date.now()): GameState {
  if (dtSeconds <= 0) return { ...state, lastSeenAt: now };
  const earned = productionPerSecond(state) * dtSeconds;
  return {
    ...addCrystals(state, earned),
    playTimeSeconds: state.playTimeSeconds + dtSeconds,
    lastSeenAt: now,
  };
}

export function click(state: GameState): GameState {
  return { ...addCrystals(state, clickValue(state)), clicks: state.clicks + 1 };
}

export function buyGenerator(state: GameState, generatorId: string, count: number = 1): GameState {
  if (!GENERATOR_BY_ID[generatorId] || count <= 0) return state;
  const cost = generatorCost(state, generatorId, count);
  if (cost > state.crystals) return state;
  return {
    ...state,
    crystals: state.crystals - cost,
    generators: { ...state.generators, [generatorId]: ownedCount(state, generatorId) + count },
  };
}

export function isUpgradeVisible(state: GameState, upgrade: UpgradeDef): boolean {
  if (hasUpgrade(state, upgrade.id)) return false;
  if (upgrade.requires) {
    return ownedCount(state, upgrade.requires.generatorId) >= upgrade.requires.count;
  }
  // Speciální vylepšení se ukážou, jakmile hráč za běh vydělal aspoň čtvrtinu ceny.
  return state.runCrystals >= upgrade.cost / 4;
}

/** Vylepšení, která jsou právě k dispozici ke koupi, seřazená podle ceny. */
export function availableUpgrades(state: GameState): UpgradeDef[] {
  return UPGRADES.filter((u) => isUpgradeVisible(state, u)).sort((a, b) => a.cost - b.cost);
}

export function buyUpgrade(state: GameState, upgradeId: string): GameState {
  const def = UPGRADE_BY_ID[upgradeId];
  if (!def || hasUpgrade(state, upgradeId) || !isUpgradeVisible(state, def)) return state;
  if (def.cost > state.crystals) return state;
  return {
    ...state,
    crystals: state.crystals - def.cost,
    upgrades: [...state.upgrades, upgradeId],
  };
}

/** Generátor je v seznamu vidět, když je první, předchozí už hráč má, nebo na něj někdy měl. */
export function isGeneratorVisible(state: GameState, index: number): boolean {
  if (index === 0) return true;
  const def = GENERATORS[index];
  const prev = GENERATORS[index - 1];
  return ownedCount(state, prev.id) > 0 || state.runCrystals >= def.baseCost;
}

// ---------------------------------------------------------------------------
// Prestiž
// ---------------------------------------------------------------------------

/** Kolik hvězdného prachu by hráč získal, kdyby teď provedl prestiž. */
export function prestigeGain(state: GameState): number {
  return Math.floor(Math.sqrt(state.runCrystals / PRESTIGE_BASE));
}

/** Kolik krystalů za běh je potřeba na další jednotku hvězdného prachu. */
export function crystalsForNextStardust(state: GameState): number {
  const next = prestigeGain(state) + 1;
  return next * next * PRESTIGE_BASE;
}

export function canPrestige(state: GameState): boolean {
  return prestigeGain(state) >= 1;
}

export function prestige(state: GameState, now: number = Date.now()): GameState {
  const gain = prestigeGain(state);
  if (gain < 1) return state;
  return {
    ...createInitialState(now),
    allTimeCrystals: state.allTimeCrystals,
    stardust: state.stardust + gain,
    prestigeCount: state.prestigeCount + 1,
    clicks: state.clicks,
    startedAt: state.startedAt,
    playTimeSeconds: state.playTimeSeconds,
  };
}

// ---------------------------------------------------------------------------
// Offline postup
// ---------------------------------------------------------------------------

export function applyOfflineProgress(state: GameState, now: number = Date.now()): OfflineResult {
  const elapsedSeconds = Math.max(0, (now - state.lastSeenAt) / 1000);
  const seconds = Math.min(elapsedSeconds, OFFLINE_CAP_SECONDS);
  const earned = productionPerSecond(state) * seconds * OFFLINE_EFFICIENCY;
  return {
    state: { ...addCrystals(state, earned), lastSeenAt: now },
    seconds,
    elapsedSeconds,
    earned,
  };
}
