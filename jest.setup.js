global.__DEV__ = true;

jest.mock('react-native-safe-area-context', () => ({
  getStatusBarHeight: () => 0,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/driver',
  useLocalSearchParams: () => ({}),
}));
