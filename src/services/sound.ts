import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * Přehrávání zvukových efektů. Zvuky jsou krátké WAV soubory generované
 * skriptem `tools/make-sounds.py`. Přehrávače se vytvářejí líně při prvním
 * použití a zapnutí/vypnutí řídí nastavení hráče.
 */
export type SoundName = 'tap' | 'buy' | 'upgrade' | 'prestige' | 'golden' | 'achievement';

const SOURCES: Record<SoundName, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  buy: require('../../assets/sounds/buy.wav'),
  upgrade: require('../../assets/sounds/upgrade.wav'),
  prestige: require('../../assets/sounds/prestige.wav'),
  golden: require('../../assets/sounds/golden.wav'),
  achievement: require('../../assets/sounds/achievement.wav'),
};

const VOLUME: Record<SoundName, number> = {
  tap: 0.5,
  buy: 0.6,
  upgrade: 0.6,
  prestige: 0.8,
  golden: 0.8,
  achievement: 0.7,
};

let enabled = true;
let modeConfigured = false;
/** Prohlížeče blokují zvuk před první interakcí; pasivní zvuky do té doby přeskočíme. */
let userInteracted = false;
const players: Partial<Record<SoundName, AudioPlayer>> = {};

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function getPlayer(name: SoundName): AudioPlayer | null {
  try {
    if (!modeConfigured) {
      modeConfigured = true;
      // Zvuky hry nemají přerušovat hudbu z jiné aplikace a mají hrát i v tichém režimu iOS jen potichu.
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    }
    let player = players[name];
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = VOLUME[name];
      players[name] = player;
    }
    return player;
  } catch (error) {
    console.warn('Zvuk se nepodařilo připravit', name, error);
    return null;
  }
}

/**
 * Přehraje efekt od začátku; při vypnutých zvucích nedělá nic.
 * `passive` označuje zvuky, které nespustil hráč (např. oznámení při načtení);
 * ty se přehrají až poté, co hráč aspoň jednou něco udělal.
 */
export function playSound(name: SoundName, options: { passive?: boolean } = {}): void {
  if (!enabled) return;
  if (options.passive && !userInteracted) return;
  if (!options.passive) userInteracted = true;
  const player = getPlayer(name);
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch (error) {
    console.warn('Zvuk se nepodařilo přehrát', name, error);
  }
}
