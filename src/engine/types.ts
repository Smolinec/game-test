/**
 * Datové typy herního enginu. Engine je čistý TypeScript bez závislosti na
 * React Native, aby šel snadno testovat a případně použít i na webu.
 */

export interface GeneratorDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Cena první jednotky. */
  baseCost: number;
  /** Násobek ceny za každou další koupenou jednotku. */
  costGrowth: number;
  /** Základní produkce krystalů za sekundu na jednu jednotku. */
  baseProduction: number;
}

export type UpgradeEffect =
  | { type: 'generator'; generatorId: string; multiplier: number }
  | { type: 'click'; multiplier: number }
  | { type: 'global'; multiplier: number }
  /** Každé klepnutí přidá navíc `percent` % aktuální produkce za sekundu. */
  | { type: 'clickFromProduction'; percent: number };

export interface UpgradeRequirement {
  generatorId: string;
  count: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  effect: UpgradeEffect;
  /** Vylepšení se zobrazí až po splnění podmínky. */
  requires?: UpgradeRequirement;
}

export interface GameState {
  version: number;
  /** Aktuální zůstatek krystalů. */
  crystals: number;
  /** Krystaly získané v aktuálním běhu (od poslední prestiže). */
  runCrystals: number;
  /** Krystaly získané za celou dobu hraní. */
  allTimeCrystals: number;
  /** Počet vlastněných generátorů podle id. */
  generators: Record<string, number>;
  /** Id zakoupených vylepšení. */
  upgrades: string[];
  /** Trvalé nároky z obchodu (přežijí prestiž). */
  entitlements: string[];
  /** Hvězdný prach – prestižní měna (neutracený zůstatek). */
  stardust: number;
  /** Kolik hvězdného prachu hráč celkem získal (prestiž + obchod). */
  stardustEarned: number;
  /** Úrovně hvězdných vylepšení podle id. */
  stardustUpgrades: Record<string, number>;
  /** Id splněných úspěchů. */
  achievements: string[];
  /** Denní odměna. */
  daily: { lastClaimedAt: number; streak: number };
  /** Zbývající herní sekundy boostu ×2 z videa. */
  boostSecondsLeft: number;
  /** Epoch ms, do kdy nejde spustit další video pro boost. */
  boostAdCooldownUntil: number;
  /** Kolik odměněných videí hráč shlédl. */
  adsWatched: number;
  /** Počet založených galaxií (druhá vrstva prestiže). */
  galaxies: number;
  prestigeCount: number;
  clicks: number;
  /** Epoch ms posledního uložení / ticku – slouží k offline výpočtu. */
  lastSeenAt: number;
  startedAt: number;
  playTimeSeconds: number;
}

export interface OfflineResult {
  state: GameState;
  /** Kolik sekund bylo skutečně započítáno (po aplikaci limitu). */
  seconds: number;
  /** Kolik sekund uplynulo doopravdy. */
  elapsedSeconds: number;
  /** Strop offline času, který pro hráče platil. */
  capSeconds: number;
  /** Účinnost offline těžby, která pro hráče platila (0–1). */
  efficiency: number;
  earned: number;
  /** True, když hráč výdělek zdvojnásobil videem. */
  doubled?: boolean;
}
