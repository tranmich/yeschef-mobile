# 🔄 MealPlanScreen.js - V2 API Integration Plan

## Current Architecture Discovery

The MealPlanScreen currently uses:
- ✅ `useLocalData` hook for local-first data management
- ✅ `LocalDataManager` for AsyncStorage persistence
- ✅ Auto-save to local storage
- ⚠️ **NO backend sync currently implemented**

## Import Currently Present
```javascript
import MealPlanAPI from '../services/MealPlanAPI';
```
**Status:** Imported but **NOT USED** in the file! 😮

## Integration Strategy

### **Hybrid Approach: Local-First + Backend Sync**

We'll add backend sync while keeping the local-first architecture:

1. **Keep:** Local storage for offline capability
2. **Add:** Background sync to v2 API
3. **Add:** Load from backend option
4. **Keep:** Auto-save to local storage
5. **Add:** Manual "Save to Cloud" button

---

## Implementation Plan

### **STEP 1: Update Imports**

```javascript
// Replace this:
import MealPlanAPI from '../services/MealPlanAPI';

// With this:
import { MealPlanServiceV2 } from '../services/apiServiceV2';
```

### **STEP 2: Add Backend Sync Functions**

Add these new functions to MealPlanScreen:

```javascript
// 🌐 Save to backend
const saveToBackend = async () => {
  if (!days || days.length === 0) {
    Alert.alert('Error', 'No meal plan data to save');
    return;
  }
  
  setIsLoading(true);
  
  try {
    const userId = await YesChefAPI.getUserId();
    
    // Calculate date range from days
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + (days.length * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    const mealPlanData = {
      name: mealPlanTitle,
      startDate: startDate,
      endDate: endDate,
      meals: days // This is your mobile format
    };
    
    let result;
    if (currentPlanId) {
      // Update existing
      result = await MealPlanServiceV2.updateMealPlan(
        currentPlanId,
        userId,
        mealPlanData
      );
    } else {
      // Create new
      result = await MealPlanServiceV2.createMealPlan(userId, mealPlanData);
      setCurrentPlanId(result.id);
    }
    
    markAsSaved(); // Mark local data as saved
    Alert.alert('Success', 'Meal plan saved to cloud!');
    
  } catch (error) {
    console.error('Failed to save to backend:', error);
    Alert.alert('Error', `Failed to save: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

// 📥 Load from backend
const loadFromBackend = async (planId) => {
  setIsLoading(true);
  
  try {
    const userId = await YesChefAPI.getUserId();
    const mealPlan = await MealPlanServiceV2.getMealPlan(planId, userId);
    
    // Update local state
    setDays(mealPlan.meals || []);
    setMealPlanTitle(mealPlan.name || 'Meal Plan');
    setCurrentPlanId(mealPlan.id);
    markAsSaved();
    
    Alert.alert('Success', 'Meal plan loaded from cloud!');
    setShowLoadModal(false);
    
  } catch (error) {
    console.error('Failed to load from backend:', error);
    Alert.alert('Error', `Failed to load: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

// 📋 Load available plans list
const loadAvailablePlans = async () => {
  setIsLoading(true);
  
  try {
    const userId = await YesChefAPI.getUserId();
    const result = await MealPlanServiceV2.getUserMealPlans(userId);
    
    setAvailablePlans(result.mealPlans || []);
    setShowLoadModal(true);
    
  } catch (error) {
    console.error('Failed to load plans list:', error);
    Alert.alert('Error', `Failed to load plans: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

// 🗑️ Delete from backend
const deleteFromBackend = async (planId) => {
  Alert.alert(
    'Confirm Delete',
    'Delete this meal plan from cloud? (Local draft will remain)',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const userId = await YesChefAPI.getUserId();
            await MealPlanServiceV2.deleteMealPlan(planId, userId);
            
            if (currentPlanId === planId) {
              setCurrentPlanId(null);
            }
            
            // Refresh list
            await loadAvailablePlans();
            
            Alert.alert('Success', 'Meal plan deleted from cloud');
          } catch (error) {
            Alert.alert('Error', `Failed to delete: ${error.message}`);
          }
        }
      }
    ]
  );
};
```

### **STEP 3: Add UI Buttons**

Add these buttons to the options menu:

```javascript
// In the options menu (showOptionsMenu modal):
<TouchableOpacity
  style={styles.optionButton}
  onPress={saveToBackend}
>
  <Icon name="cloud-upload" size={20} color="#666" />
  <Text style={styles.optionButtonText}>Save to Cloud</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.optionButton}
  onPress={loadAvailablePlans}
>
  <Icon name="cloud-download" size={20} color="#666" />
  <Text style={styles.optionButtonText}>Load from Cloud</Text>
</TouchableOpacity>
```

### **STEP 4: Add Load Modal**

Update the load modal to show backend plans:

```javascript
<Modal visible={showLoadModal} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.loadModalContent}>
      <Text style={styles.modalTitle}>Load Meal Plan</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <ScrollView>
          {availablePlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.planItem}
              onPress={() => loadFromBackend(plan.id)}
            >
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDate}>
                  {plan.start_date} to {plan.end_date}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteFromBackend(plan.id)}
                style={styles.deleteButton}
              >
                <Icon name="trash" size={20} color="#f44336" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setShowLoadModal(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

---

## Benefits of This Approach

### **1. Local-First (Existing)** ✅
- Instant saves to AsyncStorage
- Works offline
- No network delays
- Auto-save every 3 seconds

### **2. Cloud Backup (New)** 🌐
- Manual "Save to Cloud" option
- Load from any device
- Share with household
- Backend persistence

### **3. Best of Both** 🎯
- Fast local experience
- Cloud backup for safety
- Cross-device sync when needed
- User controls when to sync

---

## Next Steps

**Option A:** I create the complete updated MealPlanScreen.js  
**Option B:** I create just the helper functions file you can import  
**Option C:** We add it piece by piece with testing  

**Which would you prefer?** 🤔

The implementation is straightforward since:
- ✅ Services already built (MealPlanServiceV2)
- ✅ Local-first architecture already working
- ✅ Just adding optional cloud sync
- ✅ Non-breaking changes (adds features, doesn't remove)

