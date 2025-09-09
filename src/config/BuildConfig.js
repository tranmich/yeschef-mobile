/**
 * 🏗️ PRODUCTION BUILD CONFIGURATION
 * 
 * This file ensures the app is production-ready and handles directory structure properly
 */

// Metro configuration for production builds
const productionConfig = {
  resolver: {
    // Ensure consistent module resolution
    nodeModulesPaths: [
      './node_modules',
    ],
    // Production-safe platforms
    platforms: ['native', 'android', 'ios'],
  },
  transformer: {
    // Production optimizations
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      // Production minification settings
      keep_fnames: false,
      mangle: {
        keep_fnames: false,
      },
    },
  },
};

// Development vs Production detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

console.log(`🏗️ Build Mode: ${isDevelopment ? 'Development' : 'Production'}`);

if (isProduction) {
  console.log('🚀 Production build - optimizing for app stores');
} else {
  console.log('🛠️ Development build - including debug tools');
}

module.exports = {
  isDevelopment,
  isProduction,
  productionConfig,
};
