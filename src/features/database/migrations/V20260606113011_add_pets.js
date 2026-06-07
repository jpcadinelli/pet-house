export function V20260606113011_add_pets(db) {
  db.execSync(`
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario TEXT NOT NULL,
            nome TEXT NOT NULL,
            especie TEXT NOT NULL,
            raca TEXT,
            data_nascimento INTEGER,
            sexo TEXT NOT NULL,
            observacoes TEXT,
            foto_uri TEXT,
            criado_em INTEGER NOT NULL,
            atualizado_em INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_pets_id_usuario ON pets (id_usuario);
  `);
}