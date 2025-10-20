/**
 * 🎨 DAY OPTIONS MODAL - Bottom Sheet for Meal Plan Day Actions
 * 
 * Modern bottom sheet modal for day management in meal planning.
 * Consistent with RecipeOptionsModal design pattern.
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

const DayOptionsModal = ({ 
  visible, 
  onClose, 
  dayName,
  onAddMeal,
  onDeleteDay
}) => {
  
  const handleAddMeal = () => {
    onClose();
    onAddMeal && onAddMeal();
  };

  const handleDeleteDay = () => {
    onClose();
    onDeleteDay && onDeleteDay();
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
              
              <Text style={styles.bottomSheetTitle}>
                {dayName ? `${dayName} Options` : 'Day Options'}
              </Text>
              
              {/* Add Meal */}
              <TouchableOpacity
                style={styles.bottomSheetButton}
                onPress={handleAddMeal}
              >
                <Icon name="add" size={20} color="#374151" style={styles.bottomSheetButtonIcon} />
                <Text style={styles.bottomSheetButtonText}>Add Meal</Text>
              </TouchableOpacity>

              {/* Delete Day */}
              <TouchableOpacity
                style={[styles.bottomSheetButton, styles.deleteButton]}
                onPress={handleDeleteDay}
              >
                <Icon name="close" size={20} color="#ef4444" style={styles.bottomSheetButtonIcon} />
                <Text style={[styles.bottomSheetButtonText, styles.deleteButtonText]}>Delete Day</Text>
              </TouchableOpacity>
              
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
  deleteButtonText: {
    color: '#ef4444', // Red text for delete action
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    marginTop: 8,
  },
});

export default DayOptionsModal;