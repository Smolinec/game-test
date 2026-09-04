import { addCrystals } from './engine';
import { GameState } from './types';

/**
 * Odměny za sledování videa. Samotné přehrání řeší `services/ads.ts`,
 * tady jsou jen herní efekty a pravidla, kdy je odměna dostupná.
 */
export type AdPlacement = 'boost' | 'double_offline';

/** Násobitel produkce během boostu z videa. */
export const BOOST_MULTIPLIER = 2;
/** Délka boostu v sekundách herního času. */
export const BOOST_DURATION_SECONDS = 60 * 60;
/** Jak dlouho po spuštění boostu nejde další video pro boost (ms reálného času). */
export const BOOST_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export function isBoostActive(state: GameState): boolean {
  return state.boostSecondsLeft > 0;
}

export function boostMultiplier(state: GameState): number {
  return isBoostActive(state) ? BOOST_MULTIPLIER : 1;
}

export function boostCooldownRemainingMs(state: GameState, now: number = Date.now()): number {
  return Math.max(0, state.boostAdCooldownUntil - now);
}

export function canWatchBoostAd(state: GameState, now: number = Date.now()): boolean {
  return !isBoostActive(state) && boostCooldownRemainingMs(state, now) === 0;
}

/** Spustí boost po shlédnutém videu. Bez nároku nic nezmění. */
export function startBoost(state: GameState, now: number = Date.now()): GameState {
  if (!canWatchBoostAd(state, now)) return state;
  return {
    ...state,
    boostSecondsLeft: BOOST_DURATION_SECONDS,
    boostAdCooldownUntil: now + BOOST_COOLDOWN_MS,
    adsWatched: state.adsWatched + 1,
  };
}

/** Připíše podruhé offline výdělek (video „zdvojnásobit“). */
export function doubleOfflineReward(state: GameState, earned: number): GameState {
  if (earned <= 0) return state;
  return { ...addCrystals(state, earned), adsWatched: state.adsWatched + 1 };
}
