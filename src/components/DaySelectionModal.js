/**
 * 📅 DAY SELECTION MODAL - Smart Meal Plan Day Chooser
 * 
 * Elegant bottom sheet for choosing which day to add recipe to.
 * Only appears when meal plan has 2+ days (single day = direct add).
 * Clean button list with day names, up to 7 days maximum.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Icon } from './IconLibrary';

const DaySelectionModal = ({ visible, onClose, onSelectDay, availableDays, recipe }) => {
  const handleDaySelection = (dayId) => {
    onSelectDay(dayId);
    onClose();
  };

  // Debug logging
  console.log('🔍 DaySelectionModal availableDays:', availableDays?.length, availableDays?.map(d => ({id: d.id, name: d.name})));

  // Don't render if no days available
  if (!availableDays || availableDays.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Recipe To...</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Recipe Info */}
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeTitle}>{recipe?.title || recipe?.name}</Text>
            </View>

            {/* Day Selection List */}
            <ScrollView style={styles.daysList}>
              {availableDays.map((day, index) => (
                <TouchableOpacity
                  key={day.id}
                  style={styles.dayButton}
                  onPress={() => handleDaySelection(day.id)}
                >
                  <Icon name="mealPlanTab" size={20} color="#10b981" style={styles.dayIcon} />
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>
                      {day.name || `Day ${day.id}`}
                    </Text>
                    <Text style={styles.dayDetail}>
                      {day.recipes?.length || 0} recipe{day.recipes?.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '85%', // Increased from 80% to accommodate larger daysList
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  recipeInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  recipeTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#6b7280',
    textAlign: 'center',
  },
  daysList: {
    maxHeight: 400, // Increased from 350 to show at least 2 days clearly
    minHeight: 140, // Ensure space for at least 2 days (2 × 48px + some buffer)
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayIcon: {
    marginRight: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  dayDetail: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  cancelButton: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#6b7280',
  },
});

export default DaySelectionModal;