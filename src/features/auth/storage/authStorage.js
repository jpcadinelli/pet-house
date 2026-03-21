const STORAGE_KEY = 'pet-house-auth-session';

let memorySession = null;

function canUseLocalStorage() {
  return typeof globalThis !== 'undefined' && globalThis.localStorage;
}

export async function getAuthSession() {
  if (canUseLocalStorage()) {
    const rawValue = globalThis.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue);
    } catch (error) {
      return null;
    }
  }

  return memorySession;
}

export async function saveAuthSession(session) {
  memorySession = session;

  if (canUseLocalStorage()) {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

export async function clearAuthSession() {
  memorySession = null;

  if (canUseLocalStorage()) {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  }
}
