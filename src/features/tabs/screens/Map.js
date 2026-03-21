import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
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
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
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

      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Empreendimentos pet proximos</Text>
          <Text style={styles.statusText}>Busca centralizada na coordenada fixa da tela em ate 25 km.</Text>

          {placesLoading ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#0B3C78" />
              <Text style={styles.statusText}>Buscando resultados no OpenStreetMap...</Text>
            </View>
          ) : null}

          {!placesLoading && placesError ? (
            <Text style={styles.errorText}>{placesError}</Text>
          ) : null}

          {!placesLoading && !placesError && !hasPlaces ? (
            <Text style={styles.statusText}>
              Nenhum empreendimento pet foi encontrado no raio configurado.
            </Text>
          ) : null}

          {!placesLoading && !placesError && hasPlaces ? (
            <Text style={styles.statusText}>
              {places.length} resultado(s) encontrado(s) no raio de 25 km.
            </Text>
          ) : null}

          <Pressable style={styles.button} onPress={() => setReloadKey((value) => value + 1)}>
            <Text style={styles.buttonText}>Atualizar busca</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#B42318',
    lineHeight: 20,
    marginTop: 8,
  },
  button: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0B3C78',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
