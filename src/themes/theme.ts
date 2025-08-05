export type ThemeMode = 'light' | 'dark' | 'dim';

export interface AppTheme {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
    card: string;
}

export const themes: Record<ThemeMode, AppTheme> = {
    light: {
      background: '#ffffff',
      text: '#111111',
      primary: '#007AFF',
      secondary: '#34C759',
      border: '#dcdcdc',
      card: '#f5f5f5',
    },
    dark: {
      background: '#121212',
      text: '#f5f5f5',
      primary: '#0A84FF',
      secondary: '#30D158',
      border: '#333333',
      card: '#1e1e1e',
    },
    dim: {
      background: '#2c2c2e',
      text: '#e5e5e7',
      primary: '#5AC8FA',
      secondary: '#4CD964',
      border: '#3a3a3c',
      card: '#3a3a3c',
    },
}