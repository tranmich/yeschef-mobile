/**
 * Metro configuration for YesChef Mobile
 * 
 * Ensures Metro uses the correct node_modules and resolves path conflicts
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro looks in the correct directories
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Resolve platform extensions in the correct order
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Add resolver for better error handling
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Enable better error reporting
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    // Add custom error handling
    return (req, res, next) => {
      console.log('📱 Metro request:', req.url);
      middleware(req, res, next);
    };
  },
};

module.exports = config;
