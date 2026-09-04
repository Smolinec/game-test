import { createInitialState } from '../src/engine/engine';
import { formatDuration, formatNumber, formatRate, formatWhole } from '../src/engine/format';
import { deserialize, serialize } from '../src/engine/save';

describe('formatNumber', () => {
  it('malá čísla bez přípony', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(2.5, { decimals: 1 })).toBe('2,5');
  });

  it('přípony a desetinná čárka', () => {
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(12_345)).toBe('12,35K');
    expect(formatNumber(123_456)).toBe('123,5K');
    expect(formatNumber(1.5e9)).toBe('1,5B');
    expect(formatNumber(7.5e10)).toBe('75B');
    expect(formatNumber(1e12)).toBe('1T');
  });

  it('extrémní hodnoty', () => {
    expect(formatNumber(1e40)).toMatch(/e40$/);
    expect(formatNumber(Infinity)).toBe('∞');
    expect(formatNumber(-1500)).toBe('-1,5K');
  });

  it('pomocné formáty', () => {
    expect(formatWhole(999.9)).toBe('999');
    expect(formatRate(0.5)).toBe('0,5');
    expect(formatRate(42.7)).toBe('43');
    expect(formatRate(5000)).toBe('5K');
  });
});

describe('formatDuration', () => {
  it('skládá jednotky', () => {
    expect(formatDuration(0)).toBe('0 s');
    expect(formatDuration(59)).toBe('59 s');
    expect(formatDuration(61)).toBe('1 min 1 s');
    expect(formatDuration(120)).toBe('2 min');
    expect(formatDuration(3600 + 120)).toBe('1 h 2 min');
    expect(formatDuration(86400 * 2 + 3600)).toBe('2 d 1 h');
  });
});

describe('ukládání', () => {
  const NOW = 1_700_000_000_000;

  it('roundtrip zachová stav', () => {
    const state = {
      ...createInitialState(NOW),
      crystals: 123.5,
      generators: { drone: 3 },
      upgrades: ['gloves'],
      stardust: 2,
      stardustEarned: 5,
      stardustUpgrades: { quick_start: 1 },
    };
    expect(deserialize(serialize(state), NOW)).toEqual(state);
  });

  it('poškozená data vrátí null', () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize('')).toBeNull();
    expect(deserialize('{nope')).toBeNull();
    expect(deserialize('42')).toBeNull();
  });

  it('neznámé generátory a vylepšení zahodí, špatné hodnoty nahradí', () => {
    const raw = JSON.stringify({
      crystals: 'hodně',
      generators: { drone: 2.7, unicorn: 5 },
      upgrades: ['gloves', 'gloves', 'nonsense', 7],
      stardust: -3,
    });
    const s = deserialize(raw, NOW)!;
    expect(s.crystals).toBe(0);
    expect(s.generators).toEqual({ drone: 2 });
    expect(s.upgrades).toEqual(['gloves']);
    expect(s.stardust).toBe(0);
    expect(s.lastSeenAt).toBe(NOW);
  });
});
