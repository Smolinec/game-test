import {
  ENTITLEMENT_BOOST,
  ENTITLEMENT_OFFLINE,
  GENERATORS,
  GENERATOR_BY_ID,
  OFFLINE_CAP_PREMIUM_SECONDS,
  OFFLINE_CAP_SECONDS,
  OFFLINE_EFFICIENCY,
  PREMIUM_BOOST_MULTIPLIER,
  PRESTIGE_BASE,
  STARDUST_BONUS,
  UPGRADES,
  UPGRADE_BY_ID,
} from './data';
import { maxLevel, STARDUST_UPGRADES, STARDUST_UPGRADE_BY_ID, StardustUpgradeDef } from './stardust';
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
    entitlements: [],
    stardust: 0,
    stardustEarned: 0,
    stardustUpgrades: {},
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

export function hasEntitlement(state: GameState, entitlementId: string): boolean {
  return state.entitlements.includes(entitlementId);
}

/** Strop offline času podle nároků hráče. */
export function offlineCapSeconds(state: GameState): number {
  return hasEntitlement(state, ENTITLEMENT_OFFLINE) ? OFFLINE_CAP_PREMIUM_SECONDS : OFFLINE_CAP_SECONDS;
}

// ---------------------------------------------------------------------------
// Hvězdná vylepšení
// ---------------------------------------------------------------------------

export function stardustUpgradeLevel(state: GameState, upgradeId: string): number {
  return state.stardustUpgrades[upgradeId] ?? 0;
}

/** Cena další úrovně, nebo null, když je vylepšení na maximu. */
export function stardustUpgradeCost(state: GameState, upgradeId: string): number | null {
  const def = STARDUST_UPGRADE_BY_ID[upgradeId];
  if (!def) return null;
  const level = stardustUpgradeLevel(state, upgradeId);
  return level < maxLevel(def) ? def.costs[level] : null;
}

export function canBuyStardustUpgrade(state: GameState, upgradeId: string): boolean {
  const cost = stardustUpgradeCost(state, upgradeId);
  return cost !== null && state.stardust >= cost;
}

export function buyStardustUpgrade(state: GameState, upgradeId: string): GameState {
  const cost = stardustUpgradeCost(state, upgradeId);
  if (cost === null || state.stardust < cost) return state;
  return {
    ...state,
    stardust: state.stardust - cost,
    stardustUpgrades: {
      ...state.stardustUpgrades,
      [upgradeId]: stardustUpgradeLevel(state, upgradeId) + 1,
    },
  };
}

function ownedStardustEffects(state: GameState): { def: StardustUpgradeDef; level: number }[] {
  return STARDUST_UPGRADES.map((def) => ({ def, level: stardustUpgradeLevel(state, def.id) })).filter(
    (u) => u.level > 0,
  );
}

/** Bonus k produkci za každý neutracený hvězdný prach (0.1 = +10 %). */
export function stardustBonusPerUnit(state: GameState): number {
  for (const { def } of ownedStardustEffects(state)) {
    if (def.effect.type === 'catalyst') return def.effect.bonusPerStardust;
  }
  return STARDUST_BONUS;
}

/** Násobitel ceny zařízení (1 = bez slevy). */
export function generatorCostFactor(state: GameState): number {
  let factor = 1;
  for (const { def, level } of ownedStardustEffects(state)) {
    if (def.effect.type === 'generatorDiscount') factor *= 1 - (def.effect.percentPerLevel * level) / 100;
  }
  return factor;
}

/** Účinnost offline těžby (0–1). */
export function offlineEfficiency(state: GameState): number {
  let efficiency = OFFLINE_EFFICIENCY;
  for (const { def } of ownedStardustEffects(state)) {
    if (def.effect.type === 'offlineEfficiency') efficiency = Math.max(efficiency, def.effect.efficiency);
  }
  return efficiency;
}

/** Zlatá žíla: šance a násobitel, nebo null bez vylepšení. */
export function goldenVein(state: GameState): { chance: number; multiplier: number } | null {
  for (const { def } of ownedStardustEffects(state)) {
    if (def.effect.type === 'goldenVein') return { chance: def.effect.chance, multiplier: def.effect.multiplier };
  }
  return null;
}

function ownedUpgrades(state: GameState): UpgradeDef[] {
  return state.upgrades.map((id) => UPGRADE_BY_ID[id]).filter((u): u is UpgradeDef => !!u);
}

/** Násobitel z neutraceného hvězdného prachu. */
export function stardustMultiplier(state: GameState): number {
  return 1 + state.stardust * stardustBonusPerUnit(state);
}

