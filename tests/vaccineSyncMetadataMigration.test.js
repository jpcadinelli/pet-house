const { describe, expect, test } = require('@jest/globals');

const { V20260619130000_add_vaccine_sync_metadata } = require('../src/features/database/migrations/V20260619130000_add_vaccine_sync_metadata');

function criarDbFake() {
  const colunas = {
    vacinas: ['id', 'id_pet', 'id_usuario', 'nome'],
  };
  const vacinas = [
    { id: 1, uuid: null, sync_status: null },
    { id: 2, uuid: 'uuid-existente', sync_status: 'synced' },
  ];
  const execucoes = [];
  const updates = [];

  return {
    colunas,
    execucoes,
    updates,
    vacinas,
    getAllSync(sql) {
      const pragmaMatch = /PRAGMA table_info\((\w+)\)/.exec(sql);

      if (pragmaMatch) {
        return colunas[pragmaMatch[1]].map((name) => ({ name }));
      }

      if (/SELECT id FROM vacinas/.test(sql)) {
        return vacinas.filter((vacina) => !vacina.uuid || !String(vacina.uuid).trim());
      }

      throw new Error(`SQL não suportado no teste: ${sql}`);
    },
    execSync(sql) {
      execucoes.push(sql);
      const alterMatch = /ALTER TABLE (\w+) ADD COLUMN (\w+)/.exec(sql);

      if (alterMatch) {
        colunas[alterMatch[1]].push(alterMatch[2]);
      }
    },
    runSync(sql, params) {
      updates.push({ sql, params });
      const [, id] = params;
      const vacina = vacinas.find((item) => item.id === id);

      if (vacina) {
        vacina.uuid = params[0];
        vacina.sync_status = vacina.sync_status || 'pending';
      }

      return { changes: vacina ? 1 : 0 };
    },
  };
}

describe('V20260619130000_add_vaccine_sync_metadata', () => {
  test('adiciona metadados de sync e índices sem duplicar colunas', () => {
    const db = criarDbFake();

    V20260619130000_add_vaccine_sync_metadata(db);
    V20260619130000_add_vaccine_sync_metadata(db);

    expect(db.colunas.vacinas).toEqual(expect.arrayContaining([
      'uuid',
      'sync_status',
      'sincronizado_em',
      'excluido_em',
      'firebase_atualizado_em',
    ]));
    expect(db.colunas.vacinas.filter((coluna) => coluna === 'uuid')).toHaveLength(1);
    expect(db.execucoes).toEqual(expect.arrayContaining([
      'CREATE INDEX IF NOT EXISTS idx_vacinas_uuid ON vacinas (uuid);',
      'CREATE INDEX IF NOT EXISTS idx_vacinas_sync_status ON vacinas (sync_status);',
    ]));
  });

  test('preenche uuid para vacinas antigas sem uuid', () => {
    const db = criarDbFake();

    V20260619130000_add_vaccine_sync_metadata(db);

    expect(db.vacinas[0].uuid).toEqual(expect.any(String));
    expect(db.vacinas[0].sync_status).toBe('pending');
    expect(db.vacinas[1].uuid).toBe('uuid-existente');
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0].sql).toContain('UPDATE vacinas SET uuid = ?');
  });
});
