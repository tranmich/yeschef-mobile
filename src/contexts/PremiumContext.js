/**
 * 🌟 Premium Context
 * Manages subscription state and premium features throughout the app
 * Backend-based tier system (Free vs Premium)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PremiumContext = createContext();

// Tier limits configuration
const TIER_LIMITS = {
  free: {
    maxRecipes: 100,
    maxSpaces: 5,
    canInvite: false,
    canCombineGroceryLists: false,
    canShareMealPlans: false,
    canUseHousehold: false,
    canBeautifyRecipeCards: false,
    importMethods: ['manual', 'url'], // No photo/voice
  },
  premium: {
    maxRecipes: null, // Unlimited
    maxSpaces: null, // Unlimited
    canInvite: true,
    canCombineGroceryLists: true,
    canShareMealPlans: true,
    canUseHousehold: true,
    canBeautifyRecipeCards: true,
    importMethods: ['manual', 'url', 'photo', 'voice'],
  },
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider = ({ children }) => {
  const [userTier, setUserTier] = useState('free'); // 'free' or 'premium'
  const [isLoading, setIsLoading] = useState(true);
  const [tierInfo, setTierInfo] = useState(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [spaceCount, setSpaceCount] = useState(0);

  useEffect(() => {
    initializePremium();
  }, []);

  const initializePremium = async () => {
    try {
      setIsLoading(true);
      
      // Load tier from backend
      const storedTier = await AsyncStorage.getItem('userTier');
      if (storedTier) {
        setUserTier(storedTier);
      }
      
      // Load tier info from backend API
      await fetchTierInfo();
    } catch (error) {
      console.error('Failed to initialize premium:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTierInfo = async () => {
    try {
      // For now, disable tier info fetching since the backend endpoint doesn't exist yet
      // TODO: Implement /api/user/tier endpoint on backend when premium features are ready
      console.log('💡 Tier info fetching disabled - using free tier defaults');
      
      // Set default free tier values
      setUserTier('free');
      setRecipeCount(0);
      setSpaceCount(0);
      setTierInfo({ tier: 'free', recipeCount: 0, spaceCount: 0 });
      
      return;
      
      /* 
      // Future implementation when backend supports tier endpoints:
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch('http://192.168.1.72:5000/api/user/tier', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTier(data.tier || 'free');
        setRecipeCount(data.recipeCount || 0);
        setSpaceCount(data.spaceCount || 0);
        setTierInfo(data);
      }
      */
    } catch (error) {
      console.error('Failed to fetch tier info:', error);
      // Default to free tier on error
      setUserTier('free');
    }
  };

  const isPremium = userTier === 'premium';
  const tierLimits = TIER_LIMITS[userTier];

  const checkFeatureAccess = (feature) => {
    // Check specific feature permissions based on tier
    switch (feature) {
      case 'add_recipe':
        if (tierLimits.maxRecipes === null) return { allowed: true };
        return {
          allowed: recipeCount < tierLimits.maxRecipes,
          limit: tierLimits.maxRecipes,
          current: recipeCount,
          message: `Recipe limit: ${recipeCount}/${tierLimits.maxRecipes}`,
        };
      
      case 'create_space':
        if (tierLimits.maxSpaces === null) return { allowed: true };
        return {
          allowed: spaceCount < tierLimits.maxSpaces,
          limit: tierLimits.maxSpaces,
          current: spaceCount,
          message: `Space limit: ${spaceCount}/${tierLimits.maxSpaces}`,
        };
      
      case 'invite_user':
        return {
          allowed: tierLimits.canInvite,
          message: tierLimits.canInvite ? null : 'Inviting is a premium feature',
        };
      
      case 'combine_grocery_lists':
        return {
          allowed: tierLimits.canCombineGroceryLists,
          message: tierLimits.canCombineGroceryLists ? null : 'Combining grocery lists is premium',
        };
      
      case 'share_meal_plans':
        return {
          allowed: tierLimits.canShareMealPlans,
          message: tierLimits.canShareMealPlans ? null : 'Sharing meal plans is premium',
        };
      
      case 'use_household':
        return {
          allowed: tierLimits.canUseHousehold,
          message: tierLimits.canUseHousehold ? null : 'Household features are premium',
        };
      
      case 'beautify_recipe_cards':
        return {
          allowed: tierLimits.canBeautifyRecipeCards,
          message: tierLimits.canBeautifyRecipeCards ? null : 'Recipe card customization is premium',
        };
      
      default:
        return { allowed: true }; // Unknown features allowed by default
    }
  };

  const canUseImportMethod = (method) => {
    return tierLimits.importMethods.includes(method);
  };

  const showUpgradePrompt = (reason) => {
    // This will trigger the upgrade/paywall UI
    console.log('🚪 Showing upgrade prompt for:', reason);
    // TODO: Navigate to upgrade screen or show modal
    return { upgradeRequired: true, reason };
  };

  const upgradeToPremium = async () => {
    try {
      // TODO: Implement payment flow (Stripe, etc.)
      // For now, just update local state
      setUserTier('premium');
      await AsyncStorage.setItem('userTier', 'premium');
      await fetchTierInfo();
      return { success: true };
    } catch (error) {
      console.error('Failed to upgrade:', error);
      return { success: false, error: error.message };
    }
  };

  const setUserId = async (userId) => {
    try {
      await AsyncStorage.setItem('userId', userId);
      await fetchTierInfo();
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  };

  const logOut = async () => {
    try {
      await AsyncStorage.removeItem('userTier');
      await AsyncStorage.removeItem('userId');
      setUserTier('free');
      setTierInfo(null);
      setRecipeCount(0);
      setSpaceCount(0);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const value = {
    // Status
    isPremium,
    userTier,
    tierLimits,
    isLoading,
    tierInfo,
    recipeCount,
    spaceCount,
    
    // Functions
    checkFeatureAccess,
    canUseImportMethod,
    showUpgradePrompt,
    upgradeToPremium,
    setUserId,
    logOut,
    
    // Utilities
    refreshStatus: () => fetchTierInfo(),
    TIER_LIMITS, // Export for reference
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};