/**
 * API Configuration
 * Central config for API endpoints with v2 feature flag
 */

// 🚀 FEATURE FLAG: Toggle between old and new API
export const API_CONFIG = {
  // Set to true to use v2 API (3x faster!)
  // Set to false to use old API (fallback)
  USE_V2_API: false, // Start with false for safety!
  
  // Production URLs
  PRODUCTION_V1_URL: 'https://yeschefapp-production.up.railway.app/api',
  PRODUCTION_V2_URL: 'https://yeschefapp-production.up.railway.app/api/v2',
  
  // Development URLs (if needed)
  DEV_V1_URL: 'http://localhost:5000/api',
  DEV_V2_URL: 'http://localhost:5000/api/v2',
  
  // Environment
  IS_DEV: __DEV__,
};

/**
 * Get the appropriate API base URL
 */
export function getApiBaseUrl() {
  const isDev = API_CONFIG.IS_DEV;
  const useV2 = API_CONFIG.USE_V2_API;
  
  if (isDev) {
    return useV2 ? API_CONFIG.DEV_V2_URL : API_CONFIG.DEV_V1_URL;
  } else {
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
