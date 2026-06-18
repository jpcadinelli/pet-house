export function V20260618120000_add_pet_places_cache(db) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pet_places_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT NOT NULL UNIQUE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      places_json TEXT NOT NULL,
      atualizado_em INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pet_places_cache_atualizado_em
      ON pet_places_cache (atualizado_em);
  `);
}
