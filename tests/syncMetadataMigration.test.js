const { describe, expect, test } = require('@jest/globals');

const { V20260619120000_add_sync_metadata } = require('../src/features/database/migrations/V20260619120000_add_sync_metadata');

function criarDbFake() {
  const colunas = {
    usuarios: ['id', 'nome', 'email', 'senha'],
    pets: ['id', 'id_usuario', 'nome'],
  };
  const pets = [
    { id: 1, uuid: null },
    { id: 2, uuid: 'uuid-existente' },
  ];
  const execucoes = [];
  const updates = [];

  return {
    execucoes,
    updates,
    colunas,
    pets,
    getAllSync(sql) {
      const pragmaMatch = /PRAGMA table_info\((\w+)\)/.exec(sql);

      if (pragmaMatch) {
        return colunas[pragmaMatch[1]].map((name) => ({ name }));
      }

      if (/SELECT id FROM pets/.test(sql)) {
        return pets.filter((pet) => !pet.uuid || !String(pet.uuid).trim());
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
      const pet = pets.find((item) => item.id === id);

      if (pet) {
        pet.uuid = params[0];
      }

      return { changes: pet ? 1 : 0 };
    },
  };
}

describe('V20260619120000_add_sync_metadata', () => {
  test('adiciona colunas de sync sem duplicar colunas existentes', () => {
    const db = criarDbFake();

    V20260619120000_add_sync_metadata(db);
    V20260619120000_add_sync_metadata(db);

    expect(db.colunas.usuarios).toEqual(expect.arrayContaining([
      'firebase_uid',
      'atualizado_em',
      'sincronizado_em',
    ]));
    expect(db.colunas.pets).toEqual(expect.arrayContaining([
      'uuid',
      'sync_status',
      'sincronizado_em',
      'excluido_em',
      'firebase_atualizado_em',
    ]));
    expect(db.colunas.pets.filter((coluna) => coluna === 'uuid')).toHaveLength(1);
  });

  test('preenche uuid para pets antigos sem uuid', () => {
    const db = criarDbFake();

    V20260619120000_add_sync_metadata(db);

    expect(db.pets[0].uuid).toEqual(expect.any(String));
    expect(db.pets[1].uuid).toBe('uuid-existente');
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0].sql).toContain('UPDATE pets SET uuid = ?');
  });
});
