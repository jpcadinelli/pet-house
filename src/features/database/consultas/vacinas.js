const { buscarPetPorId } = require('./pets');
const {
  calcularStatusVacina,
  ordenarVacinasPorStatus,
} = require('../../vaccines/services/vaccineStatus');
const { validarVacina } = require('../../vaccines/services/vaccineValidation');

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

  return data.getTime();
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
    id_pet: linha.id_pet,
    id_usuario: linha.id_usuario,
    nome_pet: linha.nome_pet,
    nome: linha.nome,
    data_aplicacao: dataAplicacao,
    proxima_dose: proximaDose,
    observacoes: linha.observacoes,
    status: calcularStatusVacina(proximaDose) || linha.status,
    criado_em: converterTimestampParaData(linha.criado_em),
    atualizado_em: converterTimestampParaData(linha.atualizado_em),
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
    `SELECT vacinas.*, pets.nome AS nome_pet
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

  const resultado = database.runSync(
    `INSERT INTO vacinas (
      id_pet,
      id_usuario,
      nome,
      data_aplicacao,
      proxima_dose,
      observacoes,
      status,
      criado_em,
      atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vacina.id_pet,
      idUsuarioNormalizado,
      vacina.nome,
      converterDataParaTimestamp(vacina.data_aplicacao),
      converterDataParaTimestamp(vacina.proxima_dose),
      vacina.observacoes,
      status,
      agoraUtc,
      agoraUtc,
    ]
  );

  return buscarVacinaPorId(database, idUsuarioNormalizado, resultado.lastInsertRowId);
}

function listarVacinasPorUsuario(database, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const [sql, params] = selecionarVacinasBase(
    'vacinas.id_usuario = ?',
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
    'vacinas.id_usuario = ? AND vacinas.id_pet = ?',
    [idUsuarioNormalizado, idPetNormalizado]
  );
  const linhas = database.getAllSync(sql, params);

  return mapearEOrdenarVacinas(linhas);
}

function buscarVacinaPorId(database, idUsuario, idVacina) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const [sql, params] = selecionarVacinasBase(
    'vacinas.id = ? AND vacinas.id_usuario = ?',
    [idVacina, idUsuarioNormalizado]
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
         atualizado_em = ?
     WHERE id = ? AND id_usuario = ?`,
    [
      vacina.id_pet,
      vacina.nome,
      converterDataParaTimestamp(vacina.data_aplicacao),
      converterDataParaTimestamp(vacina.proxima_dose),
      vacina.observacoes,
      status,
      atualizadoEmUtc,
      idVacina,
      idUsuarioNormalizado,
    ]
  );

  return buscarVacinaPorId(database, idUsuarioNormalizado, idVacina);
}

function excluirVacina(database, idUsuario, idVacina) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const resultado = database.runSync(
    'DELETE FROM vacinas WHERE id = ? AND id_usuario = ?',
    [idVacina, idUsuarioNormalizado]
  );

  return resultado.changes || 0;
}

function excluirVacinasPorPet(database, idUsuario, idPet) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const resultado = database.runSync(
    'DELETE FROM vacinas WHERE id_pet = ? AND id_usuario = ?',
    [idPet, idUsuarioNormalizado]
  );

  return resultado.changes || 0;
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
  atualizarVacina,
  buscarVacinaPorId,
  converterDataParaTimestamp,
  converterTimestampParaData,
  criarVacina,
  excluirVacina,
  excluirVacinasPorPet,
  listarVacinasPorPet,
  listarVacinasPorUsuario,
  mapearLinhaVacina,
  tabelaVacinasExiste,
};
