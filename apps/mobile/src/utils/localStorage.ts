import { MMKV } from 'react-native-mmkv';

export const StorageKeys = {
  THEME_MODE: 'theme-mode',
  ACCESS_TOKEN: 'access-token',
  REFRESH_TOKEN: 'refresh-token',
};

const storage = new MMKV();

export const localStorage = {
  getItem: (key: string): string | null => {
    try {
      return storage.getString(key) ?? null;
    } catch (e) {
      console.warn(`Error getting item [${key}]`, e);
      return null;
    }
  },


  setItem: (key: string, value: string): void => {
    try {
      storage.set(key, value);
    } catch (e) {
      console.warn(`Error setting item [${key}]`, e);
    }
  },

  removeItem: (key: string): void => {
    try {
      storage.delete(key);
    } catch (e) {
      console.warn(`Error removing item [${key}]`, e);
    }
  },
};