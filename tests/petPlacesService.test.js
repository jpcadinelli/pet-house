const { afterEach, beforeEach, describe, expect, jest, test } = require('@jest/globals');

const originalAbortController = global.AbortController;
const originalFetch = global.fetch;
let mockCacheStore;

function criarRespostaJson(data, { ok = true, status = 200, text } = {}) {
  return {
    ok,
    status,
    text: jest.fn().mockResolvedValue(text ?? JSON.stringify(data)),
  };
}

function criarAbortControllerFake() {
  return class AbortControllerFake {
    constructor() {
      this.signal = {};
    }

    abort() {}
  };
}

function carregarServico() {
  return require('../src/features/services/petPlacesService');
}

function mockPetPlacesCacheRepository() {
  jest.doMock('../src/features/services/petPlacesCacheRepository', () => ({
    getPetPlacesCache: jest.fn((cacheKey) => mockCacheStore.get(cacheKey) || null),
    savePetPlacesCache: jest.fn((
      cacheKey,
      latitude,
      longitude,
      places,
      atualizadoEm
    ) => {
      mockCacheStore.set(cacheKey, {
        cacheKey,
        latitude,
        longitude,
        places,
        atualizadoEm: new Date(atualizadoEm || Date.now()),
      });

      return mockCacheStore.get(cacheKey);
    }),
  }));
}

