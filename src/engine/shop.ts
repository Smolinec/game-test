import { ENTITLEMENT_BOOST, ENTITLEMENT_OFFLINE, PREMIUM_BOOST_MULTIPLIER } from './data';
import { addCrystals, hasEntitlement, productionPerSecond } from './engine';
import { GameState } from './types';

/**
 * Placené položky obchodu. Ceny jsou orientační pro české obchody; skutečné
 * ceny se po napojení na App Store / Google Play berou z obchodu.
 */
export type ProductKind = 'consumable' | 'entitlement';

export type ProductEffect =
  | { type: 'stardust'; amount: number }
  | { type: 'timeWarp'; hours: number }
  | { type: 'entitlement'; entitlementId: string };

export interface ProductDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Zobrazovaná cena; po napojení na obchod ji nahradí lokalizovaná cena z obchodu. */
  priceLabel: string;
  kind: ProductKind;
  effect: ProductEffect;
  /** Zvýrazněná nabídka. */
  featured?: boolean;
}

export const PRODUCTS: ProductDef[] = [
  {
    id: 'stardust_small',
    name: 'Hrst hvězdného prachu',
    icon: '✨',
    description: '+10 hvězdného prachu ihned, bez prestiže.',
    priceLabel: '49 Kč',
    kind: 'consumable',
    effect: { type: 'stardust', amount: 10 },
  },
  {
    id: 'stardust_medium',
    name: 'Truhla hvězdného prachu',
    icon: '💫',
    description: '+35 hvězdného prachu ihned.',
    priceLabel: '129 Kč',
    kind: 'consumable',
    effect: { type: 'stardust', amount: 35 },
    featured: true,
  },
  {
    id: 'stardust_large',
    name: 'Mlhovina hvězdného prachu',
    icon: '🌌',
    description: '+100 hvězdného prachu ihned.',
    priceLabel: '299 Kč',
    kind: 'consumable',
    effect: { type: 'stardust', amount: 100 },
  },
  {
    id: 'time_warp_4h',
    name: 'Časový skok',
    icon: '⏩',
    description: 'Okamžitě získáš 4 hodiny produkce v plné výši.',
    priceLabel: '39 Kč',
    kind: 'consumable',
    effect: { type: 'timeWarp', hours: 4 },
  },
  {
    id: ENTITLEMENT_BOOST,
    name: 'Dvojitý výkon',
    icon: '⚡',
    description: `Trvale ×${PREMIUM_BOOST_MULTIPLIER} produkce všech zařízení. Přežije i prestiž.`,
    priceLabel: '149 Kč',
    kind: 'entitlement',
    effect: { type: 'entitlement', entitlementId: ENTITLEMENT_BOOST },
    featured: true,
  },
  {
    id: ENTITLEMENT_OFFLINE,
    name: 'Noční směna',
    icon: '🌙',
    description: 'Offline těžba se počítá až 24 hodin místo 8.',
    priceLabel: '79 Kč',
    kind: 'entitlement',
    effect: { type: 'entitlement', entitlementId: ENTITLEMENT_OFFLINE },
  },
];

export const PRODUCT_BY_ID: Record<string, ProductDef> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const ENTITLEMENT_IDS: string[] = PRODUCTS.filter((p) => p.kind === 'entitlement').map((p) => p.id);

export function ownsProduct(state: GameState, productId: string): boolean {
  const def = PRODUCT_BY_ID[productId];
  return !!def && def.kind === 'entitlement' && hasEntitlement(state, def.effect.type === 'entitlement' ? def.effect.entitlementId : '');
}

/**
 * Aplikuje efekt zakoupeného produktu na herní stav. Volá se až po úspěšném
 * nákupu (skutečném nebo testovacím). Vlastněný trvalý nárok nic nezmění.
 */
export function applyPurchase(state: GameState, productId: string): GameState {
  const def = PRODUCT_BY_ID[productId];
  if (!def) return state;
  switch (def.effect.type) {
    case 'stardust':
      return { ...state, stardust: state.stardust + def.effect.amount };
    case 'timeWarp':
      return addCrystals(state, productionPerSecond(state) * def.effect.hours * 3600);
    case 'entitlement': {
      const id = def.effect.entitlementId;
      if (hasEntitlement(state, id)) return state;
      return { ...state, entitlements: [...state.entitlements, id] };
    }
  }
}
