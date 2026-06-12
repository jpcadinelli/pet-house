const assert = require('node:assert/strict');
const test = require('node:test');

const consultasVacinas = require('../src/features/database/consultas/vacinas');

function criarPet(id, idUsuario, nome) {
  return {
    id,
    id_usuario: idUsuario,
    nome,
    especie: 'Cachorro',
    raca: 'SRD',
    data_nascimento: null,
    sexo: 'Não informado',
    observacoes: null,
    foto_uri: null,
    criado_em: 1700000000000,
    atualizado_em: 1700000000000,
  };
}

function falharSeUsarCamposDeSincronizacao(sql) {
  if (/sincronizado|excluido_em/i.test(sql)) {
    throw new Error(`SQL não deve usar sincronização: ${sql}`);
  }
}

function criarBancoEmMemoria() {
  let proximoIdVacina = 1;
  let vacinas = [];
  const pets = [
    criarPet(1, 'usuario-a', 'Rex'),
    criarPet(2, 'usuario-b', 'Mel'),
  ];

  function anexarNomePet(vacina) {
    const pet = pets.find(
      (petAtual) =>
        petAtual.id === vacina.id_pet &&
        petAtual.id_usuario === vacina.id_usuario
    );

    return pet ? { ...vacina, nome_pet: pet.nome } : null;
  }

  return {
    getAllSync(sql, params = []) {
      falharSeUsarCamposDeSincronizacao(sql);

      if (!/FROM vacinas/.test(sql)) {
        throw new Error(`SQL não suportado no teste: ${sql}`);
      }

      const [idUsuario, idPet] = params;
      return vacinas
        .filter((vacina) => vacina.id_usuario === idUsuario)
        .filter((vacina) => (idPet ? vacina.id_pet === idPet : true))
        .map(anexarNomePet)
        .filter(Boolean);
    },
    getFirstSync(sql, params = []) {
      falharSeUsarCamposDeSincronizacao(sql);

      if (/sqlite_master/.test(sql)) {
        return { name: 'vacinas' };
      }

      if (/FROM pets WHERE id = \? AND id_usuario = \?/.test(sql)) {
        const [id, idUsuario] = params;
        return pets.find((pet) => pet.id === id && pet.id_usuario === idUsuario) || null;
      }

      if (/FROM vacinas/.test(sql)) {
        const [id, idUsuario] = params;
        const vacina = vacinas.find(
          (vacinaAtual) =>
            vacinaAtual.id === id &&
            vacinaAtual.id_usuario === idUsuario
        );

        return vacina ? anexarNomePet(vacina) : null;
      }

      throw new Error(`SQL não suportado no teste: ${sql}`);
    },
    runSync(sql, params = []) {
      falharSeUsarCamposDeSincronizacao(sql);

      if (/INSERT INTO vacinas/.test(sql)) {
        const [
          id_pet,
          id_usuario,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          criado_em,
          atualizado_em,
        ] = params;
        const id = proximoIdVacina;
        proximoIdVacina += 1;
        vacinas.push({
          id,
          id_pet,
          id_usuario,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          criado_em,
          atualizado_em,
        });

        return { lastInsertRowId: id, changes: 1 };
      }

      if (/UPDATE vacinas/.test(sql)) {
        const [
          id_pet,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          atualizado_em,
          id,
          id_usuario,
        ] = params;
        const vacina = vacinas.find(
          (vacinaAtual) =>
            vacinaAtual.id === id &&
            vacinaAtual.id_usuario === id_usuario
        );

        if (!vacina) {
          return { changes: 0 };
        }

        Object.assign(vacina, {
          id_pet,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          atualizado_em,
        });

        return { changes: 1 };
      }

      if (/DELETE FROM vacinas WHERE id = \? AND id_usuario = \?/.test(sql)) {
        const [id, idUsuario] = params;
        const quantidadeAnterior = vacinas.length;
        vacinas = vacinas.filter(
          (vacina) => !(vacina.id === id && vacina.id_usuario === idUsuario)
        );

        return { changes: quantidadeAnterior - vacinas.length };
      }

      if (/DELETE FROM vacinas WHERE id_pet = \? AND id_usuario = \?/.test(sql)) {
        const [idPet, idUsuario] = params;
        const quantidadeAnterior = vacinas.length;
        vacinas = vacinas.filter(
          (vacina) =>
            !(vacina.id_pet === idPet && vacina.id_usuario === idUsuario)
        );

        return { changes: quantidadeAnterior - vacinas.length };
      }

      throw new Error(`SQL não suportado no teste: ${sql}`);
    },
  };
}

