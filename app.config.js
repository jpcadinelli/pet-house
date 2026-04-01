import 'dotenv/config';

export default { 
  expo: {
    name: 'Pet House',
    slug: 'pet-house',
    version: '1.0.0',
    orientation: 'portrait',

    icon: './assets/icon-pet-house.png',

    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/splash-full.png',
          resizeMode: 'cover',
          backgroundColor: '#ffffff',
        },
      ],
    ],

    userInterfaceStyle: 'automatic',

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pethouse.app',
      
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
      },
    },

    android: {
      package: 'com.pethouse.app',
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
  },
};
