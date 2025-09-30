/**
 * 🔧 RevenueCat Configuration
 * Centralized configuration for RevenueCat setup
 */

export const REVENUECAT_CONFIG = {
  // 🔑 API Keys (Replace with your actual keys from RevenueCat dashboard)
  API_KEYS: {
    ios: __DEV__ ? 'appl_test_key_ios' : 'appl_prod_key_ios', // TODO: Replace with actual iOS key
    android: __DEV__ ? 'goog_test_key_android' : 'goog_prod_key_android', // TODO: Replace with actual Android key
  },

  // 📦 Product IDs (Match your Google Play Console / App Store Connect products)
  PRODUCTS: {
    monthly: 'yeschef_premium_monthly',     // TODO: Replace with your actual product ID
    yearly: 'yeschef_premium_yearly',       // TODO: Replace with your actual product ID
    weekly: 'yeschef_premium_weekly',       // Optional weekly plan
  },

  // 🏆 Entitlements (Configure in RevenueCat dashboard)
  ENTITLEMENTS: {
    premium: 'premium',                     // Main premium entitlement
    pro: 'pro',                            // Optional pro tier
  },

  // 🎁 Offerings (Configure in RevenueCat dashboard)
  OFFERINGS: {
    default: 'default',                     // Default offering
    promotional: 'special_offer',           // Optional promotional offering
  },

  // 🎯 Feature Gates (Map features to entitlements)
  FEATURES: {
    unlimited_recipes: 'premium',
    ai_generation: 'premium',
    meal_planning: 'premium',
    advanced_grocery: 'premium',
    recipe_sharing: 'premium',
    custom_themes: 'premium',
    cloud_sync: 'premium',
    nutrition_tracking: 'premium',
  },

  // ⚙️ App Configuration
  APP_CONFIG: {
    // TODO: Update these when you publish to stores
    bundleId: {
      ios: 'com.yeschef.YesChefMobile',     // Your iOS Bundle ID
      android: 'com.yeschef.app',           // Your Android Package Name
    },
    
    // User ID format (optional - RevenueCat can generate anonymous IDs)
    userIdPrefix: 'yeschef_user_',
    
    // Debug settings
    enableDebugLogs: __DEV__,
    
    // Trial settings
    trialLength: '7 days',
    
    // Paywall settings
    showPaywallDelay: 0, // Show immediately when feature is gated
  },
};

// 🔍 Development vs Production helper
export const getAPIKey = (platform) => {
  return REVENUECAT_CONFIG.API_KEYS[platform];
};

// 🎯 Check if feature requires premium
export const isFeaturePremium = (featureId) => {
  return featureId in REVENUECAT_CONFIG.FEATURES;
};

// 🏆 Get required entitlement for feature
export const getFeatureEntitlement = (featureId) => {
  return REVENUECAT_CONFIG.FEATURES[featureId];
};

export default REVENUECAT_CONFIG;