const VACINA_ENTRADA = {
  id_pet: 1,
  nome: 'Antirrábica',
  data_aplicacao: '',
  proxima_dose: '2099-01-10',
  observacoes: '',
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

test('cria vacina local sem campos de sincronização', () => {
  const database = criarBancoEmMemoria();

  const vacina = comDateNowFixo(1700000000000, () =>
    consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA)
  );

  assert.equal(vacina.id_usuario, 'usuario-a');
  assert.equal(vacina.nome_pet, 'Rex');
  assert.equal(vacina.data_aplicacao, null);
  assert.equal(vacina.proxima_dose.toISOString(), '2099-01-10T00:00:00.000Z');
  assert.equal(vacina.criado_em.toISOString(), '2023-11-14T22:13:20.000Z');
  assert.equal(vacina.atualizado_em.toISOString(), '2023-11-14T22:13:20.000Z');
  assert.equal(Object.hasOwn(vacina, 'sincronizado'), false);
  assert.equal(Object.hasOwn(vacina, 'excluido_em'), false);
});

test('lista vacinas apenas do usuário e pet informados', () => {
  const database = criarBancoEmMemoria();

  consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA);
  consultasVacinas.criarVacina(database, 'usuario-b', {
    ...VACINA_ENTRADA,
    id_pet: 2,
    nome: 'V10',
  });

  assert.deepEqual(
    consultasVacinas.listarVacinasPorUsuario(database, 'usuario-a').map((vacina) => vacina.nome),
    ['Antirrábica']
  );
  assert.deepEqual(
    consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 1).map((vacina) => vacina.nome),
    ['Antirrábica']
  );
  assert.deepEqual(consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 2), []);
});

test('atualiza vacina mantendo criado_em e atualizando atualizado_em', () => {
  const database = criarBancoEmMemoria();

  const vacina = comDateNowFixo(1700000000000, () =>
    consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA)
  );
  const atualizada = comDateNowFixo(1700000100000, () =>
    consultasVacinas.atualizarVacina(database, 'usuario-a', vacina.id, {
      ...VACINA_ENTRADA,
      nome: 'Antirrábica anual',
      data_aplicacao: '2026-01-10',
      proxima_dose: '2099-02-10',
      observacoes: 'Dose reforço.',
    })
  );

  assert.equal(atualizada.nome, 'Antirrábica anual');
  assert.equal(atualizada.data_aplicacao.toISOString(), '2026-01-10T00:00:00.000Z');
  assert.equal(atualizada.proxima_dose.toISOString(), '2099-02-10T00:00:00.000Z');
  assert.equal(atualizada.criado_em.toISOString(), '2023-11-14T22:13:20.000Z');
  assert.equal(atualizada.atualizado_em.toISOString(), '2023-11-14T22:15:00.000Z');
});

test('exclui vacina definitivamente apenas do usuário informado', () => {
  const database = criarBancoEmMemoria();
  const vacina = consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA);

  assert.equal(consultasVacinas.excluirVacina(database, 'usuario-b', vacina.id), 0);
  assert.equal(consultasVacinas.buscarVacinaPorId(database, 'usuario-a', vacina.id).nome, 'Antirrábica');

  assert.equal(consultasVacinas.excluirVacina(database, 'usuario-a', vacina.id), 1);
  assert.equal(consultasVacinas.buscarVacinaPorId(database, 'usuario-a', vacina.id), null);
});

test('exclui vacinas por pet com delete físico local', () => {
  const database = criarBancoEmMemoria();

  consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA);
  consultasVacinas.criarVacina(database, 'usuario-a', {
    ...VACINA_ENTRADA,
    nome: 'Gripe canina',
    proxima_dose: '2099-03-10',
  });
  consultasVacinas.criarVacina(database, 'usuario-b', {
    ...VACINA_ENTRADA,
    id_pet: 2,
    nome: 'V10',
  });

  assert.equal(consultasVacinas.excluirVacinasPorPet(database, 'usuario-a', 1), 2);
  assert.deepEqual(consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 1), []);
  assert.deepEqual(
    consultasVacinas.listarVacinasPorUsuario(database, 'usuario-b').map((vacina) => vacina.nome),
    ['V10']
  );
});
