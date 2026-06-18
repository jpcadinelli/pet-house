import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { loadNearbyPetPlaces } from '../../services/petPlacesService';
import { homeStyles } from '../../../shared/styles/home.styles';

const LOCATION_MESSAGES = {
  loading: 'Obtendo sua localização atual para buscar empreendimentos próximos...',
  success: 'Usando sua localização atual para calcular distância e resultados próximos.',
  denied:
    'A permissão de localização foi negada. Libere o GPS para carregar os estabelecimentos próximos.',
  fallback:
    'Não foi possível obter sua localização atual. Tente novamente com o GPS ativo.',
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c).toFixed(1);
}

function getStatus() {
  const hour = new Date().getHours();

  if (hour >= 8 && hour <= 18) {
    return { label: 'Aberto', style: homeStyles.open };
  }

  return { label: 'Fechado', style: homeStyles.closed };
}

function includesSearchTerm(place, search) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableText = [place.title, place.description, place.categoryLabel]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

function formatCacheNotice(cacheUpdatedAt) {
  const message = 'Exibindo últimos empreendimentos salvos.';

  if (!cacheUpdatedAt) {
    return message;
  }

  return `${message} Atualizado em ${cacheUpdatedAt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}.`;
}

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationMessage, setLocationMessage] = useState(LOCATION_MESSAGES.loading);
  const [locationMessageType, setLocationMessageType] = useState('info');
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [placesSource, setPlacesSource] = useState('online');
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  async function loadPlacesForLocation(
    location,
    { forceRefresh = false } = {},
    requestId = requestIdRef.current
  ) {
    setPlacesLoading(true);
    setPlacesError('');

    try {
      const result = await loadNearbyPetPlaces(
        location.latitude,
        location.longitude,
        { forceRefresh }
      );

      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      if (result.places.length > 0 || !result.errorMessage) {
        setPlaces(result.places);
      }

      setPlacesSource(result.source);
      setCacheUpdatedAt(result.cacheUpdatedAt);
      setPlacesError(result.errorMessage || '');
    } catch (error) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      setPlacesError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar empreendimentos pet próximos.'
      );
    } finally {
      if (isMountedRef.current && requestIdRef.current === requestId) {
        setPlacesLoading(false);
      }
    }
  }

  async function loadHomeData({ forceRefresh = false, showFullScreen = false } = {}) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (showFullScreen) {
      setLoading(true);
    }

    setLocationLoading(true);
    setLocationMessage(LOCATION_MESSAGES.loading);
    setLocationMessageType('info');
    setPlacesError('');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      if (permission.status !== 'granted') {
        setUserLocation(null);
        setPlaces([]);
        setPlacesSource('online');
        setCacheUpdatedAt(null);
        setLocationMessage(LOCATION_MESSAGES.denied);
        setLocationMessageType('error');
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      const nextLocation = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };

      setUserLocation(nextLocation);
      setLocationMessage(LOCATION_MESSAGES.success);
      setLocationMessageType('info');
      await loadPlacesForLocation(nextLocation, { forceRefresh }, requestId);
    } catch (error) {
      console.log('[Home] Falha ao obter localização:', error);

      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      setUserLocation(null);
      setPlaces([]);
      setPlacesSource('online');
      setCacheUpdatedAt(null);
      setLocationMessage(LOCATION_MESSAGES.fallback);
      setLocationMessageType('error');
    } finally {
      if (isMountedRef.current && requestIdRef.current === requestId) {
        setLocationLoading(false);
        if (showFullScreen) {
          setLoading(false);
        }
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    void loadHomeData({ showFullScreen: true });

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const filtered = places.filter((place) => includesSearchTerm(place, search));
    setFilteredPlaces(filtered);
  }, [search, places]);

  async function reload() {
    setRefreshing(true);

    try {
      await loadHomeData({ forceRefresh: true });
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }

  if (loading || (locationLoading && !userLocation)) {
    return (
      <View style={homeStyles.loading}>
        <ActivityIndicator size="large" color="#0B3C78" />
        <Text style={homeStyles.loadingText}>{LOCATION_MESSAGES.loading}</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={homeStyles.emptyState}>
        <Ionicons name="location-outline" size={42} color="#0B3C78" />
        <Text style={homeStyles.emptyTitle}>Localização indisponível</Text>
        <Text
          style={
            locationMessageType === 'error'
              ? homeStyles.errorText
              : homeStyles.emptyText
          }
        >
          {locationMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.locationCard}>
        <View style={homeStyles.locationCardHeader}>
          <Ionicons name="navigate-circle" size={20} color="#0B3C78" />
          <Text style={homeStyles.locationTitle}>Busca pela sua localização</Text>
        </View>

        <Text
          style={
            locationMessageType === 'error'
              ? homeStyles.errorText
              : homeStyles.locationText
          }
        >
          {locationMessage}
        </Text>
      </View>

      <TextInput
        placeholder="Buscar pet shop, clínica veterinária ou hotel pet..."
        value={search}
        onChangeText={setSearch}
        style={homeStyles.searchInput}
      />

      {placesSource === 'cache' ? (
        <Text style={homeStyles.cacheBanner}>
          {formatCacheNotice(cacheUpdatedAt)}
        </Text>
      ) : null}

      {placesLoading && !refreshing ? (
        <View style={homeStyles.inlineStatus}>
          <ActivityIndicator color="#0B3C78" />
          <Text style={homeStyles.inlineStatusText}>
            Buscando empreendimentos próximos...
          </Text>
        </View>
      ) : null}

      {!placesLoading && placesError ? (
        <Text style={homeStyles.errorBanner}>{placesError}</Text>
      ) : null}

      <FlatList
        data={filteredPlaces}
        refreshing={refreshing}
        onRefresh={reload}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredPlaces.length === 0 ? homeStyles.listEmptyContent : null
        }
        ListEmptyComponent={
          !placesLoading && !placesError ? (
            <View style={homeStyles.emptyListState}>
              <Text style={homeStyles.emptyText}>
                Nenhum empreendimento pet foi encontrado para sua localização atual.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const distance = getDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.coordinate.latitude,
            item.coordinate.longitude
          );

          const status = getStatus();

          return (
            <View style={homeStyles.card}>
              <View
                style={[
                  homeStyles.iconTile,
                  { backgroundColor: item.backgroundColor },
                ]}
              >
                <Ionicons name={item.iconName} size={28} color={item.accentColor} />
              </View>

              <View style={homeStyles.infoContainer}>
                <Text style={homeStyles.title}>{item.title}</Text>
                <Text style={homeStyles.description}>{item.description}</Text>

                <View style={homeStyles.metaRow}>
                  <View
                    style={[
                      homeStyles.categoryBadge,
                      { backgroundColor: item.backgroundColor },
                    ]}
                  >
                    <Ionicons
                      name={item.iconName}
                      size={12}
                      color={item.accentColor}
                    />
                    <Text
                      style={[
                        homeStyles.categoryBadgeText,
                        { color: item.accentColor },
                      ]}
                    >
                      {item.categoryLabel}
                    </Text>
                  </View>
                </View>

                <View style={homeStyles.subtitleRow}>
                  <Text style={homeStyles.distance}>{distance} km •</Text>

                  <Text style={[homeStyles.status, status.style]}>{status.label}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
