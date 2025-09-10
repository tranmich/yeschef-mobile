/**
 * 🔄 MOBILE GROCERY ADAPTER
 * 
 * Compatibility layer between complex web grocery lists and simple mobile interface
 * Allows mobile app to work with backend data while preserving web features
 */

class MobileGroceryAdapter {
  
  /**
   * Convert complex backend grocery list to simple mobile format
   * Extracts just the ingredient names while preserving references
   */
  static backendToMobile(backendListData) {
    console.log('🔄 Converting backend to mobile format:', backendListData);
    
    if (!backendListData || !backendListData.list_data) {
      console.log('📋 No backend data, returning empty list');
      return [];
    }

    const mobileItems = [];
    const listData = backendListData.list_data;
    
    // Handle different backend data structures
    let sectionsData = null;
    
    if (listData.grocery_list && listData.grocery_list.by_section) {
      // Generated from recipes (format 1)
      sectionsData = listData.grocery_list.by_section;
      console.log('📋 Using grocery_list.by_section format');
    } else if (listData.by_section) {
      // Direct section data (format 2)
      sectionsData = listData.by_section;
      console.log('📋 Using direct by_section format');
    } else if (Array.isArray(listData)) {
      // Already simple format (mobile-created list)
      console.log('📋 Using simple array format');
      return listData.map((item, index) => ({
        id: item.id || `mobile-${index}`,
        name: item.name,
        checked: item.checked || false,
        _isMobileItem: true
      }));
    } else if (typeof listData === 'object' && listData.ingredient_count) {
      // Complex web format with direct sections (format 3) - September 8 style
      console.log('📋 Using complex web format with direct sections');
      console.log('📋 Ingredient count:', listData.ingredient_count);
      sectionsData = {};
      
      // Extract known section names and convert to by_section format
      const knownSections = ['produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'other'];
      for (const sectionName of knownSections) {
        if (listData[sectionName] && listData[sectionName].items) {
          sectionsData[sectionName] = listData[sectionName].items;
          console.log(`📋 Found section "${sectionName}" with ${listData[sectionName].items.length} items`);
        }
      }
      
      console.log(`📋 Total sections found: ${Object.keys(sectionsData).length}`);
    }

    if (sectionsData) {
      // Extract from all sections (produce, meat, dairy, etc.)
      let itemIndex = 0;
      for (const [sectionName, items] of Object.entries(sectionsData)) {
        if (Array.isArray(items)) {
          console.log(`📋 Processing section "${sectionName}" with ${items.length} items`);
          items.forEach(item => {
            // Handle different item formats
            let itemName = item.name || item.display_text || item.ingredient_name || 'Unknown Item';
            
            mobileItems.push({
              id: `backend-${itemIndex++}`,
              name: itemName,
              checked: false, // Mobile manages check status
              _backendRef: {
                section: sectionName,
                originalData: item
              }
            });
          });
        }
      }
    }

    console.log(`✅ Converted ${mobileItems.length} items to mobile format`);
    return mobileItems;
  }

  /**
   * Convert mobile items back to backend format while preserving web features
   */
  static mobileToBackend(mobileItems, originalBackendData, listName = 'Mobile Updated List') {
    console.log('🔄 Converting mobile to backend format:', {
      mobileItemCount: mobileItems.length,
      listName
    });

    // If original data exists, preserve its structure
    if (originalBackendData && originalBackendData.list_data) {
      return this.updateExistingBackendList(mobileItems, originalBackendData, listName);
    } else {
      return this.createNewBackendList(mobileItems, listName);
    }
  }

  /**
   * Update existing backend list while preserving web features
   */
  static updateExistingBackendList(mobileItems, originalBackendData, listName) {
    // Start with original complex structure
    const updatedData = JSON.parse(JSON.stringify(originalBackendData));
    updatedData.list_name = listName;

    const listData = updatedData.list_data;
    
    // Get sections data reference
    let sectionsData = null;
    if (listData.grocery_list && listData.grocery_list.by_section) {
      sectionsData = listData.grocery_list.by_section;
    } else if (listData.by_section) {
      sectionsData = listData.by_section;
    }

    if (sectionsData) {
      // Track which backend items are still present in mobile
      const mobileItemNames = new Set(mobileItems.map(item => item.name));
      
      // Remove deleted items from all sections
      for (const [sectionName, items] of Object.entries(sectionsData)) {
        if (Array.isArray(items)) {
          sectionsData[sectionName] = items.filter(item => 
            mobileItemNames.has(item.name || item.display_text)
          );
        }
      }

      // Add new mobile items to "other" section
      const existingItemNames = new Set();
      for (const items of Object.values(sectionsData)) {
        if (Array.isArray(items)) {
          items.forEach(item => {
            existingItemNames.add(item.name || item.display_text);
          });
        }
      }

      const newMobileItems = mobileItems.filter(item => 
        !item._backendRef && !existingItemNames.has(item.name)
      );

      if (newMobileItems.length > 0) {
        if (!sectionsData.other) {
          sectionsData.other = [];
        }
        
        newMobileItems.forEach(item => {
          sectionsData.other.push({
            name: item.name,
            display_text: item.name,
            recipes: ['Mobile Added']
          });
        });
      }

      // Update ingredient count
      const totalItems = Object.values(sectionsData).reduce((sum, items) => 
        sum + (Array.isArray(items) ? items.length : 0), 0
      );
      
      if (listData.ingredient_count !== undefined) {
        listData.ingredient_count = totalItems;
      }
    }

    console.log('✅ Updated existing backend list structure');
    return updatedData;
  }

  /**
   * Create new backend list from mobile items (simple structure)
   */
  static createNewBackendList(mobileItems, listName) {
    console.log('🆕 Creating new backend list from mobile items');
    
    const backendData = {
      list_name: listName,
      list_data: mobileItems, // Store as simple array for mobile-created lists
      recipe_ids: []
    };

    console.log('✅ Created new backend list structure');
    return backendData;
  }

  /**
   * Generate unique ID for mobile items
   */
  static generateMobileId() {
    return `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a grocery list was created by mobile app
   */
  static isMobileCreatedList(backendListData) {
    if (!backendListData || !backendListData.list_data) return false;
    
    // Mobile lists are stored as simple arrays
    return Array.isArray(backendListData.list_data);
  }

  /**
   * Get a user-friendly summary of what the conversion did
   */
  static getConversionSummary(mobileItems, originalBackendData) {
    const existingItems = originalBackendData ? this.backendToMobile(originalBackendData).length : 0;
    const newItems = mobileItems.filter(item => !item._backendRef).length;
    const removedItems = Math.max(0, existingItems - mobileItems.length + newItems);

    return {
      totalItems: mobileItems.length,
      newItems,
      removedItems,
      preservedWebFeatures: !!originalBackendData?.list_data?.grocery_list
    };
  }
}

export default MobileGroceryAdapter;
