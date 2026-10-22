import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeProvider as SCProvider } from 'styled-components/native';
import { themes, ThemeMode, AppTheme } from './theme';

interface ThemeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const theme = themes[mode];

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme }}>
      <SCProvider theme={theme}>{children}</SCProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
};