module.exports = {
    preset: 'jest-expo',
  
    testMatch: [
      '<rootDir>/tests/**/*.test.js',
      '<rootDir>/__tests__/**/*.test.js',
      '<rootDir>/src/**/*.test.js',
      '<rootDir>/src/**/*.spec.js',
    ],
  
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
    collectCoverageFrom: [
      '**/*.{js,jsx}',
      '!**/coverage/**',
      '!**/node_modules/**',
      '!**/babel.config.js',
      '!**/jest.config.cjs',
      '!**/jest.setup.js',
      '!**/.expo/**',
    ],
  
    transformIgnorePatterns: [
      'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-svg|react-native-maps))',
    ],
  };