const SEARCH_RADIUS_METERS = 25000;
const OVERPASS_TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 60000;
const OVERPASS_API_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const QUERY_PROFILES = [
  {
    radius: SEARCH_RADIUS_METERS,
    includeWays: true,
    includeRelations: true,
  },
  {
    radius: 10000,
    includeWays: false,
    includeRelations: false,
  },
];

let cachedResult = null;
let cachedResultAt = 0;
let cachedKey = '';
let inflightRequest = null;
let inflightKey = '';

function buildOverpassQuery(
  latitude,
  longitude,
  {
    radius = SEARCH_RADIUS_METERS,
    includeWays = true,
    includeRelations = true,
  } = {}
) {
  const wayQueries = includeWays
    ? `
      way["shop"="pet"](around:${radius},${latitude},${longitude});
      way["amenity"="veterinary"](around:${radius},${latitude},${longitude});
    `
    : '';
  const relationQueries = includeRelations
    ? `
      relation["shop"="pet"](around:${radius},${latitude},${longitude});
      relation["amenity"="veterinary"](around:${radius},${latitude},${longitude});
    `
    : '';

  return `
    [out:json][timeout:25];
    (
      node["shop"="pet"](around:${radius},${latitude},${longitude});
      node["amenity"="veterinary"](around:${radius},${latitude},${longitude});
${wayQueries}${relationQueries}
    );
    out center;
  `;
}

function getElementCoordinate(element) {
  const latitude = typeof element?.lat === 'number' ? element.lat : element?.center?.lat;
  const longitude = typeof element?.lon === 'number' ? element.lon : element?.center?.lon;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function transformOverpassResponse(data) {
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const seenIds = new Set();

  return elements.reduce((places, element) => {
    const coordinate = getElementCoordinate(element);
    const id = `${element?.type || 'item'}-${element?.id || places.length}`;

    if (!coordinate || seenIds.has(id)) {
      return places;
    }

    seenIds.add(id);

    places.push({
      id,
      coordinate,
      title: element?.tags?.name?.trim() || 'Empreendimento pet',
      description:
        element?.tags?.shop === 'pet'
          ? 'Pet shop'
          : element?.tags?.amenity === 'veterinary'
            ? 'Clinica veterinaria'
            : 'Empreendimento pet',
    });

    return places;
  }, []);
}

async function fetchOverpassFromUrl(url, query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    const rawText = await response.text();

    if (!response.ok) {
      const responseMessage = rawText.trim();
      throw new Error(
        responseMessage
          ? `${url} respondeu ${response.status}: ${responseMessage}`
          : `${url} respondeu ${response.status}.`
      );
    }

    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error(`${url} retornou uma resposta invalida.`);
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`${url} excedeu o tempo limite da consulta.`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestNearbyPetPlaces(latitude, longitude) {
  const errors = [];

  for (const profile of QUERY_PROFILES) {
    const query = buildOverpassQuery(latitude, longitude, profile);

    for (const url of OVERPASS_API_URLS) {
      try {
        const data = await fetchOverpassFromUrl(url, query);
        return transformOverpassResponse(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : `Falha ao consultar ${url}.`;
        errors.push(message);
        console.log('[petPlacesService] Falha no Overpass:', message);
      }
    }
  }

  throw new Error(
    errors.length > 0
      ? `Nao foi possivel consultar os empreendimentos pet proximos.\n${errors.join('\n')}`
      : 'Nao foi possivel consultar os empreendimentos pet proximos.'
  );
}

export async function fetchNearbyPetPlaces(latitude, longitude, options = {}) {
  const { forceRefresh = false } = options;
  const key = `${latitude}:${longitude}`;
  const cacheIsFresh =
    !forceRefresh &&
    cachedKey === key &&
    cachedResult &&
    Date.now() - cachedResultAt < CACHE_TTL_MS;

  if (cacheIsFresh) {
    return cachedResult;
  }

  if (!forceRefresh && inflightRequest && inflightKey === key) {
    return inflightRequest;
  }

  inflightKey = key;
  inflightRequest = requestNearbyPetPlaces(latitude, longitude)
    .then((places) => {
      cachedKey = key;
      cachedResult = places;
      cachedResultAt = Date.now();
      return places;
    })
    .finally(() => {
      inflightRequest = null;
      inflightKey = '';
    });

  return inflightRequest;
}
