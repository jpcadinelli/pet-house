function colunaExiste(db, tabela, coluna) {
  const colunas = db.getAllSync(`PRAGMA table_info(${tabela})`);
  return colunas.some((item) => item.name === coluna);
}

function adicionarColunaSeNaoExiste(db, tabela, coluna, definicao) {
  if (colunaExiste(db, tabela, coluna)) {
    return;
  }

  db.execSync(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao};`);
}

function gerarUuidLocal() {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function preencherUuidPetsAntigos(db) {
  const petsSemUuid = db.getAllSync(
    "SELECT id FROM pets WHERE uuid IS NULL OR TRIM(uuid) = ''"
  );

  petsSemUuid.forEach((pet) => {
    db.runSync(
      "UPDATE pets SET uuid = ?, sync_status = COALESCE(sync_status, 'pending') WHERE id = ?",
      [gerarUuidLocal(), pet.id]
    );
  });
}

export function V20260619120000_add_sync_metadata(db) {
  adicionarColunaSeNaoExiste(db, 'usuarios', 'firebase_uid', 'TEXT');
  adicionarColunaSeNaoExiste(db, 'usuarios', 'atualizado_em', 'INTEGER');
  adicionarColunaSeNaoExiste(db, 'usuarios', 'sincronizado_em', 'INTEGER');

  adicionarColunaSeNaoExiste(db, 'pets', 'uuid', 'TEXT');
  adicionarColunaSeNaoExiste(db, 'pets', 'sync_status', "TEXT DEFAULT 'pending'");
  adicionarColunaSeNaoExiste(db, 'pets', 'sincronizado_em', 'INTEGER');
  adicionarColunaSeNaoExiste(db, 'pets', 'excluido_em', 'INTEGER');
  adicionarColunaSeNaoExiste(db, 'pets', 'firebase_atualizado_em', 'INTEGER');

  preencherUuidPetsAntigos(db);

  db.execSync('CREATE INDEX IF NOT EXISTS idx_pets_uuid ON pets (uuid);');
  db.execSync('CREATE INDEX IF NOT EXISTS idx_pets_sync_status ON pets (sync_status);');
}
