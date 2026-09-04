import { ENTITLEMENT_BOOST, ENTITLEMENT_OFFLINE, OFFLINE_CAP_PREMIUM_SECONDS, OFFLINE_CAP_SECONDS, OFFLINE_EFFICIENCY, PRESTIGE_BASE } from '../src/engine/data';
import {
  applyOfflineProgress,
  buyGenerator,
  createInitialState,
  offlineCapSeconds,
  prestige,
  productionPerSecond,
} from '../src/engine/engine';
import { deserialize, serialize } from '../src/engine/save';
import { applyPurchase, ownsProduct, PRODUCTS } from '../src/engine/shop';
import { GameState } from '../src/engine/types';
import { MockPurchaseProvider } from '../src/services/purchases';

const NOW = 1_700_000_000_000;

function withDrills(count: number): GameState {
  const base = { ...createInitialState(NOW), crystals: 1e9, runCrystals: 1e9, allTimeCrystals: 1e9 };
  return buyGenerator(base, 'drill', count);
}

describe('obchod', () => {
  it('každý produkt má unikátní id a cenu', () => {
    const ids = new Set(PRODUCTS.map((p) => p.id));
    expect(ids.size).toBe(PRODUCTS.length);
    for (const p of PRODUCTS) expect(p.priceLabel).toMatch(/Kč$/);
  });

  it('balíček hvězdného prachu přičte prach bez prestiže', () => {
    const s = applyPurchase(createInitialState(NOW), 'stardust_small');
    expect(s.stardust).toBe(10);
    expect(s.prestigeCount).toBe(0);
  });

  it('časový skok dá 4 hodiny produkce v plné výši', () => {
    const s = withDrills(10); // 10/s
    const after = applyPurchase(s, 'time_warp_4h');
    expect(after.crystals).toBeCloseTo(s.crystals + 10 * 4 * 3600);
    expect(after.runCrystals).toBeCloseTo(s.runCrystals + 10 * 4 * 3600);
  });

  it('dvojitý výkon zdvojnásobí produkci a nejde koupit dvakrát', () => {
    const s = withDrills(10);
    const boosted = applyPurchase(s, ENTITLEMENT_BOOST);
    expect(ownsProduct(boosted, ENTITLEMENT_BOOST)).toBe(true);
    expect(productionPerSecond(boosted)).toBeCloseTo(productionPerSecond(s) * 2);
    expect(applyPurchase(boosted, ENTITLEMENT_BOOST)).toBe(boosted);
    expect(boosted.entitlements).toEqual([ENTITLEMENT_BOOST]);
  });

  it('noční směna zvedne strop offline těžby na 24 h', () => {
    const s = { ...withDrills(1), lastSeenAt: NOW };
    expect(offlineCapSeconds(s)).toBe(OFFLINE_CAP_SECONDS);
    const premium = applyPurchase(s, ENTITLEMENT_OFFLINE);
    expect(offlineCapSeconds(premium)).toBe(OFFLINE_CAP_PREMIUM_SECONDS);
    const result = applyOfflineProgress(premium, NOW + 2 * OFFLINE_CAP_PREMIUM_SECONDS * 1000);
    expect(result.seconds).toBe(OFFLINE_CAP_PREMIUM_SECONDS);
    expect(result.capSeconds).toBe(OFFLINE_CAP_PREMIUM_SECONDS);
    expect(result.earned).toBeCloseTo(OFFLINE_CAP_PREMIUM_SECONDS * OFFLINE_EFFICIENCY);
  });

  it('nároky přežijí prestiž', () => {
    let s = { ...withDrills(1), runCrystals: PRESTIGE_BASE * 4 };
    s = applyPurchase(s, ENTITLEMENT_BOOST);
    const after = prestige(s, NOW + 1);
    expect(after.entitlements).toEqual([ENTITLEMENT_BOOST]);
    expect(after.stardust).toBe(2);
  });

  it('neznámý produkt nic nezmění', () => {
    const s = createInitialState(NOW);
    expect(applyPurchase(s, 'nonsense')).toBe(s);
  });

  it('nároky se ukládají a neznámé se při načtení zahodí', () => {
    const s = applyPurchase(createInitialState(NOW), ENTITLEMENT_OFFLINE);
    expect(deserialize(serialize(s), NOW)?.entitlements).toEqual([ENTITLEMENT_OFFLINE]);
    const raw = JSON.stringify({ entitlements: [ENTITLEMENT_BOOST, 'hacked_gold', ENTITLEMENT_BOOST, 5] });
    expect(deserialize(raw, NOW)?.entitlements).toEqual([ENTITLEMENT_BOOST]);
  });

  it('testovací poskytovatel nákup potvrdí a nic neobnoví', async () => {
    const provider = new MockPurchaseProvider(0);
    expect(provider.isSandbox).toBe(true);
    await expect(provider.purchase('stardust_small')).resolves.toBe('success');
    await expect(provider.restore()).resolves.toEqual([]);
  });
});
