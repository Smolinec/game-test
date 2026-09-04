import { migrate, SAVE_VERSION, saveVersionOf } from '../src/engine/migrations';
import { deserialize } from '../src/engine/save';

const NOW = 1_700_000_000_000;

/** Přesná podoba uložení z první vydané verze. */
const V1_SAVE = {
  version: 1,
  crystals: 1234.5,
  runCrystals: 50000,
  allTimeCrystals: 2e7,
  generators: { drone: 20, drill: 5 },
  upgrades: ['gloves', 'drone_I'],
  stardust: 3,
  prestigeCount: 1,
  clicks: 500,
  lastSeenAt: NOW - 1000,
  startedAt: NOW - 100_000,
  playTimeSeconds: 3600,
};

describe('migrace uložení', () => {
  it('chybějící verze se bere jako 1', () => {
    expect(saveVersionOf({})).toBe(1);
    expect(saveVersionOf({ version: 'x' })).toBe(1);
    expect(saveVersionOf({ version: 2 })).toBe(2);
  });

  it('v1 → aktuální doplní nová pole a zachová stará', () => {
    const { data, fromVersion, fromFuture } = migrate(V1_SAVE);
    expect(fromVersion).toBe(1);
    expect(fromFuture).toBe(false);
    expect(data.version).toBe(SAVE_VERSION);
    expect(data.entitlements).toEqual([]);
    expect(data.stardustUpgrades).toEqual({});
    expect(data.stardustEarned).toBe(3);
    expect(data.generators).toEqual({ drone: 20, drill: 5 });
    expect(data.crystals).toBe(1234.5);
  });

  it('deserialize aplikuje migraci a výsledek je validní stav', () => {
    const s = deserialize(JSON.stringify(V1_SAVE), NOW)!;
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.stardust).toBe(3);
    expect(s.stardustEarned).toBe(3);
    expect(s.stardustUpgrades).toEqual({});
    expect(s.entitlements).toEqual([]);
    expect(s.upgrades).toEqual(['gloves', 'drone_I']);
    expect(s.playTimeSeconds).toBe(3600);
  });

  it('aktuální verze projde beze změny', () => {
    const current = { ...V1_SAVE, version: SAVE_VERSION, entitlements: ['boost_x2'], stardustUpgrades: { quick_start: 1 }, stardustEarned: 9 };
    const { data } = migrate(current);
    expect(data).toEqual(current);
  });

  it('uložení z budoucí verze se označí a načte, co jde', () => {
    const future = { ...V1_SAVE, version: SAVE_VERSION + 5, somethingNew: true };
    const { fromFuture, data } = migrate(future);
    expect(fromFuture).toBe(true);
    expect(data.version).toBe(SAVE_VERSION);
    const s = deserialize(JSON.stringify(future), NOW)!;
    expect(s.crystals).toBe(1234.5);
  });
});
