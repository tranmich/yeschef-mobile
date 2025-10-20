/**
 * 💰 Paywall Screen
 * Beautiful subscription screen with features and pricing
 * Backend-based premium tier system
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
import { usePremium } from '../contexts/PremiumContext';

// Pricing plans
const PRICING_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    priceValue: 4.99,
    billingPeriod: 'monthly',
  },
  {
    id: 'yearly',
    name: 'Annual',
    price: '$49',
    period: '/year',
    priceValue: 49,
    billingPeriod: 'yearly',
    savings: 'Save 17%',
    popular: true,
  },
];

const PaywallScreen = ({ visible, onClose, feature = null }) => {
  const { upgradeToPremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState(PRICING_PLANS[1]); // Default to yearly
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    setIsPurchasing(true);
    try {
      // TODO: Implement Stripe payment flow here
      // For now, simulate upgrade (development only)
      
      Alert.alert(
        '🚧 Payment Coming Soon',
        `Stripe integration will be added here. Selected plan: ${selectedPlan.name} (${selectedPlan.price}${selectedPlan.period})`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Upgrade (Dev Only)',
            onPress: async () => {
              const result = await upgradeToPremium();
              if (result.success) {
                Alert.alert(
                  '🎉 Welcome to Premium!',
                  'You now have access to all premium features.',
                  [{ text: 'Great!', onPress: onClose }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to process payment. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      '🔄 Restore Purchases',
      'Stripe subscription restoration will be added here.',
      [{ text: 'OK' }]
    );
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
              
              {/* Pricing Plans */}
              <View style={styles.packagesContainer}>
                {PRICING_PLANS.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.packageCard,
                      selectedPlan?.id === plan.id && styles.selectedPackage
                    ]}
                    onPress={() => setSelectedPlan(plan)}
                  >
                    <View style={styles.packageHeader}>
                      <Text style={styles.packageTitle}>{plan.name}</Text>
                      {plan.popular && (
                        <View style={styles.bestValueBadge}>
                          <Text style={styles.bestValueText}>Best Value!</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.packagePrice}>
                      {plan.price}
                      <Text style={styles.packagePeriod}>{plan.period}</Text>
                    </Text>
                    {plan.savings && (
                      <Text style={styles.packageSavings}>{plan.savings}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[styles.purchaseButton, isPurchasing && styles.disabledButton]}
              onPress={handlePurchase}
              disabled={isPurchasing}
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