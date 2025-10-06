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

import React, { useState } from 'react';
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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YesChefAPI from '../services/YesChefAPI';

const AddRecipeScreen = ({ navigation }) => {
  // URL Import state
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Background
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/mintbackground.jpg');

  const importRecipeFromUrl = async () => {
    if (!importUrl.trim()) {
      Alert.alert('URL Required', 'Please enter a recipe URL to import.');
      return;
    }

    setIsImporting(true);

    try {
      const result = await YesChefAPI.importRecipe(importUrl.trim());
      
      if (result.success) {
        // Navigate to review screen
        navigation.navigate('RecipeImportReview', {
          importResult: result
        });
        
        // Clear URL after successful import
        setImportUrl('');
      } else {
        Alert.alert('Import Failed', result.error || 'Failed to import recipe.');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'An error occurred while importing the recipe.');
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
            <View style={styles.methodIconContainer}>
              <Ionicons name="link" size={48} color="#28a745" />
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>🔗 Import from URL</Text>
              <Text style={styles.methodDescription}>
                Import recipes from YouTube, websites, and online recipe sources.
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

              <View style={styles.methodFeatures}>
                <Text style={styles.featureText}>• YouTube videos</Text>
                <Text style={styles.featureText}>• Recipe websites</Text>
                <Text style={styles.featureText}>• AI extraction</Text>
              </View>
            </View>
          </View>

          {/* Voice Recording Card - Second */}
          <TouchableOpacity
            style={[styles.methodCard, styles.voiceCard]}
            onPress={() => navigation.navigate('VoiceRecipeRecorder')}
            activeOpacity={0.8}
          >
            <View style={styles.methodIconContainer}>
              <Ionicons name="mic" size={48} color="#dc2626" />
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>🎤 Record Family Recipe</Text>
              <Text style={styles.methodDescription}>
                Preserve family recipes through voice recording. Perfect for capturing grandma's cooking secrets!
              </Text>
              <View style={styles.methodFeatures}>
                <Text style={styles.featureText}>• Multi-segment recording</Text>
                <Text style={styles.featureText}>• 18+ languages supported</Text>
                <Text style={styles.featureText}>• AI-powered transcription</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#dc2626" style={styles.methodArrow} />
          </TouchableOpacity>

          {/* Camera Import Card (Coming Soon) - Third */}
          <TouchableOpacity
            style={[styles.methodCard, styles.cameraCard, styles.comingSoon]}
            activeOpacity={0.6}
            onPress={() => Alert.alert('Coming Soon', 'Camera import will be available soon!')}
          >
            <View style={styles.methodIconContainer}>
              <Ionicons name="camera" size={48} color="#6b7280" />
            </View>
            <View style={styles.methodContent}>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>COMING SOON</Text>
              </View>
              <Text style={styles.methodTitle}>📷 Scan Recipe Card</Text>
              <Text style={styles.methodDescription}>
                Take a photo of recipe cards, cookbook pages, or handwritten recipes.
              </Text>
              <View style={styles.methodFeatures}>
                <Text style={styles.featureText}>• OCR text recognition</Text>
                <Text style={styles.featureText}>• Handwriting support</Text>
                <Text style={styles.featureText}>• Multi-page scanning</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#9ca3af" style={styles.methodArrow} />
          </TouchableOpacity>
        </ScrollView>
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
    borderColor: '#d1d5db',
  },
  comingSoon: {
    opacity: 0.6,
  },
  methodIconContainer: {
    marginBottom: 16,
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
  methodFeatures: {
    marginTop: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    fontFamily: 'Nunito-Regular',
  },
  methodArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  comingSoonBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    fontFamily: 'Nunito-Bold',
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
});

export default AddRecipeScreen;
