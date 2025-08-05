import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { useColorScheme } from 'react-native';

import { themes, ThemeMode } from '@themes/theme';
import { store } from '@stores/store';
import RootNavigator from '@navigation/RootNavigator';

const AppProvider = () => {
  const scheme = useColorScheme(); // 'light' | 'dark' | null

  const selectedMode: ThemeMode = 'dim';
//   const selectedTheme =
//     scheme === 'dark' ? darkTheme : scheme === 'light' ? lightTheme : blueTheme;

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <ThemeProvider theme={themes[selectedMode]}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
};

export default AppProvider;