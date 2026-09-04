/**
 * Anglické názvy a popisy herních dat. Česká verze je přímo v definicích
 * v `src/engine`, takže tady je jen překlad podle id. Chybějící překlad
 * spadne na češtinu, aby nic nezůstalo prázdné.
 */
export interface NamedText {
  name: string;
  description: string;
}

export const generatorsEn: Record<string, NamedText> = {
  drone: { name: 'Mining drone', description: 'A small autonomous drone that collects crystals from the surface.' },
  drill: { name: 'Drill rig', description: 'Drills deep into the rock where the crystals are bigger.' },
  refinery: { name: 'Refinery', description: 'Purifies raw ore and gets many times more crystals out of it.' },
  freighter: { name: 'Freighter', description: 'Hauls crystals from the nearby moons.' },
  asteroid: { name: 'Asteroid farm', description: 'A whole asteroid turned into a mining operation.' },
  station: { name: 'Orbital station', description: 'Coordinates mining across the whole system.' },
  quantum: { name: 'Quantum collector', description: 'Pulls crystals straight out of quantum fluctuations.' },
  fusion: { name: 'Fusion reactor', description: 'Synthesises crystals from pure energy.' },
  dyson: { name: 'Dyson ring', description: 'Wraps an entire star and harvests its output.' },
  portal: { name: 'Dimensional portal', description: 'Opens a way to universes where crystals grow on trees.' },
  nebula: { name: 'Nebula harvest', description: 'Compresses whole nebulae into crystals.' },
  blackhole: { name: 'Black hole', description: 'Nothing escapes the event horizon, except crystals.' },
  multiverse: { name: 'Multiverse mine', description: 'Mines in infinitely many universes at once.' },
};

export const upgradesEn: Record<string, NamedText> = {
  gloves: { name: 'Reinforced gloves', description: 'Taps give ×2 crystals.' },
  laser_pick: { name: 'Laser pickaxe', description: 'Taps give ×2 crystals.' },
  exosuit: { name: 'Exosuit', description: 'Taps give ×3 crystals.' },
  sync: { name: 'Synchronisation', description: 'Every tap adds 1 % of production per second.' },
  neural: { name: 'Neural interface', description: 'Every tap adds another 2 % of production per second.' },
  logistics: { name: 'Space logistics', description: 'All production +10 %.' },
  network: { name: 'Galactic network', description: 'All production +25 %.' },
  ai_core: { name: 'AI core', description: 'All production +50 %.' },
  singularity: { name: 'Singularity', description: 'All production ×2.' },
};

/** Šablony pro generovaná vylepšení zařízení (id `<generator>_<I..IV>`). */
export const tierUpgradeEn = {
  name: '{generator} {suffix}',
  description: '{generator}: production ×{mult}.',
};

export const productsEn: Record<string, NamedText> = {
  stardust_small: { name: 'Handful of stardust', description: '+10 stardust instantly, no prestige needed.' },
  stardust_medium: { name: 'Chest of stardust', description: '+35 stardust instantly.' },
  stardust_large: { name: 'Nebula of stardust', description: '+100 stardust instantly.' },
  time_warp_4h: { name: 'Time warp', description: 'Instantly receive 4 hours of full production.' },
  boost_x2: { name: 'Double output', description: 'Permanently ×2 production of all devices. Survives prestige.' },
  offline_24h: { name: 'Night shift', description: 'Offline mining counts up to 24 hours instead of 8.' },
};

export const stardustUpgradesEn: Record<string, NamedText> = {
  quick_start: { name: 'Quick start', description: 'After prestige you start with 10 drones and 1,000 crystals.' },
  stronger_click: { name: 'Stronger tap', description: 'Each level doubles the tap value.' },
  cheaper_generators: { name: 'Cheaper devices', description: 'Each level lowers all device prices by 5 %.' },
  offline_efficiency: { name: 'Efficient offline', description: 'Offline mining runs at 75 % instead of 50 %.' },
  golden_vein: { name: 'Golden vein', description: 'Every tap has a 1 % chance to give 100×.' },
  catalyst: { name: 'Star catalyst', description: 'The bonus per unspent stardust rises from 10 % to 15 %.' },
};

export const achievementsEn: Record<string, NamedText> = {
  clicks_100: { name: 'First blisters', description: 'Tap 100 times.' },
  clicks_1k: { name: 'Persistent miner', description: 'Tap 1,000 times.' },
  clicks_10k: { name: 'Steel fingers', description: 'Tap 10,000 times.' },
  clicks_100k: { name: 'Pickaxe legend', description: 'Tap 100,000 times.' },
  crystals_1k: { name: 'First thousand', description: 'Mine 1,000 crystals in total.' },
  crystals_1m: { name: 'Millionaire', description: 'Mine 1 million crystals in total.' },
  crystals_1b: { name: 'Billionaire', description: 'Mine 1 billion crystals in total.' },
  crystals_1t: { name: 'Trillionaire', description: 'Mine 1 trillion crystals in total.' },
  crystals_1qa: { name: 'Lord of crystals', description: 'Mine 1 quadrillion crystals in total.' },
  gens_10: { name: 'Base camp', description: 'Own 10 devices.' },
  gens_100: { name: 'Industrial zone', description: 'Own 100 devices.' },
  gens_500: { name: 'Mining empire', description: 'Own 500 devices.' },
  gens_1000: { name: 'Planetary network', description: 'Own 1,000 devices.' },
  types_5: { name: 'Varied fleet', description: 'Own 5 different kinds of devices.' },
  types_all: { name: 'Complete collection', description: 'Own every kind of device.' },
  prestige_1: { name: 'Rebirth', description: 'Perform your first prestige.' },
  prestige_5: { name: 'Cycle of stars', description: 'Perform 5 prestiges.' },
  prestige_25: { name: 'Eternal return', description: 'Perform 25 prestiges.' },
  upgrades_10: { name: 'Modernisation', description: 'Buy 10 upgrades in one run.' },
  upgrades_25: { name: 'Cutting edge', description: 'Buy 25 upgrades in one run.' },
  stardust_10: { name: 'Handful of stars', description: 'Earn 10 stardust in total.' },
  stardust_100: { name: 'Star cluster', description: 'Earn 100 stardust in total.' },
  stardust_1000: { name: 'Galactic core', description: 'Earn 1,000 stardust in total.' },
  galaxy_1: { name: 'New galaxy', description: 'Found your first galaxy.' },
  galaxy_5: { name: 'Creator of universes', description: 'Found 5 galaxies.' },
  time_1h: { name: 'First shift', description: 'Play for 1 hour.' },
  time_10h: { name: 'Night shift', description: 'Play for 10 hours.' },
  time_100h: { name: 'Life in the mine', description: 'Play for 100 hours.' },
};
