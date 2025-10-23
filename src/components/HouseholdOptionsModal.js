/**
 * 🏠 HOUSEHOLD OPTIONS MODAL - Bottom Sheet for Household Actions
 * 
 * Modern bottom sheet modal for household management.
 * Consistent with DayOptionsModal and RecipeOptionsModal design pattern.
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

const HouseholdOptionsModal = ({ 
  visible, 
  onClose, 
  household,
  onAddMember,
  onRemoveMember,
  onDeleteHousehold
}) => {
  
  const handleAddMember = () => {
    onClose();
    onAddMember && onAddMember();
  };

  const handleRemoveMember = () => {
    onClose();
    onRemoveMember && onRemoveMember();
  };

  const handleDeleteHousehold = () => {
    onClose();
    onDeleteHousehold && onDeleteHousehold();
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
                {household?.name ? `${household.name} Options` : 'Household Options'}
              </Text>
              
              {/* Add Member */}
              <TouchableOpacity
                style={styles.bottomSheetButton}
                onPress={handleAddMember}
              >
                <Icon name="add" size={20} color="#059669" style={styles.bottomSheetButtonIcon} />
                <Text style={styles.bottomSheetButtonText}>Add Member</Text>
              </TouchableOpacity>

              {/* Remove Member */}
              <TouchableOpacity
                style={styles.bottomSheetButton}
                onPress={handleRemoveMember}
              >
                <Icon name="minus" size={20} color="#f59e0b" style={styles.bottomSheetButtonIcon} />
                <Text style={styles.bottomSheetButtonText}>Remove Member</Text>
              </TouchableOpacity>

              {/* Delete Household */}
              <TouchableOpacity
                style={[styles.bottomSheetButton, styles.deleteButton]}
                onPress={handleDeleteHousehold}
              >
                <Icon name="delete" size={20} color="#ef4444" style={styles.bottomSheetButtonIcon} />
                <Text style={[styles.bottomSheetButtonText, styles.deleteButtonText]}>Delete Household</Text>
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
    minHeight: 250,
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
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  bottomSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  bottomSheetButtonIcon: {
    marginRight: 12,
  },
  bottomSheetButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginTop: 8,
    justifyContent: 'center',
  },
});

export default HouseholdOptionsModal;
