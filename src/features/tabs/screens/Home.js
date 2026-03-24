import { useEffect, useState } from 'react';
import {View, Text, FlatList, ActivityIndicator, Image} from 'react-native';
import { fetchNearbyPetPlaces } from '../../services/petPlacesService';
import { homeStyles } from '../../../shared/styles/home.styles';

const DEFAULT_LOCATION = {
  latitude: -22.5231,
  longitude: -44.1046,
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

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchNearbyPetPlaces(
          DEFAULT_LOCATION.latitude,
          DEFAULT_LOCATION.longitude
        );
        setPlaces(data);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading)
    return (
      <View style={homeStyles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <View style={homeStyles.container}>
      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const distance = getDistance(
            DEFAULT_LOCATION.latitude,
            DEFAULT_LOCATION.longitude,
            item.coordinate.latitude,
            item.coordinate.longitude
          );

          const status = getStatus();

          return (
            <View style={homeStyles.card}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
                }}
                style={homeStyles.image}
              />

              <View style={homeStyles.infoContainer}>
                <Text style={homeStyles.title}>{item.title}</Text>

                <View style={homeStyles.subtitleRow}>
                  <Text style={homeStyles.distance}>
                    {distance} km •
                  </Text>

                  <Text style={[homeStyles.status, status.style]}>
                    {status.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}