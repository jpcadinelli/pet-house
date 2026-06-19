const { beforeEach, describe, expect, jest, test } = require('@jest/globals');

const {
  atualizarFirebaseUidUsuario,
  buscarUsuarioPorId,
  createUser,
  getUserByEmail,
  loginUser,
  marcarUsuarioSincronizado,
} = require('../src/features/database/consultas/usuario');

function criarDbFake() {
  return {
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
  };
}

describe('consultas de usuário', () => {
  let db;

  beforeEach(() => {
    db = criarDbFake();
  });

  test('loginUser busca usuário por email e senha', () => {
    const usuario = { id: 1, email: 'ana@email.com', senha: '123' };
    db.getFirstSync.mockReturnValueOnce(usuario);

    expect(loginUser(db, 'ana@email.com', '123')).toBe(usuario);
    expect(db.getFirstSync).toHaveBeenCalledWith(
      'SELECT * FROM usuarios WHERE email = ? AND senha = ?',
      ['ana@email.com', '123']
    );
  });

  test('getUserByEmail busca usuário somente pelo email', () => {
    const usuario = { id: 2, email: 'bob@email.com' };
    db.getFirstSync.mockReturnValueOnce(usuario);

    expect(getUserByEmail(db, 'bob@email.com')).toBe(usuario);
    expect(db.getFirstSync).toHaveBeenCalledWith(
      'SELECT * FROM usuarios WHERE email = ?',
      ['bob@email.com']
    );
  });

  test('buscarUsuarioPorId busca usuário pelo id local', () => {
    const usuario = { id: 2, email: 'bob@email.com' };
    db.getFirstSync.mockReturnValueOnce(usuario);

    expect(buscarUsuarioPorId(db, 2)).toBe(usuario);
    expect(db.getFirstSync).toHaveBeenCalledWith(
      'SELECT * FROM usuarios WHERE id = ?',
      [2]
    );
  });

  test('createUser insere nome, email, senha, firebase_uid e timestamps', () => {
    const resultado = { lastInsertRowId: 3, changes: 1 };
    const dateNowOriginal = Date.now;
    Date.now = () => 1700000000000;
    db.runSync.mockReturnValueOnce(resultado);

    try {
      expect(createUser(db, 'Carla', 'carla@email.com', 'senha-segura', 'firebase-uid')).toBe(resultado);
    } finally {
      Date.now = dateNowOriginal;
    }

    expect(db.runSync).toHaveBeenCalledWith(
      'INSERT INTO usuarios (nome, email, senha, firebase_uid, atualizado_em, sincronizado_em) VALUES (?, ?, ?, ?, ?, ?)',
      ['Carla', 'carla@email.com', 'senha-segura', 'firebase-uid', 1700000000000, 1700000000000]
    );
  });

  test('atualizarFirebaseUidUsuario vincula uid remoto e atualizado_em', () => {
    const resultado = { changes: 1 };
    const dateNowOriginal = Date.now;
    Date.now = () => 1700000000000;
    db.runSync.mockReturnValueOnce(resultado);

    try {
      expect(atualizarFirebaseUidUsuario(db, 7, 'firebase-uid')).toBe(resultado);
    } finally {
      Date.now = dateNowOriginal;
    }

    expect(db.runSync).toHaveBeenCalledWith(
      'UPDATE usuarios SET firebase_uid = ?, atualizado_em = ? WHERE id = ?',
      ['firebase-uid', 1700000000000, 7]
    );
  });

  test('marcarUsuarioSincronizado atualiza sincronizado_em', () => {
    const resultado = { changes: 1 };
    db.runSync.mockReturnValueOnce(resultado);

    expect(marcarUsuarioSincronizado(db, 7, 1700000100000)).toBe(resultado);
    expect(db.runSync).toHaveBeenCalledWith(
      'UPDATE usuarios SET sincronizado_em = ? WHERE id = ?',
      [1700000100000, 7]
    );
  });
});
