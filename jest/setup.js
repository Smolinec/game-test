// Jest nemá nativní moduly; AsyncStorage nahradí oficiální paměťový mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-audio potřebuje nativní modul; testy zvuk jen „přehrají“ naprázdno.
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({ play: () => undefined, seekTo: () => undefined, volume: 1 }),
  setAudioModeAsync: async () => undefined,
}));
