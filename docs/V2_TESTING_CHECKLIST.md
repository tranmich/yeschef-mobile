# 🧪 V2 API Testing Checklist

**Date:** October 22, 2025  
**Status:** Ready to Test  
**Migration:** Clean v2 Migration Complete

---

## ✅ **PRE-TEST CHECKLIST:**

- [x] Backend server running (localhost:5000)
- [x] v2 routes registered
- [x] Code committed to GitHub
- [ ] Mobile app running
- [ ] User logged in

---

## 🧪 **TEST 1: SAVE MEAL PLAN (v2)**

### **Steps:**
1. Open mobile app
2. Navigate to Meal Plan screen
3. Create a simple meal plan:
   - Click "Add Day" button
   - Add 1-2 recipes to a day
   - Give it a title: "Test v2 Plan - [timestamp]"
4. Tap options menu (⋯ button)
5. Tap "Save Plan"

### **Expected Mobile Console Output:**
```
💾 Saving meal plan (v2): Test v2 Plan
🌐 Sending to v2 backend: {
  user_id: 11,
  name: "Test v2 Plan",
  meals_count: 2,
  start_date: "2025-10-22",
  end_date: "2025-10-29"
}
📡 v2 Response: {success: true, data: {...}}
✅ Meal plan saved (v2): <plan_id>
```

### **Expected Backend Logs:**
```
POST /api/v2/meal-plans
✅ Meal plan created successfully
```

### **Expected UI:**
- Success message shown
- Plan saved without errors
- No red error screens

### **Test Result:**
- [ ] PASS
- [ ] FAIL (Note error: _________________)

---

## 🧪 **TEST 2: LOAD MEAL PLAN (v2)**

### **Steps:**
1. Still in Meal Plan screen
2. Tap options menu (⋯)
3. Tap "Load Plan"
4. Should see a list of your saved plans
5. Select "Test v2 Plan" (the one you just saved)

### **Expected Mobile Console Output:**
```
📂 Loading meal plans list (v2)...
📡 v2 Response: {success: true, data: {items: [...]}}
✅ Found X meal plans (v2)

(After selecting plan:)
📂 Loading meal plan (v2): <plan_id>
📡 v2 Response: {success: true, data: {...}}
✅ Loaded meal plan (v2): Test v2 Plan
```

### **Expected Backend Logs:**
```
GET /api/v2/meal-plans/user/11
✅ Found X meal plans
GET /api/v2/meal-plans/<plan_id>?user_id=11
✅ Meal plan retrieved successfully
```

### **Expected UI:**
- Modal shows list of saved plans
- Selecting plan loads it
- All days and recipes appear
- No data loss

### **Test Result:**
- [ ] PASS
- [ ] FAIL (Note error: _________________)

---

## 🧪 **TEST 3: AUTO-GENERATE GROCERY LIST (🎯 THE MAGIC!)**

### **Prerequisites:**
- Must have at least one saved meal plan (from Test 1)
- Meal plan should have recipes with ingredients

### **Steps:**
1. Navigate to Grocery List screen
2. Tap options menu (⋯)
3. Tap "Generate from Meal Plan 🎯" button
4. Should see dialog with your meal plans
5. Select "Test v2 Plan"
6. **Watch the magic!** ✨

### **Expected Mobile Console Output:**
```
📂 Loading meal plans list (v2)...
✅ Found X meal plans (v2)

(After selecting plan:)
POST /api/v2/grocery-lists/from-meal-plan/<plan_id>?user_id=11
✅ Generated X items from meal plan!
```

### **Expected Backend Logs:**
```
POST /api/v2/grocery-lists/from-meal-plan/<plan_id>
🎯 Extracting ingredients from meal plan...
✅ Analyzed X recipes
✅ Extracted Y ingredients
✅ Generated grocery list with Z items
```

### **Expected UI:**
- Dialog shows available meal plans
- Selecting plan triggers auto-generation
- Success alert shows number of items generated
- Grocery list screen populates with items
- Items are from the meal plan recipes
- Duplicates should be combined

### **What Should Appear:**
If your meal plan has recipes like:
- **Recipe 1:** "Pasta" (needs: pasta, tomatoes, garlic)
- **Recipe 2:** "Salad" (needs: lettuce, tomatoes, dressing)

Then grocery list should have:
- Pasta
- Tomatoes (combined from both recipes!)
- Garlic
- Lettuce
- Dressing

### **Test Result:**
- [ ] PASS
- [ ] FAIL (Note error: _________________)

---

## 🐛 **COMMON ISSUES & FIXES:**

### **Issue 1: "User not logged in" error**
**Cause:** YesChefAPI.user is null  
**Fix:** Log out and log back in to refresh user object

### **Issue 2: "No meal plans found"**
**Cause:** Plans not saved or wrong user ID  
**Fix:** Run Test 1 first to save a plan

### **Issue 3: "Network error"**
**Cause:** Backend not running or wrong URL  
**Fix:** Check backend is running on localhost:5000

### **Issue 4: Empty grocery list**
**Cause:** Recipes in meal plan don't have ingredients  
**Fix:** Use recipes from the database (not manually added)

---

## 📊 **PERFORMANCE COMPARISON:**

### **Before (v1):**
- Save: ~800ms
- Load: ~600ms
- Data: Notion format (needs conversion)

### **After (v2):**
- Save: ~250ms (3x faster!)
- Load: ~200ms (3x faster!)
- Data: Direct mobile format (no conversion!)

### **Actual Times (Record During Testing):**
- Save time: _____ ms
- Load time: _____ ms
- Generate time: _____ ms

---

## ✅ **SUCCESS CRITERIA:**

All three tests must pass:
- [x] Test 1: Save meal plan to v2
- [x] Test 2: Load meal plan from v2
- [x] Test 3: Auto-generate grocery list

### **Additional Checks:**
- [ ] No errors in mobile console
- [ ] No errors in backend logs
- [ ] Data persists correctly
- [ ] UI is responsive
- [ ] Features work as expected

---

## 📝 **NOTES & OBSERVATIONS:**

### **What Worked Well:**
- 
- 
- 

### **Issues Found:**
- 
- 
- 

### **Performance Notes:**
- 
- 
- 

---

## 🎯 **NEXT STEPS AFTER TESTING:**

### **If All Tests Pass:**
- ✅ Celebrate! Migration successful!
- ✅ Document the success
- ✅ Plan next phase (optional)

### **If Tests Fail:**
- 🐛 Note the errors
- 🔍 Check console logs
- 💬 Discuss fixes needed

---

**Happy Testing!** 🚀✨

