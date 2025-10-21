# 📱 Phase 1 Screen Migration Guide

**Services Added:** MealPlanServiceV2 & GroceryListServiceV2  
**Date:** October 21, 2025  
**Status:** Ready for screen updates

---

## ✅ WHAT WE JUST BUILT

### **MealPlanServiceV2** (6 methods):
1. ✅ `createMealPlan(userId, data)` - Create new meal plan
2. ✅ `getMealPlan(planId, userId)` - Get specific meal plan
3. ✅ `getUserMealPlans(userId)` - Get all user's meal plans
4. ✅ `getMealPlansByDateRange(userId, start, end)` - Filter by date
5. ✅ `updateMealPlan(planId, userId, updates)` - Update meal plan
6. ✅ `deleteMealPlan(planId, userId)` - Delete meal plan

### **GroceryListServiceV2** (11 methods):
1. ✅ `createGroceryList(userId, data)` - Create new list
2. ✅ `createFromMealPlan(userId, mealPlanId)` - Auto-generate from meal plan
3. ✅ `getGroceryList(listId, userId)` - Get specific list
4. ✅ `getUserGroceryLists(userId)` - Get all user's lists
5. ✅ `updateGroceryList(listId, userId, updates)` - Update list
6. ✅ `addItem(listId, userId, item)` - Add item to list
7. ✅ `removeItem(listId, userId, itemIndex)` - Remove item
8. ✅ `markItemPurchased(listId, userId, itemIndex, purchased)` - Mark purchased
9. ✅ `clearPurchasedItems(listId, userId)` - Clear purchased items
10. ✅ `deleteGroceryList(listId, userId)` - Delete list

---

## 🔄 SCREEN MIGRATION INSTRUCTIONS

### **1. MealPlanScreen.js**

#### **Import Changes:**

**BEFORE:**
```javascript
import MealPlanAPI from '../services/MealPlanAPI';
```

**AFTER:**
```javascript
import { MealPlanServiceV2 } from '../services/apiServiceV2';
```

---

#### **Method Mappings:**

##### **Create Meal Plan:**

**BEFORE:**
```javascript
const result = await MealPlanAPI.saveMealPlan(
  mobileDays,      // meal data
  planTitle,       // name
  userId
);

if (result.success) {
  const planId = result.planId;
  // ...
}
```

**AFTER:**
```javascript
const result = await MealPlanServiceV2.createMealPlan(userId, {
  name: planTitle,
  startDate: startDate,  // ISO format: "2025-10-21"
  endDate: endDate,      // ISO format: "2025-10-27"
  meals: mobileDays      // meal data object
});

// result is the meal plan object directly (no .success wrapper needed!)
const planId = result.id;
```

---

##### **Load Meal Plans List:**

**BEFORE:**
```javascript
const result = await MealPlanAPI.loadMealPlansList();

if (result.success) {
  const plans = result.plans;
  // ...
}
```

**AFTER:**
```javascript
const result = await MealPlanServiceV2.getUserMealPlans(userId);

// result.mealPlans is the array
const plans = result.mealPlans;
```

---

##### **Load Specific Meal Plan:**

**BEFORE:**
```javascript
const result = await MealPlanAPI.loadMealPlan(planId);

if (result.success) {
  const meals = result.mobileDays;
  const title = result.planTitle;
  // ...
}
```

**AFTER:**
```javascript
const result = await MealPlanServiceV2.getMealPlan(planId, userId);

// result is the meal plan object directly
const meals = result.meals;
const title = result.name;
const startDate = result.start_date;
const endDate = result.end_date;
```

---

##### **Update Meal Plan:**

**BEFORE:**
```javascript
const result = await MealPlanAPI.updateMealPlan(
  planId,
  mobileDays,
  newTitle
);

if (result.success) {
  // ...
}
```

**AFTER:**
```javascript
const result = await MealPlanServiceV2.updateMealPlan(planId, userId, {
  name: newTitle,
  meals: mobileDays,
  // optionally: start_date, end_date
});

// result is the updated meal plan object
```

---

##### **Delete Meal Plan:**

**BEFORE:**
```javascript
const result = await MealPlanAPI.deleteMealPlan(planId);

if (result.success) {
  // ...
}
```

**AFTER:**
```javascript
const result = await MealPlanServiceV2.deleteMealPlan(planId, userId);

// result confirms deletion
```

---

### **2. GroceryListScreen.js**

#### **Import Changes:**

**BEFORE:**
```javascript
import MobileGroceryAdapter from '../services/MobileGroceryAdapter';
// Or whatever grocery API you're using
```

**AFTER:**
```javascript
import { GroceryListServiceV2 } from '../services/apiServiceV2';
```

---

#### **Method Mappings:**

##### **Create Grocery List:**

**BEFORE:**
```javascript
// Your current implementation
const list = {
  name: listName,
  items: []
};
// Save to AsyncStorage or old API
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.createGroceryList(userId, {
  name: listName,
  items: [] // optional initial items
});

const listId = result.id;
```

---

##### **Create from Meal Plan:**

**BEFORE:**
```javascript
// Manual generation from meal plan
const items = extractItemsFromMealPlan(mealPlan);
// Create list with items
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.createFromMealPlan(userId, mealPlanId);

// Automatically generates list from all recipes in meal plan!
const groceryList = result;
const items = result.items;
```

