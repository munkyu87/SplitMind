module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@tanstack/react-query|react-native-webview|react-native-safe-area-context|react-native-screens|react-native-mmkv)/)',
  ],
};
