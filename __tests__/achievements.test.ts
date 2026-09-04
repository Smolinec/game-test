import {
  ACHIEVEMENT_BONUS,
  ACHIEVEMENTS,
  achievementMultiplier,
  achievementProgress,
  checkAchievements,
  metricValue,
} from '../src/engine/achievements';
import { PRESTIGE_BASE } from '../src/engine/data';
import { buyGenerator, click, createInitialState, prestige, productionPerSecond } from '../src/engine/engine';
import { deserialize, serialize } from '../src/engine/save';
import { GameState } from '../src/engine/types';

const NOW = 1_700_000_000_000;

function rich(crystals: number, extra: Partial<GameState> = {}): GameState {
  return { ...createInitialState(NOW), crystals, runCrystals: crystals, allTimeCrystals: crystals, ...extra };
}

describe('úspěchy', () => {
  it('definice mají unikátní id a rostoucí prahy v řadě', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    const byMetric = new Map<string, number[]>();
    for (const a of ACHIEVEMENTS) byMetric.set(a.metric, [...(byMetric.get(a.metric) ?? []), a.threshold]);
    for (const thresholds of byMetric.values()) {
      for (let i = 1; i < thresholds.length; i++) expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });

  it('nový stav nemá žádný úspěch a kontrola nic nezmění', () => {
    const s = createInitialState(NOW);
    const result = checkAchievements(s);
    expect(result.unlocked).toEqual([]);
    expect(result.state).toBe(s);
  });

  it('klepnutí odemkne úspěch po dosažení prahu jen jednou', () => {
    let s = createInitialState(NOW);
    for (let i = 0; i < 99; i++) s = click(s).state;
    expect(checkAchievements(s).unlocked).toEqual([]);
    s = click(s).state;
    const first = checkAchievements(s);
    expect(first.unlocked.map((a) => a.id)).toEqual(['clicks_100']);
    expect(first.state.achievements).toEqual(['clicks_100']);
    const again = checkAchievements(first.state);
    expect(again.unlocked).toEqual([]);
    expect(again.state).toBe(first.state);
  });

  it('více úspěchů najednou a metriky zařízení', () => {
    let s = rich(1e6);
    s = buyGenerator(s, 'drone', 10);
    expect(metricValue(s, 'generatorsTotal')).toBe(10);
    expect(metricValue(s, 'generatorTypes')).toBe(1);
    const { unlocked } = checkAchievements(s);
    const ids = unlocked.map((a) => a.id);
    expect(ids).toContain('gens_10');
    expect(ids).toContain('crystals_1k');
    expect(ids).toContain('crystals_1m');
  });

  it('každý úspěch dává +1 % produkce', () => {
    let s = rich(1e6);
    s = buyGenerator(s, 'drill', 10); // 10/s
    const base = productionPerSecond(s);
    const withThree = { ...s, achievements: ['clicks_100', 'gens_10', 'crystals_1k'] };
    expect(achievementMultiplier(withThree)).toBeCloseTo(1 + 3 * ACHIEVEMENT_BONUS);
    expect(productionPerSecond(withThree)).toBeCloseTo(base * (1 + 3 * ACHIEVEMENT_BONUS));
  });

  it('postup je mezi 0 a 1 a splněný úspěch má 1', () => {
    const s = { ...createInitialState(NOW), clicks: 50 };
    const def = ACHIEVEMENTS.find((a) => a.id === 'clicks_100')!;
    expect(achievementProgress(s, def)).toBeCloseTo(0.5);
    expect(achievementProgress({ ...s, achievements: ['clicks_100'] }, def)).toBe(1);
    expect(achievementProgress({ ...s, clicks: 1e9 }, def)).toBe(1);
  });

  it('úspěchy přežijí prestiž a prestiž sama odemkne úspěch', () => {
    const s = rich(PRESTIGE_BASE, { achievements: ['clicks_100'] });
    const after = prestige(s, NOW + 1);
    expect(after.achievements).toEqual(['clicks_100']);
    expect(checkAchievements(after).unlocked.map((a) => a.id)).toContain('prestige_1');
  });

  it('úspěchy se ukládají a neznámé se při načtení zahodí', () => {
    const s = { ...createInitialState(NOW), achievements: ['clicks_100', 'gens_10'] };
    expect(deserialize(serialize(s), NOW)?.achievements).toEqual(['clicks_100', 'gens_10']);
    const raw = JSON.stringify({ version: 3, achievements: ['clicks_100', 'fake', 'clicks_100', 7] });
    expect(deserialize(raw, NOW)?.achievements).toEqual(['clicks_100']);
    const old = JSON.stringify({ version: 2, clicks: 5 });
    expect(deserialize(old, NOW)?.achievements).toEqual([]);
  });
});
