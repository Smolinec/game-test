import {
  BOOST_COOLDOWN_MS,
  BOOST_DURATION_SECONDS,
  BOOST_MULTIPLIER,
  boostCooldownRemainingMs,
  canWatchBoostAd,
  doubleOfflineReward,
  isBoostActive,
  startBoost,
} from '../src/engine/ads';
import { OFFLINE_EFFICIENCY } from '../src/engine/data';
import { applyOfflineProgress, buyGenerator, createInitialState, prestige, productionPerSecond, tick } from '../src/engine/engine';
import { deserialize, serialize } from '../src/engine/save';
import { GameState } from '../src/engine/types';
import { MockRewardedAdProvider } from '../src/services/ads';

const NOW = 1_700_000_000_000;

function withDrills(count: number): GameState {
  const base = { ...createInitialState(NOW), crystals: 1e9, runCrystals: 1e9, allTimeCrystals: 1e9 };
  return buyGenerator(base, 'drill', count);
}

describe('boost z videa', () => {
  it('spuštění zdvojnásobí produkci a nastaví cooldown', () => {
    const s = withDrills(10);
    expect(canWatchBoostAd(s, NOW)).toBe(true);
    const boosted = startBoost(s, NOW);
    expect(isBoostActive(boosted)).toBe(true);
    expect(productionPerSecond(boosted)).toBeCloseTo(productionPerSecond(s) * BOOST_MULTIPLIER);
    expect(boosted.boostSecondsLeft).toBe(BOOST_DURATION_SECONDS);
    expect(boosted.adsWatched).toBe(1);
    expect(canWatchBoostAd(boosted, NOW + 1000)).toBe(false);
    expect(boostCooldownRemainingMs(boosted, NOW + 1000)).toBe(BOOST_COOLDOWN_MS - 1000);
    expect(startBoost(boosted, NOW + 1000)).toBe(boosted);
  });

  it('tick boost odpočítává a po vypršení produkce klesne', () => {
    const s = startBoost(withDrills(10), NOW);
    const half = tick(s, BOOST_DURATION_SECONDS / 2, NOW + 1);
    expect(half.boostSecondsLeft).toBe(BOOST_DURATION_SECONDS / 2);
    expect(half.crystals).toBeCloseTo(s.crystals + productionPerSecond(s) * (BOOST_DURATION_SECONDS / 2));
    const done = tick(half, BOOST_DURATION_SECONDS, NOW + 2);
    expect(done.boostSecondsLeft).toBe(0);
    expect(isBoostActive(done)).toBe(false);
    expect(productionPerSecond(done)).toBeCloseTo(productionPerSecond(s) / BOOST_MULTIPLIER);
  });

  it('po cooldownu jde video znovu, i když boost dávno skončil', () => {
    let s = startBoost(withDrills(1), NOW);
    s = tick(s, BOOST_DURATION_SECONDS + 1, NOW + 1);
    expect(canWatchBoostAd(s, NOW + BOOST_COOLDOWN_MS - 1)).toBe(false);
    expect(canWatchBoostAd(s, NOW + BOOST_COOLDOWN_MS)).toBe(true);
  });

  it('offline postup započítá boost jen po zbývající dobu', () => {
    const s = { ...startBoost(withDrills(10), NOW), lastSeenAt: NOW };
    const base = productionPerSecond(s) / BOOST_MULTIPLIER; // bez boostu
    const seconds = 2 * BOOST_DURATION_SECONDS;
    const result = applyOfflineProgress(s, NOW + seconds * 1000);
    const expected = base * (seconds + BOOST_DURATION_SECONDS) * OFFLINE_EFFICIENCY;
    expect(result.earned).toBeCloseTo(expected);
    expect(result.state.boostSecondsLeft).toBe(0);
  });

  it('boost přežije prestiž (hráč si ho zasloužil videem)', () => {
    const s = startBoost({ ...withDrills(1), runCrystals: 1e8 }, NOW);
    const after = prestige(s, NOW + 1);
    expect(after.boostSecondsLeft).toBe(BOOST_DURATION_SECONDS);
    expect(after.boostAdCooldownUntil).toBe(s.boostAdCooldownUntil);
  });
});

describe('zdvojnásobení offline výdělku', () => {
  it('připíše částku podruhé a započítá video', () => {
    const s = withDrills(1);
    const doubled = doubleOfflineReward(s, 500);
    expect(doubled.crystals).toBeCloseTo(s.crystals + 500);
    expect(doubled.adsWatched).toBe(1);
    expect(doubleOfflineReward(s, 0)).toBe(s);
  });
});

describe('uložení a poskytovatel', () => {
  it('pole boostu se ukládají a starší uložení dostane výchozí', () => {
    const s = startBoost(withDrills(1), NOW);
    const loaded = deserialize(serialize(s), NOW)!;
    expect(loaded.boostSecondsLeft).toBe(BOOST_DURATION_SECONDS);
    expect(loaded.boostAdCooldownUntil).toBe(s.boostAdCooldownUntil);
    expect(loaded.adsWatched).toBe(1);
    const old = deserialize(JSON.stringify({ version: 4 }), NOW)!;
    expect(old.boostSecondsLeft).toBe(0);
    expect(old.boostAdCooldownUntil).toBe(0);
    expect(old.adsWatched).toBe(0);
  });

  it('testovací poskytovatel video „přehraje“ a odmění', async () => {
    const provider = new MockRewardedAdProvider(0);
    expect(provider.isSandbox).toBe(true);
    expect(provider.isReady('boost')).toBe(true);
    await expect(provider.show('boost')).resolves.toBe('rewarded');
  });
});
