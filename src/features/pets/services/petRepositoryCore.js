const { validarPet } = require('./petValidation');

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

function criarTabelaPetsPortugues(database) {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario TEXT NOT NULL,
      nome TEXT NOT NULL,
      especie TEXT NOT NULL,
      raca TEXT,
      data_nascimento INTEGER,
      sexo TEXT NOT NULL,
      observacoes TEXT,
      foto_uri TEXT,
      criado_em INTEGER NOT NULL,
      atualizado_em INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pets_id_usuario ON pets (id_usuario);
  `);
}

function migrarTabelaPetsLegada(database) {
  database.execSync(`
    ALTER TABLE pets RENAME TO pets_legado_ingles;

    CREATE TABLE pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario TEXT NOT NULL,
      nome TEXT NOT NULL,
      especie TEXT NOT NULL,
      raca TEXT,
      data_nascimento INTEGER,
      sexo TEXT NOT NULL,
      observacoes TEXT,
      foto_uri TEXT,
      criado_em INTEGER NOT NULL,
      atualizado_em INTEGER NOT NULL
    );

    INSERT INTO pets (
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
      atualizado_em
    )
    SELECT
      id,
      user_id,
      name,
      species,
      breed,
      CASE
        WHEN birth_date IS NULL OR birth_date = '' THEN NULL
        WHEN typeof(birth_date) = 'integer' OR typeof(birth_date) = 'real' THEN birth_date
        ELSE unixepoch(birth_date || 'T00:00:00Z') * 1000
      END,
      sex,
      notes,
      photo_uri,
      CASE
        WHEN typeof(created_at) = 'integer' OR typeof(created_at) = 'real' THEN created_at
        ELSE unixepoch(created_at) * 1000
      END,
      CASE
        WHEN typeof(updated_at) = 'integer' OR typeof(updated_at) = 'real' THEN updated_at
        ELSE unixepoch(updated_at) * 1000
      END
    FROM pets_legado_ingles;

    DROP TABLE pets_legado_ingles;
    CREATE INDEX IF NOT EXISTS idx_pets_id_usuario ON pets (id_usuario);
  `);
}

function inicializarTabelaPets(database) {
  const colunas = database.getAllSync('PRAGMA table_info(pets)');
  const nomesColunas = colunas.map((coluna) => coluna.name);

  if (nomesColunas.length === 0) {
    criarTabelaPetsPortugues(database);
    return;
  }

  if (nomesColunas.includes('id_usuario')) {
    database.execSync('CREATE INDEX IF NOT EXISTS idx_pets_id_usuario ON pets (id_usuario);');
    return;
  }

  if (nomesColunas.includes('user_id')) {
    migrarTabelaPetsLegada(database);
  }
}

function criarRepositorioPets(database) {
  function inicializarTabelaPetsRepositorio() {
    inicializarTabelaPets(database);
  }

  function criarPet(idUsuario, entrada) {
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

    return buscarPetPorId(resultado.lastInsertRowId, idUsuarioNormalizado);
  }

  function listarPetsPorUsuario(idUsuario) {
    const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
    const linhas = database.getAllSync(
      'SELECT * FROM pets WHERE id_usuario = ? ORDER BY criado_em DESC, id DESC',
      [idUsuarioNormalizado]
    );

    return linhas.map(mapearLinhaPet);
  }

  function buscarPetPorId(id, idUsuario) {
    const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
    const linha = database.getFirstSync(
      'SELECT * FROM pets WHERE id = ? AND id_usuario = ?',
      [id, idUsuarioNormalizado]
    );

    return mapearLinhaPet(linha);
  }

  function atualizarPet(id, idUsuario, entrada) {
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

    return buscarPetPorId(id, idUsuarioNormalizado);
  }

  function excluirPet(id, idUsuario) {
    const idUsuarioNormalizado = garantirIdUsuario(idUsuario);
    const resultado = database.runSync(
      'DELETE FROM pets WHERE id = ? AND id_usuario = ?',
      [id, idUsuarioNormalizado]
    );

    return resultado.changes || 0;
  }

  return {
    atualizarPet,
    buscarPetPorId,
    criarPet,
    excluirPet,
    inicializarTabelaPets: inicializarTabelaPetsRepositorio,
    listarPetsPorUsuario,
  };
}

module.exports = {
  converterDataParaTimestamp,
  converterTimestampParaData,
  criarRepositorioPets,
  mapearLinhaPet,
};
