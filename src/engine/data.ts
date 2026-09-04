import { GeneratorDef, UpgradeDef } from './types';

/** Kolik sekund offline produkce se maximálně započítá. */
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
/** Strop offline produkce s nárokem „Noční směna“ z obchodu. */
export const OFFLINE_CAP_PREMIUM_SECONDS = 24 * 60 * 60;
/** Násobitel produkce s nárokem „Dvojitý výkon“ z obchodu. */
export const PREMIUM_BOOST_MULTIPLIER = 2;

/** Id trvalých nároků z obchodu, na které engine reaguje. */
export const ENTITLEMENT_BOOST = 'boost_x2';
export const ENTITLEMENT_OFFLINE = 'offline_24h';
/** Účinnost offline produkce (0–1). */
export const OFFLINE_EFFICIENCY = 0.5;
/** Kolik krystalů z běhu je potřeba na první hvězdný prach. */
export const PRESTIGE_BASE = 1e7;
/** Bonus k produkci za každý hvězdný prach (0.1 = +10 %). */
export const STARDUST_BONUS = 0.1;
/** Kolik neutraceného hvězdného prachu stojí založení nové galaxie. */
export const GALAXY_COST = 1_000;
/** Násobitel produkce za každou galaxii (×3, ×9, ×27…). */
export const GALAXY_MULTIPLIER = 3;
/** Bonus k zisku prachu při prestiži za každou galaxii (+100 % za galaxii). */
export const GALAXY_PRESTIGE_BONUS = 1;

export const GENERATORS: GeneratorDef[] = [
  {
    id: 'drone',
    name: 'Těžební dron',
    icon: '🛸',
    description: 'Malý autonomní dron, který sbírá krystaly z povrchu.',
    baseCost: 15,
    costGrowth: 1.15,
    baseProduction: 0.1,
  },
  {
    id: 'drill',
    name: 'Vrtná souprava',
    icon: '⛏️',
    description: 'Vrtá hluboko do skály, kde jsou krystaly větší.',
    baseCost: 100,
    costGrowth: 1.15,
    baseProduction: 1,
  },
  {
    id: 'refinery',
    name: 'Rafinerie',
    icon: '🏭',
    description: 'Čistí surovou rudu a získává z ní násobně víc krystalů.',
    baseCost: 1_100,
    costGrowth: 1.15,
    baseProduction: 8,
  },
  {
    id: 'freighter',
    name: 'Nákladní loď',
    icon: '🚀',
    description: 'Vozí krystaly z okolních měsíců.',
    baseCost: 12_000,
    costGrowth: 1.15,
    baseProduction: 47,
  },
  {
    id: 'asteroid',
    name: 'Asteroidová farma',
    icon: '☄️',
    description: 'Celý asteroid přeměněný na těžební operaci.',
    baseCost: 130_000,
    costGrowth: 1.15,
    baseProduction: 260,
  },
  {
    id: 'station',
    name: 'Orbitální stanice',
    icon: '🛰️',
    description: 'Koordinuje těžbu v celé soustavě.',
    baseCost: 1.4e6,
    costGrowth: 1.15,
    baseProduction: 1_400,
  },
  {
    id: 'quantum',
    name: 'Kvantový kolektor',
    icon: '⚛️',
    description: 'Získává krystaly přímo z kvantových fluktuací.',
    baseCost: 2e7,
    costGrowth: 1.15,
    baseProduction: 7_800,
  },
  {
    id: 'fusion',
    name: 'Fúzní reaktor',
    icon: '☀️',
    description: 'Syntetizuje krystaly z čisté energie.',
    baseCost: 3.3e8,
    costGrowth: 1.15,
    baseProduction: 44_000,
  },
  {
    id: 'dyson',
    name: 'Dysonův prstenec',
    icon: '🪐',
    description: 'Obepíná celou hvězdu a sklízí její výkon.',
    baseCost: 5.1e9,
    costGrowth: 1.15,
    baseProduction: 260_000,
  },
  {
    id: 'portal',
    name: 'Dimenzionální portál',
    icon: '🌀',
    description: 'Otevírá cestu do vesmírů, kde krystaly rostou na stromech.',
    baseCost: 7.5e10,
    costGrowth: 1.15,
    baseProduction: 1.6e6,
  },
  {
    id: 'nebula',
    name: 'Sklizeň mlhoviny',
    icon: '🌌',
    description: 'Stlačuje celé mlhoviny do krystalů.',
    baseCost: 1e12,
    costGrowth: 1.15,
    baseProduction: 1e7,
  },
  {
    id: 'blackhole',
    name: 'Černá díra',
    icon: '🌑',
    description: 'Z horizontu událostí se nedostane nic, kromě krystalů.',
    baseCost: 1.4e13,
    costGrowth: 1.15,
    baseProduction: 6.5e7,
  },
  {
    id: 'multiverse',
    name: 'Multiverzální důl',
    icon: '♾️',
    description: 'Těží v nekonečně mnoha vesmírech naráz.',
    baseCost: 2e14,
    costGrowth: 1.15,
    baseProduction: 4.3e8,
  },
];

