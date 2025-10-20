/**
 * API Configuration
 * Central config for API endpoints with v2 feature flag
 * 
 * IMPORTANT FOR TESTING:
 * - In DEV mode: Uses your LOCAL backend (http://192.168.1.72:5000)
 *   Make sure your local hungie_server.py is running with v2 routes!
 *   
 * - In PRODUCTION mode: Uses Railway (https://yeschefapp-production.up.railway.app)
 *   v2 routes are already deployed and working!
 * 
 * To test against Railway even in dev mode, set USE_RAILWAY_IN_DEV to true below.
 */

// 🔧 DEV MODE OPTION: Force Railway in development
const USE_RAILWAY_IN_DEV = true; // Set to true to test Railway v2 API in dev mode

// 🚀 FEATURE FLAG: Toggle between old and new API
export const API_CONFIG = {
  // Set to true to use v2 API (3x faster!)
  // Set to false to use old API (fallback)
  USE_V2_API: true, // ✅ ENABLED! Whole app now uses v2! 🚀
  
  // Production URLs (Railway)
  PRODUCTION_V1_URL: 'https://yeschefapp-production.up.railway.app/api',
  PRODUCTION_V2_URL: 'https://yeschefapp-production.up.railway.app/api/v2',
  
  // Development URLs (Local backend)
  // IMPORTANT: Match YesChefAPI.js local IP!
  DEV_V1_URL: 'http://192.168.1.72:5000/api',
  DEV_V2_URL: 'http://192.168.1.72:5000/api/v2',
  
  // Environment
  IS_DEV: __DEV__,
};

/**
 * Get the appropriate API base URL
 */
export function getApiBaseUrl() {
  const isDev = API_CONFIG.IS_DEV;
  const useV2 = API_CONFIG.USE_V2_API;
  
  // 🔧 Option to force Railway in dev mode (for testing deployed v2 API)
  if (isDev && USE_RAILWAY_IN_DEV) {
    console.log('🚀 Using Railway in DEV mode');
    return useV2 ? API_CONFIG.PRODUCTION_V2_URL : API_CONFIG.PRODUCTION_V1_URL;
  }
  
  // Use dev URLs in development mode (matches YesChefAPI.js behavior)
  // Use production URLs in production mode
  if (isDev) {
    console.log('🔧 Using Local backend in DEV mode');
    return useV2 ? API_CONFIG.DEV_V2_URL : API_CONFIG.DEV_V1_URL;
  } else {
    console.log('🚀 Using Railway in PRODUCTION mode');
    return useV2 ? API_CONFIG.PRODUCTION_V2_URL : API_CONFIG.PRODUCTION_V1_URL;
  }
}

/**
 * Get full API URL for an endpoint
 * @param {string} endpoint - The endpoint path (e.g., '/recipes/user/11')
 */
export function getApiUrl(endpoint) {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
}

/**
 * Check which API version is active
 */
export function getApiVersion() {
  return API_CONFIG.USE_V2_API ? 'v2' : 'v1';
}

/**
 * Enable v2 API (for testing)
 */
export function enableV2Api() {
  API_CONFIG.USE_V2_API = true;
  console.log('✅ V2 API enabled!');
}

/**
 * Disable v2 API (fallback to old)
 */
export function disableV2Api() {
  API_CONFIG.USE_V2_API = false;
  console.log('⚠️ V2 API disabled, using old API');
}

export default API_CONFIG;
