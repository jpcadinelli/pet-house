const SEARCH_RADIUS_METERS = 25000;
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

function buildOverpassQuery(latitude, longitude, radius = SEARCH_RADIUS_METERS) {
  return `
    [out:json][timeout:25];
    (
      node["shop"="pet"](around:${radius},${latitude},${longitude});
      node["amenity"="veterinary"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;
}

function getElementCoordinate(element) {
  const latitude = element?.lat ?? element?.center?.lat;
  const longitude = element?.lon ?? element?.center?.lon;

  if (!latitude || !longitude) return null;

  return { latitude, longitude };
}

function transformOverpassResponse(data) {
  const elements = data?.elements || [];

  return elements.map((element) => ({
    id: `${element.type}-${element.id}`,
    coordinate: getElementCoordinate(element),
    title: element?.tags?.name || 'Empreendimento pet',
    description:
      element?.tags?.shop === 'pet'
        ? 'Pet shop'
        : element?.tags?.amenity === 'veterinary'
        ? 'Clínica veterinária'
        : 'Pet',
  }));
}

export async function fetchNearbyPetPlaces(latitude, longitude) {
  const query = buildOverpassQuery(latitude, longitude);

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  const data = await response.json();

  return transformOverpassResponse(data);
}