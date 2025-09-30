/**
 * 🔍 RevenueCat Configuration Validator
 * Helps validate your RevenueCat setup is correct
 */

import { Platform, Alert } from 'react-native';
import { REVENUECAT_CONFIG } from '../config/RevenueCatConfig';

export class RevenueCatValidator {
  
  // 🔍 Validate API key format
  static validateAPIKey(apiKey, platform) {
    const expectedPrefix = platform === 'ios' ? 'appl_' : 'goog_';
    
    if (!apiKey) {
      return { valid: false, error: `Missing ${platform} API key` };
    }
    
    if (apiKey.includes('test_key')) {
      return { valid: false, error: `Using test API key - replace with real key from RevenueCat` };
    }
    
    if (!apiKey.startsWith(expectedPrefix)) {
      return { valid: false, error: `${platform} API key should start with '${expectedPrefix}'` };
    }
    
    if (apiKey.length < 20) {
      return { valid: false, error: `API key seems too short - check RevenueCat dashboard` };
    }
    
    return { valid: true };
  }
  
  // 🧪 Run full configuration validation
  static validateConfiguration() {
    const issues = [];
    
    // In mock mode, just show that we're in development
    issues.push('Using RevenueCat mock service - switch to real service for production');
    
    // Check API keys (still useful for when switching to real service)
    const iosKeyCheck = this.validateAPIKey(REVENUECAT_CONFIG.API_KEYS.ios, 'ios');
    const androidKeyCheck = this.validateAPIKey(REVENUECAT_CONFIG.API_KEYS.android, 'android');
    
    if (!iosKeyCheck.valid) issues.push(`iOS: ${iosKeyCheck.error}`);
    if (!androidKeyCheck.valid) issues.push(`Android: ${androidKeyCheck.error}`);
    
    // Check product IDs
    if (!REVENUECAT_CONFIG.PRODUCTS.monthly) {
      issues.push('Missing monthly product ID');
    }
    if (!REVENUECAT_CONFIG.PRODUCTS.yearly) {
      issues.push('Missing yearly product ID');
    }
    
    // Check bundle IDs
    if (REVENUECAT_CONFIG.APP_CONFIG.bundleId.ios.includes('yeschef')) {
      issues.push('Update iOS Bundle ID to your actual Bundle ID');
    }
    if (REVENUECAT_CONFIG.APP_CONFIG.bundleId.android.includes('yeschef')) {
      issues.push('Update Android Package Name to your actual Package Name');
    }
    
    return {
      valid: issues.length <= 1, // Only mock service warning is okay
      issues,
      readyForProduction: issues.length === 1 && issues[0].includes('mock service')
    };
  }
  
  // 🚨 Show validation results to user
  static showValidationAlert() {
    const validation = this.validateConfiguration();
    
    if (validation.valid) {
      Alert.alert(
        '✅ RevenueCat Ready!',
        'Your RevenueCat configuration looks good and ready for production!',
        [{ text: 'Great!', style: 'default' }]
      );
    } else {
      const issuesList = validation.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n');
      
      Alert.alert(
        '⚠️ Configuration Issues',
        `Found ${validation.issues.length} issue(s):\n\n${issuesList}\n\nCheck REVENUECAT_SETUP_GUIDE.md for help.`,
        [{ text: 'I\'ll Fix These', style: 'default' }]
      );
    }
    
    return validation;
  }
  
  // 📊 Get configuration summary
  static getConfigSummary() {
    const currentPlatform = Platform.OS;
    const currentAPIKey = REVENUECAT_CONFIG.API_KEYS[currentPlatform];
    
    return {
      platform: currentPlatform,
      apiKey: currentAPIKey ? `${currentAPIKey.substring(0, 10)}...` : 'Not set',
      products: Object.keys(REVENUECAT_CONFIG.PRODUCTS),
      entitlements: Object.keys(REVENUECAT_CONFIG.ENTITLEMENTS),
      features: Object.keys(REVENUECAT_CONFIG.FEATURES),
      bundleId: REVENUECAT_CONFIG.APP_CONFIG.bundleId[currentPlatform],
      isConfigured: !currentAPIKey?.includes('test_key')
    };
  }
}

// 🎯 Quick validation function for development
export const validateRevenueCatSetup = () => {
  if (__DEV__) {
    console.log('🔍 RevenueCat Configuration Check:');
    console.log(RevenueCatValidator.getConfigSummary());
    
    const validation = RevenueCatValidator.validateConfiguration();
    if (!validation.valid) {
      console.warn('⚠️ RevenueCat Configuration Issues:', validation.issues);
    } else {
      console.log('✅ RevenueCat configuration looks good!');
    }
    
    return validation;
  }
};

export default RevenueCatValidator;