describe('petPlacesService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockCacheStore = new Map();
    mockPetPlacesCacheRepository();
    global.fetch = jest.fn();
    global.AbortController = originalAbortController || criarAbortControllerFake();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.AbortController = originalAbortController;
    jest.restoreAllMocks();
    jest.dontMock('../src/features/services/petPlacesCacheRepository');
  });

  test('transforma resposta do Overpass em empreendimentos pet normalizados', async () => {
    global.fetch.mockResolvedValueOnce(criarRespostaJson({
      elements: [
        {
          type: 'node',
          id: 10,
          lat: -23.5,
          lon: -46.6,
          tags: { amenity: 'veterinary', name: ' Clínica Feliz ' },
        },
        {
          type: 'way',
          id: 20,
          center: { lat: -23.51, lon: -46.61 },
          tags: { shop: 'pet' },
        },
        {
          type: 'node',
          id: 10,
          lat: -23.7,
          lon: -46.8,
          tags: { shop: 'pet', name: 'Duplicado' },
        },
        {
          type: 'node',
          id: 30,
          tags: { amenity: 'animal_boarding', name: 'Sem coordenada' },
        },
      ],
    }));

    const { fetchNearbyPetPlaces } = carregarServico();
    const lugares = await fetchNearbyPetPlaces(-23.55, -46.63);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(lugares).toEqual([
      expect.objectContaining({
        id: 'node-10',
        coordinate: { latitude: -23.5, longitude: -46.6 },
        title: 'Clínica Feliz',
        category: 'veterinary',
        categoryLabel: 'Clínica veterinária',
      }),
      expect.objectContaining({
        id: 'way-20',
        coordinate: { latitude: -23.51, longitude: -46.61 },
        title: 'Pet shop',
        category: 'pet_shop',
        categoryLabel: 'Pet shop',
      }),
    ]);

    const [, fetchOptions] = global.fetch.mock.calls[0];
    const query = decodeURIComponent(fetchOptions.body.replace('data=', ''));
    expect(fetchOptions.method).toBe('POST');
    expect(query).toContain('around:25000,-23.55,-46.63');
  });

  test('reaproveita cache para a mesma coordenada quando forceRefresh não é usado', async () => {
    global.fetch.mockResolvedValueOnce(criarRespostaJson({
      elements: [
        {
          type: 'node',
          id: 1,
          lat: -23.5,
          lon: -46.6,
          tags: { shop: 'pet', name: 'Pet Cache' },
        },
      ],
    }));

    const { fetchNearbyPetPlaces } = carregarServico();
    const primeiraChamada = await fetchNearbyPetPlaces(-23.5, -46.6);
    const segundaChamada = await fetchNearbyPetPlaces(-23.5, -46.6);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(segundaChamada).toBe(primeiraChamada);
  });

  test('forceRefresh ignora cache e faz nova consulta', async () => {
    global.fetch
      .mockResolvedValueOnce(criarRespostaJson({
        elements: [
          {
            type: 'node',
            id: 1,
            lat: -23.5,
            lon: -46.6,
            tags: { shop: 'pet', name: 'Pet antigo' },
          },
        ],
      }))
      .mockResolvedValueOnce(criarRespostaJson({
        elements: [
          {
            type: 'node',
            id: 2,
            lat: -23.51,
            lon: -46.61,
            tags: { shop: 'pet', name: 'Pet atualizado' },
          },
        ],
      }));

    const { fetchNearbyPetPlaces } = carregarServico();
    const primeiraChamada = await fetchNearbyPetPlaces(-23.5, -46.6);
    const segundaChamada = await fetchNearbyPetPlaces(-23.5, -46.6, { forceRefresh: true });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(primeiraChamada[0].title).toBe('Pet antigo');
    expect(segundaChamada[0].title).toBe('Pet atualizado');
  });

  test('loadNearbyPetPlaces retorna dados online e salva cache local', async () => {
    global.fetch.mockResolvedValueOnce(criarRespostaJson({
      elements: [
        {
          type: 'node',
          id: 5,
          lat: -23.5,
          lon: -46.6,
          tags: { shop: 'pet', name: 'Pet Online' },
        },
      ],
    }));

    const { loadNearbyPetPlaces } = carregarServico();
    const cacheRepository = require('../src/features/services/petPlacesCacheRepository');
    const resultado = await loadNearbyPetPlaces(-23.5004, -46.6004);

    expect(resultado.source).toBe('online');
    expect(resultado.errorMessage).toBe(null);
    expect(resultado.places[0]).toEqual(expect.objectContaining({
      title: 'Pet Online',
      category: 'pet_shop',
    }));
    expect(cacheRepository.savePetPlacesCache).toHaveBeenCalledWith(
      '-23.500:-46.600',
      -23.5004,
      -46.6004,
      resultado.places,
      expect.any(Number)
    );
  });

  test('loadNearbyPetPlaces usa cache SQLite quando a busca online falha', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const atualizadoEm = new Date('2026-06-18T12:00:00.000Z');
    const places = [
      {
        id: 'node-1',
        coordinate: { latitude: -23.5, longitude: -46.6 },
        title: 'Pet em cache',
      },
    ];
    mockCacheStore.set('-23.500:-46.600', { places, atualizadoEm });
    global.fetch.mockRejectedValue(new Error('offline'));

    const { loadNearbyPetPlaces } = carregarServico();
    const resultado = await loadNearbyPetPlaces(-23.5, -46.6);

    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(resultado).toEqual({
      places,
      source: 'cache',
      cacheUpdatedAt: atualizadoEm,
      errorMessage: null,
    });
  });

  test('loadNearbyPetPlaces retorna erro controlado quando rede e cache falham', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    global.fetch.mockRejectedValue(new Error('offline'));

    const { loadNearbyPetPlaces } = carregarServico();
    const resultado = await loadNearbyPetPlaces(-23.5, -46.6);

    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(resultado.places).toEqual([]);
    expect(resultado.source).toBe('online');
    expect(resultado.cacheUpdatedAt).toBe(null);
    expect(resultado.errorMessage).toContain('Não foi possível carregar');
  });

  test('forceRefresh tenta online e usa cache local como fallback', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    global.fetch.mockResolvedValueOnce(criarRespostaJson({
      elements: [
        {
          type: 'node',
          id: 8,
          lat: -23.5,
          lon: -46.6,
          tags: { shop: 'pet', name: 'Pet salvo' },
        },
      ],
    }));

    const { loadNearbyPetPlaces } = carregarServico();
    const primeiraChamada = await loadNearbyPetPlaces(-23.5, -46.6);
    global.fetch.mockRejectedValue(new Error('offline'));

    const segundaChamada = await loadNearbyPetPlaces(
      -23.5,
      -46.6,
      { forceRefresh: true }
    );

    expect(global.fetch).toHaveBeenCalledTimes(5);
    expect(primeiraChamada.source).toBe('online');
    expect(segundaChamada.source).toBe('cache');
    expect(segundaChamada.places[0].title).toBe('Pet salvo');
  });

  test('cache key arredondada agrupa coordenadas próximas em memória', async () => {
    global.fetch.mockResolvedValueOnce(criarRespostaJson({
      elements: [
        {
          type: 'node',
          id: 9,
          lat: -23.5,
          lon: -46.6,
          tags: { shop: 'pet', name: 'Pet arredondado' },
        },
      ],
    }));

    const { buildPetPlacesCacheKey, loadNearbyPetPlaces } = carregarServico();
    const primeiraChamada = await loadNearbyPetPlaces(-23.5004, -46.6004);
    const segundaChamada = await loadNearbyPetPlaces(-23.5003, -46.6003);

    expect(buildPetPlacesCacheKey(-23.5004, -46.6004)).toBe('-23.500:-46.600');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(primeiraChamada.source).toBe('online');
    expect(segundaChamada.source).toBe('memory');
    expect(segundaChamada.places).toBe(primeiraChamada.places);
  });

  test('rejeita com erro agregado quando todas as consultas falham', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    global.fetch.mockResolvedValue(criarRespostaJson(null, {
      ok: false,
      status: 500,
      text: 'erro no overpass',
    }));

    const { fetchNearbyPetPlaces } = carregarServico();

    await expect(fetchNearbyPetPlaces(-23.5, -46.6)).rejects.toThrow(
      'Não foi possível consultar os empreendimentos pet próximos.'
    );
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
