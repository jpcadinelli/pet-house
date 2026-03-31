import {
  getPetPlaceCategory,
  getPetPlaceCategoryMeta,
} from '../../shared/constants/petPlaceCategories';

const SEARCH_RADIUS_METERS = 25000;
const OVERPASS_TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 60000;
const OVERPASS_API_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OVERPASS_TAG_FILTERS = [
  { key: 'shop', value: 'pet' },
  { key: 'amenity', value: 'veterinary' },
  { key: 'amenity', value: 'animal_boarding' },
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

function buildElementQueries(elementType, latitude, longitude, radius) {
  return OVERPASS_TAG_FILTERS.map(
    ({ key, value }) =>
      `      ${elementType}["${key}"="${value}"](around:${radius},${latitude},${longitude});`
  ).join('\n');
}

function buildOverpassQuery(
  latitude,
  longitude,
  {
    radius = SEARCH_RADIUS_METERS,
    includeWays = true,
    includeRelations = true,
  } = {}
) {
  const nodeQueries = buildElementQueries('node', latitude, longitude, radius);
  const wayQueries = includeWays
    ? buildElementQueries('way', latitude, longitude, radius)
    : '';
  const relationQueries = includeRelations
    ? buildElementQueries('relation', latitude, longitude, radius)
    : '';

  return `
    [out:json][timeout:25];
    (
${nodeQueries}
${wayQueries ? `${wayQueries}\n` : ''}${relationQueries ? `${relationQueries}\n` : ''}    );
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

    const category = getPetPlaceCategory(element?.tags);
    const categoryMeta = getPetPlaceCategoryMeta(category);

    places.push({
      id,
      coordinate,
      title: element?.tags?.name?.trim() || categoryMeta.fallbackTitle,
      description: categoryMeta.description,
      category,
      categoryLabel: categoryMeta.label,
      iconName: categoryMeta.iconName,
      accentColor: categoryMeta.accentColor,
      backgroundColor: categoryMeta.backgroundColor,
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
      throw new Error(`${url} retornou uma resposta inválida.`);
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
      ? `Não foi possível consultar os empreendimentos pet próximos.\n${errors.join('\n')}`
      : 'Não foi possível consultar os empreendimentos pet próximos.'
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
