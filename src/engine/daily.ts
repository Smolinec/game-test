import { addCrystals, productionPerSecond } from './engine';
import { GameState } from './types';

/**
 * Denní odměna. Hráč si ji může vyzvednout jednou za kalendářní den
 * (podle místního času). Když si ji vyzvedne i následující den, řada
 * pokračuje; po vynechaném dni začíná znovu od prvního dne.
 */
export interface DailyReward {
  day: number;
  /** Kolik minut aktuální produkce odměna dá. */
  productionMinutes: number;
  /** Spodní hranice krystalů, aby odměna dávala smysl i na začátku hry. */
  minCrystals: number;
  stardust: number;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, productionMinutes: 10, minCrystals: 100, stardust: 0 },
  { day: 2, productionMinutes: 20, minCrystals: 250, stardust: 0 },
  { day: 3, productionMinutes: 30, minCrystals: 500, stardust: 0 },
  { day: 4, productionMinutes: 45, minCrystals: 1_000, stardust: 0 },
  { day: 5, productionMinutes: 60, minCrystals: 2_500, stardust: 0 },
  { day: 6, productionMinutes: 90, minCrystals: 5_000, stardust: 0 },
  { day: 7, productionMinutes: 180, minCrystals: 10_000, stardust: 2 },
];

export interface DailyState {
  /** Epoch ms posledního vyzvednutí, 0 = nikdy. */
  lastClaimedAt: number;
  /** Délka aktuální řady (počet po sobě jdoucích dnů včetně posledního vyzvednutí). */
  streak: number;
}

export const INITIAL_DAILY: DailyState = { lastClaimedAt: 0, streak: 0 };

/** Místní kalendářní den jako celé číslo (dny od epochy v místním čase). */
export function localDayNumber(ms: number): number {
  const d = new Date(ms);
  const localMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((localMidnight - new Date(1970, 0, 1).getTime()) / 86_400_000);
}

export interface DailyStatus {
  claimable: boolean;
  /** Den v řadě (1–7), který se právě nabízí nebo byl naposledy vyzvednut. */
  day: number;
  /** Řada po vyzvednutí (nebo aktuální, když už je dnes vyzvednuto). */
  streak: number;
  reward: DailyReward;
  crystals: number;
}

export function dailyStatus(state: GameState, now: number = Date.now()): DailyStatus {
  const { lastClaimedAt, streak } = state.daily;
  const today = localDayNumber(now);
  const lastDay = lastClaimedAt > 0 ? localDayNumber(lastClaimedAt) : null;
  const claimable = lastDay !== today;
  let nextStreak: number;
  if (!claimable) nextStreak = Math.max(1, streak);
  else if (lastDay !== null && today - lastDay === 1) nextStreak = streak + 1;
  else nextStreak = 1;
  const day = ((nextStreak - 1) % DAILY_REWARDS.length) + 1;
  const reward = DAILY_REWARDS[day - 1];
  const crystals = Math.max(reward.minCrystals, productionPerSecond(state) * reward.productionMinutes * 60);
  return { claimable, day, streak: nextStreak, reward, crystals };
}

export function claimDaily(state: GameState, now: number = Date.now()): GameState {
  const status = dailyStatus(state, now);
  if (!status.claimable) return state;
  const withCrystals = addCrystals(state, status.crystals);
  return {
    ...withCrystals,
    stardust: withCrystals.stardust + status.reward.stardust,
    stardustEarned: withCrystals.stardustEarned + status.reward.stardust,
    daily: { lastClaimedAt: now, streak: status.streak },
  };
}
