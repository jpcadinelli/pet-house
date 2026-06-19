import * as SQLite from 'expo-sqlite';
import { V20260605202020_add_usuario } from './migrations/V20260605202020_add_usuario';
import { V20260606113011_add_pets } from './migrations/V20260606113011_add_pets';
import { V20260607120000_add_vacinas } from './migrations/V20260607120000_add_vacinas';
import { V20260618120000_add_pet_places_cache } from './migrations/V20260618120000_add_pet_places_cache';
import { V20260619120000_add_sync_metadata } from './migrations/V20260619120000_add_sync_metadata';
import { V20260619130000_add_vaccine_sync_metadata } from './migrations/V20260619130000_add_vaccine_sync_metadata';

const db = SQLite.openDatabaseSync('pet_house.db');

const migrations = [
  V20260605202020_add_usuario,
  V20260606113011_add_pets,
  V20260607120000_add_vacinas,
  V20260618120000_add_pet_places_cache,
  V20260619120000_add_sync_metadata,
  V20260619130000_add_vaccine_sync_metadata,
];

export function getDB() {
  return db;
}

export const initDatabase = () => {
  migrations.forEach((migration) => migration(db));
};

export default db;
