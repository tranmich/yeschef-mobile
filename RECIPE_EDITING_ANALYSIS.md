# 📝 Recipe Editing System - Import Flow Analysis

**Date:** October 28, 2025

---

## 🎯 **HOW EDITING WORKS IN IMPORT PHASE**

### **Components Used:**

1. **RecipeImportReviewScreen.js** - Main screen
2. **FullScreenEditor.js** - Modal editor component

---

## 🔧 **EDITING ARCHITECTURE**

### **1. State Management**

```javascript
// Editor visibility & configuration
const [showEditor, setShowEditor] = useState(false);
const [editorConfig, setEditorConfig] = useState({
  type: 'title',      // What type of field
  title: 'Edit Title', // Modal title
  field: 'title',      // Which recipe field to edit
  value: '',           // Current value
  multiline: false     // Single vs multi-line
});
```

### **2. Opening the Editor**

```javascript
const openEditor = (type, field, title, multiline = true) => {
  const value = recipe[field];
  
  setEditorConfig({
    type,
    title,
    field,
    value: Array.isArray(value) ? value.join('\n') : (value || ''),
    multiline
  });
  setShowEditor(true);
};
```

**Usage Examples:**
```javascript
// Edit title (single line)
openEditor('title', 'title', 'Edit Title', false)

// Edit description (multi-line)
openEditor('description', 'description', 'Edit Description', true)

// Edit ingredients (multi-line array)
openEditor('ingredients', 'ingredients', 'Edit Ingredients', true)

// Edit instructions (multi-line array)
openEditor('instructions', 'instructions', 'Edit Instructions', true)
```

### **3. Saving Edits**

```javascript
const handleEditorSave = (newValue) => {
  const { field } = editorConfig;
  
  // Handle array fields (ingredients, instructions)
  if (field === 'ingredients' || field === 'instructions') {
    const arrayValue = newValue
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());
    
    setRecipe(prev => ({
      ...prev,
      [field]: arrayValue
    }));
  } else {
    // Handle simple string fields
    setRecipe(prev => ({
      ...prev,
      [field]: newValue.trim()
    }));
  }
};
```

---

## 🎨 **UI PATTERN**

### **Edit Button Design:**

```javascript
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>📖 Recipe Title</Text>
  <TouchableOpacity 
    style={styles.editButton}
    onPress={() => openEditor('title', 'title', 'Edit Title', false)}
  >
    <Icon name="edit" size={16} color="#AAC6AD" /> {/* Mint color */}
    <Text style={styles.editButtonText}>Edit</Text>
  </TouchableOpacity>
</View>
```

**Button appears next to each section:**
- 📖 Recipe Title [Edit]
- 📝 Description [Edit]
- ⏱️ Recipe Info [Edit]
- 🥕 Ingredients [Edit]
- 👨‍🍳 Instructions [Edit]

---

## 📱 **FullScreenEditor Component**

### **Props:**
```javascript
<FullScreenEditor
  isVisible={showEditor}
  onClose={() => setShowEditor(false)}
  onSave={handleEditorSave}
  title={editorConfig.title}
  initialValue={editorConfig.value}
  multiline={editorConfig.multiline}
  editorType={editorConfig.type}
/>
```

