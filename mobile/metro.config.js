const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicitly set the entry point to prevent Expo Router auto-detection
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
