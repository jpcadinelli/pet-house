const { validarPet } = require('../../pets/services/petValidation');

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

function mapearLinhaPet(linha) {
  if (!linha) {
    return null;
  }

  return {
    id: linha.id,
    id_usuario: linha.id_usuario,
    nome: linha.nome,
    especie: linha.especie,
    raca: linha.raca,
    data_nascimento: converterTimestampParaData(linha.data_nascimento),
    sexo: linha.sexo,
    observacoes: linha.observacoes,
    foto_uri: linha.foto_uri,
    criado_em: converterTimestampParaData(linha.criado_em),
    atualizado_em: converterTimestampParaData(linha.atualizado_em),
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

  const resultado = database.runSync(
    `INSERT INTO pets (
      id_usuario,
      nome,
      especie,
      raca,
      data_nascimento,
      sexo,
      observacoes,
      foto_uri,
      criado_em,
      atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idUsuarioNormalizado,
      pet.nome,
      pet.especie,
      pet.raca,
      converterDataParaTimestamp(pet.data_nascimento),
      pet.sexo,
      pet.observacoes,
      pet.foto_uri,
      agoraUtc,
      agoraUtc,
    ]
  );

  return buscarPetPorId(database, resultado.lastInsertRowId, idUsuarioNormalizado);
}

function listarPetsPorUsuario(database, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const linhas = database.getAllSync(
    'SELECT * FROM pets WHERE id_usuario = ? ORDER BY criado_em DESC, id DESC',
    [idUsuarioNormalizado]
  );

  return linhas.map(mapearLinhaPet);
}

function buscarPetPorId(database, id, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const linha = database.getFirstSync(
    'SELECT * FROM pets WHERE id = ? AND id_usuario = ?',
    [id, idUsuarioNormalizado]
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
         atualizado_em = ?
     WHERE id = ? AND id_usuario = ?`,
    [
      pet.nome,
      pet.especie,
      pet.raca,
      converterDataParaTimestamp(pet.data_nascimento),
      pet.sexo,
      pet.observacoes,
      pet.foto_uri,
      atualizadoEmUtc,
      id,
      idUsuarioNormalizado,
    ]
  );

  return buscarPetPorId(database, id, idUsuarioNormalizado);
}

function excluirPet(database, id, idUsuario) {
  const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
  const resultado = database.runSync(
    'DELETE FROM pets WHERE id = ? AND id_usuario = ?',
    [id, idUsuarioNormalizado]
  );

  return resultado.changes || 0;
}

module.exports = {
  atualizarPet,
  buscarPetPorId,
  converterDataParaTimestamp,
  converterTimestampParaData,
  criarPet,
  excluirPet,
  listarPetsPorUsuario,
  mapearLinhaPet,
};
