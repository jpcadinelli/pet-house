const { validarPet } = require('../../pets/services/petValidation');

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

function mapearLinhaPet(linha) {
  if (!linha) {
    return null;
  }

  return {
    id: linha.id,
    id_usuario: linha.id_usuario,
    uuid: linha.uuid,
    nome: linha.nome,
    especie: linha.especie,
    raca: linha.raca,
    data_nascimento: converterTimestampParaData(linha.data_nascimento),
    sexo: linha.sexo,
    observacoes: linha.observacoes,
    foto_uri: linha.foto_uri,
    criado_em: converterTimestampParaData(linha.criado_em),
    atualizado_em: converterTimestampParaData(linha.atualizado_em),
    sync_status: linha.sync_status || SYNC_STATUS_PENDING,
    sincronizado_em: converterTimestampParaData(linha.sincronizado_em),
    excluido_em: converterTimestampParaData(linha.excluido_em),
    firebase_atualizado_em: converterTimestampParaData(linha.firebase_atualizado_em),
  };
}

function garantirIdUsuario(idUsuario) {
  const idNormalizado = String(idUsuario || '').trim();

  if (!idNormalizado) {
    throw new Error('Usuário autenticado não identificado.');
  }

  return idNormalizado;
}

function garantirPetValido(entrada) {
  const resultado = validarPet(entrada);

  if (!resultado.valido) {
    const primeiroErro = Object.values(resultado.erros)[0];
    throw new Error(primeiroErro || 'Dados do pet inválidos.');
  }

  return resultado.dados;
}

function criarPet(database, idUsuario, entrada) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const pet = garantirPetValido(entrada);
  const agoraUtc = Date.now();
  const uuid = normalizarUuid(entrada?.uuid);

  const resultado = database.runSync(
    `INSERT INTO pets (
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
      firebase_atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idUsuarioNormalizado,
      uuid,
      pet.nome,
      pet.especie,
      pet.raca,
      converterDataParaTimestamp(pet.data_nascimento),
      pet.sexo,
      pet.observacoes,
      pet.foto_uri,
      agoraUtc,
      agoraUtc,
      SYNC_STATUS_PENDING,
      null,
      null,
      null,
    ]
  );

  return buscarPetPorId(database, resultado.lastInsertRowId, idUsuarioNormalizado);
}

function listarPetsPorUsuario(database, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const linhas = database.getAllSync(
    'SELECT * FROM pets WHERE id_usuario = ? AND excluido_em IS NULL ORDER BY criado_em DESC, id DESC',
    [idUsuarioNormalizado]
  );

  return linhas.map(mapearLinhaPet);
}

function listarPetsPendentesSincronizacao(database, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const linhas = database.getAllSync(
    'SELECT * FROM pets WHERE id_usuario = ? AND sync_status = ? ORDER BY atualizado_em ASC, id ASC',
    [idUsuarioNormalizado, SYNC_STATUS_PENDING]
  );

  return linhas.map(mapearLinhaPet);
}

function buscarPetPorId(database, id, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const linha = database.getFirstSync(
    'SELECT * FROM pets WHERE id = ? AND id_usuario = ? AND excluido_em IS NULL',
    [id, idUsuarioNormalizado]
  );

  return mapearLinhaPet(linha);
}

function buscarPetPorUuid(database, idUsuario, uuid) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const uuidNormalizado = String(uuid || '').trim();

  if (!uuidNormalizado) {
    return null;
  }

  const linha = database.getFirstSync(
    'SELECT * FROM pets WHERE uuid = ? AND id_usuario = ? LIMIT 1',
    [uuidNormalizado, idUsuarioNormalizado]
  );

  return mapearLinhaPet(linha);
}

function atualizarPet(database, id, idUsuario, entrada) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const pet = garantirPetValido(entrada);
  const atualizadoEmUtc = Date.now();

  database.runSync(
    `UPDATE pets
     SET nome = ?,
         especie = ?,
         raca = ?,
         data_nascimento = ?,
         sexo = ?,
         observacoes = ?,
         foto_uri = ?,
         atualizado_em = ?,
         sync_status = ?,
         sincronizado_em = NULL
     WHERE id = ? AND id_usuario = ? AND excluido_em IS NULL`,
    [
      pet.nome,
      pet.especie,
      pet.raca,
      converterDataParaTimestamp(pet.data_nascimento),
      pet.sexo,
      pet.observacoes,
      pet.foto_uri,
      atualizadoEmUtc,
      SYNC_STATUS_PENDING,
      id,
      idUsuarioNormalizado,
    ]
  );

  return buscarPetPorId(database, id, idUsuarioNormalizado);
}

function excluirVacinasDoPetSeExistirem(database, idUsuario, idPet) {
  const consultasVacinas = require('./vacinas');

  if (!consultasVacinas.tabelaVacinasExiste(database)) {
    return 0;
  }

  return consultasVacinas.excluirVacinasPorPet(database, idUsuario, idPet);
}

function excluirPet(database, id, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const petExistente = buscarPetPorId(database, id, idUsuarioNormalizado);

  if (!petExistente) {
    return 0;
  }

  excluirVacinasDoPetSeExistirem(database, idUsuarioNormalizado, id);

  const agoraUtc = Date.now();
  const resultado = database.runSync(
    `UPDATE pets
     SET excluido_em = ?,
         atualizado_em = ?,
         sync_status = ?,
         sincronizado_em = NULL
     WHERE id = ? AND id_usuario = ? AND excluido_em IS NULL`,
    [agoraUtc, agoraUtc, SYNC_STATUS_PENDING, id, idUsuarioNormalizado]
  );

  return resultado.changes || 0;
}

function marcarPetComoSincronizado(database, idUsuario, uuid, sincronizadoEm, firebaseAtualizadoEm) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const uuidNormalizado = String(uuid || '').trim();

  if (!uuidNormalizado) {
    return 0;
  }

  const sincronizadoEmTimestamp = Number(sincronizadoEm || Date.now());
  const firebaseAtualizadoEmTimestamp = Number(firebaseAtualizadoEm || sincronizadoEmTimestamp);
  const resultado = database.runSync(
    `UPDATE pets
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

function removerPetSincronizadoSeExcluido(database, idUsuario, uuid) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const uuidNormalizado = String(uuid || '').trim();

  if (!uuidNormalizado) {
    return 0;
  }

  const resultado = database.runSync(
    'DELETE FROM pets WHERE uuid = ? AND id_usuario = ? AND excluido_em IS NOT NULL AND sync_status = ?',
    [uuidNormalizado, idUsuarioNormalizado, SYNC_STATUS_SYNCED]
  );

  return resultado.changes || 0;
}

