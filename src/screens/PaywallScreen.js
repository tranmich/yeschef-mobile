/**
 * 💰 Paywall Screen
 * Beautiful subscription screen with features and pricing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/IconLibrary';
import RevenueCatService from '../services/RevenueCatServiceMock'; // Using mock for now

const PaywallScreen = ({ visible, onClose, feature = null }) => {
  const [offerings, setOfferings] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    if (visible) {
      loadOfferings();
      loadCustomerInfo();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setIsLoading(true);
    try {
      const offerings = await RevenueCatService.loadOfferings();
      setOfferings(offerings);
      
      // Auto-select the first available product
      if (offerings?.current?.availablePackages?.length > 0) {
        setSelectedProduct(offerings.current.availablePackages[0]);
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerInfo = async () => {
    try {
      const info = await RevenueCatService.loadCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Failed to load customer info:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    setIsPurchasing(true);
    try {
      const result = await RevenueCatService.purchaseProduct(selectedProduct.product.identifier);
      
      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Premium!',
          'Thank you for your purchase! You now have access to all premium features.',
          [{ text: 'Great!', onPress: onClose }]
        );
      } else if (result.cancelled) {
        // User cancelled, do nothing
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Purchase Error', 'Unable to complete purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const result = await RevenueCatService.restorePurchases();
      
      if (result.success) {
        const isPremium = RevenueCatService.isPremiumUser();
        if (isPremium) {
          Alert.alert(
            '✅ Purchases Restored',
            'Your premium subscription has been restored!',
            [{ text: 'Great!', onPress: onClose }]
          );
        } else {
          Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'Unable to restore purchases.');
      }
    } catch (error) {
      Alert.alert('Restore Error', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const premiumFeatures = [
    {
      icon: '🍽️',
      title: 'Unlimited Recipes',
      description: 'Save and access unlimited recipes from any source'
    },
    {
      icon: '🤖',
      title: 'AI Recipe Generation',
      description: 'Generate custom recipes based on your preferences'
    },
    {
      icon: '📋',
      title: 'Smart Meal Planning',
      description: 'AI-powered meal plans for the entire week'
    },
    {
      icon: '🛒',
      title: 'Advanced Grocery Lists',
      description: 'Automatic shopping lists with smart categorization'
    },
    {
      icon: '👥',
      title: 'Recipe Sharing',
      description: 'Share your favorite recipes with the community'
    },
    {
      icon: '🎨',
      title: 'Custom Themes',
      description: 'Personalize your app with beautiful themes'
    },
    {
      icon: '☁️',
      title: 'Cloud Sync',
      description: 'Access your recipes across all your devices'
    },
    {
      icon: '📊',
      title: 'Nutrition Tracking',
      description: 'Track calories and nutritional information'
    }
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ImageBackground
        source={require('../../assets/images/backgrounds/mintbackground.jpg')} // Using existing background
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>🌟 Upgrade to Premium</Text>
              <Text style={styles.heroSubtitle}>
                {feature ? `Unlock ${feature} and all premium features` : 'Unlock all premium features'}
              </Text>
            </View>

            {/* Features Grid */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>What You Get:</Text>
              <View style={styles.featuresGrid}>
                {premiumFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureCard}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Pricing Section */}
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>Choose Your Plan:</Text>
              
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingText}>Loading pricing...</Text>
                </View>
              ) : offerings?.current?.availablePackages?.length > 0 ? (
                <View style={styles.packagesContainer}>
                  {offerings.current.availablePackages.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[
                        styles.packageCard,
                        selectedProduct?.identifier === pkg.identifier && styles.selectedPackage
                      ]}
                      onPress={() => setSelectedProduct(pkg)}
                    >
                      <View style={styles.packageHeader}>
                        <Text style={styles.packageTitle}>
                          {RevenueCatService.formatPeriod(pkg.product)}
                        </Text>
                        {pkg.packageType === 'ANNUAL' && (
                          <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>Best Value!</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.packagePrice}>
                        {RevenueCatService.formatPrice(pkg.product)}
                      </Text>
                      <Text style={styles.packageDescription}>
                        {pkg.product.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Unable to load pricing. Please try again.</Text>
                  <TouchableOpacity onPress={loadOfferings} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[styles.purchaseButton, (isPurchasing || !selectedProduct) && styles.disabledButton]}
              onPress={handlePurchase}
              disabled={isPurchasing || !selectedProduct}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  Start Free Trial
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              Subscription automatically renews unless cancelled 24 hours before renewal.
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  featuresSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
  pricingSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
    marginTop: 12,
  },
  packagesContainer: {
    gap: 12,
  },
  packageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPackage: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  bestValueBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  packagePrice: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    color: '#10b981',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
    opacity: 0.8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  purchaseButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
    opacity: 0.8,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 16,
  },
});

export default PaywallScreen;