module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      // Jest and React Native core
      '(jest-)?react-native|' +
      '@react-native(-community)?|' +
      // Expo packages
      'expo(nent)?|' +
      '@expo(nent)?/.*|' +
      '@expo-google-fonts/.*|' +
      // Navigation
      'react-navigation|' +
      '@react-navigation/.*|' +
      // Other libraries that need transpilation
      '@sentry/react-native|' +
      'native-base|' +
      'react-native-svg|' +
      'react-native-gifted-charts|' +
      'gifted-charts-core|' +
      '@react-native-picker/picker' +
    '))',
  ],
};