const GENERATOR_TIERS: { count: number; multiplier: number; costMultiplier: number; suffix: string }[] = [
  { count: 10, multiplier: 2, costMultiplier: 10, suffix: 'I' },
  { count: 25, multiplier: 2, costMultiplier: 100, suffix: 'II' },
  { count: 50, multiplier: 2, costMultiplier: 1_000, suffix: 'III' },
  { count: 100, multiplier: 3, costMultiplier: 10_000, suffix: 'IV' },
];

function generatorUpgrades(): UpgradeDef[] {
  const result: UpgradeDef[] = [];
  for (const gen of GENERATORS) {
    for (const tier of GENERATOR_TIERS) {
      result.push({
        id: `${gen.id}_${tier.suffix}`,
        name: `${gen.name} ${tier.suffix}`,
        icon: gen.icon,
        description: `${gen.name}: produkce ×${tier.multiplier}.`,
        cost: gen.baseCost * tier.costMultiplier,
        effect: { type: 'generator', generatorId: gen.id, multiplier: tier.multiplier },
        requires: { generatorId: gen.id, count: tier.count },
      });
    }
  }
  return result;
}

const SPECIAL_UPGRADES: UpgradeDef[] = [
  {
    id: 'gloves',
    name: 'Zesílené rukavice',
    icon: '🧤',
    description: 'Klepnutí dává ×2 krystalů.',
    cost: 100,
    effect: { type: 'click', multiplier: 2 },
  },
  {
    id: 'laser_pick',
    name: 'Laserový krumpáč',
    icon: '🔦',
    description: 'Klepnutí dává ×2 krystalů.',
    cost: 2_500,
    effect: { type: 'click', multiplier: 2 },
  },
  {
    id: 'exosuit',
    name: 'Exo-oblek',
    icon: '🦾',
    description: 'Klepnutí dává ×3 krystalů.',
    cost: 50_000,
    effect: { type: 'click', multiplier: 3 },
  },
  {
    id: 'sync',
    name: 'Synchronizace',
    icon: '🔗',
    description: 'Každé klepnutí přidá 1 % produkce za sekundu.',
    cost: 500_000,
    effect: { type: 'clickFromProduction', percent: 1 },
  },
  {
    id: 'neural',
    name: 'Neurální rozhraní',
    icon: '🧠',
    description: 'Každé klepnutí přidá další 2 % produkce za sekundu.',
    cost: 5e7,
    effect: { type: 'clickFromProduction', percent: 2 },
  },
  {
    id: 'logistics',
    name: 'Kosmická logistika',
    icon: '📦',
    description: 'Veškerá produkce +10 %.',
    cost: 250_000,
    effect: { type: 'global', multiplier: 1.1 },
  },
  {
    id: 'network',
    name: 'Galaktická síť',
    icon: '🌐',
    description: 'Veškerá produkce +25 %.',
    cost: 2.5e7,
    effect: { type: 'global', multiplier: 1.25 },
  },
  {
    id: 'ai_core',
    name: 'Jádro umělé inteligence',
    icon: '🤖',
    description: 'Veškerá produkce +50 %.',
    cost: 2.5e9,
    effect: { type: 'global', multiplier: 1.5 },
  },
  {
    id: 'singularity',
    name: 'Singularita',
    icon: '🕳️',
    description: 'Veškerá produkce ×2.',
    cost: 2.5e11,
    effect: { type: 'global', multiplier: 2 },
  },
];

export const UPGRADES: UpgradeDef[] = [...SPECIAL_UPGRADES, ...generatorUpgrades()];

export const GENERATOR_BY_ID: Record<string, GeneratorDef> = Object.fromEntries(
  GENERATORS.map((g) => [g.id, g]),
);
export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);