function obterPetRemotoValidado(petRemoto) {
  const pet = garantirPetValido({
    nome: petRemoto.nome,
    especie: petRemoto.especie,
    raca: petRemoto.raca,
    data_nascimento: petRemoto.data_nascimento,
    sexo: petRemoto.sexo,
    observacoes: petRemoto.observacoes,
    foto_uri: petRemoto.foto_uri,
  });

  return {
    ...pet,
    uuid: normalizarUuid(petRemoto.uuid),
    criado_em: obterTimestamp(petRemoto.criado_em, Date.now()),
    atualizado_em: obterTimestamp(petRemoto.atualizado_em, Date.now()),
    excluido_em: obterTimestamp(petRemoto.excluido_em, null),
    firebase_atualizado_em: obterTimestamp(
      petRemoto.firebase_atualizado_em,
      obterTimestamp(petRemoto.atualizado_em, Date.now())
    ),
    sincronizado_em: obterTimestamp(petRemoto.sincronizado_em, Date.now()),
  };
}

function upsertPetSincronizado(database, idUsuario, petRemoto) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const pet = obterPetRemotoValidado(petRemoto);
  const petLocal = buscarPetPorUuid(database, idUsuarioNormalizado, pet.uuid);
  const atualizadoLocal = obterTimestamp(petLocal?.atualizado_em, 0);
  const atualizadoRemoto = pet.firebase_atualizado_em || pet.atualizado_em;

  if (
    petLocal?.sync_status === SYNC_STATUS_PENDING &&
    atualizadoRemoto < atualizadoLocal
  ) {
    return { pet: petLocal, status: 'ignored' };
  }

  if (!petLocal) {
    const resultado = database.runSync(
      `INSERT INTO pets (
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
        firebase_atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idUsuarioNormalizado,
        pet.uuid,
        pet.nome,
        pet.especie,
        pet.raca,
        converterDataParaTimestamp(pet.data_nascimento),
        pet.sexo,
        pet.observacoes,
        pet.foto_uri,
        pet.criado_em,
        pet.atualizado_em,
        SYNC_STATUS_SYNCED,
        pet.sincronizado_em,
        pet.excluido_em,
        pet.firebase_atualizado_em,
      ]
    );

    return {
      pet: mapearLinhaPet(database.getFirstSync('SELECT * FROM pets WHERE id = ?', [resultado.lastInsertRowId])),
      status: pet.excluido_em ? 'deleted' : 'inserted',
    };
  }

  database.runSync(
    `UPDATE pets
     SET nome = ?,
         especie = ?,
         raca = ?,
         data_nascimento = ?,
         sexo = ?,
         observacoes = ?,
         foto_uri = ?,
         criado_em = ?,
         atualizado_em = ?,
         sync_status = ?,
         sincronizado_em = ?,
         excluido_em = ?,
         firebase_atualizado_em = ?
     WHERE uuid = ? AND id_usuario = ?`,
    [
      pet.nome,
      pet.especie,
      pet.raca,
      converterDataParaTimestamp(pet.data_nascimento),
      pet.sexo,
      pet.observacoes,
      pet.foto_uri,
      pet.criado_em,
      pet.atualizado_em,
      SYNC_STATUS_SYNCED,
      pet.sincronizado_em,
      pet.excluido_em,
      pet.firebase_atualizado_em,
      pet.uuid,
      idUsuarioNormalizado,
    ]
  );

  return {
    pet: buscarPetPorUuid(database, idUsuarioNormalizado, pet.uuid),
    status: pet.excluido_em ? 'deleted' : 'updated',
  };
}

module.exports = {
  SYNC_STATUS_PENDING,
  SYNC_STATUS_SYNCED,
  atualizarPet,
  buscarPetPorId,
  buscarPetPorUuid,
  converterDataParaTimestamp,
  converterTimestampParaData,
  criarPet,
  excluirPet,
  gerarUuidLocal,
  listarPetsPendentesSincronizacao,
  listarPetsPorUsuario,
  mapearLinhaPet,
  marcarPetComoSincronizado,
  removerPetSincronizadoSeExcluido,
  upsertPetSincronizado,
};
