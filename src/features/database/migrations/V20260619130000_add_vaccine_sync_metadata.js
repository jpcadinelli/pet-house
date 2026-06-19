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

function preencherUuidVacinasAntigas(db) {
  const vacinasSemUuid = db.getAllSync(
    "SELECT id FROM vacinas WHERE uuid IS NULL OR TRIM(uuid) = ''"
  );

  vacinasSemUuid.forEach((vacina) => {
    db.runSync(
      "UPDATE vacinas SET uuid = ?, sync_status = COALESCE(sync_status, 'pending') WHERE id = ?",
      [gerarUuidLocal(), vacina.id]
    );
  });
}

export function V20260619130000_add_vaccine_sync_metadata(db) {
  adicionarColunaSeNaoExiste(db, 'vacinas', 'uuid', 'TEXT');
  adicionarColunaSeNaoExiste(db, 'vacinas', 'sync_status', "TEXT DEFAULT 'pending'");
  adicionarColunaSeNaoExiste(db, 'vacinas', 'sincronizado_em', 'INTEGER');
  adicionarColunaSeNaoExiste(db, 'vacinas', 'excluido_em', 'INTEGER');
  adicionarColunaSeNaoExiste(db, 'vacinas', 'firebase_atualizado_em', 'INTEGER');

  preencherUuidVacinasAntigas(db);

  db.execSync('CREATE INDEX IF NOT EXISTS idx_vacinas_uuid ON vacinas (uuid);');
  db.execSync('CREATE INDEX IF NOT EXISTS idx_vacinas_sync_status ON vacinas (sync_status);');
}
