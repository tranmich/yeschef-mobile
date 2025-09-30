/**
 * 🔐 Premium Feature Hook
 * Easy hook for gating features behind premium subscription
 */

import { usePremium } from '../contexts/PremiumContext';
import { Alert } from 'react-native';

export const usePremiumFeature = (featureId, featureName) => {
  const { isPremium, checkFeatureAccess, showPaywallForFeature } = usePremium();

  const requirePremium = (callback, customPaywallMessage = null) => {
    if (checkFeatureAccess(featureId)) {
      // User has access, execute the callback
      callback();
    } else {
      // Show paywall
      const message = customPaywallMessage || featureName;
      showPaywallForFeature(message);
    }
  };

  const showPremiumAlert = (customMessage = null) => {
    const message = customMessage || `${featureName} is a premium feature`;
    
    Alert.alert(
      '🌟 Premium Feature',
      message,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          onPress: () => showPaywallForFeature(featureName)
        }
      ]
    );
  };

  return {
    isPremium,
    hasAccess: checkFeatureAccess(featureId),
    requirePremium,
    showPremiumAlert,
  };
};

// Predefined premium features for easy use
export const usePremiumFeatures = () => {
  const { isPremium, checkFeatureAccess } = usePremium();

  return {
    isPremium,
    
    // Recipe features
    unlimitedRecipes: checkFeatureAccess('unlimited_recipes'),
    aiGeneration: checkFeatureAccess('ai_generation'),
    recipeSharing: checkFeatureAccess('recipe_sharing'),
    
    // Planning features
    mealPlanning: checkFeatureAccess('meal_planning'),
    advancedGrocery: checkFeatureAccess('advanced_grocery'),
    nutritionTracking: checkFeatureAccess('nutrition_tracking'),
    
    // Customization
    customThemes: checkFeatureAccess('custom_themes'),
    cloudSync: checkFeatureAccess('cloud_sync'),
  };
};