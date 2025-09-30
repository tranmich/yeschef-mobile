/**
 * 💰 RevenueCat Service - Expo Compatible Version
 * Temporarily disabled until proper Expo configuration
 */

import { Platform, Alert } from 'react-native';

class RevenueCatService {
  constructor() {
    this.isInitialized = false;
    this.offerings = null;
    this.customerInfo = null;
    this.purchaseListeners = [];
    this.mockPremiumStatus = false; // For development testing
  }

  // 🚀 Initialize RevenueCat (Mock for now)
  async initialize(userId = null) {
    try {
      console.log('💰 Initializing RevenueCat (Mock Mode)...');
      console.warn('⚠️ RevenueCat in mock mode - add expo plugin when ready for production');
      
      this.isInitialized = true;
      console.log('✅ RevenueCat mock initialized');

      return true;
    } catch (error) {
      console.error('❌ RevenueCat mock initialization failed:', error);
      return false;
    }
  }

  // 📦 Load available offerings/products (Mock)
  async loadOfferings() {
    try {
      const mockOfferings = {
        current: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: 'monthly',
              packageType: 'MONTHLY',
              product: {
                identifier: 'yeschef_premium_monthly',
                title: 'YesChef Premium Monthly',
                priceString: '$4.99',
                subscriptionPeriod: 'P1M'
              }
            },
            {
              identifier: 'yearly',
              packageType: 'ANNUAL',
              product: {
                identifier: 'yeschef_premium_yearly',
                title: 'YesChef Premium Yearly',
                priceString: '$39.99',
                subscriptionPeriod: 'P1Y'
              }
            }
          ]
        },
        all: {}
      };
      
      this.offerings = mockOfferings;
      console.log('📦 Loaded mock offerings');
      return mockOfferings;
    } catch (error) {
      console.error('❌ Failed to load mock offerings:', error);
      return null;
    }
  }

  // 👤 Load customer info (Mock)
  async loadCustomerInfo() {
    try {
      const mockCustomerInfo = {
        activeSubscriptions: this.mockPremiumStatus ? ['premium'] : [],
        entitlements: {
          all: {
            premium: {
              isActive: this.mockPremiumStatus,
              willRenew: this.mockPremiumStatus,
              periodType: 'NORMAL',
              latestPurchaseDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        }
      };
      
      this.customerInfo = mockCustomerInfo;
      console.log('👤 Loaded mock customer info');
      return mockCustomerInfo;
    } catch (error) {
      console.error('❌ Failed to load mock customer info:', error);
      return null;
    }
  }

  // 💳 Purchase a product (Mock)
  async purchaseProduct(productIdentifier) {
    try {
      console.log('💳 Mock purchase for:', productIdentifier);
      
      // Simulate purchase success
      this.mockPremiumStatus = true;
      const customerInfo = await this.loadCustomerInfo();
      
      Alert.alert(
        '🧪 Mock Purchase',
        `This is a mock purchase of ${productIdentifier}. In production, this would be a real purchase.`,
        [{ text: 'OK' }]
      );
      
      this.notifyPurchaseListeners(customerInfo, true);

      return {
        success: true,
        customerInfo,
        productIdentifier
      };
    } catch (error) {
      console.error('❌ Mock purchase failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔄 Restore purchases (Mock)
  async restorePurchases() {
    try {
      console.log('🔄 Mock restore purchases...');
      
      const customerInfo = await this.loadCustomerInfo();
      
      return {
        success: true,
        customerInfo
      };
    } catch (error) {
      console.error('❌ Mock restore failed:', error);
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
    return this.hasEntitlement('premium');
  }

  // 📱 Get current offering
  getCurrentOffering() {
    return this.offerings?.current;
  }

  // 📊 Get subscription status
  getSubscriptionStatus() {
    if (!this.customerInfo) return null;

    const activeSubscriptions = Object.keys(this.customerInfo.activeSubscriptions || {});
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

  // 👤 Set user ID (Mock)
  async setUserId(userId) {
    try {
      console.log('👤 Mock set user ID:', userId);
      await this.loadCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to set mock user ID:', error);
    }
  }

  // 🚪 Log out user (Mock)
  async logOut() {
    try {
      console.log('🚪 Mock user logout');
      this.customerInfo = null;
      this.mockPremiumStatus = false;
    } catch (error) {
      console.error('❌ Failed to mock logout:', error);
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
      `${feature} is available for premium users. This is a mock paywall - configure RevenueCat for production.`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Mock Upgrade', 
          onPress: () => {
            this.mockPremiumStatus = true;
            Alert.alert('🧪 Mock Upgrade', 'You now have mock premium access!');
          }
        }
      ]
    );
  }

  // 🧪 Development helper - toggle premium status
  toggleMockPremium() {
    this.mockPremiumStatus = !this.mockPremiumStatus;
    this.loadCustomerInfo();
    console.log('🧪 Mock premium toggled:', this.mockPremiumStatus);
    return this.mockPremiumStatus;
  }
}

// Export singleton instance
export default new RevenueCatService();