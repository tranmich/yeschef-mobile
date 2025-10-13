/**
 * 🎨 RECIPE OPTIONS MODAL - Reusable Bottom Sheet
 * 
 * Beautiful bottom sheet modal for recipe actions.
 * Used across RecipeCollectionScreen, RecipeViewScreen, etc.
 * Consistent UX pattern with smooth animations.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Icon } from './IconLibrary';

const RecipeOptionsModal = ({ 
  visible, 
  onClose, 
  recipe,
  onAddToMealPlan,
  onShare,
  onMove,
  onDelete,
  showShare = true,
  showAddToMealPlan = true,
  showMove = true,
  showDelete = true
}) => {
  
  const handleAddToMealPlan = () => {
    onClose();
    onAddToMealPlan && onAddToMealPlan(recipe);
  };

  const handleShare = () => {
    onClose();
    onShare && onShare(recipe);
  };

  const handleMove = () => {
    onClose();
    onMove && onMove(recipe);
  };

  const handleDelete = () => {
    onClose();
    onDelete && onDelete(recipe);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.bottomSheetOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />
              
              <Text style={styles.bottomSheetTitle}>Recipe Options</Text>
              
              {/* Add to Meal Plan */}
              {showAddToMealPlan && (
                <TouchableOpacity
                  style={styles.bottomSheetButton}
                  onPress={handleAddToMealPlan}
                >
                  <Icon name="add" size={20} color="#374151" style={styles.bottomSheetButtonIcon} />
                  <Text style={styles.bottomSheetButtonText}>Add to Meal Plan</Text>
                </TouchableOpacity>
              )}

              {/* Share Recipe */}
              {showShare && (
                <TouchableOpacity
                  style={styles.bottomSheetButton}
                  onPress={handleShare}
                >
                  <Icon name="share" size={20} color="#374151" style={styles.bottomSheetButtonIcon} />
                  <Text style={styles.bottomSheetButtonText}>Share Recipe</Text>
                </TouchableOpacity>
              )}

              {/* Move to Collection */}
              {showMove && (
                <TouchableOpacity
                  style={styles.bottomSheetButton}
                  onPress={handleMove}
                >
                  <Icon name="folder" size={20} color="#374151" style={styles.bottomSheetButtonIcon} />
                  <Text style={styles.bottomSheetButtonText}>Move to Collection</Text>
                </TouchableOpacity>
              )}

              {/* Remove Recipe */}
              {showDelete && (
                <TouchableOpacity
                  style={[styles.bottomSheetButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Icon name="close" size={20} color="#ef4444" style={styles.bottomSheetButtonIcon} />
                  <Text style={styles.bottomSheetButtonText}>Remove from Collection</Text>
                </TouchableOpacity>
              )}
              
              {/* Cancel */}
              <TouchableOpacity
                style={[styles.bottomSheetButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.bottomSheetButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 34, // Extra padding for home indicator
    minHeight: 200,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Nunito-ExtraBold',
  },
  bottomSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: '#f9fafb',
  },
  bottomSheetButtonIcon: {
    marginRight: 12,
  },
  bottomSheetButtonText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Nunito-Regular',
  },
  deleteButton: {
    backgroundColor: '#fef2f2', // Light red background
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    marginTop: 8,
  },
});

export default RecipeOptionsModal;