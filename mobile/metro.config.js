const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicitly set the entry point to prevent Expo Router auto-detection
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// Lucide ships ESM icon files. Metro's package-exports resolver misses those
// relative .mjs imports and the bundle stops before the app can open.
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath?.replace(/\\/g, '/') ?? '';
  if (origin.includes('/node_modules/lucide-react-native/')) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform,
    );
  }
  if (resolveRequest) {
    return resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
