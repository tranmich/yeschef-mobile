/**
 * 🌟 Premium Context
 * Manages subscription state and premium features throughout the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import RevenueCatService from '../services/RevenueCatServiceMock'; // Using mock for now
import { isFeaturePremium, getFeatureEntitlement } from '../config/RevenueCatConfig';

const PremiumContext = createContext();

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    initializePremium();
    
    // Listen for purchase updates
    const handlePurchaseUpdate = (customerInfo, success, error) => {
      if (success && customerInfo) {
        updatePremiumStatus(customerInfo);
      }
    };

    RevenueCatService.addPurchaseListener(handlePurchaseUpdate);
    
    return () => {
      RevenueCatService.removePurchaseListener(handlePurchaseUpdate);
    };
  }, []);

  const initializePremium = async () => {
    try {
      setIsLoading(true);
      
      // Initialize RevenueCat
      const initialized = await RevenueCatService.initialize();
      
      if (initialized) {
        // Load customer info
        const customerInfo = await RevenueCatService.loadCustomerInfo();
        updatePremiumStatus(customerInfo);
      }
    } catch (error) {
      console.error('Failed to initialize premium:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePremiumStatus = (customerInfo) => {
    if (customerInfo) {
      setCustomerInfo(customerInfo);
      setIsPremium(RevenueCatService.isPremiumUser());
      setSubscriptionStatus(RevenueCatService.getSubscriptionStatus());
      
      console.log('🌟 Premium status updated:', {
        isPremium: RevenueCatService.isPremiumUser(),
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions)
      });
    }
  };

  const checkFeatureAccess = (feature) => {
    // Check if feature requires premium using config
    if (!isFeaturePremium(feature)) {
      return true; // Feature is free
    }
    
    // Feature requires premium - check entitlement
    const requiredEntitlement = getFeatureEntitlement(feature);
    return isPremium && RevenueCatService.hasEntitlement(requiredEntitlement);
  };

  const showPaywallForFeature = (feature) => {
    // This will be implemented to show the paywall
    console.log('🚪 Showing paywall for feature:', feature);
    return RevenueCatService.showPaywallAlert(feature);
  };

  const restorePurchases = async () => {
    try {
      const result = await RevenueCatService.restorePurchases();
      if (result.success) {
        updatePremiumStatus(result.customerInfo);
      }
      return result;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return { success: false, error: error.message };
    }
  };

  const setUserId = async (userId) => {
    try {
      await RevenueCatService.setUserId(userId);
      const customerInfo = await RevenueCatService.loadCustomerInfo();
      updatePremiumStatus(customerInfo);
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  };

  const logOut = async () => {
    try {
      await RevenueCatService.logOut();
      setIsPremium(false);
      setCustomerInfo(null);
      setSubscriptionStatus(null);
    } catch (error) {
      console.error('Failed to log out from RevenueCat:', error);
    }
  };

  const value = {
    // Status
    isPremium,
    isLoading,
    customerInfo,
    subscriptionStatus,
    
    // Functions
    checkFeatureAccess,
    showPaywallForFeature,
    restorePurchases,
    setUserId,
    logOut,
    
    // Utilities
    refreshStatus: () => initializePremium(),
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};