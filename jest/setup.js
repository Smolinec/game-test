// Jest nemá nativní moduly; AsyncStorage nahradí oficiální paměťový mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
