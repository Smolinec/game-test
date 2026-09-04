import { GENERATORS, OFFLINE_CAP_SECONDS, OFFLINE_EFFICIENCY, PRESTIGE_BASE } from '../src/engine/data';
import {
  applyOfflineProgress,
  availableUpgrades,
  buyGenerator,
  buyUpgrade,
  canPrestige,
  click,
  clickValue,
  createInitialState,
  generatorCost,
  isGeneratorVisible,
  maxAffordable,
  prestige,
  prestigeGain,
  productionPerSecond,
  tick,
} from '../src/engine/engine';
import { GameState } from '../src/engine/types';

const NOW = 1_700_000_000_000;

function rich(crystals: number, extra: Partial<GameState> = {}): GameState {
  return { ...createInitialState(NOW), crystals, runCrystals: crystals, allTimeCrystals: crystals, ...extra };
}

describe('klepání', () => {
  it('základní klepnutí dá 1 krystal a započítá se do statistik', () => {
    const s = click(createInitialState(NOW)).state;
    expect(s.crystals).toBe(1);
    expect(s.runCrystals).toBe(1);
    expect(s.allTimeCrystals).toBe(1);
    expect(s.clicks).toBe(1);
  });

  it('vylepšení kliku násobí hodnotu', () => {
    const s = buyUpgrade(rich(100), 'gloves');
    expect(s.upgrades).toContain('gloves');
    expect(clickValue(s)).toBe(2);
  });
});

describe('generátory', () => {
  it('cena roste geometricky a hromadná cena odpovídá součtu', () => {
    const s = createInitialState(NOW);
    const drone = GENERATORS[0];
    expect(generatorCost(s, 'drone', 1)).toBeCloseTo(drone.baseCost);
    const one = generatorCost(s, 'drone', 1);
    const two = generatorCost(s, 'drone', 2);
    expect(two).toBeCloseTo(one + drone.baseCost * drone.costGrowth);
  });

  it('nákup odečte krystaly a přidá jednotku', () => {
    const s = buyGenerator(rich(1000), 'drone', 3);
    expect(s.generators.drone).toBe(3);
    expect(s.crystals).toBeCloseTo(1000 - generatorCost(createInitialState(NOW), 'drone', 3));
  });

  it('nákup bez dostatku krystalů nic nezmění', () => {
    const before = rich(5);
    expect(buyGenerator(before, 'drone')).toBe(before);
  });

  it('maxAffordable vrací největší počet, který se vejde do rozpočtu', () => {
    const s = rich(1000);
    const n = maxAffordable(s, 'drone');
    expect(n).toBeGreaterThan(0);
    expect(generatorCost(s, 'drone', n)).toBeLessThanOrEqual(1000);
    expect(generatorCost(s, 'drone', n + 1)).toBeGreaterThan(1000);
    expect(maxAffordable(rich(0), 'drone')).toBe(0);
  });

  it('produkce se sčítá a tick přičte krystaly podle času', () => {
    let s = rich(10_000);
    s = buyGenerator(s, 'drone', 10);
    s = buyGenerator(s, 'drill', 2);
    expect(productionPerSecond(s)).toBeCloseTo(10 * 0.1 + 2 * 1);
    const after = tick(s, 5, NOW + 5000);
    expect(after.crystals).toBeCloseTo(s.crystals + 15);
    expect(after.playTimeSeconds).toBe(5);
    expect(after.lastSeenAt).toBe(NOW + 5000);
  });

  it('viditelnost: první vždy, další po koupi předchozího', () => {
    const s = createInitialState(NOW);
    expect(isGeneratorVisible(s, 0)).toBe(true);
    expect(isGeneratorVisible(s, 1)).toBe(false);
    expect(isGeneratorVisible(buyGenerator(rich(100), 'drone'), 1)).toBe(true);
  });
});

