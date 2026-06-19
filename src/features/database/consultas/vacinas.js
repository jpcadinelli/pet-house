const { buscarPetPorId, buscarPetPorUuid } = require('./pets');
const {
  calcularStatusVacina,
  ordenarVacinasPorStatus,
} = require('../../vaccines/services/vaccineStatus');
const { validarVacina } = require('../../vaccines/services/vaccineValidation');

const SYNC_STATUS_PENDING = 'pending';
const SYNC_STATUS_SYNCED = 'synced';

function converterTimestampParaData(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const data = new Date(Number(valor));
  return Number.isNaN(data.getTime()) ? null : data;
}

function converterDataParaTimestamp(data) {
  if (!data) {
    return null;
  }

  if (typeof data === 'number') {
    return Number.isFinite(data) ? data : null;
  }

  const timestamp = data.getTime?.();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function obterTimestamp(valor, fallback = 0) {
  const timestamp = converterDataParaTimestamp(valor);
  return timestamp === null ? fallback : timestamp;
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

function normalizarUuid(uuid) {
  const uuidNormalizado = String(uuid || '').trim();
  return uuidNormalizado || gerarUuidLocal();
}

function garantirIdUsuario(idUsuario) {
  const idNormalizado = String(idUsuario || '').trim();

  if (!idNormalizado) {
    throw new Error('Usuário autenticado não identificado.');
  }

  return idNormalizado;
}

function mapearLinhaVacina(linha) {
  if (!linha) {
    return null;
  }

  const dataAplicacao = converterTimestampParaData(linha.data_aplicacao);
  const proximaDose = converterTimestampParaData(linha.proxima_dose);

  return {
    id: linha.id,
    uuid: linha.uuid,
    id_pet: linha.id_pet,
    pet_uuid: linha.pet_uuid,
    id_usuario: linha.id_usuario,
    nome_pet: linha.nome_pet,
    nome: linha.nome,
    data_aplicacao: dataAplicacao,
    proxima_dose: proximaDose,
    observacoes: linha.observacoes,
    status: calcularStatusVacina(proximaDose) || linha.status,
    criado_em: converterTimestampParaData(linha.criado_em),
    atualizado_em: converterTimestampParaData(linha.atualizado_em),
    sync_status: linha.sync_status || SYNC_STATUS_PENDING,
    sincronizado_em: converterTimestampParaData(linha.sincronizado_em),
    excluido_em: converterTimestampParaData(linha.excluido_em),
    firebase_atualizado_em: converterTimestampParaData(linha.firebase_atualizado_em),
  };
}

function mapearEOrdenarVacinas(linhas) {
  return ordenarVacinasPorStatus(linhas.map(mapearLinhaVacina).filter(Boolean));
}

function garantirVacinaValida(database, idUsuario, entrada) {
  const resultado = validarVacina(entrada);

  if (!resultado.valido) {
    const primeiroErro = Object.values(resultado.erros)[0];
    throw new Error(primeiroErro || 'Dados da vacina inválidos.');
  }

  const pet = buscarPetPorId(database, resultado.dados.id_pet, idUsuario);

  if (!pet) {
    throw new Error('O pet selecionado não foi encontrado para este usuário.');
  }

  return resultado.dados;
}

function selecionarVacinasBase(whereClause, params) {
  return [
    `SELECT vacinas.*, pets.nome AS nome_pet, pets.uuid AS pet_uuid
     FROM vacinas
     INNER JOIN pets
       ON pets.id = vacinas.id_pet
      AND pets.id_usuario = vacinas.id_usuario
     WHERE ${whereClause}`,
    params,
  ];
}

function criarVacina(database, idUsuario, entrada) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const vacina = garantirVacinaValida(database, idUsuarioNormalizado, entrada);
  const agoraUtc = Date.now();
  const status = calcularStatusVacina(vacina.proxima_dose);
  const uuid = normalizarUuid(entrada?.uuid);

  const resultado = database.runSync(
    `INSERT INTO vacinas (
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
      firebase_atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vacina.id_pet,
      idUsuarioNormalizado,
      uuid,
      vacina.nome,
      converterDataParaTimestamp(vacina.data_aplicacao),
      converterDataParaTimestamp(vacina.proxima_dose),
      vacina.observacoes,
      status,
      agoraUtc,
      agoraUtc,
      SYNC_STATUS_PENDING,
      null,
      null,
      null,
    ]
  );

  return buscarVacinaPorId(database, idUsuarioNormalizado, resultado.lastInsertRowId);
}

function listarVacinasPorUsuario(database, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const [sql, params] = selecionarVacinasBase(
    'vacinas.id_usuario = ? AND vacinas.excluido_em IS NULL',
    [idUsuarioNormalizado]
  );
  const linhas = database.getAllSync(sql, params);

  return mapearEOrdenarVacinas(linhas);
}

function listarVacinasPorPet(database, idUsuario, idPet) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const idPetNormalizado = Number(idPet);

  if (!Number.isInteger(idPetNormalizado) || idPetNormalizado <= 0) {
    return [];
  }

  const [sql, params] = selecionarVacinasBase(
    'vacinas.id_usuario = ? AND vacinas.id_pet = ? AND vacinas.excluido_em IS NULL',
    [idUsuarioNormalizado, idPetNormalizado]
  );
  const linhas = database.getAllSync(sql, params);

  return mapearEOrdenarVacinas(linhas);
}

function listarVacinasPendentesSincronizacao(database, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const [sql, params] = selecionarVacinasBase(
    'vacinas.id_usuario = ? AND vacinas.sync_status = ?',
    [idUsuarioNormalizado, SYNC_STATUS_PENDING]
  );
  const linhas = database.getAllSync(`${sql} ORDER BY vacinas.atualizado_em ASC, vacinas.id ASC`, params);

  return linhas.map(mapearLinhaVacina);
}

function buscarVacinaPorId(database, idUsuario, idVacina) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const [sql, params] = selecionarVacinasBase(
    'vacinas.id = ? AND vacinas.id_usuario = ? AND vacinas.excluido_em IS NULL',
    [idVacina, idUsuarioNormalizado]
  );

  return mapearLinhaVacina(database.getFirstSync(sql, params));
}

function buscarVacinaPorUuid(database, idUsuario, uuid) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const uuidNormalizado = String(uuid || '').trim();

  if (!uuidNormalizado) {
    return null;
  }

  const [sql, params] = selecionarVacinasBase(
    'vacinas.uuid = ? AND vacinas.id_usuario = ?',
    [uuidNormalizado, idUsuarioNormalizado]
  );

  return mapearLinhaVacina(database.getFirstSync(sql, params));
}

function atualizarVacina(database, idUsuario, idVacina, entrada) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const vacinaExistente = buscarVacinaPorId(database, idUsuarioNormalizado, idVacina);

  if (!vacinaExistente) {
    throw new Error('Vacina não encontrada.');
  }

  const vacina = garantirVacinaValida(database, idUsuarioNormalizado, entrada);
  const atualizadoEmUtc = Date.now();
  const status = calcularStatusVacina(vacina.proxima_dose);

  database.runSync(
    `UPDATE vacinas
     SET id_pet = ?,
         nome = ?,
         data_aplicacao = ?,
         proxima_dose = ?,
         observacoes = ?,
         status = ?,
         atualizado_em = ?,
         sync_status = ?,
         sincronizado_em = NULL
     WHERE id = ? AND id_usuario = ? AND excluido_em IS NULL`,
    [
      vacina.id_pet,
      vacina.nome,
      converterDataParaTimestamp(vacina.data_aplicacao),
      converterDataParaTimestamp(vacina.proxima_dose),
      vacina.observacoes,
      status,
      atualizadoEmUtc,
      SYNC_STATUS_PENDING,
      idVacina,
      idUsuarioNormalizado,
    ]
  );

  return buscarVacinaPorId(database, idUsuarioNormalizado, idVacina);
}

function excluirVacina(database, idUsuario, idVacina) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const vacinaExistente = buscarVacinaPorId(database, idUsuarioNormalizado, idVacina);

  if (!vacinaExistente) {
    return 0;
  }

  const agoraUtc = Date.now();
  const resultado = database.runSync(
    `UPDATE vacinas
     SET excluido_em = ?,
         atualizado_em = ?,
         sync_status = ?,
         sincronizado_em = NULL
     WHERE id = ? AND id_usuario = ? AND excluido_em IS NULL`,
    [agoraUtc, agoraUtc, SYNC_STATUS_PENDING, idVacina, idUsuarioNormalizado]
  );

  return resultado.changes || 0;
}

function excluirVacinasPorPet(database, idUsuario, idPet) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const agoraUtc = Date.now();
  const resultado = database.runSync(
    `UPDATE vacinas
     SET excluido_em = ?,
         atualizado_em = ?,
         sync_status = ?,
         sincronizado_em = NULL
     WHERE id_pet = ? AND id_usuario = ? AND excluido_em IS NULL`,
    [agoraUtc, agoraUtc, SYNC_STATUS_PENDING, idPet, idUsuarioNormalizado]
  );

  return resultado.changes || 0;
}

function marcarVacinaComoSincronizada(database, idUsuario, uuid, sincronizadoEm, firebaseAtualizadoEm) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const uuidNormalizado = String(uuid || '').trim();

  if (!uuidNormalizado) {
    return 0;
  }

  const sincronizadoEmTimestamp = Number(sincronizadoEm || Date.now());
  const firebaseAtualizadoEmTimestamp = Number(firebaseAtualizadoEm || sincronizadoEmTimestamp);
  const resultado = database.runSync(
    `UPDATE vacinas
     SET sync_status = ?,
         sincronizado_em = ?,
         firebase_atualizado_em = ?
     WHERE uuid = ? AND id_usuario = ?`,
    [
      SYNC_STATUS_SYNCED,
      sincronizadoEmTimestamp,
      firebaseAtualizadoEmTimestamp,
      uuidNormalizado,
      idUsuarioNormalizado,
    ]
  );

  return resultado.changes || 0;
}

function obterVacinaRemotaValidada(database, idUsuario, vacinaRemota) {
  const petLocal = vacinaRemota.pet_uuid
    ? buscarPetPorUuid(database, idUsuario, vacinaRemota.pet_uuid)
    : buscarPetPorId(database, vacinaRemota.id_pet, idUsuario);

  if (!petLocal) {
    return null;
  }

  const resultado = validarVacina({
    id_pet: petLocal.id,
    nome: vacinaRemota.nome,
    data_aplicacao: vacinaRemota.data_aplicacao,
    proxima_dose: vacinaRemota.proxima_dose,
    observacoes: vacinaRemota.observacoes,
  });

  if (!resultado.valido) {
    return null;
  }

  const status = calcularStatusVacina(resultado.dados.proxima_dose);

  return {
    ...resultado.dados,
    uuid: normalizarUuid(vacinaRemota.uuid),
    pet_uuid: petLocal.uuid,
    criado_em: obterTimestamp(vacinaRemota.criado_em, Date.now()),
    atualizado_em: obterTimestamp(vacinaRemota.atualizado_em, Date.now()),
    excluido_em: obterTimestamp(vacinaRemota.excluido_em, null),
    firebase_atualizado_em: obterTimestamp(
      vacinaRemota.firebase_atualizado_em,
      obterTimestamp(vacinaRemota.atualizado_em, Date.now())
    ),
    sincronizado_em: obterTimestamp(vacinaRemota.sincronizado_em, Date.now()),
    status,
  };
}

function upsertVacinaSincronizada(database, idUsuario, vacinaRemota) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const vacina = obterVacinaRemotaValidada(database, idUsuarioNormalizado, vacinaRemota);

  if (!vacina) {
    return { vacina: null, status: 'ignored' };
  }

  const vacinaLocal = buscarVacinaPorUuid(database, idUsuarioNormalizado, vacina.uuid);
  const atualizadoLocal = obterTimestamp(vacinaLocal?.atualizado_em, 0);
  const atualizadoRemoto = vacina.firebase_atualizado_em || vacina.atualizado_em;

  if (
    vacinaLocal?.sync_status === SYNC_STATUS_PENDING &&
    atualizadoRemoto < atualizadoLocal
  ) {
    return { vacina: vacinaLocal, status: 'ignored' };
  }

  if (!vacinaLocal) {
    const resultado = database.runSync(
      `INSERT INTO vacinas (
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
        firebase_atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vacina.id_pet,
        idUsuarioNormalizado,
        vacina.uuid,
        vacina.nome,
        converterDataParaTimestamp(vacina.data_aplicacao),
        converterDataParaTimestamp(vacina.proxima_dose),
        vacina.observacoes,
        vacina.status,
        vacina.criado_em,
        vacina.atualizado_em,
        SYNC_STATUS_SYNCED,
        vacina.sincronizado_em,
        vacina.excluido_em,
        vacina.firebase_atualizado_em,
      ]
    );

    return {
      vacina: mapearLinhaVacina(database.getFirstSync('SELECT * FROM vacinas WHERE id = ?', [resultado.lastInsertRowId])),
      status: vacina.excluido_em ? 'deleted' : 'inserted',
    };
  }

  database.runSync(
    `UPDATE vacinas
     SET id_pet = ?,
         nome = ?,
         data_aplicacao = ?,
         proxima_dose = ?,
         observacoes = ?,
         status = ?,
         criado_em = ?,
         atualizado_em = ?,
         sync_status = ?,
         sincronizado_em = ?,
         excluido_em = ?,
         firebase_atualizado_em = ?
     WHERE uuid = ? AND id_usuario = ?`,
    [
      vacina.id_pet,
      vacina.nome,
      converterDataParaTimestamp(vacina.data_aplicacao),
      converterDataParaTimestamp(vacina.proxima_dose),
      vacina.observacoes,
      vacina.status,
      vacina.criado_em,
      vacina.atualizado_em,
      SYNC_STATUS_SYNCED,
      vacina.sincronizado_em,
      vacina.excluido_em,
      vacina.firebase_atualizado_em,
      vacina.uuid,
      idUsuarioNormalizado,
    ]
  );

  return {
    vacina: buscarVacinaPorUuid(database, idUsuarioNormalizado, vacina.uuid),
    status: vacina.excluido_em ? 'deleted' : 'updated',
  };
}

function tabelaVacinasExiste(database) {
  try {
    const linha = database.getFirstSync(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'vacinas'"
    );

    return Boolean(linha);
  } catch (error) {
    return false;
  }
}

module.exports = {
  SYNC_STATUS_PENDING,
  SYNC_STATUS_SYNCED,
  atualizarVacina,
  buscarVacinaPorId,
  buscarVacinaPorUuid,
  converterDataParaTimestamp,
  converterTimestampParaData,
  criarVacina,
  excluirVacina,
  excluirVacinasPorPet,
  gerarUuidLocal,
  listarVacinasPendentesSincronizacao,
  listarVacinasPorPet,
  listarVacinasPorUsuario,
  mapearLinhaVacina,
  marcarVacinaComoSincronizada,
  tabelaVacinasExiste,
  upsertVacinaSincronizada,
};
