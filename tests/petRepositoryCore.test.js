const { describe, expect, test } = require('@jest/globals');

const { criarRepositorioPets } = require('../src/features/pets/services/petRepositoryCore');

function criarBancoEmMemoria() {
  let proximoId = 1;
  let pets = [];

  return {
    execSync() {},
    getAllSync(sql, params = []) {
      if (/PRAGMA table_info\(pets\)/.test(sql)) {
        return [
          { name: 'id' },
          { name: 'id_usuario' },
          { name: 'nome' },
          { name: 'especie' },
          { name: 'raca' },
          { name: 'data_nascimento' },
          { name: 'sexo' },
          { name: 'observacoes' },
          { name: 'foto_uri' },
          { name: 'criado_em' },
          { name: 'atualizado_em' },
        ];
      }

      if (!/FROM pets WHERE id_usuario = \?/.test(sql)) {
        throw new Error(`SQL não suportado no teste: ${sql}`);
      }

      const [idUsuario] = params;
      return pets
        .filter((pet) => pet.id_usuario === idUsuario)
        .sort((primeiro, segundo) => segundo.id - primeiro.id);
    },
    getFirstSync(sql, params) {
      if (!/FROM pets WHERE id = \? AND id_usuario = \?/.test(sql)) {
        throw new Error(`SQL não suportado no teste: ${sql}`);
      }

      const [id, idUsuario] = params;
      return pets.find((pet) => pet.id === id && pet.id_usuario === idUsuario) || null;
    },
    runSync(sql, params) {
      if (/INSERT INTO pets/.test(sql)) {
        const [
          id_usuario,
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          criado_em,
          atualizado_em,
        ] = params;
        const id = proximoId;
        proximoId += 1;
        pets.push({
          id,
          id_usuario,
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          criado_em,
          atualizado_em,
        });
        return { lastInsertRowId: id, changes: 1 };
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
          id,
          id_usuario,
        ] = params;
        const pet = pets.find((petAtual) => petAtual.id === id && petAtual.id_usuario === id_usuario);

        if (!pet) {
          return { changes: 0 };
        }

        Object.assign(pet, {
          nome,
          especie,
          raca,
          data_nascimento,
          sexo,
          observacoes,
          foto_uri,
          atualizado_em,
        });
        return { changes: 1 };
      }

      if (/DELETE FROM pets WHERE id = \? AND id_usuario = \?/.test(sql)) {
        const [id, idUsuario] = params;
        const quantidadeAnterior = pets.length;
        pets = pets.filter((pet) => !(pet.id === id && pet.id_usuario === idUsuario));
        return { changes: quantidadeAnterior - pets.length };
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

  test('salva criado_em e atualizado_em em UTC no cadastro', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());

    const rex = comDateNowFixo(1700000000000, () => repositorio.criarPet('usuario-a', petEntrada));

    expect(rex.criado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
    expect(rex.atualizado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  });

  test('atualiza atualizado_em ao editar o pet', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());

    const rex = comDateNowFixo(1700000000000, () => repositorio.criarPet('usuario-a', petEntrada));
    const atualizado = comDateNowFixo(1700000100000, () => repositorio.atualizarPet(
      rex.id,
      'usuario-a',
      { ...petEntrada, nome: 'Rex Atualizado' }
    ));

    expect(atualizado.nome).toBe('Rex Atualizado');
    expect(atualizado.criado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
    expect(atualizado.atualizado_em.toISOString()).toBe('2023-11-14T22:15:00.000Z');
  });

  test('salva e lista apenas pets do usuário atual', () => {
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

  test('atualiza somente pet pertencente ao usuário informado', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());

    const rex = repositorio.criarPet('usuario-a', petEntrada);

    expect(repositorio.atualizarPet(rex.id, 'usuario-b', { ...petEntrada, nome: 'Rex errado' })).toBe(null);
    expect(repositorio.buscarPetPorId(rex.id, 'usuario-a').nome).toBe('Rex');
  });

  test('exclui definitivamente apenas pet do usuário informado', () => {
    const repositorio = criarRepositorioPets(criarBancoEmMemoria());

    const rex = repositorio.criarPet('usuario-a', petEntrada);

    expect(repositorio.excluirPet(rex.id, 'usuario-b')).toBe(0);
    expect(repositorio.buscarPetPorId(rex.id, 'usuario-a').nome).toBe('Rex');

    expect(repositorio.excluirPet(rex.id, 'usuario-a')).toBe(1);
    expect(repositorio.buscarPetPorId(rex.id, 'usuario-a')).toBe(null);
  });
});
