import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { fetchNearbyPetPlaces } from '../../services/petPlacesService';
import { mapStyles } from '../../../shared/styles/map.styles';

const DEFAULT_LOCATION = {
  latitude: -22.5231,
  longitude: -44.1046,
};

const MAP_DELTAS = {
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

function createRegion({ latitude, longitude }) {
  return {
    latitude,
    longitude,
    ...MAP_DELTAS,
  };
}

export default function Map() {
  const [reloadKey, setReloadKey] = useState(0);
  const [searchLocation, setSearchLocation] = useState(DEFAULT_LOCATION);
  const [isMapReady, setIsMapReady] = useState(false);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    mapRef.current?.animateToRegion(createRegion(searchLocation), 800);
  }, [isMapReady, searchLocation]);

  useEffect(() => {
    let isActive = true;

    async function loadPlaces() {
      setPlacesLoading(true);
      setPlacesError('');

      try {
        const nearbyPlaces = await fetchNearbyPetPlaces(
          searchLocation.latitude,
          searchLocation.longitude,
          { forceRefresh: reloadKey > 0 }
        );

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
            : 'Não foi possível carregar empreendimentos pet próximos.'
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
  }, [reloadKey, searchLocation.latitude, searchLocation.longitude]);

  const hasPlaces = places.length > 0;

  return (
    <View style={mapStyles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={mapStyles.map}
        initialRegion={createRegion(DEFAULT_LOCATION)}
        onMapReady={() => setIsMapReady(true)}
        loadingEnabled
      >
        <Marker
          coordinate={searchLocation}
          title="Centro da busca"
          description="Ponto usado para buscar empreendimentos pet em até 25 km"
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
            <Text style={mapStyles.statusTitle}>📍 Empreendimentos próximos</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {isOpen ? 'Toque para recolher ▲' : 'Toque para expandir ▼'}
            </Text>
          </Pressable>

          {isOpen && (
            <>
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
