const consultasVacinas = require('../src/features/database/consultas/vacinas');

function criarPet(id, idUsuario, nome, uuid) {
  return {
    id,
    uuid,
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
    sync_status: 'synced',
    sincronizado_em: 1700000000000,
    excluido_em: null,
    firebase_atualizado_em: 1700000000000,
  };
}

function criarBancoEmMemoria() {
  let proximoIdVacina = 1;
  let vacinas = [];
  const pets = [
    criarPet(1, 'usuario-a', 'Rex', 'pet-rex'),
    criarPet(2, 'usuario-b', 'Mel', 'pet-mel'),
  ];

  function anexarDadosPet(vacina) {
    const pet = pets.find(
      (petAtual) =>
        petAtual.id === vacina.id_pet &&
        petAtual.id_usuario === vacina.id_usuario
    );

    return pet ? { ...vacina, nome_pet: pet.nome, pet_uuid: pet.uuid } : null;
  }

  function filtrarVacinas(sql, params) {
    if (/vacinas\.id_usuario = \? AND vacinas\.id_pet = \?/.test(sql)) {
      const [idUsuario, idPet] = params;
      return vacinas.filter(
        (vacina) => vacina.id_usuario === idUsuario && vacina.id_pet === idPet && vacina.excluido_em == null
      );
    }

    if (/vacinas\.id_usuario = \? AND vacinas\.sync_status = \?/.test(sql)) {
      const [idUsuario, syncStatus] = params;
      return vacinas
        .filter((vacina) => vacina.id_usuario === idUsuario && vacina.sync_status === syncStatus)
        .sort((primeiro, segundo) => primeiro.atualizado_em - segundo.atualizado_em || primeiro.id - segundo.id);
    }

    if (/vacinas\.id_usuario = \? AND vacinas\.excluido_em IS NULL/.test(sql)) {
      const [idUsuario] = params;
      return vacinas.filter((vacina) => vacina.id_usuario === idUsuario && vacina.excluido_em == null);
    }

    throw new Error(`SQL de listagem não suportado no teste: ${sql}`);
  }

  return {
    getAllSync(sql, params = []) {
      if (!/FROM vacinas/.test(sql)) {
        throw new Error(`SQL não suportado no teste: ${sql}`);
      }

      return filtrarVacinas(sql, params).map(anexarDadosPet).filter(Boolean);
    },
    getFirstSync(sql, params = []) {
      if (/sqlite_master/.test(sql)) {
        return { name: 'vacinas' };
      }

      if (/FROM pets WHERE id = \? AND id_usuario = \?/.test(sql)) {
        const [id, idUsuario] = params;
        return pets.find((pet) => pet.id === id && pet.id_usuario === idUsuario && pet.excluido_em == null) || null;
      }

      if (/FROM pets WHERE uuid = \? AND id_usuario = \?/.test(sql)) {
        const [uuid, idUsuario] = params;
        return pets.find((pet) => pet.uuid === uuid && pet.id_usuario === idUsuario) || null;
      }

      if (/FROM vacinas/.test(sql) && /vacinas\.id = \? AND vacinas\.id_usuario = \?/.test(sql)) {
        const [id, idUsuario] = params;
        const vacina = vacinas.find(
          (vacinaAtual) =>
            vacinaAtual.id === id &&
            vacinaAtual.id_usuario === idUsuario &&
            vacinaAtual.excluido_em == null
        );

        return vacina ? anexarDadosPet(vacina) : null;
      }

      if (/FROM vacinas/.test(sql) && /vacinas\.uuid = \? AND vacinas\.id_usuario = \?/.test(sql)) {
        const [uuid, idUsuario] = params;
        const vacina = vacinas.find(
          (vacinaAtual) => vacinaAtual.uuid === uuid && vacinaAtual.id_usuario === idUsuario
        );

        return vacina ? anexarDadosPet(vacina) : null;
      }

      if (/SELECT \* FROM vacinas WHERE id = \?/.test(sql)) {
        const [id] = params;
        const vacina = vacinas.find((vacinaAtual) => vacinaAtual.id === id);
        return vacina ? anexarDadosPet(vacina) : null;
      }

      throw new Error(`SQL não suportado no teste: ${sql}`);
    },
    runSync(sql, params = []) {
      if (/INSERT INTO vacinas/.test(sql)) {
        const [
          id_pet,
          id_usuario,
          uuid,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
        ] = params;
        const id = proximoIdVacina;
        proximoIdVacina += 1;
        vacinas.push({
          id,
          id_pet,
          id_usuario,
          uuid,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
        });

        return { lastInsertRowId: id, changes: 1 };
      }

      if (/UPDATE vacinas/.test(sql) && /SET excluido_em = \?/.test(sql) && /WHERE id_pet = \?/.test(sql)) {
        const [excluido_em, atualizado_em, sync_status, idPet, idUsuario] = params;
        let changes = 0;
        vacinas.forEach((vacina) => {
          if (vacina.id_pet === idPet && vacina.id_usuario === idUsuario && vacina.excluido_em == null) {
            Object.assign(vacina, { excluido_em, atualizado_em, sync_status, sincronizado_em: null });
            changes += 1;
          }
        });
        return { changes };
      }

      if (/UPDATE vacinas/.test(sql) && /SET excluido_em = \?/.test(sql) && /WHERE id = \?/.test(sql)) {
        const [excluido_em, atualizado_em, sync_status, id, idUsuario] = params;
        const vacina = vacinas.find(
          (vacinaAtual) => vacinaAtual.id === id && vacinaAtual.id_usuario === idUsuario && vacinaAtual.excluido_em == null
        );

        if (!vacina) return { changes: 0 };

        Object.assign(vacina, { excluido_em, atualizado_em, sync_status, sincronizado_em: null });
        return { changes: 1 };
      }

      if (/UPDATE vacinas/.test(sql) && /SET sync_status = \?/.test(sql) && /WHERE uuid = \?/.test(sql)) {
        const [sync_status, sincronizado_em, firebase_atualizado_em, uuid, idUsuario] = params;
        const vacina = vacinas.find(
          (vacinaAtual) => vacinaAtual.uuid === uuid && vacinaAtual.id_usuario === idUsuario
        );

        if (!vacina) return { changes: 0 };

        Object.assign(vacina, { sync_status, sincronizado_em, firebase_atualizado_em });
        return { changes: 1 };
      }

      if (/UPDATE vacinas/.test(sql) && /criado_em = \?/.test(sql) && /WHERE uuid = \?/.test(sql)) {
        const [
          id_pet,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
          uuid,
          idUsuario,
        ] = params;
        const vacina = vacinas.find(
          (vacinaAtual) => vacinaAtual.uuid === uuid && vacinaAtual.id_usuario === idUsuario
        );

        if (!vacina) return { changes: 0 };

        Object.assign(vacina, {
          id_pet,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          criado_em,
          atualizado_em,
          sync_status,
          sincronizado_em,
          excluido_em,
          firebase_atualizado_em,
        });
        return { changes: 1 };
      }

      if (/UPDATE vacinas/.test(sql) && /SET id_pet = \?/.test(sql)) {
        const [
          id_pet,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
          atualizado_em,
          sync_status,
          id,
          idUsuario,
        ] = params;
        const vacina = vacinas.find(
          (vacinaAtual) => vacinaAtual.id === id && vacinaAtual.id_usuario === idUsuario && vacinaAtual.excluido_em == null
        );

        if (!vacina) return { changes: 0 };

        Object.assign(vacina, {
          id_pet,
          nome,
          data_aplicacao,
          proxima_dose,
          observacoes,
          status,
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

test('cria vacina local pendente de sincronização', () => {
  const database = criarBancoEmMemoria();

  const vacina = comDateNowFixo(1700000000000, () =>
    consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA)
  );

  expect(vacina.id_usuario).toBe('usuario-a');
  expect(vacina.nome_pet).toBe('Rex');
  expect(vacina.pet_uuid).toBe('pet-rex');
  expect(vacina.uuid).toBeTruthy();
  expect(vacina.sync_status).toBe('pending');
  expect(vacina.sincronizado_em).toBeNull();
  expect(vacina.excluido_em).toBeNull();
  expect(vacina.data_aplicacao).toBeNull();
  expect(vacina.proxima_dose.toISOString()).toBe('2099-01-10T00:00:00.000Z');
});

test('lista vacinas visíveis apenas do usuário e pet informados', () => {
  const database = criarBancoEmMemoria();

  consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA);
  consultasVacinas.criarVacina(database, 'usuario-b', {
    ...VACINA_ENTRADA,
    id_pet: 2,
    nome: 'V10',
  });

  expect(
    consultasVacinas.listarVacinasPorUsuario(database, 'usuario-a').map((vacina) => vacina.nome)
  ).toEqual(['Antirrábica']);
  expect(
    consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 1).map((vacina) => vacina.nome)
  ).toEqual(['Antirrábica']);
  expect(consultasVacinas.listarVacinasPorPet(database, 'usuario-a', 2)).toEqual([]);
});

test('atualiza vacina e mantém registro pendente de sincronização', () => {
  const database = criarBancoEmMemoria();

  const vacina = comDateNowFixo(1700000000000, () =>
    consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA)
  );
  consultasVacinas.marcarVacinaComoSincronizada(database, 'usuario-a', vacina.uuid, 1700000050000, 1700000050000);

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
  expect(atualizada.criado_em.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  expect(atualizada.atualizado_em.toISOString()).toBe('2023-11-14T22:15:00.000Z');
  expect(atualizada.sync_status).toBe('pending');
  expect(atualizada.sincronizado_em).toBeNull();
});

test('exclui vacina com soft delete local e mantém pendente para sync', () => {
  const database = criarBancoEmMemoria();
  const vacina = consultasVacinas.criarVacina(database, 'usuario-a', VACINA_ENTRADA);

  expect(consultasVacinas.excluirVacina(database, 'usuario-b', vacina.id)).toBe(0);
  expect(consultasVacinas.buscarVacinaPorId(database, 'usuario-a', vacina.id).nome).toBe('Antirrábica');

  const excluidas = comDateNowFixo(1700000200000, () =>
    consultasVacinas.excluirVacina(database, 'usuario-a', vacina.id)
  );

  expect(excluidas).toBe(1);
  expect(consultasVacinas.buscarVacinaPorId(database, 'usuario-a', vacina.id)).toBeNull();

  const pendentes = consultasVacinas.listarVacinasPendentesSincronizacao(database, 'usuario-a');
  expect(pendentes).toHaveLength(1);
  expect(pendentes[0].uuid).toBe(vacina.uuid);
  expect(pendentes[0].excluido_em.toISOString()).toBe('2023-11-14T22:16:40.000Z');
});

test('exclui vacinas por pet com soft delete preservando outros usuários', () => {
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
  expect(consultasVacinas.listarVacinasPendentesSincronizacao(database, 'usuario-a')).toHaveLength(2);
  expect(
    consultasVacinas.listarVacinasPorUsuario(database, 'usuario-b').map((vacina) => vacina.nome)
  ).toEqual(['V10']);
});

test('upsert remoto insere vacina sincronizada ligada ao pet por uuid', () => {
  const database = criarBancoEmMemoria();

  const resultado = consultasVacinas.upsertVacinaSincronizada(database, 'usuario-a', {
    uuid: 'vacina-remota',
    pet_uuid: 'pet-rex',
    nome: 'V10',
    data_aplicacao: 1700000000000,
    proxima_dose: 1800000000000,
    observacoes: 'Aplicada fora do app.',
    criado_em: 1700000000000,
    atualizado_em: 1700000100000,
    firebase_atualizado_em: 1700000100000,
    sincronizado_em: 1700000200000,
  });

  expect(resultado.status).toBe('inserted');
  const vacina = consultasVacinas.buscarVacinaPorUuid(database, 'usuario-a', 'vacina-remota');
  expect(vacina.nome).toBe('V10');
  expect(vacina.id_pet).toBe(1);
  expect(vacina.sync_status).toBe('synced');
});

test('upsert remoto preserva vacina local pendente contra remoto antigo', () => {
  const database = criarBancoEmMemoria();
  const vacina = comDateNowFixo(1700000300000, () =>
    consultasVacinas.criarVacina(database, 'usuario-a', {
      ...VACINA_ENTRADA,
      uuid: 'vacina-local',
      nome: 'Local recente',
    })
  );

  const resultado = consultasVacinas.upsertVacinaSincronizada(database, 'usuario-a', {
    uuid: vacina.uuid,
    pet_uuid: 'pet-rex',
    nome: 'Remoto antigo',
    data_aplicacao: null,
    proxima_dose: 1800000000000,
    observacoes: null,
    criado_em: 1700000000000,
    atualizado_em: 1700000100000,
    firebase_atualizado_em: 1700000100000,
    sincronizado_em: 1700000200000,
  });

  expect(resultado.status).toBe('ignored');
  expect(consultasVacinas.buscarVacinaPorUuid(database, 'usuario-a', vacina.uuid).nome).toBe('Local recente');
});
