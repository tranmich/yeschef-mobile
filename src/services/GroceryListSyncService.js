/**
 * 🔄 GROCERY LIST SYNC SERVICE
 * 
 * Hybrid local-first + cloud sync for grocery lists
 * Combines LocalDataManager with GroceryListServiceV2
 * 
 * ARCHITECTURE:
 * - Local storage for fast, offline access
 * - Optional cloud sync for backup and cross-device
 * - Special: Generate from meal plan in cloud!
 */

import { Alert } from 'react-native';
import { GroceryListServiceV2 } from './apiServiceV2';
import LocalDataManager from './LocalDataManager';
import YesChefAPI from './YesChefAPI';

class GroceryListSyncService {
  
  /**
   * 🌐 Save grocery list to cloud (v2 API)
   */
  static async saveToCloud(items, listName, currentListId = null) {
    console.log('☁️ Saving grocery list to cloud...');
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const listData = {
        name: listName || 'My Grocery List',
        items: items || []
      };
      
      let result;
      
      if (currentListId) {
        // Update existing list
        console.log('📝 Updating existing list:', currentListId);
        result = await GroceryListServiceV2.updateGroceryList(
          currentListId,
          userId,
          listData
        );
      } else {
        // Create new list
        console.log('✨ Creating new list');
        result = await GroceryListServiceV2.createGroceryList(userId, listData);
      }
      
      console.log('✅ Cloud save successful:', result.id);
      
      return {
        success: true,
        listId: result.id,
        message: currentListId ? 'Grocery list updated in cloud!' : 'Grocery list saved to cloud!'
      };
      
    } catch (error) {
      console.error('❌ Cloud save failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to save to cloud'
      };
    }
  }
  
  /**
   * 🎯 Create grocery list from meal plan (CLOUD-POWERED!)
   * Backend automatically extracts ingredients from all recipes
   */
  static async createFromMealPlan(mealPlanId) {
    console.log('🎯 Generating grocery list from meal plan:', mealPlanId);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const result = await GroceryListServiceV2.createFromMealPlan(userId, mealPlanId);
      
      console.log('✅ Grocery list generated:', result.name);
      
      return {
        success: true,
        groceryList: {
          id: result.id,
          name: result.name,
          items: result.items || []
        },
        message: `Generated ${result.items?.length || 0} items from meal plan!`
      };
      
    } catch (error) {
      console.error('❌ Generate from meal plan failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate grocery list'
      };
    }
  }
  
  /**
   * 📥 Load grocery list from cloud
   */
  static async loadFromCloud(listId) {
    console.log('📥 Loading grocery list from cloud:', listId);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const list = await GroceryListServiceV2.getGroceryList(listId, userId);
      
      console.log('✅ Loaded grocery list:', list.name);
      
      return {
        success: true,
        groceryList: {
          id: list.id,
          name: list.name,
          items: list.items || []
        },
        message: 'Grocery list loaded from cloud!'
      };
      
    } catch (error) {
      console.error('❌ Load from cloud failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to load from cloud'
      };
    }
  }
  
  /**
   * 📋 Get list of user's grocery lists from cloud
   */
  static async getCloudLists() {
    console.log('📋 Fetching cloud grocery lists...');
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const result = await GroceryListServiceV2.getUserGroceryLists(userId);
      
      console.log(`✅ Found ${result.groceryLists.length} cloud grocery lists`);
      
      return {
        success: true,
        lists: result.groceryLists || [],
        total: result.total || 0
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch cloud lists:', error);
      return {
        success: false,
        lists: [],
        error: error.message || 'Failed to load lists'
      };
    }
  }
  
  /**
   * ✅ Mark item as purchased in cloud
   */
  static async markItemPurchased(listId, itemIndex, purchased = true) {
    console.log(`${purchased ? '✅' : '⬜'} Marking item ${itemIndex} as ${purchased ? 'purchased' : 'unpurchased'}`);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      await GroceryListServiceV2.markItemPurchased(listId, userId, itemIndex, purchased);
      
      console.log('✅ Item status updated in cloud');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Mark item failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * ➕ Add item to cloud list
   */
  static async addItem(listId, item) {
    console.log('➕ Adding item to cloud list:', item.name);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      await GroceryListServiceV2.addItem(listId, userId, item);
      
      console.log('✅ Item added to cloud');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Add item failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * ➖ Remove item from cloud list
   */
  static async removeItem(listId, itemIndex) {
    console.log('➖ Removing item from cloud list:', itemIndex);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      await GroceryListServiceV2.removeItem(listId, userId, itemIndex);
      
      console.log('✅ Item removed from cloud');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Remove item failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🧹 Clear all purchased items
   */
  static async clearPurchased(listId) {
    console.log('🧹 Clearing purchased items from cloud...');
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      await GroceryListServiceV2.clearPurchasedItems(listId, userId);
      
      console.log('✅ Purchased items cleared from cloud');
      
      return { success: true, message: 'Purchased items cleared!' };
      
    } catch (error) {
      console.error('❌ Clear purchased failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🗑️ Delete grocery list from cloud
   */
  static async deleteFromCloud(listId) {
    console.log('🗑️ Deleting grocery list from cloud:', listId);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      await GroceryListServiceV2.deleteGroceryList(listId, userId);
      
      console.log('✅ Grocery list deleted from cloud');
      
      return {
        success: true,
        message: 'Grocery list deleted from cloud'
      };
      
    } catch (error) {
      console.error('❌ Delete from cloud failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete from cloud'
      };
    }
  }
}

export default GroceryListSyncService;
