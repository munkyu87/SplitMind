export type ThemeMode = 'light' | 'dark' | 'star';

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
    // dim: {
    //   background: '#2c2c2e',
    //   text: '#e5e5e7',
    //   primary: '#5AC8FA',
    //   secondary: '#4CD964',
    //   border: '#3a3a3c',
    //   card: '#3a3a3c',
    // },
    star: {
      background: '#060B23',   // 채도 높은 딥 네이비
      text: '#B0C4DE',         // 연한 블루그레이
      primary: '#8A2BE2',      // 선명한 보라 (BlueViolet)
      secondary: '#00CED1',    // 청록빛
      border: '#1E2A4A',       // 네이비-블루 경계선
      card: '#101B3F',         // 카드 영역에 보라빛 네이비
    },
}