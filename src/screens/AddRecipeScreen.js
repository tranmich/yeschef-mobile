/**
 * Add Recipe Screen
 * Central hub for adding recipes via different methods
 * 
 * Methods:
 * - URL Import (YouTube, websites)
 * - Voice Recording (family recipes)
 * - Camera Import (coming soon)
 * 
 * Created: October 6, 2025
 * Phase 2: Navigation Polish
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import YesChefAPI from '../services/YesChefAPI';

const AddRecipeScreen = ({ navigation }) => {
  // URL Import state
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnimation = useRef(new Animated.Value(0)).current;

  // Background
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/mintbackground.jpg');

  // Reset URL input when screen comes into focus (e.g., after saving a recipe or returning from collection)
  useFocusEffect(
    React.useCallback(() => {
      // Clear any previous import state when returning to this screen
      setImportUrl('');
      setIsImporting(false);
    }, [])
  );

  // Show toast notification
  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    
    // Gentle fade in
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 2.5 seconds
    setTimeout(() => {
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowToast(false);
      });
    }, 2500);
  };

  const importRecipeFromUrl = async () => {
    if (!importUrl.trim()) {
      Alert.alert('URL Required', 'Please enter a recipe URL to import.');
      return;
    }

    // Prevent double-tap by checking if already importing
    if (isImporting) {
      console.log('⚠️ Already importing, ignoring duplicate tap');
      return;
    }

    setIsImporting(true);
    showToastNotification('Processing recipe... 🍳');

    try {
      const result = await YesChefAPI.importRecipe(importUrl.trim());
      
      if (result.success) {
        showToastNotification('Recipe imported successfully! ✅');
        
        // Navigate to review screen after brief delay to show success toast
        setTimeout(() => {
          navigation.navigate('RecipeImportReview', {
            importResult: result
          });
        }, 500);
        
        // Clear URL after successful import
        setImportUrl('');
      } else {
        showToastNotification('Import failed ❌');
        setTimeout(() => {
          Alert.alert('Import Failed', result.error || 'Failed to import recipe.');
        }, 500);
      }
    } catch (error) {
      console.error('Import error:', error);
      showToastNotification('Network error ❌');
      setTimeout(() => {
        Alert.alert('Error', 'An error occurred while importing the recipe.');
      }, 500);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ImageBackground
      source={SELECTED_BACKGROUND}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
          animated={true}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>➕ Add Recipe</Text>
          <Text style={styles.headerSubtitle}>Choose how you'd like to add your recipe</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* URL Import Card - First */}
          <View style={[styles.methodCard, styles.urlCard]}>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>🔗 Import from URL</Text>
              <Text style={styles.methodDescription}>
                Paste a link from YouTube or any recipe website.
              </Text>
              
              <View style={styles.urlInputContainer}>
                <TextInput
                  style={styles.urlInput}
                  value={importUrl}
                  onChangeText={setImportUrl}
                  placeholder="Paste recipe URL here..."
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity
                  style={[styles.importButton, isImporting && styles.importButtonDisabled]}
                  onPress={importRecipeFromUrl}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.importButtonText}>Import</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Voice Recording Card - Second */}
          <TouchableOpacity
            style={[styles.methodCard, styles.voiceCard]}
            onPress={() => navigation.navigate('VoiceRecipeRecorder')}
            activeOpacity={0.8}
          >
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>🎤 Record Family Recipe</Text>
              <Text style={styles.methodDescription}>
                Preserve family recipes through voice recording.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#dc2626" style={styles.methodArrow} />
          </TouchableOpacity>

          {/* Camera Import Card (Coming Soon) - Third */}
          <TouchableOpacity
            style={[styles.methodCard, styles.cameraCard]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CameraRecipeScanner')}
          >
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>📷 Scan Recipe Card</Text>
              <Text style={styles.methodDescription}>
                Take a photo of recipe cards or cookbook pages.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#6366f1" style={styles.methodArrow} />
          </TouchableOpacity>
        </ScrollView>
        
        {/* Toast Notification */}
        {showToast && (
          <Animated.View 
            style={[
              styles.toast,
              {
                opacity: toastAnimation,
                transform: [{
                  translateY: toastAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              }
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight + 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'Nunito-ExtraBold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Nunito-Regular',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
  },
  voiceCard: {
    borderColor: '#dc2626',
  },
  urlCard: {
    borderColor: '#28a745',
  },
  cameraCard: {
    borderColor: '#6366f1',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'Nunito-ExtraBold',
  },
  methodDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: 'Nunito-Regular',
  },
  methodArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  urlInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1f2937',
    fontFamily: 'Nunito-Regular',
  },
  importButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    marginLeft: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  importButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
  },
  
  // Toast Notification Styles
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastText: {
    backgroundColor: '#e6fffa',
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    textAlign: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    fontFamily: 'Nunito-Regular',
  },
});

export default AddRecipeScreen;
