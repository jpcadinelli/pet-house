import 'dotenv/config';

export default {
  expo: {
    name: 'Pet House',
    slug: 'pet-house',
    version: '1.0.0',
    orientation: 'portrait',
    android: {
      package: "com.pethouse.app",
      versionCode: 1
    },

    icon: './assets/icon-pet-house.png',

    "extra": {
      "eas": {
          "projectId": "3999cfc3-5912-4249-bb9d-65c99e3976eb"
        }
      }
    },

    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Usamos sua localização para abrir o mapa na sua posição e buscar empreendimentos pet próximos.',
        },
      ],
      [
        'expo-sqlite'
      ],
    ],

    userInterfaceStyle: 'automatic',

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
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#E6F4FE',
      },

      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },

    web: {
      favicon: './assets/icon-pet-house.png',
    },
  };
