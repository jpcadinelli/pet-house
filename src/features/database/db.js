import * as SQLite from 'expo-sqlite';
import { V20260605202020_add_usuario } from './migrations/V20260605202020_add_usuario';
import { V20260606113011_add_pets } from './migrations/V20260606113011_add_pets';
import { V20260607120000_add_vacinas } from './migrations/V20260607120000_add_vacinas';

const db = SQLite.openDatabaseSync('pet_house.db');

const migrations = [
  V20260605202020_add_usuario,
  V20260606113011_add_pets,
  V20260607120000_add_vacinas,
];

export function getDB() {
  return db;
}

export const initDatabase = () => {
  migrations.forEach((migration) => migration(db));
};

export default db;
