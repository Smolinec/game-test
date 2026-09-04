import AsyncStorage from '@react-native-async-storage/async-storage';
import { deserialize, SAVE_KEY, serialize } from './save';
import { GameState } from './types';

export async function loadGame(now: number = Date.now()): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    return deserialize(raw, now);
  } catch (error) {
    console.warn('Načtení uložené hry selhalo', error);
    return null;
  }
}

export async function saveGame(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVE_KEY, serialize(state));
  } catch (error) {
    console.warn('Uložení hry selhalo', error);
  }
}

export async function clearGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn('Smazání uložené hry selhalo', error);
  }
}