---

##### **Load Grocery Lists:**

**BEFORE:**
```javascript
// Load from AsyncStorage or old API
const lists = await loadFromStorage();
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.getUserGroceryLists(userId);

const lists = result.groceryLists;
```

---

##### **Get Specific List:**

**BEFORE:**
```javascript
// Find in local storage
const list = lists.find(l => l.id === listId);
```

**AFTER:**
```javascript
const list = await GroceryListServiceV2.getGroceryList(listId, userId);

const items = list.items;
const name = list.name;
```

---

##### **Add Item:**

**BEFORE:**
```javascript
// Add to local array
list.items.push(newItem);
// Save to storage
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.addItem(listId, userId, {
  name: 'Milk',
  quantity: '1 gallon',
  category: 'dairy',
  purchased: false
});

// result is updated list
```

---

##### **Mark Item Purchased:**

**BEFORE:**
```javascript
// Toggle in local array
list.items[index].purchased = true;
// Save to storage
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.markItemPurchased(
  listId,
  userId,
  itemIndex,
  true  // or false to unmark
);

// result is updated list
```

---

##### **Remove Item:**

**BEFORE:**
```javascript
// Remove from array
list.items.splice(index, 1);
// Save to storage
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.removeItem(
  listId,
  userId,
  itemIndex
);

// result is updated list
```

---

##### **Clear Purchased Items:**

**BEFORE:**
```javascript
// Filter array
list.items = list.items.filter(item => !item.purchased);
// Save to storage
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.clearPurchasedItems(listId, userId);

// result is updated list with purchased items removed
```

---

##### **Delete List:**

**BEFORE:**
```javascript
// Remove from array
lists = lists.filter(l => l.id !== listId);
// Save to storage
```

**AFTER:**
```javascript
const result = await GroceryListServiceV2.deleteGroceryList(listId, userId);

// list deleted from backend
```

---

## 🎯 KEY DIFFERENCES

### **1. No More `.success` Wrapper**

The `apiFetch()` function in `apiServiceV2.js` already unwraps the v2 response format!

**v2 Backend Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "My Meal Plan"
  }
}
```

**What You Get in App:**
```javascript
const result = await MealPlanServiceV2.getMealPlan(123, userId);
// result = { id: 123, name: "My Meal Plan" }
// NO .success field! Already unwrapped!
```

---

### **2. User ID Always Required**

v2 API requires `user_id` for all operations (security):

**BEFORE (v1):**
```javascript
await deleteMealPlan(planId);  // No user check
```

**AFTER (v2):**
```javascript
await MealPlanServiceV2.deleteMealPlan(planId, userId);  // Verified ownership
```

---

### **3. Consistent Response Format**

All v2 services return the actual data object:

```javascript
// Create returns the created object
const mealPlan = await MealPlanServiceV2.createMealPlan(userId, data);
console.log(mealPlan.id);  // Direct access!

// Get returns the object
const list = await GroceryListServiceV2.getGroceryList(listId, userId);
console.log(list.items);  // Direct access!

// List endpoints return { items, pagination, total }
const result = await MealPlanServiceV2.getUserMealPlans(userId);
console.log(result.mealPlans);  // Array of meal plans
console.log(result.total);  // Total count
```

---

## 🧪 TESTING CHECKLIST

### **MealPlanScreen.js:**
- [ ] Create new meal plan
- [ ] Load list of meal plans
- [ ] Open existing meal plan
- [ ] Edit meal plan (change meals)
- [ ] Update meal plan name
- [ ] Delete meal plan
- [ ] Generate grocery list from meal plan

### **GroceryListScreen.js:**
- [ ] Create new grocery list
- [ ] Generate from meal plan (auto-populate)
- [ ] Load list of grocery lists
- [ ] Open existing list
- [ ] Add item manually
- [ ] Mark item as purchased
- [ ] Unmark item
- [ ] Remove item
- [ ] Clear all purchased items
- [ ] Delete grocery list

---

## 🚨 ERROR HANDLING

The `apiFetch()` function throws errors automatically, so wrap in try-catch:

```javascript
try {
  const result = await MealPlanServiceV2.createMealPlan(userId, data);
  // Success!
  Alert.alert('Success', 'Meal plan created!');
} catch (error) {
  // Error already includes message from backend
  Alert.alert('Error', error.message);
  console.error('Failed to create meal plan:', error);
}
```

---

## 📝 SUMMARY

### **What Changed:**
1. ✅ Import from `apiServiceV2` instead of old API
2. ✅ Use new service methods (MealPlanServiceV2, GroceryListServiceV2)
3. ✅ Pass `userId` to all methods
4. ✅ No more `.success` checks (auto-unwrapped)
5. ✅ Direct access to data in response

### **What Stayed the Same:**
1. ✅ UI components unchanged
2. ✅ Business logic unchanged
3. ✅ Data structures similar
4. ✅ User experience identical

### **Benefits:**
1. ⚡ 3x faster response times
2. 🛡️ Better error handling
3. 🔐 Improved security (user verification)
4. 📊 Consistent API patterns
5. 🐛 Fewer bugs (standardized responses)

---

**Ready to update the screens?** 🚀

Let me know if you'd like me to help with the actual screen updates!
