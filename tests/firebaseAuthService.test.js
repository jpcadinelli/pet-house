const { beforeEach, describe, expect, jest, test } = require('@jest/globals');

const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
}));

jest.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
}));

jest.mock('../src/features/firebase/firebaseConfig', () => ({
  firebaseAuth: { currentUser: null },
  firestoreDb: { name: 'firestore-fake' },
}));

const {
  cadastrarUsuarioFirebase,
  garantirUsuarioFirebaseAutenticado,
  loginUsuarioFirebase,
  obterUsuarioFirebaseAtual,
  salvarPerfilUsuarioFirebase,
} = require('../src/features/firebase/firebaseAuthService');

describe('firebaseAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue({ path: 'perfil-ref' });
    mockSetDoc.mockResolvedValue(undefined);
  });

  test('cadastrarUsuarioFirebase usa Email/Senha e retorna uid', async () => {
    const auth = { currentUser: null };
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'uid-cadastro' } });

    await expect(cadastrarUsuarioFirebase('ana@email.com', 'senha', auth)).resolves.toBe('uid-cadastro');
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'ana@email.com', 'senha');
  });

  test('loginUsuarioFirebase usa Email/Senha e retorna uid', async () => {
    const auth = { currentUser: null };
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'uid-login' } });

    await expect(loginUsuarioFirebase('ana@email.com', 'senha', auth)).resolves.toBe('uid-login');
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'ana@email.com', 'senha');
  });

  test('garantirUsuarioFirebaseAutenticado falha sem currentUser', () => {
    expect(() => garantirUsuarioFirebaseAutenticado({ currentUser: null })).toThrow('Sessão Firebase expirada ou ausente');
  });

  test('obterUsuarioFirebaseAtual retorna currentUser', () => {
    const currentUser = { uid: 'uid-atual' };
    expect(obterUsuarioFirebaseAtual({ currentUser })).toBe(currentUser);
  });

  test('salvarPerfilUsuarioFirebase grava perfil inicial no Firestore', async () => {
    const firestore = { name: 'firestore-test' };

    await salvarPerfilUsuarioFirebase('uid-perfil', { nome: 'Ana', email: 'ana@email.com' }, firestore);

    expect(mockDoc).toHaveBeenCalledWith(firestore, 'usuarios', 'uid-perfil', 'perfil', 'dados');
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'perfil-ref' },
      expect.objectContaining({ nome: 'Ana', email: 'ana@email.com' }),
      { merge: true }
    );
  });
});
