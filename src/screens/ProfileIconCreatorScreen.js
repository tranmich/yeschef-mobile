/**
 * 🎨 Profile Icon Creator Screen
 * Allows users to customize their profile avatar with background + fruit icon
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/IconLibrary';

const ProfileIconCreatorScreen = ({ visible, currentProfile, onClose, onSave }) => {
  const [selectedBackground, setSelectedBackground] = useState(currentProfile?.background || 'default');
  const [selectedIcon, setSelectedIcon] = useState(currentProfile?.icon || '🍎');
  const [isSaving, setIsSaving] = useState(false);

  // 🎨 Profile background options - colors and patterns
  const backgroundOptions = [
    { id: 'default', name: 'Classic', color: '#f8fafc', type: 'color' },
    { id: 'warm', name: 'Warm', color: '#fef3e2', type: 'color' },
    { id: 'fresh', name: 'Fresh', color: '#f0fdf4', type: 'color' },
    { id: 'ocean', name: 'Ocean', color: '#eff6ff', type: 'color' },
    { id: 'sunset', name: 'Sunset', color: '#fef2f2', type: 'color' },
    { id: 'lavender', name: 'Lavender', color: '#f3e8ff', type: 'color' },
    { id: 'gradient1', name: 'Sunrise', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', type: 'gradient' },
    { id: 'gradient2', name: 'Sky', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', type: 'gradient' },
    { id: 'gradient3', name: 'Forest', color: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', type: 'gradient' },
  ];

  // 🍎 Fruit/food icons for profile (focus on fruits for friendlier profile icons)
  const profileIconOptions = [
    // Fruits (perfect for profiles)
    '🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑', '🥭', '🍒', '🥥',
    '🍈', '🍉', '🍋', '🥑', '🥒', '🌶️', '🫒', '🍅',
    
    // Fun food options
    '🥕', '🌽', '🧄', '🧅', '🥔', '🍠',
  ];

  // Update state when currentProfile changes
  useEffect(() => {
    if (currentProfile) {
      setSelectedBackground(currentProfile.background || 'default');
      setSelectedIcon(currentProfile.icon || '🍎');
    }
  }, [currentProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const profileData = {
        background: selectedBackground,
        icon: selectedIcon,
      };
      
      console.log('🎨 Saving profile icon:', profileData);
      await onSave(profileData);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile icon. Please try again.');
      console.error('Failed to save profile icon:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getBackgroundColor = (bg) => {
    const option = backgroundOptions.find(b => b.id === bg);
    return option ? option.color : '#f8fafc';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Your Avatar</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving}
            >
              <Text style={styles.saveText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={[
                styles.avatarPreview, 
                { backgroundColor: getBackgroundColor(selectedBackground) }
              ]}>
                <Text style={styles.avatarIcon}>{selectedIcon}</Text>
              </View>
              <Text style={styles.previewDescription}>
                This is how your avatar will appear in the community
              </Text>
            </View>

            {/* Background Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Background Style</Text>
              <View style={styles.backgroundGrid}>
                {backgroundOptions.map((bg) => (
                  <TouchableOpacity
                    key={bg.id}
                    style={[
                      styles.backgroundOption,
                      { backgroundColor: bg.color },
                      selectedBackground === bg.id && styles.selectedOption
                    ]}
                    onPress={() => setSelectedBackground(bg.id)}
                  >
                    <Text style={styles.backgroundName}>{bg.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Character</Text>
              <Text style={styles.sectionSubtitle}>Choose a fruit or veggie that represents you</Text>
              <ScrollView 
                horizontal
                style={styles.iconScrollView}
                contentContainerStyle={styles.iconHorizontalGrid}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
              >
                {profileIconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.selectedIconOption
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Nunito-Regular',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Nunito-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarIcon: {
    fontSize: 48,
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 16,
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  backgroundOption: {
    width: '30%',
    aspectRatio: 2,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  backgroundName: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: '#374151',
    textAlign: 'center',
  },
  iconScrollView: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    maxHeight: 80,
  },
  iconHorizontalGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  iconOption: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  selectedOption: {
    borderColor: '#10b981',
    borderWidth: 3,
  },
  selectedIconOption: {
    borderColor: '#10b981',
    borderWidth: 3,
    backgroundColor: '#f0fdf4',
  },
  iconText: {
    fontSize: 24,
  },
});

export default ProfileIconCreatorScreen;