import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('pet_house.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    );
  `);
};

export const loginUser = (email, senha) => {
  return db.getFirstSync(
    'SELECT * FROM usuarios WHERE email = ? AND senha = ?',
    [email, senha]
  );
};

export const createUser = (nome, email, senha) => {
  return db.runSync(
    'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
    [nome, email, senha]
  );
};

export default db;