const { afterEach, beforeEach, describe, expect, jest, test } = require('@jest/globals');

const originalAbortController = global.AbortController;
const originalFetch = global.fetch;

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

describe('petPlacesService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.AbortController = originalAbortController || criarAbortControllerFake();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.AbortController = originalAbortController;
    jest.restoreAllMocks();
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
