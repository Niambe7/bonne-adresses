module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-native-reanimated|@react-navigation|expo-|expo|@expo|@unimodules|unimodules|sentry-expo)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};

