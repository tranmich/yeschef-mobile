/**
 * 💰 RevenueCat Service
 * Handles all subscription and purchase logic for YesChef app
 */

import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { getAPIKey, REVENUECAT_CONFIG } from '../config/RevenueCatConfig';
import { validateRevenueCatSetup } from '../utils/RevenueCatValidator';

class RevenueCatService {
  constructor() {
    this.isInitialized = false;
    this.offerings = null;
    this.customerInfo = null;
    this.purchaseListeners = [];
  }

  // 🚀 Initialize RevenueCat
  async initialize(userId = null) {
    try {
      console.log('💰 Initializing RevenueCat...');

      // Validate configuration in development
      if (__DEV__) {
        validateRevenueCatSetup();
      }

      // Configure RevenueCat with your API keys from config
      const apiKey = getAPIKey(Platform.OS);
      
      if (!apiKey || apiKey.includes('test_key')) {
        console.warn('⚠️ Using test API keys - Update RevenueCatConfig.js with real keys when ready');
      }

      await Purchases.configure({
        apiKey: apiKey,
        appUserID: userId,
      });

      // Enable debug logs in development
      if (REVENUECAT_CONFIG.APP_CONFIG.enableDebugLogs) {
        Purchases.setLogLevel('DEBUG');
      }

      // Set up purchase listener
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate.bind(this));

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');

      // Load initial data
      await this.loadOfferings();
      await this.loadCustomerInfo();

      return true;
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      return false;
    }
  }

  // 📦 Load available offerings/products
  async loadOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      this.offerings = offerings;
      
      console.log('📦 Loaded offerings:', {
        current: offerings.current?.identifier,
        all: Object.keys(offerings.all)
      });

      return offerings;
    } catch (error) {
      console.error('❌ Failed to load offerings:', error);
      return null;
    }
  }

  // 👤 Load customer info (subscription status)
  async loadCustomerInfo() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      
      console.log('👤 Customer info loaded:', {
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
        entitlements: Object.keys(customerInfo.entitlements.all)
      });

      return customerInfo;
    } catch (error) {
      console.error('❌ Failed to load customer info:', error);
      return null;
    }
  }

  // 💳 Purchase a product
  async purchaseProduct(productIdentifier) {
    try {
      console.log('💳 Attempting to purchase:', productIdentifier);

      const { customerInfo, productIdentifier: purchasedProductId } = await Purchases.purchaseProduct(productIdentifier);
      
      console.log('✅ Purchase successful:', {
        productId: purchasedProductId,
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions)
      });

      this.customerInfo = customerInfo;
      
      // Notify listeners
      this.notifyPurchaseListeners(customerInfo, true);

      return {
        success: true,
        customerInfo,
        productIdentifier: purchasedProductId
      };
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      
      // Handle specific error cases
      if (error.code === 'PURCHASE_CANCELLED') {
        console.log('ℹ️ Purchase was cancelled by user');
        return { success: false, cancelled: true };
      }
      
      this.notifyPurchaseListeners(null, false, error);
      return { success: false, error: error.message };
    }
  }

  // 🔄 Restore purchases
  async restorePurchases() {
    try {
      console.log('🔄 Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      console.log('✅ Purchases restored:', {
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions)
      });

      return {
        success: true,
        customerInfo
      };
    } catch (error) {
      console.error('❌ Restore purchases failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 🎯 Check if user has specific entitlement
  hasEntitlement(entitlementId) {
    if (!this.customerInfo) return false;
    
    const entitlement = this.customerInfo.entitlements.all[entitlementId];
    return entitlement?.isActive === true;
  }

  // 🏆 Check if user has premium access
  isPremiumUser() {
    return this.hasEntitlement(REVENUECAT_CONFIG.ENTITLEMENTS.premium) || 
           this.hasEntitlement(REVENUECAT_CONFIG.ENTITLEMENTS.pro);
  }

  // 📱 Get current offering
  getCurrentOffering() {
    return this.offerings?.current;
  }

  // 🎁 Get specific offering
  getOffering(identifier) {
    return this.offerings?.all[identifier];
  }

  // 📊 Get subscription status
  getSubscriptionStatus() {
    if (!this.customerInfo) return null;

    const activeSubscriptions = Object.keys(this.customerInfo.activeSubscriptions);
    const entitlements = this.customerInfo.entitlements.all;
    
    return {
      isSubscribed: activeSubscriptions.length > 0,
      activeSubscriptions,
      entitlements: Object.keys(entitlements).reduce((acc, key) => {
        acc[key] = {
          isActive: entitlements[key].isActive,
          willRenew: entitlements[key].willRenew,
          periodType: entitlements[key].periodType,
          latestPurchaseDate: entitlements[key].latestPurchaseDate,
          expirationDate: entitlements[key].expirationDate
        };
        return acc;
      }, {})
    };
  }

  // 👂 Add purchase listener
  addPurchaseListener(listener) {
    this.purchaseListeners.push(listener);
  }

  // 🗑️ Remove purchase listener
  removePurchaseListener(listener) {
    this.purchaseListeners = this.purchaseListeners.filter(l => l !== listener);
  }

  // 📢 Notify purchase listeners
  notifyPurchaseListeners(customerInfo, success, error = null) {
    this.purchaseListeners.forEach(listener => {
      try {
        listener(customerInfo, success, error);
      } catch (err) {
        console.error('❌ Purchase listener error:', err);
      }
    });
  }

  // 🔄 Handle customer info updates
  handleCustomerInfoUpdate(customerInfo) {
    console.log('🔄 Customer info updated:', {
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions)
    });
    
    this.customerInfo = customerInfo;
    this.notifyPurchaseListeners(customerInfo, true);
  }

  // 👤 Set user ID
  async setUserId(userId) {
    try {
      await Purchases.logIn(userId);
      console.log('👤 User ID set:', userId);
      await this.loadCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
    }
  }

  // 🚪 Log out user
  async logOut() {
    try {
      await Purchases.logOut();
      console.log('🚪 User logged out from RevenueCat');
      this.customerInfo = null;
    } catch (error) {
      console.error('❌ Failed to log out:', error);
    }
  }

  // 🎨 Format price for display
  formatPrice(product) {
    if (!product?.priceString) return 'N/A';
    return product.priceString;
  }

  // ⏰ Format subscription period
  formatPeriod(product) {
    if (!product?.subscriptionPeriod) return '';
    
    const period = product.subscriptionPeriod;
    
    if (period.includes('P1M')) return 'Monthly';
    if (period.includes('P1Y')) return 'Yearly';
    if (period.includes('P1W')) return 'Weekly';
    
    return period;
  }

  // 💸 Show paywall alert
  showPaywallAlert(feature = 'this feature') {
    Alert.alert(
      '🌟 Premium Feature',
      `${feature} is available for premium users. Upgrade to unlock all features!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => this.showPaywall() }
      ]
    );
  }

  // 🎯 Show paywall (to be implemented with UI component)
  showPaywall() {
    console.log('🎯 Opening paywall...');
    // This will be connected to a PaywallScreen component
  }
}

// Export singleton instance
export default new RevenueCatService();