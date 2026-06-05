import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('pet_house.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    );
  `);

  const usuario = db.getFirstSync(
    'SELECT * FROM usuarios WHERE email = ?',
    ['email@email.com']
  );

  if (!usuario) {
    db.runSync(
      'INSERT INTO usuarios (email, senha) VALUES (?, ?)',
      ['email@email.com', '1234']
    );
  }
};

export const loginUser = (email, senha) => {
  return db.getFirstSync(
    'SELECT * FROM usuarios WHERE email = ? AND senha = ?',
    [email, senha]
  );
};

export const createUser = (email, senha) => {
  return db.runSync(
    'INSERT INTO usuarios (email, senha) VALUES (?, ?)',
    [email, senha]
  );
};

export default db;