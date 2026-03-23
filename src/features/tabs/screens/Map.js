import { useEffect, useState } from 'react';
import { mapStyles } from '../../../shared/styles/map.styles';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const SEARCH_RADIUS_METERS = 25000;
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_LOCATION = {
  latitude: -22.5231,
  longitude: -44.1046,
};
const MAP_DELTAS = {
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

function buildOverpassQuery(latitude, longitude, radius = SEARCH_RADIUS_METERS) {
  return `
    [out:json][timeout:25];
    (
      node["shop"="pet"](around:${radius},${latitude},${longitude});
      way["shop"="pet"](around:${radius},${latitude},${longitude});
      relation["shop"="pet"](around:${radius},${latitude},${longitude});
      node["amenity"="veterinary"](around:${radius},${latitude},${longitude});
      way["amenity"="veterinary"](around:${radius},${latitude},${longitude});
      relation["amenity"="veterinary"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;
}

function createRegion({ latitude, longitude }) {
  return {
    latitude,
    longitude,
    ...MAP_DELTAS,
  };
}

function getElementCoordinate(element) {
  const latitude = typeof element?.lat === 'number' ? element.lat : element?.center?.lat;
  const longitude = typeof element?.lon === 'number' ? element.lon : element?.center?.lon;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function getPlaceDescription(tags = {}) {
  if (tags.shop === 'pet') {
    return 'Pet shop';
  }

  if (tags.amenity === 'veterinary') {
    return 'Clinica veterinaria';
  }

  return 'Empreendimento pet';
}

function transformOverpassResponse(data) {
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const seenIds = new Set();

  return elements.reduce((markers, element) => {
    const coordinate = getElementCoordinate(element);
    const markerId = `${element?.type || 'item'}-${element?.id || markers.length}`;

    if (!coordinate || seenIds.has(markerId)) {
      return markers;
    }

    seenIds.add(markerId);

    markers.push({
      id: markerId,
      coordinate,
      title: element?.tags?.name?.trim() || 'Empreendimento pet',
      description: getPlaceDescription(element?.tags),
    });

    return markers;
  }, []);
}

async function fetchNearbyPetPlaces({ latitude, longitude }) {
  const query = buildOverpassQuery(latitude, longitude);
  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar os empreendimentos pet proximos.');
  }

  const data = await response.json();

  return transformOverpassResponse(data);
}

export default function Map() {
  const [reloadKey, setReloadKey] = useState(0);
  const [mapRegion, setMapRegion] = useState(createRegion(DEFAULT_LOCATION));
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadPlaces() {
      setPlacesLoading(true);
      setPlacesError('');
      setPlaces([]);

      try {
        const nearbyPlaces = await fetchNearbyPetPlaces(DEFAULT_LOCATION);

        if (!isActive) {
          return;
        }

        setPlaces(nearbyPlaces);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPlacesError(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar empreendimentos pet proximos.',
        );
      } finally {
        if (isActive) {
          setPlacesLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  const hasPlaces = places.length > 0;

  return (
    <View style={mapStyles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={mapStyles.map}
        region={mapRegion}
        loadingEnabled
        onRegionChangeComplete={setMapRegion}
      >
        <Marker
          coordinate={DEFAULT_LOCATION}
          title="Centro da busca"
          description="Ponto usado para buscar empreendimentos pet em ate 25 km"
          pinColor="#0B3C78"
        />

        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinate}
            title={place.title}
            description={place.description}
          />
        ))}
      </MapView>

      <View pointerEvents="box-none" style={mapStyles.overlay}>
        <View style={mapStyles.statusCard}>

          <Pressable onPress={() => setIsOpen((prev) => !prev)}>
            <Text style={mapStyles.statusTitle}>
                📍 Empreendimentos próximos
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {isOpen ? 'Toque para recolher ▲' : 'Toque para expandir ▼'}
            </Text>
          </Pressable>

          {isOpen && (
            <>
              <Text style={mapStyles.statusText}>
                Busca centralizada na coordenada fixa da tela em ate 25 km.
              </Text>

              {placesLoading ? (
                <View style={mapStyles.statusRow}>
                  <ActivityIndicator color="#0B3C78" />
                  <Text style={mapStyles.statusText}>
                    Buscando resultados no OpenStreetMap...
                  </Text>
                </View>
              ) : null}

              {!placesLoading && placesError ? (
                <Text style={mapStyles.errorText}>{placesError}</Text>
              ) : null}

              {!placesLoading && !placesError && !hasPlaces ? (
                <Text style={mapStyles.statusText}>
                  Nenhum empreendimento pet foi encontrado no raio configurado.
                </Text>
              ) : null}

              {!placesLoading && !placesError && hasPlaces ? (
                <Text style={mapStyles.statusText}>
                  {places.length} resultado(s) encontrado(s) no raio de 25 km.
                </Text>
              ) : null}

              <Pressable
                style={mapStyles.button}
                onPress={() => setReloadKey((value) => value + 1)}
              >
                <Text style={mapStyles.buttonText}>Atualizar busca</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}