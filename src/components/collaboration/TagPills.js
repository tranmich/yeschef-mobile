// TagPills Component - Display and manage tags
// Shows tags as colored pills, handles filtering, and allows adding new tags

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Icon } from '../IconLibrary';

export default function TagPills({ 
  tags = [], 
  onTagPress,
  onAddTag,
  onRemoveTag,
  editable = false,
  style,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Predefined popular tags
  const popularTags = [
    'quick',
    'kids',
    'weeknight',
    'healthy',
    'comfort',
    'party',
    'vegetarian',
    'gluten-free',
    'budget',
    'fancy',
  ];

  // Tag color mapping
  const tagColors = {
    'quick': '#10b981',
    'kids': '#f59e0b',
    'weeknight': '#3b82f6',
    'party': '#ec4899',
    'healthy': '#14b8a6',
    'comfort': '#ef4444',
    'vegetarian': '#84cc16',
    'gluten-free': '#f97316',
    'budget': '#06b6d4',
    'fancy': '#a855f7',
    'default': '#6b7280',
  };

  const getTagColor = (tag) => {
    const normalized = tag.toLowerCase();
    return tagColors[normalized] || tagColors.default;
  };

  // Handle adding custom tag
  const handleAddCustomTag = () => {
    if (newTagText.trim()) {
      onAddTag?.(newTagText.trim().toLowerCase());
      setNewTagText('');
      setShowAddModal(false);
    }
  };

  // Handle adding popular tag
  const handleAddPopularTag = (tag) => {
    if (!tags.includes(tag)) {
      onAddTag?.(tag);
    }
    setShowAddModal(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Existing Tags */}
      {tags.map((tag, index) => (
        <TouchableOpacity
          key={`${tag}-${index}`}
          style={[
            styles.pill,
            { backgroundColor: getTagColor(tag) + '20' }
          ]}
          onPress={() => onTagPress?.(tag)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tagText, { color: getTagColor(tag) }]}>
            {tag}
          </Text>
          {editable && onRemoveTag && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onRemoveTag(tag);
              }}
              style={styles.removeButton}
            >
              <Icon name="close" size={12} color={getTagColor(tag)} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}

      {/* Add Tag Button */}
      {editable && onAddTag && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" size={12} color="#6b7280" />
          <Text style={styles.addText}>Add tag</Text>
        </TouchableOpacity>
      )}

      {/* Add Tag Modal */}
      {editable && (
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Tag</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Icon name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Custom Tag Input */}
              <View style={styles.customTagSection}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter custom tag..."
                  value={newTagText}
                  onChangeText={setNewTagText}
                  autoCapitalize="none"
                  maxLength={20}
                />
                <TouchableOpacity
                  style={[
                    styles.addCustomButton,
                    !newTagText.trim() && styles.addCustomButtonDisabled
                  ]}
                  onPress={handleAddCustomTag}
                  disabled={!newTagText.trim()}
                >
                  <Text style={styles.addCustomButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Popular Tags */}
              <Text style={styles.sectionTitle}>Popular Tags</Text>
              <FlatList
                data={popularTags.filter(tag => !tags.includes(tag))}
                numColumns={2}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.popularTagPill,
                      { backgroundColor: getTagColor(item) + '20' }
                    ]}
                    onPress={() => handleAddPopularTag(item)}
                  >
                    <Text style={[styles.popularTagText, { color: getTagColor(item) }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.popularTagsGrid}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  removeButton: {
    marginLeft: 6,
    padding: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  addText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
    fontFamily: 'Nunito-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Nunito-Bold',
  },
  customTagSection: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Nunito-Regular',
  },
  addCustomButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addCustomButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addCustomButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  popularTagsGrid: {
    paddingBottom: 12,
  },
  popularTagPill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    alignItems: 'center',
  },
  popularTagText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
});
