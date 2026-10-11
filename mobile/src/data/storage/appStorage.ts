import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memory = new Map<string, string>();

export async function readFlag(key: string): Promise<string | null> {
  const cached = memory.get(key);
  if (cached !== undefined) return cached;
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function writeFlag(key: string, value: string): Promise<void> {
  memory.set(key, value);
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // The in-memory copy still covers this app session.
  }
}

export async function removeFlag(key: string): Promise<void> {
  memory.delete(key);
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore storage failures on logout.
  }
}
