/**
 * 🔄 MOBILE GROCERY ADAPTER
 * 
 * Compatibility layer between complex web grocery lists and simple mobile interface
 * Allows mobile app to work with backend data while preserving web features
 * 
 * NOW WITH INTELLIGENT COMBINING! 🧠
 */

import IntelligentIngredientCombiner from '../utils/IntelligentIngredientCombiner';

class MobileGroceryAdapter {
  
  // Initialize the combiner (can be configured per user)
  static combiner = new IntelligentIngredientCombiner({
    debug: false, // Set to true for debugging
    aggressive: true // Aggressive combining by default
  });
  
  /**
   * Convert complex backend grocery list to simple mobile format
   * Extracts just the ingredient names while preserving references
   */
  static backendToMobile(backendListData) {
    // console.log('🔄 DEBUG: Converting backend to mobile format:', JSON.stringify(backendListData, null, 2));
    
    if (!backendListData || !backendListData.list_data) {
      console.log('📋 No backend data, returning empty list');
      return [];
    }

    const mobileItems = [];
    const listData = backendListData.list_data;
    
    // console.log('🔍 DEBUG: list_data structure:', JSON.stringify(listData, null, 2));
    
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
    } else if (typeof listData === 'object') {
      // Check if this is direct section format (your current format)
      const knownSections = ['produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'other'];
      const hasDirectSections = knownSections.some(section => 
        listData[section] && Array.isArray(listData[section])
      );
      
      if (hasDirectSections) {
        // Direct sections format (your current backend format)
        console.log('📋 Using direct sections format (September 2025 style)');
        sectionsData = {};
        
        for (const sectionName of knownSections) {
          if (listData[sectionName] && Array.isArray(listData[sectionName])) {
            sectionsData[sectionName] = listData[sectionName];
            console.log(`📋 Found direct section "${sectionName}" with ${listData[sectionName].length} items`);
          }
        }
        
        console.log(`📋 Total direct sections found: ${Object.keys(sectionsData).length}`);
      } else if (listData.ingredient_count) {
        // Complex web format with nested sections (older format)
        console.log('📋 Using complex web format with nested sections');
        console.log('📋 Ingredient count:', listData.ingredient_count);
        sectionsData = {};
        
        // Extract known section names and convert to by_section format
        for (const sectionName of knownSections) {
          if (listData[sectionName] && listData[sectionName].items) {
            sectionsData[sectionName] = listData[sectionName].items;
            console.log(`📋 Found nested section "${sectionName}" with ${listData[sectionName].items.length} items`);
          }
        }
        
        console.log(`📋 Total nested sections found: ${Object.keys(sectionsData).length}`);
      }
    }

    if (sectionsData) {
      // Extract from all sections (produce, meat, dairy, etc.)
      let itemIndex = 0;
      for (const [sectionName, items] of Object.entries(sectionsData)) {
        if (Array.isArray(items)) {
          console.log(`📋 Processing section "${sectionName}" with ${items.length} items`);
          items.forEach(item => {
            // Handle different item formats - prefer display_text for full quantities
            let itemName = item.display_text || item.name || item.ingredient_name || 'Unknown Item';
            
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
    
    // ⚡ TIER 1: JavaScript combining (ALWAYS - instant)
    console.log('⚡ Tier 1: Quick combine (JavaScript)...');
    const quickCombined = this.combiner.combineItems(mobileItems);
    console.log(`✨ JavaScript combined: ${mobileItems.length} → ${quickCombined.length} items`);
    
    // 🧠 TIER 2: spaCy enhancement (background, if online)
    // Don't await - return quick results immediately
    this.enhanceWithSpaCy(quickCombined).catch(err => {
      console.log('📴 Offline or spaCy unavailable - using JavaScript results');
    });
    
    return quickCombined;
  }

  /**
   * 🧠 TIER 2: Enhance with spaCy (background, optional)
   * Silently improves combining when backend is available
   */
  static async enhanceWithSpaCy(items) {
    try {
      // Quick timeout - don't wait long
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000); // 1 second max
      
      console.log('🧠 Tier 2: Attempting spaCy enhancement...');
      
      const response = await fetch('http://localhost:5001/api/grocery/enhance-combining', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.improvements > 0) {
          console.log(`✨ spaCy found ${result.improvements} more improvements!`);
          
          // Notify listeners that items were enhanced
          if (this.onEnhanced) {
            this.onEnhanced(result.enhanced_items, result.improvements);
          }
          
          return result;
        } else {
          console.log('✅ JavaScript combining was perfect, no spaCy improvements needed');
        }
      }
    } catch (error) {
      // Offline, timeout, or error - silently fail
      // User already has good JavaScript results
      if (error.name !== 'AbortError') {
        console.log('📴 spaCy enhancement unavailable:', error.message);
      }
      return null;
    }
  }

  /**
   * Register a callback for when spaCy enhances items
   */
  static onEnhancementComplete(callback) {
    this.onEnhanced = callback;
  }

  /**
   * Convert mobile items back to backend format while preserving web features
   */
  static mobileToBackend(mobileItems, originalBackendData, listName = 'Mobile Updated List') {
    console.log('🔄 Converting mobile to backend format:', {
      mobileItemCount: mobileItems.length,
      listName
    });

    // Check if items have section information from _backendRef
    const hasBackendRefs = mobileItems.some(item => item._backendRef && item._backendRef.section);
    
    if (hasBackendRefs) {
      // Preserve sectioned format for webapp compatibility
      return this.createSectionedBackendList(mobileItems, listName, originalBackendData);
    } else {
      // Fall back to simple format for mobile-only lists
      return this.createSimpleBackendList(mobileItems, listName, originalBackendData);
    }
  }

  /**
   * Create sectioned backend list (webapp-compatible)
   */
  static createSectionedBackendList(mobileItems, listName, originalBackendData = null) {
    console.log('✅ Creating sectioned backend list structure');
    
    // Initialize sections
    const sections = {
      produce: [],
      meat_seafood: [],
      pantry: [],
      other: [],
      dairy: []
    };
    
    // Group items by section using _backendRef
    mobileItems.forEach(item => {
      const section = item._backendRef?.section || 'other';
      const sectionKey = section.toLowerCase();
      
      // Map to standard section names
      const normalizedSection = sections[sectionKey] ? sectionKey : 'other';
      
      sections[normalizedSection].push({
        name: item.name,
        checked: item.checked || false,
        display_text: item.name, // Preserve display_text for web
        recipes: item._backendRef?.originalData?.recipes || []
      });
    });
    
    const backendData = {
      list_name: listName,
      list_data: sections,
      recipe_ids: originalBackendData?.recipe_ids || []
    };

    // If updating existing list, preserve the ID
    if (originalBackendData && originalBackendData.id) {
      backendData.id = originalBackendData.id;
    }

    console.log('✅ Sectioned backend data created:', {
      listName,
      sections: Object.keys(sections).map(s => `${s}: ${sections[s].length} items`),
      hasId: !!backendData.id
    });

    return backendData;
  }

  /**
   * Create simple backend list (mobile-optimized)
   */
  static createSimpleBackendList(mobileItems, listName, originalBackendData = null) {
    console.log('✅ Creating simple backend list structure');
    
    // Convert mobile items to simple backend format
    const listData = mobileItems.map(item => ({
      id: item.id,
      name: item.name,
      checked: item.checked || false
    }));

    const backendData = {
      list_name: listName,
      list_data: listData,
      recipe_ids: originalBackendData?.recipe_ids || []
    };

    // If updating existing list, preserve the ID
    if (originalBackendData && originalBackendData.id) {
      backendData.id = originalBackendData.id;
    }

    console.log('✅ Simple backend data created:', {
      listName,
      itemCount: listData.length,
      hasId: !!backendData.id
    });

    return backendData;
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

  /**
   * 🧠 COMBINING CONTROL METHODS
   */

  /**
   * Enable/disable automatic combining
   * @param {boolean} enabled - Whether combining is enabled
   */
  static setCombiningEnabled(enabled) {
    if (enabled) {
      this.combiner = new IntelligentIngredientCombiner({
        debug: false,
        aggressive: true
      });
      console.log('✅ Ingredient combining ENABLED');
    } else {
      this.combiner = null;
      console.log('❌ Ingredient combining DISABLED');
    }
  }

  /**
   * Check if combining is currently enabled
   */
  static isCombiningEnabled() {
    return this.combiner !== null;
  }

  /**
   * Set combining aggressiveness
   * @param {boolean} aggressive - True for aggressive, false for conservative
   */
  static setCombiningMode(aggressive) {
    if (this.combiner) {
      this.combiner.aggressive = aggressive;
      console.log(`🧠 Combining mode set to: ${aggressive ? 'AGGRESSIVE' : 'CONSERVATIVE'}`);
    }
  }

  /**
   * Manually combine a list of items (for testing or manual trigger)
   * @param {Array} items - Items to combine
   * @returns {Array} - Combined items
   */
  static manualCombine(items) {
    if (!this.combiner) {
      console.log('⚠️ Combining is disabled, returning items as-is');
      return items;
    }
    return this.combiner.combineItems(items);
  }

  /**
   * "Uncombine" items - restore original items from combined ones
   * @param {Array} items - Items (possibly combined)
   * @returns {Array} - Uncombined items
   */
  static uncombineItems(items) {
    const uncombined = [];
    
    items.forEach(item => {
      if (item._combined && item._originalItems) {
        // This is a combined item, restore originals
        uncombined.push(...item._originalItems);
      } else {
        // Regular item, keep as-is
        uncombined.push(item);
      }
    });
    
    return uncombined;
  }
}

export default MobileGroceryAdapter;