describe('vylepšení', () => {
  it('generátorové vylepšení se ukáže až po dosažení počtu a zdvojnásobí produkci', () => {
    let s = rich(1e6);
    expect(availableUpgrades(s).map((u) => u.id)).not.toContain('drone_I');
    s = buyGenerator(s, 'drone', 10);
    expect(availableUpgrades(s).map((u) => u.id)).toContain('drone_I');
    const before = productionPerSecond(s);
    s = buyUpgrade(s, 'drone_I');
    expect(productionPerSecond(s)).toBeCloseTo(before * 2);
    expect(availableUpgrades(s).map((u) => u.id)).not.toContain('drone_I');
  });

  it('vylepšení nejde koupit dvakrát ani bez peněz', () => {
    const s = buyUpgrade(rich(100), 'gloves');
    expect(buyUpgrade(s, 'gloves')).toBe(s);
    const poor = { ...rich(50), runCrystals: 1000 };
    expect(buyUpgrade(poor, 'gloves')).toBe(poor);
  });

  it('globální vylepšení a synchronizace ovlivní produkci i klik', () => {
    let s = rich(1e7);
    s = buyGenerator(s, 'drill', 100); // 100/s
    const base = productionPerSecond(s);
    s = buyUpgrade(s, 'logistics');
    expect(productionPerSecond(s)).toBeCloseTo(base * 1.1);
    s = buyUpgrade(s, 'sync');
    expect(clickValue(s)).toBeCloseTo(1 + productionPerSecond(s) * 0.01);
  });
});

describe('prestiž', () => {
  it('není dostupná pod hranicí a nad ní dá odmocninový zisk', () => {
    expect(canPrestige(rich(PRESTIGE_BASE - 1))).toBe(false);
    expect(prestigeGain(rich(PRESTIGE_BASE))).toBe(1);
    expect(prestigeGain(rich(PRESTIGE_BASE * 9))).toBe(3);
  });

  it('prestiž resetuje běh, zachová prach a statistiky a zvýší produkci', () => {
    let s = rich(PRESTIGE_BASE * 4, { clicks: 42 });
    s = buyGenerator(s, 'drone', 5);
    const after = prestige(s, NOW + 1);
    expect(after.stardust).toBe(2);
    expect(after.prestigeCount).toBe(1);
    expect(after.crystals).toBe(0);
    expect(after.generators).toEqual({});
    expect(after.upgrades).toEqual([]);
    expect(after.allTimeCrystals).toBe(s.allTimeCrystals);
    expect(after.clicks).toBe(42);
    const withDrone = buyGenerator({ ...after, crystals: 100 }, 'drone');
    expect(productionPerSecond(withDrone)).toBeCloseTo(0.1 * 1.2);
  });

  it('prestiž bez nároku nic nezmění', () => {
    const s = rich(10);
    expect(prestige(s)).toBe(s);
  });
});

describe('offline postup', () => {
  it('započítá uplynulý čas se sníženou účinností', () => {
    let s = rich(1000);
    s = buyGenerator(s, 'drill', 5); // 5/s
    s = { ...s, lastSeenAt: NOW };
    const result = applyOfflineProgress(s, NOW + 60_000);
    expect(result.elapsedSeconds).toBe(60);
    expect(result.seconds).toBe(60);
    expect(result.earned).toBeCloseTo(5 * 60 * OFFLINE_EFFICIENCY);
    expect(result.state.crystals).toBeCloseTo(s.crystals + result.earned);
    expect(result.state.lastSeenAt).toBe(NOW + 60_000);
  });

  it('omezí započítaný čas stropem', () => {
    const s = { ...buyGenerator(rich(1000), 'drill', 1), lastSeenAt: NOW };
    const result = applyOfflineProgress(s, NOW + 3 * OFFLINE_CAP_SECONDS * 1000);
    expect(result.seconds).toBe(OFFLINE_CAP_SECONDS);
    expect(result.earned).toBeCloseTo(OFFLINE_CAP_SECONDS * OFFLINE_EFFICIENCY);
  });

  it('čas zpět (změna hodin) nedá nic', () => {
    const s = { ...rich(0), lastSeenAt: NOW };
    expect(applyOfflineProgress(s, NOW - 10_000).earned).toBe(0);
  });
});
