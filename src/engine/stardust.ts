/**
 * Hvězdná vylepšení – trvalá vylepšení kupovaná za hvězdný prach.
 * Utracený prach přestává dávat pasivní bonus k produkci, takže každá
 * koupě je rozhodnutí mezi okamžitým výkonem a dlouhodobou výhodou.
 */

export type StardustEffect =
  | { type: 'quickStart'; drones: number; crystals: number }
  | { type: 'generatorDiscount'; percentPerLevel: number }
  | { type: 'clickMultiplier'; multiplierPerLevel: number }
  | { type: 'offlineEfficiency'; efficiency: number }
  | { type: 'goldenVein'; chance: number; multiplier: number }
  | { type: 'catalyst'; bonusPerStardust: number };

export interface StardustUpgradeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Cena každé úrovně; délka pole = maximální úroveň. */
  costs: number[];
  effect: StardustEffect;
}

export const STARDUST_UPGRADES: StardustUpgradeDef[] = [
  {
    id: 'quick_start',
    name: 'Rychlý start',
    icon: '🚀',
    description: 'Po prestiži začínáš s 10 drony a 1 000 krystaly.',
    costs: [5],
    effect: { type: 'quickStart', drones: 10, crystals: 1_000 },
  },
  {
    id: 'stronger_click',
    name: 'Silnější klepnutí',
    icon: '👆',
    description: 'Každá úroveň zdvojnásobí hodnotu klepnutí.',
    costs: [8, 25, 60],
    effect: { type: 'clickMultiplier', multiplierPerLevel: 2 },
  },
  {
    id: 'cheaper_generators',
    name: 'Levnější zařízení',
    icon: '🏷️',
    description: 'Každá úroveň sníží ceny všech zařízení o 5 %.',
    costs: [10, 30, 80],
    effect: { type: 'generatorDiscount', percentPerLevel: 5 },
  },
  {
    id: 'offline_efficiency',
    name: 'Efektivní offline',
    icon: '🛌',
    description: 'Offline těžba běží na 75 % výkonu místo 50 %.',
    costs: [15],
    effect: { type: 'offlineEfficiency', efficiency: 0.75 },
  },
  {
    id: 'golden_vein',
    name: 'Zlatá žíla',
    icon: '🌟',
    description: 'Každé klepnutí má 1% šanci dát 100× víc.',
    costs: [40],
    effect: { type: 'goldenVein', chance: 0.01, multiplier: 100 },
  },
  {
    id: 'catalyst',
    name: 'Hvězdný katalyzátor',
    icon: '🔮',
    description: 'Bonus za každý neutracený prach roste z 10 % na 15 %.',
    costs: [100],
    effect: { type: 'catalyst', bonusPerStardust: 0.15 },
  },
];

export const STARDUST_UPGRADE_BY_ID: Record<string, StardustUpgradeDef> = Object.fromEntries(
  STARDUST_UPGRADES.map((u) => [u.id, u]),
);

export function maxLevel(def: StardustUpgradeDef): number {
  return def.costs.length;
}
