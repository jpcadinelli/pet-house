export function V20260607120000_add_vacinas(db) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS vacinas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet INTEGER NOT NULL,
      id_usuario TEXT NOT NULL,
      nome TEXT NOT NULL,
      data_aplicacao INTEGER,
      proxima_dose INTEGER NOT NULL,
      observacoes TEXT,
      status TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0,
      criado_em INTEGER NOT NULL,
      atualizado_em INTEGER NOT NULL,
      excluido_em INTEGER,
      FOREIGN KEY (id_pet) REFERENCES pets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_vacinas_id_pet ON vacinas (id_pet);
    CREATE INDEX IF NOT EXISTS idx_vacinas_id_usuario ON vacinas (id_usuario);
    CREATE INDEX IF NOT EXISTS idx_vacinas_status ON vacinas (status);
    CREATE INDEX IF NOT EXISTS idx_vacinas_proxima_dose ON vacinas (proxima_dose);
    CREATE INDEX IF NOT EXISTS idx_vacinas_excluido_em ON vacinas (excluido_em);
    CREATE INDEX IF NOT EXISTS idx_vacinas_sincronizado ON vacinas (sincronizado);
  `);
}
