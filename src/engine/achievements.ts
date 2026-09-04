import { GENERATORS } from './data';
import { GameState } from './types';

/** Trvalý bonus k produkci za každý splněný úspěch (0.01 = +1 %). */
export const ACHIEVEMENT_BONUS = 0.01;

export type AchievementMetric =
  | 'clicks'
  | 'allTimeCrystals'
  | 'generatorsTotal'
  | 'generatorTypes'
  | 'prestigeCount'
  | 'upgrades'
  | 'stardustEarned'
  | 'playTimeSeconds';

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
}

function series(
  metric: AchievementMetric,
  icon: string,
  items: { id: string; name: string; threshold: number; description: string }[],
): AchievementDef[] {
  return items.map((i) => ({ ...i, icon, metric }));
}

export const ACHIEVEMENTS: AchievementDef[] = [
  ...series('clicks', '👆', [
    { id: 'clicks_100', name: 'První mozoly', threshold: 100, description: 'Klepni 100×.' },
    { id: 'clicks_1k', name: 'Vytrvalý horník', threshold: 1_000, description: 'Klepni 1 000×.' },
    { id: 'clicks_10k', name: 'Ocelové prsty', threshold: 10_000, description: 'Klepni 10 000×.' },
    { id: 'clicks_100k', name: 'Legenda krumpáče', threshold: 100_000, description: 'Klepni 100 000×.' },
  ]),
  ...series('allTimeCrystals', '💎', [
    { id: 'crystals_1k', name: 'První tisícovka', threshold: 1e3, description: 'Vytěž celkem 1 000 krystalů.' },
    { id: 'crystals_1m', name: 'Milionář', threshold: 1e6, description: 'Vytěž celkem 1 milion krystalů.' },
    { id: 'crystals_1b', name: 'Miliardář', threshold: 1e9, description: 'Vytěž celkem 1 miliardu krystalů.' },
    { id: 'crystals_1t', name: 'Bilionář', threshold: 1e12, description: 'Vytěž celkem 1 bilion krystalů.' },
    { id: 'crystals_1qa', name: 'Pán krystalů', threshold: 1e15, description: 'Vytěž celkem 1 biliardu krystalů.' },
  ]),
  ...series('generatorsTotal', '🏗️', [
    { id: 'gens_10', name: 'Základní tábor', threshold: 10, description: 'Vlastni 10 zařízení.' },
    { id: 'gens_100', name: 'Průmyslová zóna', threshold: 100, description: 'Vlastni 100 zařízení.' },
    { id: 'gens_500', name: 'Těžební impérium', threshold: 500, description: 'Vlastni 500 zařízení.' },
    { id: 'gens_1000', name: 'Planetární síť', threshold: 1_000, description: 'Vlastni 1 000 zařízení.' },
  ]),
  ...series('generatorTypes', '🧩', [
    { id: 'types_5', name: 'Pestrá flotila', threshold: 5, description: 'Vlastni 5 různých druhů zařízení.' },
    { id: 'types_all', name: 'Kompletní sbírka', threshold: GENERATORS.length, description: 'Vlastni všechny druhy zařízení.' },
  ]),
  ...series('prestigeCount', '✨', [
    { id: 'prestige_1', name: 'Znovuzrození', threshold: 1, description: 'Proveď první prestiž.' },
    { id: 'prestige_5', name: 'Cyklus hvězd', threshold: 5, description: 'Proveď 5 prestiží.' },
    { id: 'prestige_25', name: 'Věčný návrat', threshold: 25, description: 'Proveď 25 prestiží.' },
  ]),
  ...series('upgrades', '⬆️', [
    { id: 'upgrades_10', name: 'Modernizace', threshold: 10, description: 'Kup 10 vylepšení v jednom běhu.' },
    { id: 'upgrades_25', name: 'Špičková technika', threshold: 25, description: 'Kup 25 vylepšení v jednom běhu.' },
  ]),
  ...series('stardustEarned', '🌟', [
    { id: 'stardust_10', name: 'Hrst hvězd', threshold: 10, description: 'Získej celkem 10 hvězdného prachu.' },
    { id: 'stardust_100', name: 'Hvězdokupa', threshold: 100, description: 'Získej celkem 100 hvězdného prachu.' },
    { id: 'stardust_1000', name: 'Galaktické jádro', threshold: 1_000, description: 'Získej celkem 1 000 hvězdného prachu.' },
  ]),
  ...series('playTimeSeconds', '⏱️', [
    { id: 'time_1h', name: 'První směna', threshold: 3_600, description: 'Odehraj 1 hodinu.' },
    { id: 'time_10h', name: 'Noční směna', threshold: 36_000, description: 'Odehraj 10 hodin.' },
    { id: 'time_100h', name: 'Život v dole', threshold: 360_000, description: 'Odehraj 100 hodin.' },
  ]),
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Aktuální hodnota metriky pro zobrazení postupu. */
export function metricValue(state: GameState, metric: AchievementMetric): number {
  switch (metric) {
    case 'clicks':
      return state.clicks;
    case 'allTimeCrystals':
      return state.allTimeCrystals;
    case 'generatorsTotal':
      return Object.values(state.generators).reduce((a, b) => a + b, 0);
    case 'generatorTypes':
      return Object.values(state.generators).filter((n) => n > 0).length;
    case 'prestigeCount':
      return state.prestigeCount;
    case 'upgrades':
      return state.upgrades.length;
    case 'stardustEarned':
      return state.stardustEarned;
    case 'playTimeSeconds':
      return state.playTimeSeconds;
  }
}

export function hasAchievement(state: GameState, id: string): boolean {
  return state.achievements.includes(id);
}

export function achievementProgress(state: GameState, def: AchievementDef): number {
  if (hasAchievement(state, def.id)) return 1;
  return Math.min(1, metricValue(state, def.metric) / def.threshold);
}

/** Násobitel produkce ze splněných úspěchů. */
export function achievementMultiplier(state: GameState): number {
  return 1 + state.achievements.length * ACHIEVEMENT_BONUS;
}

/**
 * Projde nesplněné úspěchy a odemkne ty, jejichž podmínka právě platí.
 * Vrací nový stav (nebo původní, když se nic nezměnilo) a seznam nově odemčených.
 */
export function checkAchievements(state: GameState): { state: GameState; unlocked: AchievementDef[] } {
  const unlocked: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (hasAchievement(state, def.id)) continue;
    if (metricValue(state, def.metric) >= def.threshold) unlocked.push(def);
  }
  if (unlocked.length === 0) return { state, unlocked };
  return {
    state: { ...state, achievements: [...state.achievements, ...unlocked.map((a) => a.id)] },
    unlocked,
  };
}
