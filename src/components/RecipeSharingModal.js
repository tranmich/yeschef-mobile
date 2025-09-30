import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './IconLibrary';
import { getCommunityBackgroundColor, getBackgroundOptions, getIconOptions } from '../utils/communityStyles';
import { usePremiumFeature } from '../hooks/usePremiumFeature';

const RecipeSharingModal = ({ visible, recipe, onClose, onShare }) => {
  const [communityTitle, setCommunityTitle] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('default');
  const [selectedIcon, setSelectedIcon] = useState('🍽️');
  const [isSharing, setIsSharing] = useState(false);

  // 🌟 Premium feature hook for recipe sharing
  const { requirePremium } = usePremiumFeature('recipe_sharing', 'Recipe Sharing');

  // 🔄 Update form fields when recipe changes
  useEffect(() => {
    if (recipe) {
      console.log('🔄 Loading recipe data for sharing:', {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description
      });
      setCommunityTitle(recipe.title || '');
      setCommunityDescription(recipe.description || '');
    } else {
      // Reset form when no recipe is selected
      setCommunityTitle('');
      setCommunityDescription('');
      setSelectedBackground('default');
      setSelectedIcon('🍽️');
    }
  }, [recipe]);

  // Background and icon options from utility
  const backgroundOptions = getBackgroundOptions();
  const iconOptions = getIconOptions();

  const handleShare = async () => {
    // 🌟 Check premium access before allowing share
    requirePremium(() => {
      performShare();
    });
  };

  const performShare = async () => {
    if (!communityTitle.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your shared recipe.');
      return;
    }

    const shareData = {
      community_title: communityTitle.trim(),
      community_description: communityDescription.trim(),
      community_background: selectedBackground,
      community_icon: selectedIcon,
    };

    console.log('📤 Sharing recipe with data:', shareData);
    setIsSharing(true);
    
    try {
      await onShare(shareData);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to share recipe. Please try again.');
    } finally {
      setIsSharing(false);
    }
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
            <Text style={styles.headerTitle}>Share Recipe</Text>
            <TouchableOpacity 
              onPress={handleShare} 
              style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
              disabled={isSharing}
            >
              <Text style={styles.shareText}>
                {isSharing ? 'Sharing...' : 'Share'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
          {/* Recipe Preview */}
          <View style={[styles.previewCard, { backgroundColor: getCommunityBackgroundColor(selectedBackground) }]}>
            <Text style={styles.previewIcon}>{selectedIcon}</Text>
            <Text style={styles.previewTitle}>{communityTitle || 'Recipe Title'}</Text>
            <Text style={styles.previewDescription}>
              {communityDescription || 'Recipe description...'}
            </Text>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipe Title</Text>
            <TextInput
              style={styles.textInput}
              value={communityTitle}
              onChangeText={setCommunityTitle}
              placeholder="Enter a catchy title for your recipe"
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={communityDescription}
              onChangeText={setCommunityDescription}
              placeholder="Add a brief description or story about this recipe"
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>

          {/* Background Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background Theme</Text>
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
            <Text style={styles.sectionTitle}>Recipe Icon</Text>
            <Text style={styles.sectionSubtitle}>Choose from 48 food emojis • Swipe left and right to browse →</Text>
            <ScrollView 
              horizontal
              style={styles.iconScrollView}
              contentContainerStyle={styles.iconHorizontalGrid}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={60} // Snap to each icon for better UX
            >
              {iconOptions.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.selectedOption
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
    backgroundColor: '#ffffff', // White background for status bar area
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
  shareButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  shareText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Nunito-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    backgroundColor: '#ffffff',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  iconHorizontalGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  iconScrollContainer: {
    height: 160, // Fixed height for scrollable area
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  iconScrollView: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    maxHeight: 68, // Just enough for one row of icons
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  backgroundOption: {
    width: '30%', // 3 per row for backgrounds
    aspectRatio: 2,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  iconOption: {
    width: 52, // Fixed width for horizontal scrolling
    height: 52, // Fixed height for consistent appearance
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginHorizontal: 2, // Small spacing between icons
  },
  selectedOption: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  backgroundName: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    textAlign: 'center',
  },
  iconText: {
    fontSize: 22, // Slightly larger for better visibility in horizontal scroll
  },
});

export default RecipeSharingModal;