function converterTimestampParaData(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const data = new Date(Number(valor));
  return Number.isNaN(data.getTime()) ? null : data;
}

function normalizarCacheKey(cacheKey) {
  return String(cacheKey || '').trim();
}

function mapearLinhaCache(linha) {
  if (!linha) {
    return null;
  }

  try {
    const places = JSON.parse(linha.places_json);

    if (!Array.isArray(places)) {
      return null;
    }

    return {
      cacheKey: linha.cache_key,
      latitude: linha.latitude,
      longitude: linha.longitude,
      places,
      atualizadoEm: converterTimestampParaData(linha.atualizado_em),
    };
  } catch {
    return null;
  }
}

function salvarCacheEmpreendimentos(database, entrada) {
  const cacheKey = normalizarCacheKey(entrada?.cacheKey);

  if (!cacheKey) {
    throw new Error('Chave de cache dos empreendimentos nao informada.');
  }

  const places = Array.isArray(entrada?.places) ? entrada.places : [];
  const atualizadoEm = entrada?.atualizadoEm || Date.now();

  database.runSync(
    `INSERT INTO pet_places_cache (
      cache_key,
      latitude,
      longitude,
      places_json,
      atualizado_em
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      places_json = excluded.places_json,
      atualizado_em = excluded.atualizado_em`,
    [
      cacheKey,
      Number(entrada.latitude),
      Number(entrada.longitude),
      JSON.stringify(places),
      atualizadoEm,
    ]
  );

  return buscarCacheEmpreendimentos(database, cacheKey);
}

function buscarCacheEmpreendimentos(database, cacheKey) {
  const cacheKeyNormalizada = normalizarCacheKey(cacheKey);

  if (!cacheKeyNormalizada) {
    return null;
  }

  const linha = database.getFirstSync(
    'SELECT * FROM pet_places_cache WHERE cache_key = ? LIMIT 1',
    [cacheKeyNormalizada]
  );

  return mapearLinhaCache(linha);
}

function limparCachesAntigos(database, maxAgeMs, agora = Date.now()) {
  const idadeMaxima = Number(maxAgeMs);

  if (!Number.isFinite(idadeMaxima) || idadeMaxima <= 0) {
    return 0;
  }

  const resultado = database.runSync(
    'DELETE FROM pet_places_cache WHERE atualizado_em < ?',
    [agora - idadeMaxima]
  );

  return resultado.changes || 0;
}

module.exports = {
  buscarCacheEmpreendimentos,
  converterTimestampParaData,
  limparCachesAntigos,
  mapearLinhaCache,
  salvarCacheEmpreendimentos,
};
