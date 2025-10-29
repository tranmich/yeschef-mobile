import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
  ImageBackground,
  StatusBar,
  Animated,
} from 'react-native';
import { Icon, IconButton } from '../components/IconLibrary';
import { ThemedText, typography } from '../components/Typography';
// ï¿½ BACK TO SMOOTH: LightweightDragSystem with driver conflict FIXED
import { SimpleDraggableList } from '../components/LightweightDragSystem';
// REGRESSION: import { SimpleDraggableList } from '../components/UltraSmoothDragSystem'; // (Lost smooth swapping)
// FALLBACK: import { SimpleDraggableList } from '../components/DragSystem';
import YesChefAPI from '../services/YesChefAPI';
import FriendsAPI from '../services/FriendsAPI';
import OfflineSyncManager from '../services/OfflineSyncManager';
import MobileGroceryAdapter from '../services/MobileGroceryAdapter';
// ðŸ”„ MEAL PLAN INTEGRATION - For generate feature
import MealPlanAPI from '../services/MealPlanAPI';

export default function GroceryListScreen({ route, navigation }) {
  // ðŸŽ¨ Background Configuration (matches other screens)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/mintbackground.jpg');
  
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, isSyncing: false });
  
  // List management state
  const [listTitle, setListTitle] = useState('My Grocery List');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingText, setEditingText] = useState(''); // Store editing text separately
  
  // Track editing state changes
  const setEditingItemIdWithDebug = (itemId) => {
    setEditingItemId(itemId);
    
    // When starting to edit, store the current text
    if (itemId && !editingItemId) {
      const item = groceryItems.find(item => item.id === itemId);
      if (item) {
        setEditingText(item.name);
      }
    }
    
    // When finishing editing, update the actual item
    if (!itemId && editingItemId) {
      setGroceryItems(prev => 
        prev.map(item => 
          item.id === editingItemId ? { ...item, name: editingText } : item
        )
      );
      setEditingText('');
    }
  };
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // Backend integration state
  const [currentBackendList, setCurrentBackendList] = useState(null);
  const [availableLists, setAvailableLists] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // ï¿½ FIX: Use ref to always get latest state (avoid stale closures)
  const groceryItemsRef = useRef(groceryItems);
  useEffect(() => {
    groceryItemsRef.current = groceryItems;
  }, [groceryItems]);
  
  // ï¿½ðŸ” DEBUG: Track when groceryItems changes
  useEffect(() => {
    console.log(`ðŸ” GROCERY ITEMS STATE CHANGED: ${groceryItems.length} items at ${new Date().toLocaleTimeString()}`);
    console.log(`ðŸ“Š Items:`, groceryItems.map(i => i.name).join(', '));
  }, [groceryItems]);
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Saved âœ“');
  const toastAnimation = useRef(new Animated.Value(0)).current;

  // ðŸ†• Bulk import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportPreview, setBulkImportPreview] = useState([]);

  // Show toast notification
  const showToastNotification = (message = 'Saved âœ“') => {
    setToastMessage(message);
    setShowToast(true);
    
    // Gentle fade in
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 2.5 seconds
    setTimeout(() => {
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowToast(false);
      });
    }, 2500);
  };

  // ðŸ†• Smart grocery list parser
  const parseGroceryList = (text) => {
    if (!text || !text.trim()) return [];
    
    // Remove common headers
    text = text.replace(/^(shopping list|grocery list|to buy):?\s*/i, '');
    
    // Split by lines
    let items = text.split('\n');
    
    // If only one line, try comma split
    if (items.length === 1 && text.includes(',')) {
      items = text.split(',');
    }
    
    // Clean each item
    items = items
      .map(item => {
        // Remove common prefixes
        item = item
          .replace(/^[-â€¢*âž¤â–ºâ–ªï¸Žâ–«ï¸Ž]\s*/, '')     // Bullets
          .replace(/^\d+[\.)]\s*/, '')         // Numbers: 1. 2) 3.
          .replace(/^[\[\]âœ“âœ—â˜â˜‘]\s*/, '')      // Checkboxes
          .replace(/^\s*[-=]{2,}\s*$/, '')     // Separators
          .trim();
        
        // Remove quantity in parentheses at start
        // Example: "(2) Apples" -> "Apples"
        item = item.replace(/^\(\d+\)\s*/, '');
        
        return item;
      })
      .filter(item => {
        // Filter empty lines and separators
        return item.length > 0 && 
               !item.match(/^[-=_]{2,}$/) &&
               item.length < 200; // Sanity check
      });
    
    return items;
  };

  // ðŸ†• Handle bulk import
  const handleBulkImport = () => {
    console.log(`ðŸ“‹ Bulk importing ${bulkImportPreview.length} items`);
    
    bulkImportPreview.forEach(itemText => {
      const newItemObj = {
        id: Date.now() + Math.random(),
        name: itemText,
        checked: false,
      };
      setGroceryItems(prev => [...prev, newItemObj]);
    });
    
    // Close modal and clear state
    setShowBulkImportModal(false);
    setBulkImportText('');
    setBulkImportPreview([]);
    
    // Show success toast
    showToastNotification(`Added ${bulkImportPreview.length} items âœ“`);
    
    // Trigger auto-save
    setTimeout(() => autoSave(), 500);
  };

  // ðŸ†• Handle input change with multi-line paste detection
  const handleNewItemChange = (text) => {
    // Check if text contains line breaks (multi-line paste)
    if (text.includes('\n')) {
      const items = parseGroceryList(text);
      
      if (items.length > 1) {
        console.log(`ðŸ“‹ Multi-line paste detected: ${items.length} items`);
        // Show preview in modal instead of adding directly
        setBulkImportText(text);
        setBulkImportPreview(items);
        setShowBulkImportModal(true);
        setNewItem(''); // Clear input
        return;
      }
    }
    
    // Normal single-line input
    setNewItem(text);
  };

  // Initialize grocery list
  useEffect(() => {
    // Check for generated grocery list first
    if (global.tempGeneratedGroceryList) {
      console.log('ðŸ“‹ Loading generated list on focus:', global.tempGeneratedGroceryList.items.length, 'items');
      
      // ðŸ”§ FIX: Ensure all items have unique IDs!
      const itemsWithIds = global.tempGeneratedGroceryList.items.map((item, index) => ({
        ...item,
        id: item.id || `generated-${Date.now()}-${index}`, // Generate unique ID if missing
        checked: item.checked || false
      }));
      
      console.log('âœ… Added IDs to generated items');
      
      // Load the generated items
      setGroceryItems(itemsWithIds);
      setListTitle(global.tempGeneratedGroceryList.title);
      
      // Store item count before clearing
      const itemCount = itemsWithIds.length;
      
      // Clear the temporary list after loading
      global.tempGeneratedGroceryList = null;
      
      setIsLoading(false);
      
      // Show success message
      setTimeout(() => {
        Alert.alert(
          'Generated Grocery List Loaded!', 
          `Loaded ${itemCount} items from meal plan.`
        );
      }, 500);
      
    } else if (route?.params?.generatedItems) {
      // Handle navigation parameters (fallback)
      console.log('ðŸ“‹ Loading grocery list via navigation params');
      
      setGroceryItems(route.params.generatedItems);
      if (route.params.listTitle) {
        setListTitle(route.params.listTitle);
      }
      setIsLoading(false);
      
    } else {
      // Normal initialization - load saved lists
      initializeGroceryList();
    }
  }, []);

  // Check for generated grocery list whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Ensure status bar is set correctly when screen is focused
      StatusBar.setBarStyle('dark-content', true);
      
      if (global.tempGeneratedGroceryList) {
        console.log('ðŸ“‹ Loading generated list on focus:', global.tempGeneratedGroceryList.items.length, 'items');
        
        // Load the generated items
        setGroceryItems(global.tempGeneratedGroceryList.items);
        setListTitle(global.tempGeneratedGroceryList.title);
        
        // ðŸ”§ FIX: Set the backend list reference so auto-save updates instead of creating new
        if (global.tempGeneratedGroceryList.backendList) {
          console.log('âœ… Setting backend list reference from generated list:', global.tempGeneratedGroceryList.backendList.id);
          setCurrentBackendList(global.tempGeneratedGroceryList.backendList);
        } else {
          // ðŸ”„ If no backend list provided, try to find it by refreshing available lists
          console.log('âš ï¸ No backend list in generated data, will refresh lists to find it');
          YesChefAPI.getGroceryLists().then(result => {
            if (result.success && result.lists.length > 0) {
              // Find the most recent list (likely the one just generated)
              const mostRecent = result.lists[0];
              console.log('âœ… Found most recent list, setting as current:', mostRecent.id, mostRecent.name);
              setCurrentBackendList(mostRecent);
              setAvailableLists(result.lists);
            }
          });
        }
        
        // Store item count before clearing
        const itemCount = global.tempGeneratedGroceryList.items.length;
        
        // Clear the temporary list after loading
        global.tempGeneratedGroceryList = null;
        
        setIsLoading(false);
        
        // Show success message
        Alert.alert(
          'Generated Grocery List Loaded!', 
          `Loaded ${itemCount} items from meal plan.`
        );
      }
    }, [])
  );

    const initializeGroceryList = async () => {
    try {
      setIsLoading(true);
      console.log('ðŸ”„ Loading grocery lists from backend...');
      
      // Load available grocery lists from backend
      const listsResult = await YesChefAPI.getGroceryLists();
      
      if (listsResult.success && listsResult.lists.length > 0) {
        console.log(`ðŸ“‹ Found ${listsResult.lists.length} grocery lists`);
        setAvailableLists(listsResult.lists);
        
        // Load the most recent list
        const mostRecentList = listsResult.lists[0];
        await loadGroceryListById(mostRecentList.id);
        
      } else {
        console.log('ðŸ“‹ No grocery lists found, starting with empty list');
        setGroceryItems([]);
        setListTitle('My Grocery List');
        setCurrentBackendList(null);
        setAvailableLists([]);
      }
      
    } catch (error) {
      console.error('âŒ Failed to initialize grocery list:', error);
      // Fallback to empty list
      setGroceryItems([]);
      setListTitle('My Grocery List');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroceryListById = async (listId) => {
    try {
      console.log(`\nðŸ”„ LOAD LIST DEBUG - ${new Date().toLocaleTimeString()}`);
      console.log(`ðŸ“‹ TRIGGER: Loading grocery list details for ID: ${listId}`);
      console.log(`ðŸ“± CURRENT STATE: ${groceryItems.length} items locally`);
      console.log(`ðŸ“Š CURRENT ITEMS:`, groceryItems.map(item => item.name));
      
      const listResult = await YesChefAPI.getGroceryListDetails(listId);
      
      if (listResult.success) {
        const backendList = listResult.list;
        console.log('ðŸ“‹ Backend list loaded (v2):', backendList.name);
        console.log('ðŸ“‹ Backend list data:', JSON.stringify(backendList).substring(0, 200));
        
        // Convert backend data to mobile format (now async with spaCy)
        const mobileItems = await MobileGroceryAdapter.backendToMobile(backendList);
        console.log(`âœ… Converted to ${mobileItems.length} mobile items`);
        
        setGroceryItems(mobileItems);
        console.log(`ðŸ”„ LOAD LIST DEBUG END - LIST REPLACED\n`);
        setListTitle(backendList.name || 'Grocery List'); // v2 uses 'name' not 'list_name'
        setCurrentBackendList(backendList);
        
        // Get conversion summary for user info
        const summary = await MobileGroceryAdapter.getConversionSummary(mobileItems, backendList);
        console.log('ðŸ“Š Conversion summary:', summary);
        
      } else {
        console.error('âŒ Failed to load grocery list details:', listResult.error);
      }
      
    } catch (error) {
      console.error('âŒ Error loading grocery list:', error);
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
    console.log('ðŸ”˜ Toggle item ID:', id);
    console.log('ðŸ“‹ Current items:', groceryItems.map(i => ({ id: i.id, name: i.name, checked: i.checked })));
    
    setGroceryItems(prev => {
      const updated = prev.map(item => {
        const shouldToggle = item.id === id;
        if (shouldToggle) {
          console.log('âœ… Toggling item:', item.id, item.name, 'from', item.checked, 'to', !item.checked);
        }
        return shouldToggle ? { ...item, checked: !item.checked } : item;
      });
      
      console.log('ðŸ“Š Updated items:', updated.map(i => ({ id: i.id, name: i.name, checked: i.checked })));
      return updated;
    });
    
    autoSave(); // Auto-save when items are checked/unchecked
  };

  // Simple delete function without confirmation dialog
  const deleteItem = (id) => {
    console.log('ðŸ—‘ï¸ Deleting item:', id);
    
    // Find the item being deleted to preserve its position context
    const deletedIndex = groceryItems.findIndex(item => item.id === id);
    
    setGroceryItems(prev => prev.filter(item => item.id !== id));
    
    // Update stable ref immediately to prevent jump
    if (stableDataRef.current) {
      stableDataRef.current = stableDataRef.current.filter(item => item.id !== id);
    }
    
    autoSave(); // Auto-save when items are deleted
  };

  // Edit item name inline
  const updateItemName = (itemId, newName) => {
    setGroceryItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, name: newName } : item
      )
    );
    
    // ALSO update the stable ref immediately to prevent DragSystem refresh
    if (stableDataRef.current) {
      const index = stableDataRef.current.findIndex(item => item.id === itemId);
      if (index !== -1) {
        stableDataRef.current[index] = { ...stableDataRef.current[index], name: newName };
      }
    }
  };

  // Handle drag and drop reordering
  const handleReorder = (newItems) => {
    console.log(`\nðŸª GROCERY SCREEN REORDER DEBUG - ${new Date().toLocaleTimeString()}`);
    console.log(`ðŸ“± BEFORE: groceryItems has ${groceryItems.length} items`);
    console.log(`ðŸ“± RECEIVED: newItems has ${newItems.length} items`);
    console.log(`ðŸ“Š RECEIVED ITEMS:`, newItems.map((item, idx) => `${idx}: "${item.name}" (id: ${item.id})`));
    
    setGroceryItems(newItems);
    console.log(`âœ… GROCERY ITEMS UPDATED`);
    
    // âœ… NOW SAFE: Auto-save after reordering (ref fix prevents stale closures)
    console.log(`âœ… TRIGGERING AUTO-SAVE after reorder (debounced 3s)`);
    autoSave();
    console.log(`ðŸª GROCERY SCREEN REORDER DEBUG END\n`);
  };

  // Save current mobile list back to backend
  const saveToBackend = async () => {
    if (isSaving) {
      console.log('ðŸš« SAVE SKIPPED: Already saving in progress');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // ðŸ”§ FIX: Use ref to get latest state (avoid stale closure)
      const currentItems = groceryItemsRef.current;
      
      console.log(`\nðŸ’¾ SAVE DEBUG START - ${new Date().toLocaleTimeString()}`);
      console.log(`ðŸ“± SAVING: ${currentItems.length} items (from ref)`);
      console.log(`ðŸ“Š ITEMS TO SAVE:`, currentItems.map(i => i.name).join(', '));
      console.log(`ðŸ“‹ CURRENT BACKEND LIST:`, currentBackendList ? `ID: ${currentBackendList.id}, Name: "${currentBackendList.name}"` : 'None');
      console.log(`ðŸ“ LIST TITLE: "${listTitle}"`);
      
      // Convert mobile data back to backend format
      const backendData = MobileGroceryAdapter.mobileToBackend(
        currentItems,  // Use currentItems from ref!
        currentBackendList, 
        listTitle
      );
      
      console.log(`ðŸ”„ BACKEND DATA PREPARED:`, backendData);
      
      let result;
      if (currentBackendList && currentBackendList.id) {
        // Update existing list
        console.log(`ðŸ”„ UPDATING existing list ID: ${currentBackendList.id}`);
        result = await YesChefAPI.updateGroceryList(currentBackendList.id, backendData);
      } else {
        // This should rarely happen - prefer updating over creating
        console.log(`âš ï¸ WARNING: No current backend list found!`);
        console.log(`ðŸ“‹ Current backend list:`, currentBackendList);
        
        // Try to find an existing list with the same name instead of creating new
        const existingList = availableLists.find(list => list.name === listTitle);
        if (existingList) {
          console.log(`ðŸ”„ FOUND existing list with same name, updating ID: ${existingList.id}`);
          setCurrentBackendList(existingList);
          result = await YesChefAPI.updateGroceryList(existingList.id, backendData);
        } else {
          console.log(`âž• CREATING new list as last resort`);
          result = await YesChefAPI.saveGroceryList(backendData);
        }
      }
      
      if (result.success) {
        console.log(`âœ… SAVE SUCCESS: List saved successfully`);
        console.log(`ðŸ“‹ RESULT:`, result);
        setLastSaved(new Date());
        
        // Show toast notification
        showToastNotification('Saved âœ“');
        
        // If it was a new list, update our current backend reference
        if (!currentBackendList && result.list) {
          console.log(`ðŸ“‹ SETTING current backend list to new list:`, result.list);
          setCurrentBackendList(result.list);
        }
        
        // CRITICAL: Refresh available lists to show updated names
        console.log(`ðŸ”„ REFRESHING available lists to show updated names`);
        try {
          const listsResult = await YesChefAPI.getGroceryLists();
          if (listsResult.success) {
            setAvailableLists(listsResult.lists);
            console.log(`âœ… Available lists refreshed: ${listsResult.lists.length} lists`);
          }
        } catch (refreshError) {
          console.log(`âš ï¸ Could not refresh available lists:`, refreshError);
        }
        
        console.log(`ðŸ’¾ SAVE DEBUG END - SUCCESS\n`);
        return { success: true };
      } else {
        console.error(`âŒ SAVE FAILED:`, result.error);
        console.log(`ðŸ’¾ SAVE DEBUG END - FAILED\n`);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('âŒ Error saving grocery list:', error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when items change (debounced)
  const [saveTimeout, setSaveTimeout] = useState(null);
  
  const autoSave = () => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Don't start new save timer if already saving
    if (isSaving) {
      return;
    }
    
    const timeout = setTimeout(() => {
      // Double-check we're not saving when the timeout fires
      if (!isSaving) {
        saveToBackend();
      }
    }, 3000); // 3 seconds to reduce spam
    
    setSaveTimeout(timeout);
  };
  
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [households, setHouseholds] = useState([]);
  const [householdMembers, setHouseholdMembers] = useState([]);

  // Load households for invitation
  const loadHouseholds = async () => {
    try {
      const result = await FriendsAPI.getHouseholds();
      if (result.success) {
        setHouseholds(result.households);
      } else {
        console.error('Failed to load households:', result.error);
      }
    } catch (error) {
      console.error('Error loading households:', error);
    }
  };

  // Load household members for invitation
  const loadHouseholdMembers = async (householdId) => {
    try {
      const result = await FriendsAPI.getHouseholdMembers(householdId);
      if (result.success) {
        setHouseholdMembers(result.members);
      } else {
        console.error('Failed to load household members:', result.error);
        setHouseholdMembers([]);
      }
    } catch (error) {
      console.error('Error loading household members:', error);
      setHouseholdMembers([]);
    }
  };

  // Handle inviting household members to grocery list
  const handleInviteToGroceryList = () => {
    loadHouseholds();
    setShowInviteModal(true);
  };

  // Handle inviting specific household
  const handleInviteHousehold = async (household) => {
    try {
      console.log('ðŸŽ¯ GROCERY INVITE DEBUG: Inviting household:', household);
      console.log('ðŸŽ¯ GROCERY INVITE DEBUG: Current list:', currentBackendList);
      console.log('ðŸŽ¯ GROCERY INVITE DEBUG: List title:', listTitle);
      
      if (!currentBackendList || !currentBackendList.id) {
        showToastNotification('Save list first to invite');
        return;
      }
      
      // Call the backend collaboration API
      const inviteData = {
        resource_type: 'grocery_list',
        resource_id: currentBackendList.id,
        household_id: household.id,
        permission_level: 'editor'
      };
      
      console.log('ðŸŽ¯ GROCERY INVITE DEBUG: Sending invite data:', inviteData);
      
      // Call the real backend collaboration API
      const result = await YesChefAPI.inviteToCollaborate(inviteData);
      
      if (result.success) {
        // Show mint toast instead of alert
        showToastNotification(`Invited ${household.name} âœ“`);
        console.log('ðŸŽ¯ GROCERY INVITE SUCCESS:', result.data);
      } else {
        showToastNotification('Invitation failed');
        console.error('ðŸŽ¯ GROCERY INVITE FAILED:', result.error);
      }
      
      setShowInviteModal(false);
      
    } catch (error) {
      console.error('ðŸŽ¯ GROCERY INVITE ERROR:', error);
      showToastNotification('Failed to send invitation');
    }
  };

  // Show dialog to load different grocery lists
  const showLoadListDialog = () => {
    // Simple alert with list of available lists for now
    if (availableLists.length === 0) {
      Alert.alert('No Lists', 'No grocery lists found. Create some lists first!');
      return;
    }
    
    setShowLoadModal(true);
  };

  // Delete current grocery list with confirmation
  const deleteCurrentList = async () => {
    if (!currentBackendList || !currentBackendList.id) {
      showToastNotification('No saved list to delete');
      return;
    }

    Alert.alert(
      `Delete "${currentBackendList.name || 'this list'}"?`,
      undefined, // No message parameter to minimize spacing
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => console.log('ðŸš« Delete cancelled by user')
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              console.log(`ðŸ—‘ï¸ DELETING list: ${currentBackendList.name} (ID: ${currentBackendList.id})`);
              console.log('ðŸ—‘ï¸ FULL BACKEND LIST OBJECT:', JSON.stringify(currentBackendList, null, 2));
              console.log('ðŸ—‘ï¸ ID TYPE CHECK:', typeof currentBackendList.id, 'VALUE:', currentBackendList.id);
              
              const result = await YesChefAPI.deleteGroceryList(currentBackendList.id);
              
              if (result.success) {
                console.log('âœ… List deleted successfully');
                
                // Clear current state
                setGroceryItems([]);
                setCurrentBackendList(null);
                setListTitle('New Grocery List');
                setLastSaved(null);
                
                // Refresh available lists
                await initializeGroceryList();
                
                // Show mint toast instead of alert
                showToastNotification('List deleted âœ“');
              } else {
                console.error('âŒ Failed to delete list:', result.error);
                Alert.alert('Error', `Failed to delete list: ${result.error}`);
              }
            } catch (error) {
              console.error('âŒ Error deleting list:', error);
              Alert.alert('Error', 'An error occurred while deleting the list.');
            }
          }
        }
      ]
    );
  };
  
  // Create a new empty list
  const createNewList = () => {
    // Directly create new list without confirmation
    setGroceryItems([]);
    setListTitle('New Grocery List');
    setCurrentBackendList(null);
    setLastSaved(null);
  };
  
  const completedCount = groceryItems.filter(item => item.checked).length;
  const totalCount = groceryItems.length;
  
  // ðŸ”§ Use a ref to maintain stable data reference during editing
  const stableDataRef = React.useRef([]);
  
  // Update stable data only when not editing, or when structural changes happen
  React.useEffect(() => {
    if (!editingItemId) {
      // Not editing - update the stable reference
      stableDataRef.current = groceryItems.sort((a, b) => a.checked - b.checked);
    } else {
      // Currently editing - only update the specific item being edited
      const currentItem = groceryItems.find(item => item.id === editingItemId);
      if (currentItem) {
        const index = stableDataRef.current.findIndex(item => item.id === editingItemId);
        if (index !== -1) {
          // Update the item in place without changing the array reference
          stableDataRef.current[index] = { ...currentItem };
        }
      }
    }
  }, [groceryItems.length, editingItemId, groceryItems.filter(item => item.checked).length]);
  
  // For rendering, use the current groceryItems but with the ref for DragSystem
  const displayData = editingItemId ? stableDataRef.current : groceryItems.sort((a, b) => a.checked - b.checked);

  return (
    <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay} />
      
      {/* ðŸ“± Top Status Bar Background (Clean Header for Phone Status) */}
      <View style={styles.topStatusBarOverlay} />
      
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent={true}
          animated={true}
        />
        
        {/* ðŸ·ï¸ Card 1: Title Section */}
        <View style={styles.titleCard}>
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
          <Text style={styles.optionsIcon}>â‹¯</Text>
        </TouchableOpacity>
      </View>

      {/* Options Menu Modal - Fullscreen */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List Options</Text>
              <TouchableOpacity onPress={() => setShowOptionsMenu(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  saveToBackend();
                }}
              >
                <Icon name="save" size={22} color="#22C55E" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>Save Now</Text>
                {isSaving && <ActivityIndicator size="small" color="#22C55E" style={{marginLeft: 'auto'}} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  showLoadListDialog();
                }}
              >
                <Icon name="folder" size={22} color="#1E40AF" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>Load List</Text>
              </TouchableOpacity>
              
              <View style={styles.modalDivider} />
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  createNewList();
                }}
              >
                <Icon name="add" size={22} color="#E7993F" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>New List</Text>
              </TouchableOpacity>
              
              <View style={styles.modalDivider} />
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  handleInviteToGroceryList();
                }}
              >
                <Text style={{ fontSize: 22, color: "#7C3AED", marginRight: 16 }}>ðŸ‘¥</Text>
                <Text style={styles.modalMenuText}>Invite Friends</Text>
              </TouchableOpacity>
              
              <View style={styles.modalDivider} />
              
              <TouchableOpacity 
                style={[styles.modalMenuItem, styles.modalDeleteMenuItem]}
                onPress={() => {
                  setShowOptionsMenu(false);
                  deleteCurrentList();
                }}
              >
                <Icon name="delete" size={22} color="#DC313F" style={{marginRight: 16}} />
                <Text style={styles.modalDeleteText}>Delete List</Text>
              </TouchableOpacity>
              
              <View style={styles.modalDivider} />
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  initializeGroceryList();
                }}
              >
                <Icon name="refresh" size={22} color="#1E40AF" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>Refresh List</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <Animated.View 
          style={[
            styles.toast,
            {
              opacity: toastAnimation,
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* âž• Card 2: Add Item Section */}
      <View style={styles.addCard}>
        <TextInput
          style={styles.input}
          value={newItem}
          onChangeText={handleNewItemChange}
          placeholder="Add ingredient..."
          placeholderTextColor="rgba(156, 163, 175, 0.8)" // Light grey placeholder text
          onSubmitEditing={addItem}
          returnKeyType="done"
          multiline={false}
        />
        <TouchableOpacity 
          style={styles.bulkImportButton}
          onPress={() => setShowBulkImportModal(true)}
        >
          <Icon name="clipboard" size={22} color="#10b981" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Icon name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ðŸ“ Card 3: Grocery List Items */}
      <View style={styles.listCard}>
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
            data={displayData}
            keyExtractor={(item) => item.id}
            onReorder={handleReorder}
            key={editingItemId ? `editing-${editingItemId}` : `grocery-list-stable`}
            renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                onPress={() => toggleItem(item.id)}
              >
                {item.checked && <Text style={styles.checkmark}>âœ“</Text>}
              </TouchableOpacity>
              
              {editingItemId === item.id ? (
                <TextInput
                  style={styles.itemEditInput}
                  value={editingText}
                  onChangeText={(text) => {
                    setEditingText(text); // Only update editing text, not main state
                  }}
                  onBlur={() => {
                    setEditingItemIdWithDebug(null); // This will update main state
                    autoSave(); // Save when user finishes editing
                  }}
                  onSubmitEditing={() => {
                    setEditingItemIdWithDebug(null); // This will update main state
                    autoSave(); // Save when user presses enter
                  }}
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity 
                  style={styles.itemTextContainer}
                  onPress={() => {
                    setEditingItemIdWithDebug(item.id);
                  }}
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
                <Icon name="delete" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
          style={styles.list}
        />
      )}
      </View>

      {/* Load List Modal */}
      <Modal
        visible={showLoadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLoadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header with X button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Load Grocery List</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('ðŸš« Load cancelled by user');
                  setShowLoadModal(false);
                }}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.loadModalScrollArea}>
              <Text style={styles.modalSubtitle}>
                Choose a list to load (current changes will be lost):
              </Text>
              
              {/* List of available lists */}
              <ScrollView style={styles.loadListContainer} showsVerticalScrollIndicator={false}>
                {availableLists.map((list, index) => (
                  <TouchableOpacity
                    key={list.id}
                    style={styles.modalMenuItem}
                    onPress={() => {
                      setShowLoadModal(false);
                      loadGroceryListById(list.id);
                    }}
                  >
                    <Icon name="folder" size={20} color="#1E40AF" style={{marginRight: 12}} />
                    <View style={{flex: 1}}>
                      <Text style={styles.modalMenuText}>
                        {list.name || `List ${list.id}`}
                      </Text>
                      <Text style={styles.listInfo}>
                        {list.item_count || 0} items
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Household Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header with X button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Household</Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.loadModalScrollArea}>
              <Text style={styles.modalSubtitle}>
                Invite a household to collaborate on "{listTitle}":
              </Text>
              
              {/* List of available households */}
              <ScrollView style={styles.loadListContainer} showsVerticalScrollIndicator={false}>
                {households.length > 0 ? (
                  households.map((household) => (
                    <TouchableOpacity
                      key={household.id}
                      style={styles.modalMenuItem}
                      onPress={() => handleInviteHousehold(household)}
                    >
                      <Text style={{ fontSize: 22, color: "#7C3AED", marginRight: 12 }}>ðŸ‘¥</Text>
                      <View style={{flex: 1}}>
                        <Text style={styles.modalMenuText}>
                          {household.name}
                        </Text>
                        <Text style={styles.listInfo}>
                          {household.members || 0} members
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No households found</Text>
                    <Text style={styles.emptySubtext}>Create a household first to invite members</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ðŸ“‹ Bulk Import Modal */}
      <Modal
        visible={showBulkImportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowBulkImportModal(false);
          setBulkImportText('');
          setBulkImportPreview([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkImportModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Grocery List</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBulkImportModal(false);
                  setBulkImportText('');
                  setBulkImportPreview([]);
                }}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.bulkImportSubtitle}>
              Paste your list here (one item per line)
            </Text>
            
            {/* Multi-line text input */}
            <TextInput
              style={styles.bulkImportInput}
              multiline
              numberOfLines={8}
              placeholder="Milk&#10;Eggs&#10;Bread&#10;Apples&#10;...or paste from another app"
              placeholderTextColor="#9ca3af"
              value={bulkImportText}
              onChangeText={(text) => {
                setBulkImportText(text);
                setBulkImportPreview(parseGroceryList(text));
              }}
              autoFocus
              textAlignVertical="top"
            />
            
            {/* Preview Section */}
            {bulkImportPreview.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>
                  Preview ({bulkImportPreview.length} {bulkImportPreview.length === 1 ? 'item' : 'items'})
                </Text>
                <ScrollView style={styles.previewList} showsVerticalScrollIndicator={true}>
                  {bulkImportPreview.map((item, index) => (
                    <View key={index} style={styles.previewItem}>
                      <Text style={styles.previewBullet}>â€¢</Text>
                      <Text style={styles.previewItemText}>{item}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.bulkImportButtons}>
              <TouchableOpacity 
                style={styles.bulkImportCancelButton}
                onPress={() => {
                  setShowBulkImportModal(false);
                  setBulkImportText('');
                  setBulkImportPreview([]);
                }}
              >
                <Text style={styles.bulkImportCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.bulkImportAddButton,
                  bulkImportPreview.length === 0 && styles.bulkImportAddButtonDisabled
                ]}
                onPress={handleBulkImport}
                disabled={bulkImportPreview.length === 0}
              >
                <Text style={styles.bulkImportAddText}>
                  Add {bulkImportPreview.length > 0 ? bulkImportPreview.length : ''} {bulkImportPreview.length === 1 ? 'Item' : 'Items'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // ðŸŽ¨ Background and Overlay Styles
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Enough to cover status bar area
    backgroundColor: 'transparent', // Let mint background show through
    zIndex: 3, // Above main overlay to ensure status bar area is clearly visible
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent', // Let mint background show through
    zIndex: 1,
  },
  
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed from '#ffffff' to transparent
    zIndex: 2, // Above overlay
    paddingTop: 50, // Add padding to push content below status bar
  },
  
  // ðŸŽ¨ Card Styles - Beautiful bubble design
  titleCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 8, // Back to small margin since container has padding
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255,)', // More transparent
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 1,
  },
  addCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  listCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingVertical: 8,
  },
  
  header: {
    paddingHorizontal: 20, // Consistent padding with other screens
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)', // Semi-transparent border
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: 16, // Add margin for padding effect
    marginTop: 16, // Top margin for spacing
    borderRadius: 12, // Rounded corners to match other screens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16, // Consistent padding with other screens
    paddingTop: 8, // Small top padding for spacing
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937', // Match other container text colors
  },
  titleInput: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937', // Match other container text colors
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
  itemCount: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
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
    backgroundColor: 'rgba(249, 250, 251, 0.8)', // Semi-transparent
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)', // Semi-transparent border
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
    fontFamily: 'Nunito-Regular',
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
  
  // Load List Modal Styles (old modal for loading lists)
  loadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContainer: {
    maxHeight: 300,
    marginHorizontal: 16, // Add horizontal margins for padding effect
    marginTop: 8, // Small top margin for spacing
  },
  listItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243, 244, 246, 0.5)', // Semi-transparent
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
    marginHorizontal: 4, // Small margin between items
    marginVertical: 2, // Small vertical margin
    borderRadius: 8, // Rounded corners for card effect
  },
  lastListItem: {
    borderBottomWidth: 0,
  },
  listName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  listInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Fullscreen Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',  // Fill most of screen (under status bar)
    paddingBottom: 34, // Safe area for home indicator
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#f9fafb',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  modalMenuText: {
    fontSize: 17,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    flex: 1,
  },
  modalDivider: {
    height: 8,
    marginVertical: 8,
  },
  modalDeleteMenuItem: {
    backgroundColor: '#fef2f2',
  },
  modalDeleteText: {
    fontSize: 17,
    fontFamily: 'Nunito-Regular',
    color: '#dc2626',
    flex: 1,
  },
  
  // Load/Invite Modal Specific Styles
  loadModalScrollArea: {
    flex: 1,
    paddingTop: 8,
  },
  loadListContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  listInfo: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  // Toast Notification Styles
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastText: {
    backgroundColor: '#e6fffa',
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    textAlign: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    fontFamily: 'Nunito-Regular',
  },



  // ðŸ“‹ Bulk Import Styles
  bulkImportButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  bulkImportModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkImportSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontFamily: 'Nunito-Regular',
  },
  bulkImportInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 150,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'Nunito-Regular',
  },
  previewSection: {
    marginTop: 16,
    maxHeight: 180,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  previewList: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  previewBullet: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 8,
    marginTop: 2,
  },
  previewItemText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontFamily: 'Nunito-Regular',
    lineHeight: 20,
  },
  bulkImportButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  bulkImportCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  bulkImportCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Nunito-SemiBold',
  },
  bulkImportAddButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bulkImportAddButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  bulkImportAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Nunito-SemiBold',
  },
});

});
