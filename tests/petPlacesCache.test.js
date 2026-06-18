const { describe, expect, jest, test } = require('@jest/globals');

const {
  buscarCacheEmpreendimentos,
  limparCachesAntigos,
  salvarCacheEmpreendimentos,
} = require('../src/features/database/consultas/petPlacesCache');

function criarDbFake(linha = null) {
  return {
    getFirstSync: jest.fn(() => linha),
    runSync: jest.fn(() => ({ changes: 1 })),
  };
}

describe('consultas de cache de empreendimentos pet', () => {
  test('salva cache serializando os empreendimentos em JSON', () => {
    const linha = {
      cache_key: '-23.500:-46.600',
      latitude: -23.5,
      longitude: -46.6,
      places_json: JSON.stringify([{ id: 'node-1', title: 'Pet shop' }]),
      atualizado_em: 1700000000000,
    };
    const db = criarDbFake(linha);

    const resultado = salvarCacheEmpreendimentos(db, {
      cacheKey: '-23.500:-46.600',
      latitude: -23.5,
      longitude: -46.6,
      places: [{ id: 'node-1', title: 'Pet shop' }],
      atualizadoEm: 1700000000000,
    });

    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pet_places_cache'),
      [
        '-23.500:-46.600',
        -23.5,
        -46.6,
        JSON.stringify([{ id: 'node-1', title: 'Pet shop' }]),
        1700000000000,
      ]
    );
    expect(resultado.places).toEqual([{ id: 'node-1', title: 'Pet shop' }]);
    expect(resultado.atualizadoEm.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  });

  test('retorna null quando o cache salvo possui JSON inválido', () => {
    const db = criarDbFake({
      cache_key: '-23.500:-46.600',
      latitude: -23.5,
      longitude: -46.6,
      places_json: '{json-invalido',
      atualizado_em: 1700000000000,
    });

    expect(buscarCacheEmpreendimentos(db, '-23.500:-46.600')).toBe(null);
  });

  test('remove caches mais antigos que a idade máxima informada', () => {
    const db = criarDbFake();
    const removidos = limparCachesAntigos(db, 60000, 1700000060000);

    expect(removidos).toBe(1);
    expect(db.runSync).toHaveBeenCalledWith(
      'DELETE FROM pet_places_cache WHERE atualizado_em < ?',
      [1700000000000]
    );
  });
});
