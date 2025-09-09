import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
// 🔄 NEW: Simplified drag system to fix timing issues
import { SimpleDraggableList } from '../components/SimpleDragSystem';
import YesChefAPI from '../services/YesChefAPI';
import OfflineSyncManager from '../services/OfflineSyncManager';

export default function GroceryListScreen() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, isSyncing: false });
  
  // 🎯 NEW: List management state
  const [listTitle, setListTitle] = useState('Untitled');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    'Produce': true,
    'Meat & Seafood': true,
    'Pantry': true,
    'Other': true,
    'Hidden': false  // Hidden section collapsed by default
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Initialize and load grocery list
  useEffect(() => {
    initializeGroceryList();
    setupSyncListener();
  }, []);

  const initializeGroceryList = async () => {
    try {
      // Initialize offline sync manager
      await OfflineSyncManager.initialize();
      
      // Try to load from backend first if online
      if (OfflineSyncManager.getStatus().isOnline) {
        const result = await YesChefAPI.getGroceryLists();
        if (result.success && result.lists.length > 0) {
          // Use the most recent grocery list
          const currentList = result.lists[0];
          setGroceryItems(currentList.items || []);
          
          // Cache locally for offline use
          await OfflineSyncManager.saveGroceryListOffline({
            id: currentList.id,
            items: currentList.items || [],
            name: currentList.name || 'My Grocery List',
          });
        } else {
          // No lists on backend, try local
          await loadLocalGroceryList();
        }
      } else {
        // Offline, load from local storage
        await loadLocalGroceryList();
      }
    } catch (error) {
      console.error('Initialize grocery list error:', error);
      // Fallback to local storage
      await loadLocalGroceryList();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalGroceryList = async () => {
    const result = await OfflineSyncManager.loadGroceryListOffline();
    if (result.success && result.list) {
      setGroceryItems(result.list.items || []);
    }
  };

  const setupSyncListener = () => {
    const removeListener = OfflineSyncManager.addListener((event) => {
      const status = OfflineSyncManager.getStatus();
      setSyncStatus(status);
      
      switch (event.type) {
        case 'SYNC_COMPLETED':
          console.log('✅ Sync completed');
          break;
        case 'SYNC_ERROR':
          console.error('❌ Sync error:', event.error);
          break;
      }
    });

    return removeListener;
  };

  // 🎯 LOADING STATE CHECK - Early return if still loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading your grocery list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const addItem = async () => {
    if (newItem.trim()) {
      const newGroceryItem = {
        id: Date.now().toString(),
        name: newItem.trim(),
        checked: false,
        category: categorizeItem(newItem.trim()), // Smart categorization
        quantity: extractQuantity(newItem.trim()), // Extract quantity if present
      };
      
      const updatedItems = [...groceryItems, newGroceryItem];
      setGroceryItems(updatedItems);
      setNewItem('');
      
      // Use simplified local save for now
      await OfflineSyncManager.saveGroceryListOffline({
        id: 'current',
        items: updatedItems,
        name: listTitle,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const toggleItem = async (id) => {
    const updatedItems = groceryItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setGroceryItems(updatedItems);
    await saveGroceryList(updatedItems);
  };

  const deleteItem = (id) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = groceryItems.filter(item => item.id !== id);
            setGroceryItems(updatedItems);
            await saveGroceryList(updatedItems);
          },
        },
      ]
    );
  };

  const clearCompleted = () => {
    const completedCount = groceryItems.filter(item => item.checked).length;
    
    Alert.alert(
      'Clear Completed',
      `Remove ${completedCount} checked item${completedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = groceryItems.filter(item => !item.checked);
            setGroceryItems(updatedItems);
            await saveGroceryList(updatedItems);
          },
        },
      ]
    );
  };

  // Smart categorization based on your backend categories
  const categorizeItem = (itemName) => {
    const name = itemName.toLowerCase();
    
    // Produce
    if (name.match(/(apple|banana|orange|tomato|lettuce|spinach|carrot|onion|garlic|potato|avocado|lemon|lime)/)) {
      return 'Produce';
    }
    
    // Meat & Seafood
    if (name.match(/(chicken|beef|pork|fish|salmon|shrimp|turkey|lamb)/)) {
      return 'Meat & Seafood';
    }
    
    // Pantry
    if (name.match(/(rice|pasta|bread|flour|sugar|salt|pepper|oil|vinegar|sauce|spice)/)) {
      return 'Pantry';
    }
    
    return 'Other';
  };

  // Extract quantity from item name (e.g., "2 apples" -> "2")
  const extractQuantity = (itemName) => {
    const match = itemName.match(/^(\d+(?:\.\d+)?)\s+/);
    return match ? match[1] : '1';
  };

  // 🎯 NEW: Helper functions for new functionality
  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const updateItemName = (itemId, newName) => {
    setGroceryItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, name: newName } : item
      )
    );
  };

  const showCopyPasteMenu = (itemId) => {
    // TODO: Implement copy/paste menu
    console.log('Show copy/paste menu for item:', itemId);
  };

  // 👁️ Enhanced Hide Function - Move to Hidden Category
  const hideItem = (itemId) => {
    const itemToHide = groceryItems.find(item => item.id === itemId);
    if (!itemToHide) return;

    const updatedItem = { 
      ...itemToHide, 
      originalCategory: itemToHide.category, // Store original category
      category: 'Hidden',
      hiddenAt: new Date().toISOString() 
    };
    
    const newItems = groceryItems.map(item => 
      item.id === itemId ? updatedItem : item
    );
    
    setGroceryItems(newItems);
    saveGroceryList(newItems);
    console.log(`👁️ Item moved to Hidden: ${itemToHide.name} (was in ${itemToHide.category})`);
  };

  };

  // 🌍 Cross-Category Movement Handler
  const handleCrossCategoryMove = (draggedItem, fromCategory, targetIndex) => {
    console.log(`🌍 CROSS-CATEGORY: Moving ${draggedItem.name} from ${fromCategory}`);
    
    // For now, just move to the next category if dragged down far enough
    const currentCategoryIndex = categoryOrder.indexOf(fromCategory);
    const targetCategory = targetIndex > 5 ? // Dragged far down
      (categoryOrder[currentCategoryIndex + 1] || 'Other') :
      (categoryOrder[currentCategoryIndex - 1] || 'Produce'); // Dragged far up
    
    console.log(`🎯 Moving to category: ${targetCategory}`);
    
    // Update the item's category
    const newItems = groceryItems.map(item => 
      item.id === draggedItem.id ? 
        { ...item, category: targetCategory } : 
        item
    );
    
    setGroceryItems(newItems);
    saveGroceryList(newItems);
  };

  // 🔄 Unhide Function - Move Back to Original Category
  const unhideItem = (itemId) => {
    const itemToUnhide = groceryItems.find(item => item.id === itemId);
    if (!itemToUnhide) return;

    // Restore to original category or default to 'Other'
    const targetCategory = itemToUnhide.originalCategory || 'Other';

    const updatedItem = { 
      ...itemToUnhide, 
      category: targetCategory,
      originalCategory: undefined, // Clear the stored category
      hiddenAt: undefined 
    };
    
    const newItems = groceryItems.map(item => 
      item.id === itemId ? updatedItem : item
    );
    
    setGroceryItems(newItems);
    saveGroceryList(newItems);
    console.log(`🔄 Item unhidden to ${targetCategory}: ${itemToUnhide.name}`);
  };

  const removeItem = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const updatedItems = groceryItems.filter(item => item.id !== itemId);
            setGroceryItems(updatedItems);
            await saveGroceryList(updatedItems);
            console.log('✅ Item removed:', itemId);
          }
        }
      ]
    );
  };

  // 🎯 NEW: Unified add function for the + button
  const addGroceryItem = () => {
    if (newItem.trim()) {
      addItem(); // Use existing addItem function
    }
  };

  // 🎯 NEW: Save & Load Functions
  const saveGroceryList = async () => {
    try {
      setShowOptionsMenu(false);
      
      Alert.prompt(
        'Save Grocery List',
        'Enter a name for this grocery list:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save', 
            onPress: async (name) => {
              if (name && name.trim()) {
                const listData = {
                  name: name.trim(),
                  items: groceryItems,
                  created_at: new Date().toISOString()
                };
                
                const result = await YesChefAPI.saveGroceryList(listData);
                if (result.success) {
                  setListTitle(name.trim());
                  Alert.alert('Success', 'Grocery list saved successfully!');
                } else {
                  Alert.alert('Error', result.error || 'Failed to save grocery list');
                }
              }
            }
          }
        ],
        'plain-text',
        listTitle === 'Untitled' ? '' : listTitle
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save grocery list');
    }
  };

  const loadGroceryList = async () => {
    try {
      setShowOptionsMenu(false);
      
      const result = await YesChefAPI.getGroceryLists();
      if (result.success && result.lists.length > 0) {
        const listNames = result.lists.map(list => list.name);
        
        Alert.alert(
          'Load Grocery List',
          'Select a list to load:',
          [
            { text: 'Cancel', style: 'cancel' },
            ...result.lists.map(list => ({
              text: list.name,
              onPress: () => {
                setGroceryItems(list.items || []);
                setListTitle(list.name);
                Alert.alert('Success', `Loaded "${list.name}" successfully!`);
              }
            }))
          ]
        );
      } else {
        Alert.alert('No Lists', 'No saved grocery lists found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load grocery lists');
    }
  };

  const shareGroceryList = () => {
    setShowOptionsMenu(false);
    // TODO: Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const generateFromMealPlan = async () => {
    setShowOptionsMenu(false);
    
    try {
      // TODO: Connect to meal plan API
      Alert.alert('Generate from Meal Plan', 'This feature will connect to your meal plan and automatically add ingredients.');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate from meal plan');
    }
  };

  // 🎯 NEW: Drag and Drop Functions
  const handleDragEnd = ({ data }) => {
    setGroceryItems(data);
  };

  const moveSection = (fromIndex, toIndex) => {
    const newOrder = [...categoryOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    // TODO: Update category order state
    console.log('Move section:', moved, 'from', fromIndex, 'to', toIndex);
  };

  // 🎯 RENDER LOGIC INSIDE COMPONENT FUNCTION
  const completedCount = groceryItems.filter(item => item.checked).length;
  const totalCount = groceryItems.length;

  // 📂 Category order configuration
  const categoryOrder = ['Produce', 'Meat & Seafood', 'Pantry', 'Other', 'Hidden'];

  // Group items by category for better organization
  const groupedItems = groceryItems.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      {/* 🎯 NEW: Redesigned Header - List Title & Options */}
      <View style={styles.newHeader}>
        <View style={styles.titleRow}>
          {isEditingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={listTitle}
              onChangeText={setListTitle}
              onBlur={() => setIsEditingTitle(false)}
              onSubmitEditing={() => setIsEditingTitle(false)}
              returnKeyType="done"
              blurOnSubmit={true}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={styles.listTitle}>{listTitle}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
          >
            <Text style={styles.optionsIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.itemCount}>
          {completedCount} of {totalCount} items
        </Text>

        {/* 🎯 NEW: Options Menu (Save, Load, Share, Generate) */}
        {showOptionsMenu && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={saveGroceryList}>
              <Text style={styles.optionIcon}>💾</Text>
              <Text style={styles.optionText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={loadGroceryList}>
              <Text style={styles.optionIcon}>📂</Text>
              <Text style={styles.optionText}>Load</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={shareGroceryList}>
              <Text style={styles.optionIcon}>📤</Text>
              <Text style={styles.optionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={generateFromMealPlan}>
              <Text style={styles.optionIcon}>📅</Text>
              <Text style={styles.optionText}>Generate from Meal Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 🎯 NEW: Sticky Search & Add Section */}
      <View style={styles.stickySearchSection}>
        <TextInput
          style={styles.searchInput}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Search or add new item..."
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
          onSubmitEditing={addGroceryItem}
          blurOnSubmit={true}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addGroceryItem}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 🎯 NEW: Redesigned Grocery List with Collapsible Sections */}
      <ScrollView style={styles.listContainer}>
        {totalCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your grocery list is empty</Text>
            <Text style={styles.emptySubtext}>
              Add items above to get started
            </Text>
          </View>
        ) : (
          categoryOrder.map(category => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;
            const isExpanded = expandedSections[category];

            return (
              <View key={category} style={styles.categorySection}>
                {/* 🎯 NEW: Collapsible Section Header */}
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(category)}
                  onLongPress={() => console.log('Move section:', category)}
                >
                  <Text style={styles.sectionTitle}>
                    {category === 'Hidden' ? '👁️‍🗨️ ' : ''}
                    {category}
                  </Text>
                  <Text style={[styles.sectionArrow, !isExpanded && styles.sectionArrowCollapsed]}>
                    ▼
                  </Text>
                </TouchableOpacity>

                {/* 🔄 SIMPLE: Enhanced Drag & Drop Section Content */}
                {isExpanded && (
                  <SimpleDraggableList
                    data={items.sort((a, b) => a.checked - b.checked)}
                    renderItem={({ item, index }) => (
                      <View style={[styles.newItem, item.checked && styles.newItemChecked]}>
                        {/* Checkbox */}
                        <TouchableOpacity
                          style={[styles.newCheckbox, item.checked && styles.newCheckboxChecked]}
                          onPress={() => toggleItem(item.id)}
                        >
                          {item.checked && <Text style={styles.newCheckmark}>✓</Text>}
                        </TouchableOpacity>

                        {/* 🎯 DRAG HANDLE + Item Name */}
                        <View style={styles.itemNameContainer}>
                          {editingItemId === item.id ? (
                            <TextInput
                              style={styles.itemNameInput}
                              value={item.name}
                              onChangeText={(text) => updateItemName(item.id, text)}
                              onBlur={() => setEditingItemId(null)}
                              onSubmitEditing={() => setEditingItemId(null)}
                              returnKeyType="done"
                              blurOnSubmit={true}
                              autoFocus
                              selectTextOnFocus
                            />
                          ) : (
                            <TouchableOpacity
                              style={styles.itemNameTouchable}
                              onPress={() => setEditingItemId(item.id)}
                            >
                              <Text style={[styles.newItemText, item.checked && styles.newItemTextChecked]}>
                                {item.name}
                              </Text>
                              {/* 🚫 REMOVED: Clutter-reducing - no more drag indicators */}
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Right Actions: Conditional Hide/Unhide & Remove */}
                        <View style={styles.itemActions}>
                          {category === 'Hidden' ? (
                            // Hidden items: Show Unhide button
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => unhideItem(item.id)}
                            >
                              <Text style={styles.actionIcon}>🔄</Text>
                            </TouchableOpacity>
                          ) : (
                            // Regular items: Show Hide button
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => hideItem(item.id)}
                            >
                              <Text style={styles.actionIcon}>👁️</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => removeItem(item.id)}
                          >
                            <Text style={styles.actionIcon}>−</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    onReorder={(newItems) => {
                      // Update the specific category's items
                      const newGroupedItems = { ...groupedItems };
                      newGroupedItems[category] = newItems;
                      
                      // Flatten back to groceryItems array
                      const newGroceryItems = categoryOrder.reduce((acc, cat) => {
                        return acc.concat(newGroupedItems[cat] || []);
                      }, []);
                      
                      setGroceryItems(newGroceryItems);
                      
                      // Save to backend
                      saveGroceryList(newGroceryItems);
                    }}
                    keyExtractor={(item) => item.id}
                    style={styles.sectionContent}
                  />
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Clear completed button */}
      {completedCount > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearCompleted}>
          <Text style={styles.clearButtonText}>
            Clear {completedCount} completed item{completedCount > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  // 🎯 NEW: Redesigned Header Styles
  newHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 2,
    minWidth: 200,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  optionsIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  optionsMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
    minWidth: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
  },
  // 🎯 NEW: Sticky Search Section
  stickySearchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#10b981',
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  // 🎯 NEW: Collapsible Section Styles
  categorySection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionArrow: {
    fontSize: 12,
    color: '#6b7280',
    transform: [{ rotate: '0deg' }],
  },
  sectionArrowCollapsed: {
    transform: [{ rotate: '-90deg' }],
  },
  sectionContent: {
    backgroundColor: '#ffffff',
  },
  // 🎯 NEW: Redesigned Item Styles
  newItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  newItemChecked: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  draggingItem: {
    backgroundColor: '#e0f2fe',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  newCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCheckboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  newCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemNameTouchable: {
    paddingVertical: 4,
  },
  itemNameInput: {
    fontSize: 16,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingVertical: 4,
  },
  newItemText: {
    fontSize: 16,
    color: '#111827',
  },
  newItemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  // 🎯 NEW: Drag & Drop Styles
  dragHandleArea: {
    flex: 1,
  },
  itemNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dragIndicator: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
    lineHeight: 12,
  },
  dragHandleContainer: {
    padding: 4,
    marginLeft: 8,
  },
  draggingItem: {
    backgroundColor: '#e0f2fe',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  // Keep existing useful styles
  listContainer: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  clearButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
