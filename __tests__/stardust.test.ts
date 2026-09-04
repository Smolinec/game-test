import { OFFLINE_EFFICIENCY, PRESTIGE_BASE, STARDUST_BONUS } from '../src/engine/data';
import {
  applyOfflineProgress,
  buyGenerator,
  buyStardustUpgrade,
  canBuyStardustUpgrade,
  click,
  clickValue,
  createInitialState,
  generatorCost,
  maxAffordable,
  offlineEfficiency,
  prestige,
  productionPerSecond,
  stardustMultiplier,
  stardustUpgradeCost,
  stardustUpgradeLevel,
} from '../src/engine/engine';
import { deserialize, serialize } from '../src/engine/save';
import { applyPurchase } from '../src/engine/shop';
import { STARDUST_UPGRADES } from '../src/engine/stardust';
import { GameState } from '../src/engine/types';

const NOW = 1_700_000_000_000;

function withStardust(stardust: number, extra: Partial<GameState> = {}): GameState {
  return { ...createInitialState(NOW), stardust, stardustEarned: stardust, ...extra };
}

describe('hvězdná vylepšení', () => {
  it('definice mají unikátní id a rostoucí ceny', () => {
    expect(new Set(STARDUST_UPGRADES.map((u) => u.id)).size).toBe(STARDUST_UPGRADES.length);
    for (const u of STARDUST_UPGRADES) {
      for (let i = 1; i < u.costs.length; i++) expect(u.costs[i]).toBeGreaterThan(u.costs[i - 1]);
    }
  });

  it('nákup odečte prach, zvýší úroveň a respektuje maximum', () => {
    let s = withStardust(200);
    expect(stardustUpgradeCost(s, 'stronger_click')).toBe(8);
    s = buyStardustUpgrade(s, 'stronger_click');
    expect(s.stardust).toBe(192);
    expect(stardustUpgradeLevel(s, 'stronger_click')).toBe(1);
    expect(stardustUpgradeCost(s, 'stronger_click')).toBe(25);
    s = buyStardustUpgrade(buyStardustUpgrade(s, 'stronger_click'), 'stronger_click');
    expect(stardustUpgradeLevel(s, 'stronger_click')).toBe(3);
    expect(stardustUpgradeCost(s, 'stronger_click')).toBeNull();
    expect(canBuyStardustUpgrade(s, 'stronger_click')).toBe(false);
    expect(buyStardustUpgrade(s, 'stronger_click')).toBe(s);
    expect(s.stardust).toBe(200 - 8 - 25 - 60);
  });

  it('bez dostatku prachu nebo s neznámým id se nic nestane', () => {
    const s = withStardust(3);
    expect(buyStardustUpgrade(s, 'quick_start')).toBe(s);
    expect(buyStardustUpgrade(s, 'nonsense')).toBe(s);
  });

  it('utracený prach přestane dávat pasivní bonus', () => {
    const s = withStardust(20);
    expect(stardustMultiplier(s)).toBeCloseTo(1 + 20 * STARDUST_BONUS);
    const after = buyStardustUpgrade(s, 'cheaper_generators'); // 10 ✨
    expect(stardustMultiplier(after)).toBeCloseTo(1 + 10 * STARDUST_BONUS);
  });

  it('silnější klepnutí zdvojnásobí hodnotu klepnutí za úroveň', () => {
    const s = withStardust(0);
    const base = clickValue(s);
    let up = { ...s, stardustUpgrades: { stronger_click: 2 } };
    expect(clickValue(up)).toBeCloseTo(base * 4);
    up = { ...s, stardustUpgrades: { stronger_click: 3 } };
    expect(clickValue(up)).toBeCloseTo(base * 8);
  });

  it('levnější zařízení sníží ceny a maxAffordable s tím počítá', () => {
    const s = { ...withStardust(0), crystals: 1000 };
    const cheap = { ...s, stardustUpgrades: { cheaper_generators: 3 } };
    expect(generatorCost(cheap, 'drone', 1)).toBeCloseTo(generatorCost(s, 'drone', 1) * 0.85);
    expect(generatorCost(cheap, 'drone', 5)).toBeCloseTo(generatorCost(s, 'drone', 5) * 0.85);
    const n = maxAffordable(cheap, 'drone');
    expect(n).toBeGreaterThanOrEqual(maxAffordable(s, 'drone'));
    expect(generatorCost(cheap, 'drone', n)).toBeLessThanOrEqual(1000);
    expect(generatorCost(cheap, 'drone', n + 1)).toBeGreaterThan(1000);
  });

  it('efektivní offline zvedne účinnost na 75 %', () => {
    let s = buyGenerator({ ...withStardust(0), crystals: 1000, runCrystals: 1000 }, 'drill', 2);
    s = { ...s, lastSeenAt: NOW };
    expect(offlineEfficiency(s)).toBe(OFFLINE_EFFICIENCY);
    const up = { ...s, stardustUpgrades: { offline_efficiency: 1 } };
    const result = applyOfflineProgress(up, NOW + 100_000);
    expect(result.efficiency).toBe(0.75);
    expect(result.earned).toBeCloseTo(productionPerSecond(up) * 100 * 0.75);
  });

  it('zlatá žíla dá 100× jen při šťastném hodu', () => {
    const s = { ...withStardust(0), stardustUpgrades: { golden_vein: 1 } };
    const lucky = click(s, () => 0.001);
    expect(lucky.golden).toBe(true);
    expect(lucky.gained).toBeCloseTo(clickValue(s) * 100);
    expect(lucky.state.crystals).toBeCloseTo(clickValue(s) * 100);
    const unlucky = click(s, () => 0.5);
    expect(unlucky.golden).toBe(false);
    expect(unlucky.gained).toBeCloseTo(clickValue(s));
    expect(click(withStardust(0), () => 0).golden).toBe(false);
  });

  it('katalyzátor zvedne bonus za prach na 15 %', () => {
    const s = withStardust(10);
    const up = { ...s, stardustUpgrades: { catalyst: 1 } };
    expect(stardustMultiplier(up)).toBeCloseTo(1 + 10 * 0.15);
  });

  it('rychlý start dá po prestiži drony a krystaly, vylepšení a prach zůstanou', () => {
    let s = withStardust(5, { runCrystals: PRESTIGE_BASE * 4, allTimeCrystals: PRESTIGE_BASE * 4 });
    s = buyStardustUpgrade(s, 'quick_start');
    expect(s.stardust).toBe(0);
    const after = prestige(s, NOW + 1);
    expect(after.stardust).toBe(2);
    expect(after.stardustEarned).toBe(7);
    expect(after.generators).toEqual({ drone: 10 });
    expect(after.crystals).toBe(1_000);
    expect(after.runCrystals).toBe(0);
    expect(after.stardustUpgrades).toEqual({ quick_start: 1 });
  });

  it('prach z obchodu se počítá do získaného prachu', () => {
    const s = applyPurchase(withStardust(0), 'stardust_medium');
    expect(s.stardust).toBe(35);
    expect(s.stardustEarned).toBe(35);
  });

  it('úrovně se ukládají, neznámé se zahodí a přesah se ořízne', () => {
    const s = { ...withStardust(1), stardustUpgrades: { stronger_click: 2, golden_vein: 1 } };
    expect(deserialize(serialize(s), NOW)?.stardustUpgrades).toEqual({ stronger_click: 2, golden_vein: 1 });
    const raw = JSON.stringify({ stardust: 7, stardustUpgrades: { stronger_click: 99, bogus: 1, quick_start: 0 } });
    const loaded = deserialize(raw, NOW)!;
    expect(loaded.stardustUpgrades).toEqual({ stronger_click: 3 });
    expect(loaded.stardustEarned).toBe(7);
  });
});
