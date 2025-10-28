import '@testing-library/jest-native/extend-expect';
jest.setTimeout(10000);

// Silence React Native Maps warnings in tests
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = (props: any) => React.createElement(View, props, props.children);
  Mock.Marker = Mock;
  Mock.Callout = Mock;
  return Mock;
});

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
}));

// Router mock by default; tests can override
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
