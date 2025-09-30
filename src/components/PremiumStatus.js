/**
 * 🌟 Premium Status Component
 * Shows premium subscription status and upgrade options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { usePremium } from '../contexts/PremiumContext';
import { Icon } from './IconLibrary';
import PaywallScreen from '../screens/PaywallScreen';

const PremiumStatus = ({ style = {} }) => {
  const { isPremium, subscriptionStatus, isLoading } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  const handleUpgradePress = () => {
    setShowPaywall(true);
  };

  const handleManagePress = () => {
    // TODO: Open subscription management
    console.log('Opening subscription management...');
  };

  if (isPremium) {
    return (
      <View style={[styles.container, styles.premiumContainer, style]}>
        <View style={styles.statusHeader}>
          <Icon name="crown" size={24} color="#f59e0b" />
          <Text style={styles.premiumTitle}>Premium Active</Text>
        </View>
        
        <Text style={styles.premiumSubtitle}>
          You have access to all premium features
        </Text>
        
        {subscriptionStatus?.entitlements && (
          <View style={styles.subscriptionDetails}>
            {Object.entries(subscriptionStatus.entitlements).map(([key, entitlement]) => (
              entitlement.isActive && (
                <View key={key} style={styles.entitlementRow}>
                  <Text style={styles.entitlementText}>
                    {key}: {entitlement.periodType || 'Active'}
                  </Text>
                  {entitlement.expirationDate && (
                    <Text style={styles.expirationText}>
                      Renews: {new Date(entitlement.expirationDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              )
            ))}
          </View>
        )}
        
        <TouchableOpacity style={styles.manageButton} onPress={handleManagePress}>
          <Text style={styles.manageButtonText}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, styles.freeContainer, style]}>
        <View style={styles.statusHeader}>
          <Icon name="star" size={24} color="#6b7280" />
          <Text style={styles.freeTitle}>Free Plan</Text>
        </View>
        
        <Text style={styles.freeSubtitle}>
          Upgrade to unlock all premium features
        </Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Icon name="check" size={16} color="#10b981" />
            <Text style={styles.featureText}>Basic recipes</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="lock" size={16} color="#6b7280" />
            <Text style={[styles.featureText, styles.lockedFeature]}>Unlimited recipes</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="lock" size={16} color="#6b7280" />
            <Text style={[styles.featureText, styles.lockedFeature]}>AI meal planning</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="lock" size={16} color="#6b7280" />
            <Text style={[styles.featureText, styles.lockedFeature]}>Recipe sharing</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
          <Text style={styles.upgradeButtonText}>🌟 Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>

      <PaywallScreen
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  premiumContainer: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  freeContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#92400e',
    marginLeft: 8,
  },
  freeTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#374151',
    marginLeft: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#92400e',
    marginBottom: 12,
  },
  freeSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 12,
  },
  subscriptionDetails: {
    marginBottom: 12,
  },
  entitlementRow: {
    marginBottom: 4,
  },
  entitlementText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#92400e',
    textTransform: 'capitalize',
  },
  expirationText: {
    fontSize: 10,
    fontFamily: 'Nunito-Regular',
    color: '#92400e',
    opacity: 0.7,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginLeft: 8,
  },
  lockedFeature: {
    color: '#9ca3af',
  },
  upgradeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  manageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#92400e',
  },
});

export default PremiumStatus;