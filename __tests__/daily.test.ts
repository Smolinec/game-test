import { claimDaily, DAILY_REWARDS, dailyStatus, localDayNumber } from '../src/engine/daily';
import { buyGenerator, createInitialState, productionPerSecond } from '../src/engine/engine';
import { deserialize, serialize } from '../src/engine/save';
import { GameState } from '../src/engine/types';

// Poledne místního času, aby posuny o 24 h nepřeskočily den.
const NOW = new Date(2026, 8, 4, 12, 0, 0).getTime();
const DAY = 86_400_000;

function withDrills(count: number): GameState {
  const base = { ...createInitialState(NOW), crystals: 1e9, runCrystals: 1e9, allTimeCrystals: 1e9 };
  return buyGenerator(base, 'drill', count);
}

describe('denní odměna', () => {
  it('místní den se mění o půlnoci', () => {
    const before = new Date(2026, 8, 4, 23, 59).getTime();
    const after = new Date(2026, 8, 5, 0, 1).getTime();
    expect(localDayNumber(after)).toBe(localDayNumber(before) + 1);
  });

  it('nový hráč má nárok na 1. den s minimální odměnou', () => {
    const s = createInitialState(NOW);
    const status = dailyStatus(s, NOW);
    expect(status.claimable).toBe(true);
    expect(status.day).toBe(1);
    expect(status.streak).toBe(1);
    expect(status.crystals).toBe(DAILY_REWARDS[0].minCrystals);
  });

  it('odměna odpovídá produkci, když je vyšší než minimum', () => {
    const s = withDrills(100); // 100/s
    const status = dailyStatus(s, NOW);
    expect(status.crystals).toBeCloseTo(productionPerSecond(s) * 10 * 60);
  });

  it('vyzvednutí přičte krystaly a zablokuje další vyzvednutí ten den', () => {
    const s = createInitialState(NOW);
    const claimed = claimDaily(s, NOW);
    expect(claimed.crystals).toBe(100);
    expect(claimed.daily).toEqual({ lastClaimedAt: NOW, streak: 1 });
    expect(dailyStatus(claimed, NOW + 3600_000).claimable).toBe(false);
    expect(claimDaily(claimed, NOW + 3600_000)).toBe(claimed);
  });

  it('řada pokračuje další den a po vynechání se resetuje', () => {
    let s = claimDaily(createInitialState(NOW), NOW);
    s = claimDaily(s, NOW + DAY);
    expect(s.daily.streak).toBe(2);
    expect(dailyStatus(s, NOW + 2 * DAY).day).toBe(3);
    const skipped = dailyStatus(s, NOW + 3 * DAY);
    expect(skipped.claimable).toBe(true);
    expect(skipped.streak).toBe(1);
    expect(skipped.day).toBe(1);
  });

  it('sedmý den dá hvězdný prach a osmý začne znovu od 1. dne', () => {
    let s = createInitialState(NOW);
    for (let i = 0; i < 6; i++) s = claimDaily(s, NOW + i * DAY);
    const seventh = dailyStatus(s, NOW + 6 * DAY);
    expect(seventh.day).toBe(7);
    expect(seventh.reward.stardust).toBe(2);
    s = claimDaily(s, NOW + 6 * DAY);
    expect(s.stardust).toBe(2);
    expect(s.stardustEarned).toBe(2);
    expect(s.daily.streak).toBe(7);
    expect(dailyStatus(s, NOW + 7 * DAY).day).toBe(1);
    expect(dailyStatus(s, NOW + 7 * DAY).streak).toBe(8);
  });

  it('stav odměny se ukládá a starší uložení dostane výchozí', () => {
    const s = claimDaily(createInitialState(NOW), NOW);
    expect(deserialize(serialize(s), NOW)?.daily).toEqual({ lastClaimedAt: NOW, streak: 1 });
    expect(deserialize(JSON.stringify({ version: 3 }), NOW)?.daily).toEqual({ lastClaimedAt: 0, streak: 0 });
    expect(deserialize(JSON.stringify({ version: 4, daily: { lastClaimedAt: 'x', streak: -2 } }), NOW)?.daily).toEqual({
      lastClaimedAt: 0,
      streak: 0,
    });
  });
});
