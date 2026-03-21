import 'dotenv/config';

export default {
  expo: {
    name: "pet-house",
    slug: "pet-house",
    version: "1.0.0",
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    }
  }
};