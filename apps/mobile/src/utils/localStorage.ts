import { MMKV } from 'react-native-mmkv';

export const StorageKeys = {
  THEME_MODE: 'theme-mode',
  ACCESS_TOKEN: 'access-token',
  REFRESH_TOKEN: 'refresh-token',
};

const memory = new Map<string, string>();

function openStorage() {
  try {
    return new MMKV();
  } catch {
    return null;
  }
}

const storage = openStorage();

export const localStorage = {
  getItem: (key: string): string | null => {
    try {
      if (!storage) return memory.get(key) ?? null;
      return storage.getString(key) ?? null;
    } catch (e) {
      console.warn(`Error getting item [${key}]`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (!storage) {
        memory.set(key, value);
        return;
      }
      storage.set(key, value);
    } catch (e) {
      console.warn(`Error setting item [${key}]`, e);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (!storage) {
        memory.delete(key);
        return;
      }
      storage.delete(key);
    } catch (e) {
      console.warn(`Error removing item [${key}]`, e);
    }
  },
};