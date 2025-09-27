import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '../components/IconLibrary';
import YesChefAPI from '../services/YesChefAPI';

export default function ProfileScreen({ navigation, user = null }) {
  // 📱 UI State
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFirstDeleteModal, setShowFirstDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // 🎯 Static background (matching other screens)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_modern.jpg');

  // 🔄 Load Profile Data on mount and when screen focuses
  useEffect(() => {
    loadProfileData();
  }, []);

  // 🔄 Reload stats when screen comes into focus (real-time updates)
  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading profile data from API...');
      const result = await YesChefAPI.getProfile();
      
      if (result.success) {
        console.log('✅ Profile data loaded:', result.profile);
        // Use name field as username since backend username field isn't updating properly
        const profileWithFixedUsername = {
          ...result.profile,
          username: result.profile.name || result.profile.username || 'YesChef User'
        };
        setProfileData(profileWithFixedUsername);
        setEditingUsername(profileWithFixedUsername.username);
      } else {
        console.error('❌ Profile load failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to load profile data');
        // No fallback - user must have valid API connection for real-time stats
        return;
      }
    } catch (error) {
      console.error('❌ Profile load error:', error);
      Alert.alert('Error', 'Network error - check your connection');
      // No mock data - require real API connection for authentic stats
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ Handle Username Edit
  const handleUsernameEdit = () => {
    setIsEditingUsername(true);
  };

  const handleUsernameSave = async () => {
    if (!editingUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    
    try {
      console.log('🔄 Starting username update process...');
      console.log('📝 Current profileData:', profileData);
      console.log('� New username:', editingUsername.trim());
      
      // Test: First let's see what the current profile data looks like
      console.log('🔍 Testing current API getProfile response...');
      const currentProfile = await YesChefAPI.getProfile();
      console.log('📥 Current profile from API:', currentProfile);
      
      console.log('📤 Sending update to API...');
      const updateData = {
        name: editingUsername.trim() // Only update name field since username isn't working in backend
      };
      console.log('📤 Update payload:', updateData);
      
      const result = await YesChefAPI.updateProfile(updateData);
      console.log('📥 Update API Response:', result);
      
      if (result.success) {
        console.log('✅ Username updated successfully in API');
        
        // Test: Check what the API returns immediately after update
        console.log('🔍 Fetching profile again to verify update...');
        const verifyProfile = await YesChefAPI.getProfile();
        console.log('📥 Profile after update:', verifyProfile);
        
        // Update local state - use the name field as the display username
        setProfileData(prev => ({ 
          ...prev, 
          username: verifyProfile.profile?.name || editingUsername.trim(),
          name: verifyProfile.profile?.name || editingUsername.trim()
        }));
        setIsEditingUsername(false);
        Alert.alert(
          'Success', 
          'Username updated successfully!\n\nYour recipes and posts are being updated with the new username.',
          [{ text: 'OK' }]
        );
        
        console.log('💾 Updated local profileData with verified username');
      } else {
        console.error('❌ Username update failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to update username');
      }
    } catch (error) {
      console.error('❌ Username update error:', error);
      Alert.alert('Error', 'Network error - check your connection');
    }
  };

  const handleUsernameCancel = () => {
    setEditingUsername(profileData?.username || '');
    setIsEditingUsername(false);
  };

  //  Handle Back Navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // 🗑️ Handle Account Deletion
  const handleDeleteAccount = () => {
    setShowFirstDeleteModal(true);
  };

  const handleFirstDeleteModalCancel = () => {
    setShowFirstDeleteModal(false);
  };

  const handleFirstDeleteModalConfirm = () => {
    setShowFirstDeleteModal(false);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteModalConfirm = () => {
    if (deleteConfirmText === 'DELETE') {
      setShowDeleteModal(false);
      executeAccountDeletion();
    } else {
      Alert.alert('Verification Failed', 'You must type "DELETE" exactly to confirm account deletion.');
    }
  };

  const handleDeleteModalCancel = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  const executeAccountDeletion = async () => {
    try {
      setIsLoading(true);
      
      const result = await YesChefAPI.deleteAccount();
      
      if (result.success) {
        Alert.alert(
          'Account Deleted',
          'Your account has been permanently deleted. Thank you for using YesChef!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear auth data and navigate to login
                YesChefAPI.clearAuthData();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }]
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('❌ Account deletion error:', error);
      Alert.alert('Error', 'Network error - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.overlay} />
        <View style={styles.topStatusBarOverlay} />
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} animated={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading Profile...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay} />
      
      {/* 🤍 White Opaque Layer for Better Readability */}
      <View style={styles.whiteOverlay} />
      
      {/* 📱 Top Status Bar Background (Clean Header for Phone Status) */}
      <View style={styles.topStatusBarOverlay} />
      
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent={true}
          animated={true}
        />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 🔙 Header with Back Button Only */}
          <View style={styles.headerCard}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Icon name="chevron-left" size={24} color="#374151" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* 👤 Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.profilePhotoContainer}>
              {profileData?.profilePhotoUrl ? (
                <Image source={{ uri: profileData.profilePhotoUrl }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Text style={styles.profilePhotoInitials}>
                    {profileData?.username?.substring(0, 2).toUpperCase() || 'YC'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.usernameContainer}>
              {isEditingUsername ? (
                <View style={styles.usernameEditContainer}>
                  <TextInput
                    style={styles.usernameInput}
                    value={editingUsername}
                    onChangeText={setEditingUsername}
                    placeholder="Enter username"
                    autoFocus
                    selectTextOnFocus
                  />
                  <View style={styles.usernameEditButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleUsernameCancel}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleUsernameSave}>
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.usernameDisplay} onPress={handleUsernameEdit}>
                  <Text style={styles.username}>{profileData?.username}</Text>
                  <Icon name="edit" size={16} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 📋 Personal Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileData?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date Joined</Text>
              <Text style={styles.infoValue}>
                {profileData?.created_at 
                  ? new Date(profileData.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })
                  : 'September 2025'
                }
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <View style={styles.accountTypeContainer}>
                <Text style={styles.accountTypeText}>Free Member</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 📊 Your Culinary Journey Card */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Your Culinary Journey</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData?.stats?.recipesSaved || 0}</Text>
                <Text style={styles.statLabel}>Recipes Saved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData?.stats?.recipesShared || 0}</Text>
                <Text style={styles.statLabel}>Recipes Shared</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData?.stats?.groceryListsCreated || 0}</Text>
                <Text style={styles.statLabel}>Grocery Lists</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData?.stats?.mealPlansCreated || 0}</Text>
                <Text style={styles.statLabel}>Meal Plans</Text>
              </View>
            </View>
          </View>

          {/* 💳 Subscription Management Card */}
          <View style={styles.subscriptionCard}>
            <Text style={styles.cardTitle}>Subscription</Text>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionStatus}>Free Plan</Text>
              <Text style={styles.subscriptionDescription}>Enjoy basic features with limited access</Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              <Icon name="star" size={16} color="#f59e0b" />
            </TouchableOpacity>
          </View>

          {/* 🗑️ Danger Zone Card */}
          <View style={styles.dangerZoneCard}>
            <Text style={styles.dangerZoneTitle}>Caution: Hot Surface</Text>
            <Text style={styles.dangerZoneDescription}>
              Once you delete your account, there is no going back. Please be certain.
            </Text>
            <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
              <Icon name="delete" size={16} color="#ffffff" />
              <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          {/* Spacing at bottom */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* 🗑️ First Delete Account Confirmation Modal */}
        <Modal
          visible={showFirstDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleFirstDeleteModalCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.firstDeleteModal}>
              <Text style={styles.firstDeleteModalTitle}>Delete Account</Text>
              <Text style={styles.firstDeleteModalDescription}>
                Are you sure you want to permanently delete your account?
              </Text>
              
              <View style={styles.warningSection}>
                <Text style={styles.warningTitle}>⚠️ This action cannot be undone and will:</Text>
                <View style={styles.warningList}>
                  <Text style={styles.warningItem}>• Delete all your recipes and data</Text>
                  <Text style={styles.warningItem}>• Remove your grocery lists and meal plans</Text>
                  <Text style={styles.warningItem}>• Permanently close your account</Text>
                </View>
              </View>
              
              <View style={styles.firstDeleteModalButtons}>
                <TouchableOpacity 
                  style={styles.firstDeleteModalCancelButton} 
                  onPress={handleFirstDeleteModalCancel}
                >
                  <Text style={styles.firstDeleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.firstDeleteModalContinueButton} 
                  onPress={handleFirstDeleteModalConfirm}
                >
                  <Text style={styles.firstDeleteModalContinueText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 🗑️ Delete Account Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleDeleteModalCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModal}>
              <Text style={styles.deleteModalTitle}>Final Confirmation</Text>
              <Text style={styles.deleteModalDescription}>
                Type "DELETE" exactly to permanently delete your account:
              </Text>
              
              <TextInput
                style={styles.deleteModalInput}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type DELETE here"
                autoFocus={true}
                autoCapitalize="characters"
              />
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity 
                  style={styles.deleteModalCancelButton} 
                  onPress={handleDeleteModalCancel}
                >
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.deleteModalConfirmButton,
                    deleteConfirmText === 'DELETE' ? {} : styles.deleteModalConfirmButtonDisabled
                  ]} 
                  onPress={handleDeleteModalConfirm}
                  disabled={deleteConfirmText !== 'DELETE'}
                >
                  <Text style={[
                    styles.deleteModalConfirmText,
                    deleteConfirmText === 'DELETE' ? {} : styles.deleteModalConfirmTextDisabled
                  ]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 2,
  },
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginTop: 12,
  },
  
  // Header Styles
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
  },

  // Profile Header Styles
  profileHeaderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoInitials: {
    fontSize: 36,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
  },
  photoEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#374151',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  usernameContainer: {
    width: '100%',
    alignItems: 'center',
  },
  usernameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  username: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    marginRight: 8,
  },
  usernameEditContainer: {
    width: '100%',
    alignItems: 'center',
  },
  usernameInput: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  usernameEditButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
  },

  // Card Styles
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    marginBottom: 16,
  },

  // Info Card Styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#111827',
  },
  accountTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#111827',
    marginRight: 8,
  },
  freeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  freeBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-ExtraBold',
    color: '#166534',
    letterSpacing: 0.5,
  },

  // Stats Card Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },

  // Subscription Card Styles
  subscriptionInfo: {
    marginBottom: 16,
  },
  subscriptionStatus: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  upgradeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
  },

  // Danger Zone Card Styles
  dangerZoneCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#fecaca',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#dc2626',
    marginBottom: 8,
  },
  dangerZoneDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    gap: 8,
  },
  deleteAccountButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
  },

  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  firstDeleteModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  firstDeleteModalTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  firstDeleteModalDescription: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 26,
  },
  warningSection: {
    backgroundColor: 'rgba(254, 202, 202, 0.3)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningList: {
    paddingLeft: 8,
  },
  warningItem: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 4,
  },
  firstDeleteModalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  firstDeleteModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstDeleteModalCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#374151',
    textAlign: 'center',
  },
  firstDeleteModalContinueButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  firstDeleteModalContinueText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
  },
  deleteModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteModalTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  deleteModalDescription: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  deleteModalInput: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#111827',
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 28,
    textAlign: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#374151',
    textAlign: 'center',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteModalConfirmButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
  },
  deleteModalConfirmTextDisabled: {
    color: '#9ca3af',
  },

  bottomSpacing: {
    height: 40,
  },
});
