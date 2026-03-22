import 'dotenv/config';

export default {
  expo: {
    name: 'pet-house',
    slug: 'pet-house',
    version: '1.0.0',
    orientation: 'portrait',

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pethouse.app',
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
      },
    },

    android: {
      package: 'com.pethouse.app',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
  },
};
