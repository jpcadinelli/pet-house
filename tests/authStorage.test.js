const { beforeEach, describe, expect, jest, test } = require('@jest/globals');

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const AsyncStorage = require('@react-native-async-storage/async-storage');
const {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} = require('../src/features/auth/storage/authStorage');

const STORAGE_KEY = 'pet-house-auth-session';

describe('authStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna null quando não existe sessão salva', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    await expect(getAuthSession()).resolves.toBe(null);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  test('retorna sessão parseada quando o valor salvo é JSON válido', async () => {
    const session = { idUsuario: 'usuario-1', email: 'ana@email.com', nome: 'Ana' };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(session));

    await expect(getAuthSession()).resolves.toEqual(session);
  });

  test('retorna null quando o valor salvo não é JSON válido', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('{valor inválido');

    await expect(getAuthSession()).resolves.toBe(null);
  });

  test('salva sessão serializada no AsyncStorage', async () => {
    const session = { idUsuario: 'usuario-2', email: 'bob@email.com' };

    await saveAuthSession(session);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(session));
  });

  test('remove sessão salva', async () => {
    await clearAuthSession();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
});
