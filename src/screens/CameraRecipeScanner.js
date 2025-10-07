/**
 * Camera Recipe Scanner
 * Capture recipe cards and cookbook pages with OCR
 * 
 * Features:
 * - Multi-photo capture (for multi-page recipes)
 * - Photo reordering
 * - Gallery import
 * - Image quality tips
 * - Batch processing
 * 
 * Created: October 7, 2025
 * Phase 3: OCR Import System
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import YesChefAPI from '../services/YesChefAPI';

const CameraRecipeScanner = ({ navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  // Request camera permissions on mount
  React.useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(
        cameraStatus.status === 'granted' && mediaStatus.status === 'granted'
      );
    })();
  }, []);

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8, // Balance between quality and file size
      });

      if (!result.canceled) {
        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        };
        setPhotos([...photos, newPhoto]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10, // Max 10 photos at once
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => ({
          id: Date.now().toString() + Math.random(),
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }));
        setPhotos([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const removePhoto = (photoId) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotos(photos.filter(p => p.id !== photoId));
          }
        }
      ]
    );
  };

  const reorderPhotos = (fromIndex, toIndex) => {
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    setPhotos(newPhotos);
  };

  const processPhotos = async () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please capture at least one photo before processing.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log(`📸 Processing ${photos.length} photos...`);
      
      // Call API to process OCR
      const result = await YesChefAPI.processOCRImages(photos);

      if (result.success) {
        // Navigate to review screen with extracted recipe
        navigation.navigate('RecipeImportReview', {
          importResult: {
            success: true,
            recipe: result.recipe,
            recipe_id: result.recipe_id,
            source: 'ocr_scan',
            isTemporary: false,
            extraction_method: result.extraction_method,
            confidence: result.confidence,
            metadata: {
              photo_count: photos.length,
              extraction_method: result.extraction_method,
              confidence: result.confidence
            }
          }
        });
      } else {
        Alert.alert('Processing Failed', result.error || 'Failed to extract recipe from photos.');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert('Error', 'An error occurred while processing your photos.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
        <View style={styles.permissionDenied}>
          <Ionicons name="camera-off" size={64} color="#dc2626" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            YesChef needs camera and photo library access to scan recipe cards.
          </Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => Alert.alert(
              'Enable Camera Access',
              'Please go to Settings → YesChef → Permissions and enable Camera and Photos.',
              [{ text: 'OK' }]
            )}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📷 Scan Recipe</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Tips Section */}
        {photos.length === 0 && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
              <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={styles.tipText}>Good lighting - avoid shadows</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={styles.tipText}>Flat surface - lay recipe card flat</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={styles.tipText}>Clear text - focus on recipe text</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={styles.tipText}>Multiple pages - capture each page</Text>
              </View>
            </View>
          </View>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <View style={styles.photosSectionHeader}>
              <Text style={styles.sectionTitle}>
                Captured Photos ({photos.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                Tap and hold to reorder
              </Text>
            </View>
            
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <View style={styles.photoOverlay}>
                    <View style={styles.photoNumber}>
                      <Text style={styles.photoNumberText}>{index + 1}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePhoto(photo.id)}
                    >
                      <Ionicons name="close-circle" size={28} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                  {/* Reorder buttons */}
                  {photos.length > 1 && (
                    <View style={styles.reorderButtons}>
                      {index > 0 && (
                        <TouchableOpacity
                          style={styles.reorderButton}
                          onPress={() => reorderPhotos(index, index - 1)}
                        >
                          <Ionicons name="arrow-back" size={16} color="#fff" />
                        </TouchableOpacity>
                      )}
                      {index < photos.length - 1 && (
                        <TouchableOpacity
                          style={styles.reorderButton}
                          onPress={() => reorderPhotos(index, index + 1)}
                        >
                          <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Ionicons name="camera" size={32} color="#28a745" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={pickFromGallery}>
            <Ionicons name="images" size={32} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Process Button */}
      {photos.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomStats}>
            <Text style={styles.bottomStatsText}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} ready
            </Text>
            <Text style={styles.bottomStatsSubtext}>
              AI will extract recipe text
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
            onPress={processPhotos}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.processButtonText}>Process Photos</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  settingsButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
  },
  photosSection: {
    marginBottom: 24,
  },
  photosSectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  photoGrid: {
    gap: 16,
  },
  photoCard: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  photoImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  photoNumber: {
    backgroundColor: '#28a745',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
  },
  reorderButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  reorderButton: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bottomStats: {
    flex: 1,
  },
  bottomStatsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bottomStatsSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  processButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CameraRecipeScanner;
