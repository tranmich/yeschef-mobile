import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/IconLibrary';
import YesChefAPI from '../services/YesChefAPI';

export default function ProfileScreen({ navigation, user = null }) {
  // 📱 UI State
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');

  // 🎯 Static background (matching other screens)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_modern.jpg');

  // 🔄 Load Profile Data
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading profile data from API...');
      const result = await YesChefAPI.getProfile();
      
      if (result.success) {
        console.log('✅ Profile data loaded:', result.profile);
        setProfileData(result.profile);
        setEditingUsername(result.profile.username);
      } else {
        console.error('❌ Profile load failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to load profile data');
        
        // Fallback to mock data if API fails
        const mockProfile = {
          username: user?.email ? user.email.split('@')[0] + 'Chef' : 'YesChef User',
          firstName: 'Not Set',
          lastName: 'Not Set',
          email: user?.email || 'user@example.com',
          cookingLevel: 'Beginner',
          householdSize: 2,
          measurementUnits: 'Imperial',
          profilePhotoUrl: null,
          stats: {
            recipesSaved: 0,
            recipesShared: 0,
            groceryListsCreated: 0,
            friendsCount: 0
          }
        };
        setProfileData(mockProfile);
        setEditingUsername(mockProfile.username);
      }
    } catch (error) {
      console.error('❌ Profile load error:', error);
      Alert.alert('Error', 'Network error - check your connection');
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
      console.log('🔄 Updating username to:', editingUsername.trim());
      
      // For now, we'll update the name field since username doesn't exist in DB yet
      const result = await YesChefAPI.updateProfile({
        name: editingUsername.trim()
      });
      
      if (result.success) {
        console.log('✅ Username updated successfully');
        setProfileData(prev => ({ ...prev, username: editingUsername.trim() }));
        setIsEditingUsername(false);
        Alert.alert('Success', 'Username updated successfully!');
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

  // 📸 Handle Profile Photo
  const handleProfilePhotoPress = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => console.log('Take Photo') },
        { text: 'Choose from Gallery', onPress: () => console.log('Choose from Gallery') }
      ]
    );
  };

  // 🔙 Handle Back Navigation
  const handleBack = () => {
    navigation.goBack();
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
          {/* 🔙 Header with Back Button */}
          <View style={styles.headerCard}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Icon name="chevron-left" size={24} color="#374151" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>

          {/* 👤 Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <TouchableOpacity style={styles.profilePhotoContainer} onPress={handleProfilePhotoPress}>
              {profileData?.profilePhotoUrl ? (
                <Image source={{ uri: profileData.profilePhotoUrl }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Text style={styles.profilePhotoInitials}>
                    {profileData?.username?.substring(0, 2).toUpperCase() || 'YC'}
                  </Text>
                </View>
              )}
              <View style={styles.photoEditIcon}>
                <Icon name="camera" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
            
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
              <Text style={styles.infoLabel}>First Name</Text>
              <Text style={styles.infoValue}>{profileData?.firstName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Name</Text>
              <Text style={styles.infoValue}>{profileData?.lastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileData?.email}</Text>
            </View>
            <TouchableOpacity style={styles.editInfoButton}>
              <Text style={styles.editInfoButtonText}>Edit Information</Text>
              <Icon name="chevron-right" size={16} color="#6b7280" />
            </TouchableOpacity>
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
                <Text style={styles.statNumber}>{profileData?.stats?.friendsCount || 0}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
            </View>
          </View>

          {/* 🍳 Cooking Preferences Card */}
          <View style={styles.preferencesCard}>
            <Text style={styles.cardTitle}>Cooking Preferences</Text>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Cooking Level</Text>
              <Text style={styles.preferenceValue}>{profileData?.cookingLevel}</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Household Size</Text>
              <Text style={styles.preferenceValue}>{profileData?.householdSize} people</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Measurement Units</Text>
              <Text style={styles.preferenceValue}>{profileData?.measurementUnits}</Text>
            </View>
            <TouchableOpacity style={styles.editPreferencesButton}>
              <Text style={styles.editPreferencesButtonText}>Edit Preferences</Text>
              <Icon name="chevron-right" size={16} color="#6b7280" />
            </TouchableOpacity>
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

          {/* Spacing at bottom */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  preferencesCard: {
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
  editInfoButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 12,
  },
  editInfoButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#10b981',
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

  // Preferences Card Styles
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  preferenceLabel: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  preferenceValue: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#111827',
  },
  editPreferencesButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 12,
  },
  editPreferencesButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#10b981',
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

  bottomSpacing: {
    height: 40,
  },
});
