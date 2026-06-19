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

function falharSeVacinaUsarCamposDeSincronizacao(sql) {
  if (/vacinas/i.test(sql) && /sincronizado|excluido_em/i.test(sql)) {
    throw new Error(`SQL de vacinas não deve usar sincronização: ${sql}`);
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
      falharSeVacinaUsarCamposDeSincronizacao(sql);

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
      falharSeVacinaUsarCamposDeSincronizacao(sql);

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
      falharSeVacinaUsarCamposDeSincronizacao(sql);

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

  expect(vacina.id_usuario).toBe('usuario-a');
  expect(vacina.nome_pet).toBe('Rex');
  expect(vacina.data_aplicacao).toBeNull();
  expect(vacina.proxima_dose.toISOString()).toBe('2099-01-10T00:00:00.000Z');
  expect(vacina.criado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  expect(vacina.atualizado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  expect(vacina).not.toHaveProperty('sincronizado');
  expect(vacina).not.toHaveProperty('excluido_em');
});

test('lista vacinas apenas do usuário e pet informados', () => {
  const database = criarBancoEmMemoria();

  consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA);
  consultasVacinas.criarVacina(database, 'usuario-b', {
    ...VACINA_ENTRADA,
    id_pet: 2,
    nome: 'V10',
  });

  expect(
    consultasVacinas.listarVacinasPorUsuario(database, 'usuario-a').map((vacina) => vacina.nome),
  ).toEqual(['Antirrábica']);
  expect(
    consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 1).map((vacina) => vacina.nome),
  ).toEqual(['Antirrábica']);
  expect(consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 2)).toEqual([]);
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

  expect(atualizada.nome).toBe('Antirrábica anual');
  expect(atualizada.data_aplicacao.toISOString()).toBe('2026-01-10T00:00:00.000Z');
  expect(atualizada.proxima_dose.toISOString()).toBe('2099-02-10T00:00:00.000Z');
  expect(atualizada.criado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  expect(atualizada.atualizado_em.toISOString()).toBe('2023-11-14T22:15:00.000Z');
});

test('exclui vacina definitivamente apenas do usuário informado', () => {
  const database = criarBancoEmMemoria();
  const vacina = consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA);

  expect(consultasVacinas.excluirVacina(database, 'usuario-b', vacina.id)).toBe(0);
  expect(consultasVacinas.buscarVacinaPorId(database, 'usuario-a', vacina.id).nome).toBe('Antirrábica');

  expect(consultasVacinas.excluirVacina(database, 'usuario-a', vacina.id)).toBe(1);
  expect(consultasVacinas.buscarVacinaPorId(database, 'usuario-a', vacina.id)).toBeNull();
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

  expect(consultasVacinas.excluirVacinasPorPet(database, 'usuario-a', 1)).toBe(2);
  expect(consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 1)).toEqual([]);
  expect(
    consultasVacinas.listarVacinasPorUsuario(database, 'usuario-b').map((vacina) => vacina.nome),
  ).toEqual(['V10']);
});
