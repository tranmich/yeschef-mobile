import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function MealPlanScreen() {
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Mock meal plan data (will be replaced with real data from your backend)
  const mockMealPlan = {
    weekOf: '2025-09-07',
    days: [
      {
        date: 'Mon, Sep 7',
        meals: {
          breakfast: { id: '1', title: 'Fluffy Pancakes', status: 'planned' },
          lunch: { id: '2', title: 'Caesar Salad', status: 'planned' },
          dinner: { id: '3', title: 'Spaghetti Carbonara', status: 'cooked' },
        }
      },
      {
        date: 'Tue, Sep 8',
        meals: {
          breakfast: null,
          lunch: { id: '4', title: 'Chicken Sandwich', status: 'planned' },
          dinner: { id: '5', title: 'Beef Stir Fry', status: 'planned' },
        }
      },
      {
        date: 'Wed, Sep 9',
        meals: {
          breakfast: { id: '6', title: 'Avocado Toast', status: 'planned' },
          lunch: null,
          dinner: { id: '7', title: 'Salmon with Rice', status: 'planned' },
        }
      },
      {
        date: 'Thu, Sep 10',
        meals: {
          breakfast: null,
          lunch: null,
          dinner: null,
        }
      },
      {
        date: 'Fri, Sep 11',
        meals: {
          breakfast: null,
          lunch: null,
          dinner: { id: '8', title: 'Pizza Night', status: 'planned' },
        }
      },
      {
        date: 'Sat, Sep 12',
        meals: {
          breakfast: { id: '9', title: 'Weekend Brunch', status: 'planned' },
          lunch: null,
          dinner: null,
        }
      },
      {
        date: 'Sun, Sep 13',
        meals: {
          breakfast: null,
          lunch: { id: '10', title: 'Sunday Roast', status: 'planned' },
          dinner: null,
        }
      },
    ]
  };

  const generateGroceryList = () => {
    // This would collect all ingredients from planned meals
    alert('Grocery list generated from your meal plan!');
  };

  const addMeal = (dayIndex, mealType) => {
    alert(`Add ${mealType} for ${mockMealPlan.days[dayIndex].date}`);
  };

  const renderMealSlot = (meal, dayIndex, mealType) => {
    if (meal) {
      return (
        <TouchableOpacity style={[styles.mealSlot, styles.mealSlotFilled]}>
          <Text style={styles.mealTitle}>{meal.title}</Text>
          <Text style={styles.mealStatus}>
            {meal.status === 'cooked' ? '✅ Cooked' : '📝 Planned'}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.mealSlot, styles.mealSlotEmpty]}
        onPress={() => addMeal(dayIndex, mealType)}
      >
        <Text style={styles.addMealText}>+ Add {mealType}</Text>
      </TouchableOpacity>
    );
  };

  const renderDay = (day, dayIndex) => (
    <View key={dayIndex} style={styles.dayContainer}>
      <Text style={styles.dayHeader}>{day.date}</Text>
      
      <View style={styles.mealsContainer}>
        <View style={styles.mealSection}>
          <Text style={styles.mealTypeLabel}>🌅 Breakfast</Text>
          {renderMealSlot(day.meals.breakfast, dayIndex, 'breakfast')}
        </View>
        
        <View style={styles.mealSection}>
          <Text style={styles.mealTypeLabel}>☀️ Lunch</Text>
          {renderMealSlot(day.meals.lunch, dayIndex, 'lunch')}
        </View>
        
        <View style={styles.mealSection}>
          <Text style={styles.mealTypeLabel}>🌙 Dinner</Text>
          {renderMealSlot(day.meals.dinner, dayIndex, 'dinner')}
        </View>
      </View>
    </View>
  );

  const plannedMealsCount = mockMealPlan.days.reduce((count, day) => {
    return count + 
      (day.meals.breakfast ? 1 : 0) +
      (day.meals.lunch ? 1 : 0) +
      (day.meals.dinner ? 1 : 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.subtitle}>Week of {mockMealPlan.weekOf}</Text>
        <Text style={styles.counter}>{plannedMealsCount} meals planned</Text>
      </View>

      {/* Generate Grocery List Button */}
      <TouchableOpacity style={styles.groceryButton} onPress={generateGroceryList}>
        <Text style={styles.groceryButtonText}>🛒 Generate Grocery List</Text>
      </TouchableOpacity>

      {/* Days */}
      <ScrollView style={styles.daysContainer} showsVerticalScrollIndicator={false}>
        {mockMealPlan.days.map((day, index) => renderDay(day, index))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  counter: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  groceryButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#28a745',
    borderRadius: 8,
    alignItems: 'center',
  },
  groceryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  daysContainer: {
    flex: 1,
  },
  dayContainer: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  mealsContainer: {
    gap: 12,
  },
  mealSection: {
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  mealSlot: {
    padding: 12,
    borderRadius: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  mealSlotFilled: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  mealSlotEmpty: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  mealStatus: {
    fontSize: 14,
    color: '#6b7280',
  },
  addMealText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
