const { beforeEach, describe, expect, jest, test } = require('@jest/globals');

const {
  createUser,
  getUserByEmail,
  loginUser,
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

  test('createUser insere nome, email e senha informados', () => {
    const resultado = { lastInsertRowId: 3, changes: 1 };
    db.runSync.mockReturnValueOnce(resultado);

    expect(createUser(db, 'Carla', 'carla@email.com', 'senha-segura')).toBe(resultado);
    expect(db.runSync).toHaveBeenCalledWith(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      ['Carla', 'carla@email.com', 'senha-segura']
    );
  });
});
