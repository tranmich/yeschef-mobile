import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleDraggableList } from '../components/DragSystem';
import YesChefAPI from '../services/YesChefAPI';
import OfflineSyncManager from '../services/OfflineSyncManager';
import MobileGroceryAdapter from '../services/MobileGroceryAdapter';

export default function GroceryListScreen() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, isSyncing: false });
  
  // List management state
  const [listTitle, setListTitle] = useState('My Grocery List');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // Backend integration state
  const [currentBackendList, setCurrentBackendList] = useState(null);
  const [availableLists, setAvailableLists] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Initialize grocery list
  useEffect(() => {
    initializeGroceryList();
  }, []);

    const initializeGroceryList = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading grocery lists from backend...');
      
      // Load available grocery lists from backend
      const listsResult = await YesChefAPI.getGroceryLists();
      
      if (listsResult.success && listsResult.lists.length > 0) {
        console.log(`📋 Found ${listsResult.lists.length} grocery lists`);
        setAvailableLists(listsResult.lists);
        
        // Load the most recent list
        const mostRecentList = listsResult.lists[0];
        await loadGroceryListById(mostRecentList.id);
        
      } else {
        console.log('📋 No grocery lists found, starting with empty list');
        setGroceryItems([]);
        setListTitle('My Grocery List');
        setCurrentBackendList(null);
        setAvailableLists([]);
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize grocery list:', error);
      // Fallback to empty list
      setGroceryItems([]);
      setListTitle('My Grocery List');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroceryListById = async (listId) => {
    try {
      console.log(`🔄 Loading grocery list details for ID: ${listId}`);
      
      const listResult = await YesChefAPI.getGroceryListDetails(listId);
      
      if (listResult.success) {
        const backendList = listResult.list;
        console.log('📋 Backend list loaded:', backendList.list_name);
        
        // Convert backend data to mobile format
        const mobileItems = MobileGroceryAdapter.backendToMobile(backendList);
        console.log(`✅ Converted to ${mobileItems.length} mobile items`);
        
        setGroceryItems(mobileItems);
        setListTitle(backendList.list_name || 'Grocery List');
        setCurrentBackendList(backendList);
        
        // Get conversion summary for user info
        const summary = MobileGroceryAdapter.getConversionSummary(mobileItems, backendList);
        console.log('📊 Conversion summary:', summary);
        
      } else {
        console.error('❌ Failed to load grocery list details:', listResult.error);
      }
      
    } catch (error) {
      console.error('❌ Error loading grocery list:', error);
    }
  };

    // Simple add item function
  const addItem = () => {
    if (!newItem.trim()) return;

    const newGroceryItem = {
      id: Date.now().toString(),
      name: newItem.trim(),
      checked: false,
    };

    setGroceryItems(prev => [...prev, newGroceryItem]);
    setNewItem('');
    autoSave(); // Auto-save when items are added
  };

  // Simple toggle function
  const toggleItem = (id) => {
    setGroceryItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
    autoSave(); // Auto-save when items are checked/unchecked
  };

  // Simple delete function without confirmation dialog
  const deleteItem = (id) => {
    setGroceryItems(prev => prev.filter(item => item.id !== id));
    autoSave(); // Auto-save when items are deleted
  };

  // Edit item name inline
  const updateItemName = (itemId, newName) => {
    setGroceryItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, name: newName } : item
      )
    );
    autoSave(); // Auto-save when item names are changed
  };

  // Handle drag and drop reordering
  const handleReorder = (newItems) => {
    setGroceryItems(newItems);
    autoSave(); // Auto-save when items are reordered
    console.log('🔄 Items reordered:', newItems.map(item => item.name));
  };

  // Save current mobile list back to backend
  const saveToBackend = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      console.log('💾 Saving grocery list to backend...');
      
      // Convert mobile data back to backend format
      const backendData = MobileGroceryAdapter.mobileToBackend(
        groceryItems, 
        currentBackendList, 
        listTitle
      );
      
      let result;
      if (currentBackendList && currentBackendList.id) {
        // Update existing list
        result = await YesChefAPI.updateGroceryList(currentBackendList.id, backendData);
      } else {
        // Create new list
        result = await YesChefAPI.saveGroceryList(backendData);
      }
      
      if (result.success) {
        console.log('✅ Grocery list saved successfully');
        setLastSaved(new Date());
        
        // If it was a new list, update our current backend reference
        if (!currentBackendList && result.list) {
          setCurrentBackendList(result.list);
        }
        
        return { success: true };
      } else {
        console.error('❌ Failed to save grocery list:', result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ Error saving grocery list:', error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when items change (debounced)
  const [saveTimeout, setSaveTimeout] = useState(null);
  
  const autoSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const timeout = setTimeout(() => {
      saveToBackend();
    }, 2000); // Auto-save 2 seconds after last change
    
    setSaveTimeout(timeout);
  };
  
  // Show dialog to load different grocery lists
  const showLoadListDialog = () => {
    // Simple alert with list of available lists for now
    if (availableLists.length === 0) {
      Alert.alert('No Lists', 'No grocery lists found. Create some lists first!');
      return;
    }
    
    const listOptions = availableLists.map(list => ({
      text: list.list_name || `List ${list.id}`,
      onPress: () => loadGroceryListById(list.id)
    }));
    
    listOptions.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert(
      'Load Grocery List',
      'Choose a list to load:',
      listOptions
    );
  };
  
  // Create a new empty list
  const createNewList = () => {
    Alert.alert(
      'New List',
      'Create a new grocery list? Unsaved changes will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create New',
          onPress: () => {
            setGroceryItems([]);
            setListTitle('New Grocery List');
            setCurrentBackendList(null);
            setLastSaved(null);
          }
        }
      ]
    );
  };
  
  const completedCount = groceryItems.filter(item => item.checked).length;
  const totalCount = groceryItems.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with editable title and options menu */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {isEditingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={listTitle}
              onChangeText={setListTitle}
              onBlur={() => {
                setIsEditingTitle(false);
                autoSave(); // Save title changes
              }}
              onSubmitEditing={() => {
                setIsEditingTitle(false);
                autoSave(); // Save title changes
              }}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={styles.title}>{listTitle}</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.itemCount}>
            {completedCount} of {totalCount} items
          </Text>
        </View>
        
        {/* Options Menu Button */}
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => setShowOptionsMenu(!showOptionsMenu)}
        >
          <Text style={styles.optionsIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Options Menu Dropdown */}
      {showOptionsMenu && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowOptionsMenu(false);
              saveToBackend();
            }}
          >
            <Text style={styles.menuIcon}>💾</Text>
            <Text style={styles.menuText}>Save Now</Text>
            {isSaving && <ActivityIndicator size="small" color="#3b82f6" />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowOptionsMenu(false);
              showLoadListDialog();
            }}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>Load List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowOptionsMenu(false);
              createNewList();
            }}
          >
            <Text style={styles.menuIcon}>➕</Text>
            <Text style={styles.menuText}>New List</Text>
          </TouchableOpacity>
          
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowOptionsMenu(false);
              initializeGroceryList();
            }}
          >
            <Text style={styles.menuIcon}>🔄</Text>
            <Text style={styles.menuText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sync Status Indicator */}
      <View style={styles.syncStatus}>
        {isSaving ? (
          <View style={styles.syncIndicator}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.syncText}>Saving...</Text>
          </View>
        ) : lastSaved ? (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>✅ Saved {lastSaved.toLocaleTimeString()}</Text>
          </View>
        ) : currentBackendList ? (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>📋 {currentBackendList.list_name}</Text>
          </View>
        ) : (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>📱 Local list</Text>
          </View>
        )}
      </View>

      {/* Add Item Section */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Add new item..."
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Simple Grocery List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your grocery list is empty</Text>
          <Text style={styles.emptySubtext}>Add items above to get started</Text>
        </View>
      ) : (
        <SimpleDraggableList
          data={groceryItems.sort((a, b) => a.checked - b.checked)} // Sort unchecked first
          keyExtractor={(item) => item.id}
          onReorder={handleReorder}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                onPress={() => toggleItem(item.id)}
              >
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              
              {editingItemId === item.id ? (
                <TextInput
                  style={styles.itemEditInput}
                  value={item.name}
                  onChangeText={(text) => updateItemName(item.id, text)}
                  onBlur={() => setEditingItemId(null)}
                  onSubmitEditing={() => setEditingItemId(null)}
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity 
                  style={styles.itemTextContainer}
                  onPress={() => setEditingItemId(item.id)}
                >
                  <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => deleteItem(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fafbfc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingVertical: 4,
  },
  optionsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginLeft: 12,
  },
  optionsIcon: {
    fontSize: 18,
    color: '#374151',
    fontWeight: 'bold',
  },
  optionsMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  syncStatus: {
    marginTop: 8,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  addSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
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
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8, // Adjusted for smaller drag handle
    paddingRight: 16, // Keep right padding for delete button
    paddingVertical: 3, // Keep compact vertical spacing
    backgroundColor: '#ffffff',
    minHeight: 44, // Ensure consistent height
    // Removed borderBottomWidth and borderBottomColor for cleaner look
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 4,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  itemEditInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingVertical: 4,
    marginRight: 12,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
});