import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { fetchNearbyPetPlaces } from '../../services/petPlacesService';
import { mapStyles } from '../../../shared/styles/map.styles';

const MAP_DELTAS = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const LOCATION_MESSAGES = {
  loading: 'Obtendo sua localização atual pelo GPS...',
  success: 'Usando sua localização atual como centro da busca.',
  denied: 'A permissão de localização foi negada. Libere o GPS para abrir o mapa.',
  fallback:
    'Não foi possível obter sua localização atual. Tente novamente com o GPS ativo.',
};

function createRegion({ latitude, longitude }) {
  return {
    latitude,
    longitude,
    ...MAP_DELTAS,
  };
}

export default function MapScreen() {
  const [reloadKey, setReloadKey] = useState(0);
  const [searchLocation, setSearchLocation] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationMessage, setLocationMessage] = useState(LOCATION_MESSAGES.loading);
  const [locationMessageType, setLocationMessageType] = useState('info');
  const mapRef = useRef(null);
  const isMountedRef = useRef(true);
  const locationRequestIdRef = useRef(0);

  async function loadUserLocation() {
    const requestId = locationRequestIdRef.current + 1;
    locationRequestIdRef.current = requestId;

    setLocationLoading(true);
    setLocationMessage(LOCATION_MESSAGES.loading);
    setLocationMessageType('info');
    setPlacesError('');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isMountedRef.current || locationRequestIdRef.current !== requestId) {
        return;
      }

      if (permission.status !== 'granted') {
        setSearchLocation(null);
        setPlaces([]);
        setLocationMessage(LOCATION_MESSAGES.denied);
        setLocationMessageType('error');
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

      if (!isMountedRef.current || locationRequestIdRef.current !== requestId) {
        return;
      }

      setSearchLocation({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });
      setLocationMessage(LOCATION_MESSAGES.success);
      setLocationMessageType('info');
    } catch (error) {
      console.log('[Map] Falha ao obter localização:', error);

      if (!isMountedRef.current || locationRequestIdRef.current !== requestId) {
        return;
      }

      setSearchLocation(null);
      setPlaces([]);
      setLocationMessage(LOCATION_MESSAGES.fallback);
      setLocationMessageType('error');
    } finally {
      if (isMountedRef.current && locationRequestIdRef.current === requestId) {
        setLocationLoading(false);
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    void loadUserLocation();

    return () => {
      isMountedRef.current = false;
      locationRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !searchLocation) {
      return;
    }

    mapRef.current?.animateToRegion(createRegion(searchLocation), 800);
  }, [isMapReady, searchLocation]);

  useEffect(() => {
    if (locationLoading || !searchLocation) {
      return;
    }

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

    void loadPlaces();

    return () => {
      isActive = false;
    };
  }, [locationLoading, reloadKey, searchLocation]);

  const hasPlaces = places.length > 0;
  const hasUserLocation = Boolean(searchLocation);
  const legendPlaces = Array.from(
    new Map(places.map((place) => [place.category, place])).values()
  ).slice(0, 3);

  return (
    <View style={mapStyles.mapContainer}>
      {hasUserLocation ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={mapStyles.map}
          initialRegion={createRegion(searchLocation)}
          onMapReady={() => setIsMapReady(true)}
          loadingEnabled
          showsUserLocation
          showsMyLocationButton
        >
          <Marker
            coordinate={searchLocation}
            title="Sua localização"
            description="Sua posição atual usada para buscar empreendimentos pet em até 25 km."
            pinColor="#84BE12"
          />

          {places.map((place) => (
            <Marker
              key={place.id}
              coordinate={place.coordinate}
              title={place.title}
              description={place.categoryLabel}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={mapStyles.placeMarkerContainer}>
                <View
                  style={[
                    mapStyles.placeMarkerBubble,
                    { backgroundColor: place.accentColor },
                  ]}
                >
                  <Ionicons name={place.iconName} size={18} color="#FFFFFF" />
                </View>
                <View
                  style={[
                    mapStyles.placeMarkerTail,
                    { backgroundColor: place.accentColor },
                  ]}
                />
              </View>
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={mapStyles.mapPlaceholder}>
          <ActivityIndicator color="#0B3C78" size="large" />
          <Text style={mapStyles.placeholderText}>
            {locationLoading ? LOCATION_MESSAGES.loading : locationMessage}
          </Text>
        </View>
      )}

      <View pointerEvents="box-none" style={mapStyles.overlay}>
        <View style={mapStyles.statusCard}>
          <Pressable onPress={() => setIsOpen((prev) => !prev)}>
            <Text style={mapStyles.statusTitle}> 📍 Empreendimentos próximos</Text>
            <Text style={mapStyles.statusHint}>
              {isOpen ? 'Toque para recolher ▲' : 'Toque para expandir ▼'}
            </Text>
          </Pressable>

          {isOpen && (
            <>
              {hasUserLocation && legendPlaces.length > 0 ? (
                <View style={mapStyles.legendRow}>
                  {legendPlaces.map((place) => (
                    <View
                      key={`${place.id}-legend`}
                      style={[
                        mapStyles.legendChip,
                        { backgroundColor: place.backgroundColor },
                      ]}
                    >
                      <Ionicons
                        name={place.iconName}
                        size={12}
                        color={place.accentColor}
                      />
                      <Text
                        style={[
                          mapStyles.legendText,
                          { color: place.accentColor },
                        ]}
                      >
                        {place.categoryLabel}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {locationLoading ? (
                <View style={mapStyles.statusRow}>
                  <ActivityIndicator color="#0B3C78" />
                  <Text style={mapStyles.statusText}>{LOCATION_MESSAGES.loading}</Text>
                </View>
              ) : (
                <Text
                  style={
                    locationMessageType === 'error'
                      ? mapStyles.errorText
                      : mapStyles.statusText
                  }
                >
                  {locationMessage}
                </Text>
              )}

              {hasUserLocation && placesLoading ? (
                <View style={mapStyles.statusRow}>
                  <ActivityIndicator color="#0B3C78" />
                  <Text style={mapStyles.statusText}>
                    Buscando resultados no OpenStreetMap...
                  </Text>
                </View>
              ) : null}

              {hasUserLocation && !placesLoading && placesError ? (
                <Text style={mapStyles.errorText}>{placesError}</Text>
              ) : null}

              {hasUserLocation &&
              !locationLoading &&
              !placesLoading &&
              !placesError &&
              !hasPlaces ? (
                <Text style={mapStyles.statusText}>
                  Nenhum empreendimento pet foi encontrado em um raio de 25 Km.
                </Text>
              ) : null}

              {hasUserLocation &&
              !locationLoading &&
              !placesLoading &&
              !placesError &&
              hasPlaces ? (
                <Text style={mapStyles.statusText}>
                  {places.length} resultado(s) encontrado(s) no raio de 25 km.
                </Text>
              ) : null}

              <View style={mapStyles.buttonGroup}>
                <Pressable
                  style={[
                    mapStyles.button,
                    locationLoading ? mapStyles.buttonDisabled : null,
                  ]}
                  onPress={() => {
                    void loadUserLocation();
                  }}
                  disabled={locationLoading}
                >
                  <Text style={mapStyles.buttonText}>Atualizar localização</Text>
                </Pressable>

                {hasUserLocation ? (
                  <Pressable
                    style={[
                      mapStyles.secondaryButton,
                      locationLoading ? mapStyles.buttonDisabled : null,
                    ]}
                    onPress={() => setReloadKey((value) => value + 1)}
                    disabled={locationLoading}
                  >
                    <Text style={mapStyles.secondaryButtonText}>Atualizar busca</Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
