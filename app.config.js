import 'dotenv/config';

export default {
  expo: {
    name: 'pet-house',
    slug: 'pet-house',
    version: '1.0.0',
    orientation: 'portrait',
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Usamos sua localização para abrir o mapa na sua posição e buscar empreendimentos pet próximos.',
        },
      ],
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pethouse.app',
      infoPlist: {
        NSFaceIDUsageDescription:
          'Use o Face ID para autenticar seu acesso de forma rápida e segura.',
        NSLocationWhenInUseUsageDescription:
          'Usamos sua localização para abrir o mapa na sua posição e buscar empreendimentos pet próximos.',
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
      },
    },
    android: {
      package: 'com.pethouse.app',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
  },
};
