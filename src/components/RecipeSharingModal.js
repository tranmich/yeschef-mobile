import React, { useState } from 'react';
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
import { Icon } from './IconLibrary';

const RecipeSharingModal = ({ visible, recipe, onClose, onShare }) => {
  const [communityTitle, setCommunityTitle] = useState(recipe?.title || '');
  const [communityDescription, setCommunityDescription] = useState(recipe?.description || '');
  const [selectedBackground, setSelectedBackground] = useState('default');
  const [selectedIcon, setSelectedIcon] = useState('🍽️');
  const [isSharing, setIsSharing] = useState(false);

  // Background options (simple for Phase 1)
  const backgroundOptions = [
    { id: 'default', name: 'Classic', color: '#f8fafc' },
    { id: 'warm', name: 'Warm', color: '#fef3e2' },
    { id: 'fresh', name: 'Fresh', color: '#f0fdf4' },
    { id: 'elegant', name: 'Elegant', color: '#faf7ff' },
  ];

  // Icon options (simple emoji selection)
  const iconOptions = ['🍽️', '🍝', '🍕', '🌮', '🍗', '🥗', '🍰', '☕'];

  const handleShare = async () => {
    if (!communityTitle.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your shared recipe.');
      return;
    }

    setIsSharing(true);
    
    try {
      await onShare({
        community_title: communityTitle.trim(),
        community_description: communityDescription.trim(),
        community_background: selectedBackground,
        community_icon: selectedIcon,
      });
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
          <View style={[styles.previewCard, { backgroundColor: backgroundOptions.find(b => b.id === selectedBackground)?.color }]}>
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
            <View style={styles.optionsGrid}>
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
            <View style={styles.optionsGrid}>
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
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  backgroundOption: {
    flex: 1,
    minWidth: 80,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  iconOption: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  selectedOption: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  backgroundName: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
  },
  iconText: {
    fontSize: 24,
  },
});

export default RecipeSharingModal;