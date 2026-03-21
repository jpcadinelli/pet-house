import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pet-house-auth-session';

export async function getAuthSession() {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export async function saveAuthSession(session) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
