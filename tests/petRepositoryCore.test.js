const { describe, expect, test } = require('@jest/globals');

const { criarRepositorioPets } = require('../src/features/pets/services/petRepositoryCore');
const consultasPets = require('../src/features/database/consultas/pets');

function criarBancoEmMemoria() {
  let proximoId = 1;
  let pets = [];

  function ordenarVisiveis(lista) {
    return lista.sort((primeiro, segundo) => segundo.id - primeiro.id);
  }

  return {
    execSync() {},
    getAllSync(sql, params = []) {
      if (/PRAGMA table_info\(pets\)/.test(sql)) {
        return [
          'id',
          'id_usuario',
          'uuid',
          'nome',
          'especie',
          'raca',
          'data_nascimento',
          'sexo',
          'observacoes',
          'foto_uri',
          'criado_em',
          'atualizado_em',
          'sync_status',
          'sincronizado_em',
          'excluido_em',
          'firebase_atualizado_em',
        ].map((name) => ({ name }));
      }

      if (/sync_status = \?/.test(sql)) {
        const [idUsuario, syncStatus] = params;
        return pets
          .filter((pet) => pet.id_usuario === idUsuario && pet.sync_status === syncStatus)
          .sort((primeiro, segundo) => primeiro.atualizado_em - segundo.atualizado_em || primeiro.id - segundo.id);
      }

      if (/FROM pets WHERE id_usuario = \? AND excluido_em IS NULL/.test(sql)) {
        const [idUsuario] = params;
        return ordenarVisiveis(pets.filter((pet) => pet.id_usuario === idUsuario && pet.excluido_em == null));
      }

      throw new Error(`SQL não suportado no teste: ${sql}`);
    },
    getFirstSync(sql, params = []) {
      if (/sqlite_master/.test(sql)) {
        return null;
      }

      if (/FROM pets WHERE id = \? AND id_usuario = \? AND excluido_em IS NULL/.test(sql)) {
        const [id, idUsuario] = params;
        return pets.find((pet) => pet.id === id && pet.id_usuario === idUsuario && pet.excluido_em == null) || null;
      }

      if (/FROM pets WHERE uuid = \? AND id_usuario = \?/.test(sql)) {
        const [uuid, idUsuario] = params;
        return pets.find((pet) => pet.uuid === uuid && pet.id_usuario === idUsuario) || null;
      }

      if (/FROM pets WHERE id = \?/.test(sql)) {
        const [id] = params;
        return pets.find((pet) => pet.id === id) || null;
      }

      throw new Error(`SQL não suportado no teste: ${sql}`);
    },
    runSync(sql, params = []) {
      if (/INSERT INTO pets/.test(sql)) {
        const [
          id_usuario,
          uuid,
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
        ] = params;
        const id = proximoId;
        proximoId += 1;
        pets.push({
          id,
          id_usuario,
          uuid,
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
        });
        return { lastInsertRowId: id, changes: 1 };
      }

      if (/SET excluido_em = \?/.test(sql)) {
        const [excluido_em, atualizado_em, sync_status, id, id_usuario] = params;
        const pet = pets.find((petAtual) => petAtual.id === id && petAtual.id_usuario === id_usuario && petAtual.excluido_em == null);

        if (!pet) return { changes: 0 };

        Object.assign(pet, { excluido_em, atualizado_em, sync_status, sincronizado_em: null });
        return { changes: 1 };
      }

      if (/SET sync_status = \?/.test(sql) && /WHERE uuid = \? AND id_usuario = \?/.test(sql)) {
        const [sync_status, sincronizado_em, firebase_atualizado_em, uuid, id_usuario] = params;
        const pet = pets.find((petAtual) => petAtual.uuid === uuid && petAtual.id_usuario === id_usuario);

        if (!pet) return { changes: 0 };

        Object.assign(pet, { sync_status, sincronizado_em, firebase_atualizado_em });
        return { changes: 1 };
      }

      if (/DELETE FROM pets WHERE uuid = \?/.test(sql)) {
        const [uuid, idUsuario, syncStatus] = params;
        const quantidadeAnterior = pets.length;
        pets = pets.filter((pet) => !(pet.uuid === uuid && pet.id_usuario === idUsuario && pet.excluido_em != null && pet.sync_status === syncStatus));
        return { changes: quantidadeAnterior - pets.length };
      }

      if (/criado_em = \?/.test(sql) && /WHERE uuid = \? AND id_usuario = \?/.test(sql)) {
        const [
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
          uuid,
          id_usuario,
        ] = params;
        const pet = pets.find((petAtual) => petAtual.uuid === uuid && petAtual.id_usuario === id_usuario);

        if (!pet) return { changes: 0 };

        Object.assign(pet, {
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
        });
        return { changes: 1 };
      }

      if (/UPDATE pets/.test(sql)) {
        const [
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          atualizado_em,
          sync_status,
          id,
          id_usuario,
        ] = params;
        const pet = pets.find((petAtual) => petAtual.id === id && petAtual.id_usuario === id_usuario && petAtual.excluido_em == null);

        if (!pet) return { changes: 0 };

        Object.assign(pet, {
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          atualizado_em,
          sync_status,
          sincronizado_em: null,
        });
        return { changes: 1 };
      }

      throw new Error(`SQL não suportado no teste: ${sql}`);
    },
  };
}

