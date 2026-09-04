import { GALAXY_COST, GALAXY_MULTIPLIER, GENERATORS, PRESTIGE_BASE, UPGRADES } from '../src/engine/data';
import {
  ascendGalaxy,
  buyGenerator,
  buyStardustUpgrade,
  canAscendGalaxy,
  createInitialState,
  crystalsForNextStardust,
  galaxyMultiplier,
  prestigeGain,
  productionPerSecond,
} from '../src/engine/engine';
import { deserialize, serialize } from '../src/engine/save';
import { GameState } from '../src/engine/types';

const NOW = 1_700_000_000_000;

function rich(crystals: number, extra: Partial<GameState> = {}): GameState {
  return { ...createInitialState(NOW), crystals, runCrystals: crystals, allTimeCrystals: crystals, ...extra };
}

describe('pozdní hra', () => {
  it('nová zařízení navazují cenou i produkcí a mají svá vylepšení', () => {
    expect(GENERATORS.map((g) => g.id).slice(-3)).toEqual(['nebula', 'blackhole', 'multiverse']);
    for (let i = 1; i < GENERATORS.length; i++) {
      expect(GENERATORS[i].baseCost).toBeGreaterThan(GENERATORS[i - 1].baseCost);
      expect(GENERATORS[i].baseProduction).toBeGreaterThan(GENERATORS[i - 1].baseProduction);
    }
    expect(UPGRADES.filter((u) => u.id.startsWith('multiverse_'))).toHaveLength(4);
    const s = buyGenerator(rich(1e15), 'multiverse', 1);
    expect(productionPerSecond(s)).toBeCloseTo(4.3e8);
  });

  it('galaxie jde založit až za 1 000 neutraceného prachu', () => {
    expect(canAscendGalaxy(rich(0, { stardust: GALAXY_COST - 1 }))).toBe(false);
    expect(canAscendGalaxy(rich(0, { stardust: GALAXY_COST }))).toBe(true);
    const s = rich(10, { stardust: 5 });
    expect(ascendGalaxy(s)).toBe(s);
  });

  it('založení galaxie resetuje běh, prach i hvězdná vylepšení a zachová trvalé věci', () => {
    let s = rich(5e6, {
      stardust: GALAXY_COST + 50,
      stardustEarned: 2_000,
      entitlements: ['boost_x2'],
      achievements: ['clicks_100'],
      adsWatched: 3,
      prestigeCount: 7,
      clicks: 999,
      playTimeSeconds: 5_000,
      daily: { lastClaimedAt: NOW, streak: 3 },
    });
    s = buyGenerator(s, 'drone', 10);
    s = buyStardustUpgrade(s, 'quick_start');
    const after = ascendGalaxy(s, NOW + 1);
    expect(after.galaxies).toBe(1);
    expect(after.stardust).toBe(0);
    expect(after.stardustUpgrades).toEqual({});
    expect(after.generators).toEqual({});
    expect(after.crystals).toBe(0);
    expect(after.runCrystals).toBe(0);
    expect(after.allTimeCrystals).toBe(s.allTimeCrystals);
    expect(after.stardustEarned).toBe(2_000);
    expect(after.entitlements).toEqual(['boost_x2']);
    expect(after.achievements).toEqual(['clicks_100']);
    expect(after.adsWatched).toBe(3);
    expect(after.prestigeCount).toBe(7);
    expect(after.clicks).toBe(999);
    expect(after.playTimeSeconds).toBe(5_000);
    expect(after.daily).toEqual({ lastClaimedAt: NOW, streak: 3 });
  });

  it('každá galaxie násobí produkci ×3 a zisk prachu při prestiži', () => {
    const base = buyGenerator(rich(1e6), 'drill', 10);
    const one = { ...base, galaxies: 1 };
    const two = { ...base, galaxies: 2 };
    expect(galaxyMultiplier(one)).toBe(GALAXY_MULTIPLIER);
    expect(productionPerSecond(one)).toBeCloseTo(productionPerSecond(base) * GALAXY_MULTIPLIER);
    expect(productionPerSecond(two)).toBeCloseTo(productionPerSecond(base) * GALAXY_MULTIPLIER ** 2);

    const run = rich(PRESTIGE_BASE * 4); // √4 = 2 prachu
    expect(prestigeGain(run)).toBe(2);
    expect(prestigeGain({ ...run, galaxies: 1 })).toBe(4);
    expect(prestigeGain({ ...run, galaxies: 2 })).toBe(6);
  });

  it('práh dalšího prachu respektuje bonus z galaxií', () => {
    const s = { ...rich(0), galaxies: 1 }; // zisk = floor(2 * √(x / base))
    const next = crystalsForNextStardust(s);
    expect(prestigeGain({ ...s, runCrystals: next })).toBe(1);
    expect(prestigeGain({ ...s, runCrystals: next - 1 })).toBe(0);
  });

  it('galaxie se ukládají a staré uložení začne bez nich', () => {
    const s = { ...rich(0), galaxies: 2 };
    expect(deserialize(serialize(s), NOW)?.galaxies).toBe(2);
    expect(deserialize(JSON.stringify({ version: 5 }), NOW)?.galaxies).toBe(0);
  });
});
