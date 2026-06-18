const dbModule = require('../database/db');
const consultasCache = require('../database/consultas/petPlacesCache');

const db = dbModule.getDB ? dbModule.getDB() : dbModule.default || dbModule;

function criarPetPlacesCacheRepository(database) {
  return {
    getPetPlacesCache(cacheKey) {
      try {
        return consultasCache.buscarCacheEmpreendimentos(database, cacheKey);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log('[petPlacesCacheRepository] Falha ao buscar cache:', message);
        return null;
      }
    },

    savePetPlacesCache(cacheKey, latitude, longitude, places, atualizadoEm) {
      try {
        return consultasCache.salvarCacheEmpreendimentos(database, {
          cacheKey,
          latitude,
          longitude,
          places,
          atualizadoEm,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log('[petPlacesCacheRepository] Falha ao salvar cache:', message);
        return null;
      }
    },

    clearOldPetPlacesCaches(maxAgeMs) {
      try {
        return consultasCache.limparCachesAntigos(database, maxAgeMs);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log('[petPlacesCacheRepository] Falha ao limpar cache:', message);
        return 0;
      }
    },
  };
}

const repository = criarPetPlacesCacheRepository(db);

module.exports = {
  clearOldPetPlacesCaches: repository.clearOldPetPlacesCaches,
  criarPetPlacesCacheRepository,
  getPetPlacesCache: repository.getPetPlacesCache,
  savePetPlacesCache: repository.savePetPlacesCache,
};