/** Globální násobitel (vylepšení + prestiž + nároky z obchodu). */
export function globalMultiplier(state: GameState): number {
  let mult = stardustMultiplier(state);
  if (hasEntitlement(state, ENTITLEMENT_BOOST)) mult *= PREMIUM_BOOST_MULTIPLIER;
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
  for (const { def, level } of ownedStardustEffects(state)) {
    if (def.effect.type === 'clickMultiplier') base *= Math.pow(def.effect.multiplierPerLevel, level);
  }
  base *= stardustMultiplier(state);
  return base + (productionPerSecond(state) * percent) / 100;
}

/** Cena `count` jednotek generátoru počínaje aktuálně vlastněným počtem. */
export function generatorCost(state: GameState, generatorId: string, count: number = 1): number {
  const def = GENERATOR_BY_ID[generatorId];
  if (!def || count <= 0) return 0;
  const owned = ownedCount(state, generatorId);
  return bulkCost(def, owned, count, generatorCostFactor(state));
}

function bulkCost(def: GeneratorDef, owned: number, count: number, factor: number): number {
  // Součet geometrické řady: base * r^owned * (r^count - 1) / (r - 1)
  const r = def.costGrowth;
  return (factor * def.baseCost * Math.pow(r, owned) * (Math.pow(r, count) - 1)) / (r - 1);
}

/** Kolik jednotek generátoru si hráč může aktuálně dovolit. */
export function maxAffordable(state: GameState, generatorId: string): number {
  const def = GENERATOR_BY_ID[generatorId];
  if (!def) return 0;
  const owned = ownedCount(state, generatorId);
  const factor = generatorCostFactor(state);
  const r = def.costGrowth;
  const first = factor * def.baseCost * Math.pow(r, owned);
  if (state.crystals < first) return 0;
  // Inverze vzorce pro součet geometrické řady.
  const n = Math.floor(Math.log((state.crystals * (r - 1)) / first + 1) / Math.log(r));
  // Kvůli zaokrouhlení plovoucí čárky pro jistotu ověříme.
  let count = Math.max(1, n);
  while (count > 1 && bulkCost(def, owned, count, factor) > state.crystals) count -= 1;
  while (bulkCost(def, owned, count + 1, factor) <= state.crystals) count += 1;
  return count;
}

// ---------------------------------------------------------------------------
// Přechody stavu – všechny funkce vrací nový stav, původní nemění.
// ---------------------------------------------------------------------------

export function addCrystals(state: GameState, amount: number): GameState {
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

/**
 * Klepnutí. `rng` vrací číslo v <0, 1) a slouží Zlaté žíle; v testech ho lze podstrčit.
 * Vrací nový stav a kolik krystalů klepnutí dalo.
 */
export function click(state: GameState, rng: () => number = Math.random): { state: GameState; gained: number; golden: boolean } {
  let gained = clickValue(state);
  let golden = false;
  const vein = goldenVein(state);
  if (vein && rng() < vein.chance) {
    gained *= vein.multiplier;
    golden = true;
  }
  return { state: { ...addCrystals(state, gained), clicks: state.clicks + 1 }, gained, golden };
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
  let next: GameState = {
    ...createInitialState(now),
    allTimeCrystals: state.allTimeCrystals,
    entitlements: state.entitlements,
    stardust: state.stardust + gain,
    stardustEarned: state.stardustEarned + gain,
    stardustUpgrades: state.stardustUpgrades,
    prestigeCount: state.prestigeCount + 1,
    clicks: state.clicks,
    startedAt: state.startedAt,
    playTimeSeconds: state.playTimeSeconds,
  };
  for (const { def } of ownedStardustEffects(next)) {
    if (def.effect.type === 'quickStart') {
      next = { ...next, crystals: def.effect.crystals, generators: { drone: def.effect.drones } };
    }
  }
  return next;
}

// ---------------------------------------------------------------------------
// Offline postup
// ---------------------------------------------------------------------------

export function applyOfflineProgress(state: GameState, now: number = Date.now()): OfflineResult {
  const elapsedSeconds = Math.max(0, (now - state.lastSeenAt) / 1000);
  const capSeconds = offlineCapSeconds(state);
  const efficiency = offlineEfficiency(state);
  const seconds = Math.min(elapsedSeconds, capSeconds);
  const earned = productionPerSecond(state) * seconds * efficiency;
  return {
    state: { ...addCrystals(state, earned), lastSeenAt: now },
    seconds,
    elapsedSeconds,
    capSeconds,
    efficiency,
    earned,
  };
}