const petEntrada = {
  nome: 'Rex',
  especie: 'Cachorro',
  raca: 'SRD',
  data_nascimento: '2020-02-02',
  sexo: 'Macho',
  observacoes: 'Gosta de passear.',
  foto_uri: 'file://rex.jpg',
};

function comDateNowFixo(timestamp, callback) {
  const dateNowOriginal = Date.now;
  Date.now = () => timestamp;

  try {
    return callback();
  } finally {
    Date.now = dateNowOriginal;
  }
}

describe('criarRepositorioPets', () => {
  test('salva data_nascimento como timestamp UTC com horário zerado', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());
    const rex = comDateNowFixo(1700000000000, () => repositorio.criarPet('usuario-a', petEntrada));

    expect(rex.data_nascimento instanceof Date).toBeTruthy();
    expect(rex.data_nascimento.toISOString()).toBe('2020-02-02T00:00:00.000Z');
  });

  test('cria pet com uuid e sync_status pending', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());
    const rex = comDateNowFixo(1700000000000, () => repositorio.criarPet('usuario-a', petEntrada));

    expect(rex.uuid).toEqual(expect.any(String));
    expect(rex.sync_status).toBe('pending');
    expect(rex.excluido_em).toBeNull();
    expect(rex.criado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
    expect(rex.atualizado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  });

  test('atualiza pet marcando sync_status pending', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());
    const rex = comDateNowFixo(1700000000000, () => repositorio.criarPet('usuario-a', petEntrada));
    repositorio.marcarPetComoSincronizado('usuario-a', rex.uuid, 1700000050000, 1700000050000);

    const atualizado = comDateNowFixo(1700000100000, () => repositorio.atualizarPet(
      rex.id,
      'usuario-a',
      { ...petEntrada, nome: 'Rex Atualizado' }
    ));

    expect(atualizado.nome).toBe('Rex Atualizado');
    expect(atualizado.sync_status).toBe('pending');
    expect(atualizado.sincronizado_em).toBeNull();
    expect(atualizado.criado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
    expect(atualizado.atualizado_em.toISOString()).toBe('2023-11-14T22:15:00.000Z');
  });

  test('salva e lista apenas pets ativos do usuário atual', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());

    const rex = repositorio.criarPet('usuario-a', petEntrada);
    const mel = repositorio.criarPet('usuario-b', { ...petEntrada, nome: 'Mel', sexo: 'Fêmea' });

    expect(rex.id_usuario).toBe('usuario-a');
    expect(mel.id_usuario).toBe('usuario-b');
    expect(repositorio.listarPetsPorUsuario('usuario-a').map((pet) => pet.nome)).toEqual(['Rex']);
    expect(repositorio.listarPetsPorUsuario('usuario-b').map((pet) => pet.nome)).toEqual(['Mel']);
  });

  test('não busca pet de outro usuário por id', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());
    const rex = repositorio.criarPet('usuario-a', petEntrada);

    expect(repositorio.buscarPetPorId(rex.id, 'usuario-b')).toBe(null);
    expect(repositorio.buscarPetPorId(rex.id, 'usuario-a').nome).toBe('Rex');
  });

  test('exclui pet com soft delete e remove da listagem ativa', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());
    const rex = repositorio.criarPet('usuario-a', petEntrada);

    expect(repositorio.excluirPet(rex.id, 'usuario-b')).toBe(0);
    expect(repositorio.buscarPetPorId(rex.id, 'usuario-a').nome).toBe('Rex');

    expect(comDateNowFixo(1700000200000, () => repositorio.excluirPet(rex.id, 'usuario-a'))).toBe(1);
    expect(repositorio.buscarPetPorId(rex.id, 'usuario-a')).toBe(null);
    expect(repositorio.listarPetsPorUsuario('usuario-a')).toEqual([]);

    const [pendente] = repositorio.listarPetsPendentesSincronizacao('usuario-a');
    expect(pendente.uuid).toBe(rex.uuid);
    expect(pendente.excluido_em.toISOString()).toBe('2023-11-14T22:16:40.000Z');
    expect(pendente.sync_status).toBe('pending');
  });

  test('não sobrescreve pet local pending com remoto antigo', () => {
    const database = criarBancoEmMemoria();
    const repositorio = criarRepositorioPets(database);
    const rex = comDateNowFixo(1700000100000, () => repositorio.criarPet('usuario-a', {
      ...petEntrada,
      uuid: 'pet-uuid-1',
      nome: 'Rex local',
    }));

    const resultado = consultasPets.upsertPetSincronizado(database, 'usuario-a', {
      ...petEntrada,
      uuid: rex.uuid,
      nome: 'Rex remoto antigo',
      criado_em: 1700000000000,
      atualizado_em: 1700000000000,
      firebase_atualizado_em: 1700000000000,
    });

    expect(resultado.status).toBe('ignored');
    expect(repositorio.buscarPetPorUuid('usuario-a', rex.uuid).nome).toBe('Rex local');
  });
});
