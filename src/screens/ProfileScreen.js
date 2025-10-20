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
import ProfileIconCreatorScreen from './ProfileIconCreatorScreen';
import ProfileAvatar from '../components/ProfileAvatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumStatus from '../components/PremiumStatus';
import RecipeDebugger from '../utils/RecipeDebugger';
import { usePremium } from '../contexts/PremiumContext';

export default function ProfileScreen({ navigation, user = null }) {
  // 📱 UI State
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFirstDeleteModal, setShowFirstDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [userProfile, setUserProfile] = useState({ background: 'default', icon: '🍎' });
  const [avatarLoading, setAvatarLoading] = useState(true);

  // 🎯 Static background (matching other screens)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/mintbackground.jpg');

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

  // 🔍 Debug: Track avatar changes
  useEffect(() => {
    console.log('👤 User profile state changed:', userProfile);
  }, [userProfile]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading profile data from API...');
      
      // Load profile data first
      const profileResult = await YesChefAPI.getProfile();
      
      if (profileResult.success) {
        console.log('✅ Profile data loaded:', profileResult.profile);
        
        // Use name field as username since backend username field isn't updating properly
        const profileWithFixedUsername = {
          ...profileResult.profile,
          username: profileResult.profile.name || profileResult.profile.username || 'YesChef User'
        };
        setProfileData(profileWithFixedUsername);
        setEditingUsername(profileWithFixedUsername.username);
        
        // Check if profile includes avatar data
        if (profileResult.profile.avatar) {
          console.log('🎨 Found avatar data in profile:', profileResult.profile.avatar);
          setUserProfile(profileResult.profile.avatar);
          
          // Update local storage with backend data
          await AsyncStorage.setItem('userProfileAvatar', JSON.stringify(profileResult.profile.avatar));
        } else {
          // Load avatar separately if not in profile
          await loadAvatarData();
        }
      } else {
        console.error('❌ Profile load failed:', profileResult.error);
        Alert.alert('Error', profileResult.error || 'Failed to load profile data');
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

  // 🎨 Avatar Save Handler
  const handleAvatarSave = async (avatarData) => {
    try {
      console.log('🎨 Saving avatar data to backend:', avatarData);
      
      // Save to backend API
      const result = await YesChefAPI.saveProfileAvatar(avatarData);
      
      if (result.success) {
        console.log('✅ Avatar saved to backend successfully!');
        
        // Update local state
        setUserProfile(avatarData);
        
        // Also save to AsyncStorage as backup
        await AsyncStorage.setItem('userProfileAvatar', JSON.stringify(avatarData));
        console.log('💾 Avatar also saved to local storage as backup');
        
        Alert.alert('Success', 'Your avatar has been updated and saved!');
      } else {
        console.error('❌ Backend save failed:', result.error);
        
        // Fallback to local storage if backend fails
        await AsyncStorage.setItem('userProfileAvatar', JSON.stringify(avatarData));
        setUserProfile(avatarData);
        
        Alert.alert('Saved Locally', 'Avatar saved locally. It will sync when connection is restored.');
      }
    } catch (error) {
      console.error('❌ Failed to save avatar:', error);
      
      // Fallback to local storage on error
      try {
        await AsyncStorage.setItem('userProfileAvatar', JSON.stringify(avatarData));
        setUserProfile(avatarData);
        Alert.alert('Saved Locally', 'Avatar saved locally due to connection issues.');
      } catch (localError) {
        console.error('❌ Local save also failed:', localError);
        Alert.alert('Error', 'Failed to save avatar. Please try again.');
      }
    }
  };

  // 🔄 Load Avatar Data
  const loadAvatarData = async () => {
    try {
      setAvatarLoading(true);
      
      // First try to load from backend
      try {
        const result = await YesChefAPI.get('/api/profile/avatar');
        if (result.success && result.avatar) {
          console.log('📥 Loaded avatar from backend:', result.avatar);
          setUserProfile(result.avatar);
          
          // Update local storage with backend data
          await AsyncStorage.setItem('userProfileAvatar', JSON.stringify(result.avatar));
          return;
        }
      } catch (backendError) {
        console.warn('⚠️ Backend avatar load failed, trying local storage:', backendError);
      }
      
      // Fallback to local storage
      const savedAvatar = await AsyncStorage.getItem('userProfileAvatar');
      if (savedAvatar) {
        const avatarData = JSON.parse(savedAvatar);
        console.log('📥 Loaded avatar from local storage:', avatarData);
        setUserProfile(avatarData);
      } else {
        console.log('ℹ️ No saved avatar found, using default');
      }
    } catch (error) {
      console.error('❌ Failed to load avatar data:', error);
      // Keep default avatar if loading fails
    } finally {
      setAvatarLoading(false);
    }
  };

  // 🧹 Clear Avatar Data (for debugging/reset)
  const clearAvatarData = async () => {
    try {
      await AsyncStorage.removeItem('userProfileAvatar');
      setUserProfile({ background: 'default', icon: '🍎' });
      console.log('🧹 Avatar data cleared');
      Alert.alert('Debug', 'Avatar data cleared. Default avatar restored.');
    } catch (error) {
      console.error('❌ Failed to clear avatar data:', error);
    }
  };

  // 🔍 Debug: Check what's in storage
  const debugAvatarStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('userProfileAvatar');
      const backendAvatar = await YesChefAPI.get('/api/profile/avatar');
      
      console.log('🔍 Debug - Stored avatar data:', stored);
      console.log('🔍 Debug - Backend avatar data:', backendAvatar);
      
      Alert.alert('Debug Info', `Local: ${stored || 'No data'}\nBackend: ${JSON.stringify(backendAvatar?.avatar || 'No data')}\nCurrent: ${JSON.stringify(userProfile)}`);
    } catch (error) {
      console.error('❌ Debug check failed:', error);
      Alert.alert('Debug Error', error.message);
    }
  };

  //  Debug: Recipe Issues  
  const debugRecipes = async () => {
    try {
      const report = await RecipeDebugger.showDiagnosticAlert();
      
      const summary = [
        `🏗️ Build: ${report.buildType}`,
        `🌐 API: ${report.apiConnection || 'Unknown'}`,
        `🔐 Auth: ${report.authenticated ? 'Yes' : 'No'}`,
        `📝 Recipes: ${report.recipeCount || 0}`,
        `👥 Community: ${report.communityRecipeCount || 0}`,
        `⚠️ Issues: ${report.issues.length}`,
      ].join('\n');

      Alert.alert(
        '🔍 Recipe Diagnostic Report',
        summary,
        [
          { text: 'Copy Report', onPress: () => console.log('Full Report:', report) },
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      Alert.alert('Debug Error', error.message);
    }
  };

  // 🧪 Debug: Toggle Mock Premium Status (for development)
  const { upgradeToPremium, userTier } = usePremium();
  const toggleMockPremium = async () => {
    const result = await upgradeToPremium();
    Alert.alert(
      '🧪 Premium Status',
      `Current tier: ${userTier}\n\n${result.success ? 'Upgraded to premium!' : 'Already premium or error occurred'}`
    );
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
              <ProfileAvatar 
                profile={userProfile}
                size="xlarge"
                onPress={() => setShowAvatarCreator(true)}
                showBorder={true}
                style={styles.profileAvatarStyle}
              />
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={() => setShowAvatarCreator(true)}
              >
                <Icon name="edit" size={16} color="#ffffff" />
              </TouchableOpacity>
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

          {/* 🌟 Premium Status Card */}
          <PremiumStatus style={styles.premiumCard} />

          {/* � Development Debug Section */}
          {__DEV__ && (
            <View style={styles.debugCard}>
              <Text style={styles.cardTitle}>🔧 Development Tools</Text>
              <TouchableOpacity 
                style={styles.debugButton} 
                onPress={debugAvatarStorage}
              >
                <Text style={styles.debugButtonText}>Check Avatar Storage</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.debugButton} 
                onPress={debugRecipes}
              >
                <Text style={styles.debugButtonText}>🔍 Debug Recipe Issues</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.debugButton, { backgroundColor: '#10b981' }]} 
                onPress={toggleMockPremium}
              >
                <Text style={styles.debugButtonText}>Toggle Mock Premium</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* �🗑️ Danger Zone Card */}
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

        {/* 🎨 Profile Avatar Creator Modal */}
        <ProfileIconCreatorScreen
          visible={showAvatarCreator}
          currentProfile={userProfile}
          onClose={() => setShowAvatarCreator(false)}
          onSave={handleAvatarSave}
        />
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
  profileAvatarStyle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
  premiumCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  debugCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  debugButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#ffffff',
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
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