### **Features:**
- ✅ Full-screen modal (clean, distraction-free)
- ✅ Auto-focus on text input
- ✅ Cancel button (discards changes)
- ✅ Save button (mint green when valid)
- ✅ Handles both single-line and multi-line
- ✅ Smart placeholders based on field type
- ✅ Keyboard-aware (doesn't hide behind keyboard)

### **User Experience:**
1. User taps "Edit" button
2. Full-screen editor slides up
3. Current value pre-filled
4. User edits text
5. Tap "Save" → Changes applied immediately
6. Tap "Cancel" → Changes discarded

---

## 🎯 **FIELD TYPES**

### **1. Single-Line Fields:**
```javascript
openEditor('title', 'title', 'Edit Title', false)
```
- Title
- Prep time (individual)
- Cook time (individual)
- Servings (individual)

### **2. Multi-Line Text:**
```javascript
openEditor('description', 'description', 'Edit Description', true)
```
- Description

### **3. Multi-Line Arrays:**
```javascript
openEditor('ingredients', 'ingredients', 'Edit Ingredients', true)
```
- Ingredients (one per line)
- Instructions (one per line)

### **4. Special: Recipe Info:**
```javascript
// Handles multiple fields at once
const infoText = `Prep Time: ${recipe.prep_time || ''}\nCook Time: ${recipe.cook_time || ''}\nServings: ${recipe.servings || ''}`;
openEditor('info', 'info', 'Edit Recipe Info', true)
```

---

## 🔄 **DATA FLOW**

```
User taps [Edit] 
  → openEditor() called
  → setEditorConfig() with field details
  → setShowEditor(true)
  → FullScreenEditor modal appears
  
User edits text
  → Text stored in FullScreenEditor state
  
User taps Save
  → onSave() callback with new value
  → handleEditorSave() processes value
  → setRecipe() updates recipe state
  → Modal closes
  
Recipe state updated
  → UI re-renders with new values
  → Changes visible immediately
```

---

## 🎨 **STYLING NOTES**

### **Edit Button:**
```javascript
editButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
  backgroundColor: 'rgba(170, 198, 173, 0.1)', // Mint tint
},
editButtonText: {
  marginLeft: 4,
  fontSize: 14,
  color: '#AAC6AD', // Mint color
  fontFamily: 'Nunito-SemiBold',
}
```

### **Section Header:**
```javascript
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
}
```

---

## 🚀 **TO ADD TO RECIPE VIEW**

### **What We Need:**

1. **Import FullScreenEditor component** ✅ (already exists)
2. **Add editor state variables** (showEditor, editorConfig)
3. **Add openEditor() function**
4. **Add handleEditorSave() function**
5. **Add [Edit] buttons to each section** in Recipe View UI
6. **Render FullScreenEditor modal**
7. **Call API to save recipe after edits** (updateRecipe)

### **Differences from Import:**
- Import: Editing temporary/unsaved recipe
- **Recipe View: Editing saved recipe → Must call API to persist!**

---

## 📋 **RECIPE VIEW SECTIONS TO ADD EDITING:**

1. ✅ **Title** - Single line
2. ✅ **Description** - Multi-line
3. ✅ **Prep Time** - Part of info
4. ✅ **Cook Time** - Part of info
5. ✅ **Servings** - Part of info
6. ✅ **Ingredients** - Multi-line array
7. ✅ **Instructions** - Multi-line array

---

## 💡 **KEY DECISIONS FOR RECIPE VIEW:**

### **Option 1: Save on Each Edit** (Recommended)
- User edits field → Save immediately to backend
- Simple, no "discard changes" needed
- Matches modern app behavior

### **Option 2: Edit Mode with Bulk Save**
- Enter "Edit Mode"
- Make multiple changes
- Save all at once
- More traditional, but extra steps

**Recommend Option 1** for consistency with grocery list auto-save!

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Add Editing Infrastructure** (5 min)
1. Add state variables
2. Add openEditor() function
3. Add handleEditorSave() function
4. Import FullScreenEditor component

### **Phase 2: Add Edit Buttons to UI** (10 min)
1. Add edit button to title section
2. Add edit button to description section
3. Add edit button to recipe info section
4. Add edit button to ingredients section
5. Add edit button to instructions section

### **Phase 3: Wire Up Save to API** (5 min)
1. Call YesChefAPI.updateRecipe() after edits
2. Show toast notification
3. Update local state

### **Phase 4: Test** (5 min)
1. Test each field type
2. Verify API saves
3. Test cancel functionality

**Total Time: ~25 minutes**

---

## ✅ **BENEFITS OF THIS APPROACH**

- ✅ **Proven pattern** - Already works in Import
- ✅ **Consistent UX** - Same editing experience
- ✅ **Clean code** - Reusable FullScreenEditor
- ✅ **Mobile-optimized** - Full-screen, keyboard-aware
- ✅ **User-friendly** - Clear, simple workflow

---

Ready to implement this in Recipe View! 🚀
