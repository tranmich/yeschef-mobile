// Offline Sync Manager for YesChef Mobile
// Handles offline functionality and sync with your backend

import AsyncStorage from '@react-native-async-storage/async-storage';
import YesChefAPI from './YesChefAPI';

class OfflineSyncManager {
  constructor() {
    this.syncQueue = [];
    this.isOnline = true;
    this.isSyncing = false;
    this.listeners = [];
  }

  // Initialize the sync manager
  async initialize() {
    await this.loadSyncQueue();
    this.startPeriodicSync();
    this.setupNetworkListener();
  }

  // Network status monitoring
  setupNetworkListener() {
    // Note: In React Native, you'd use @react-native-community/netinfo
    // For now, we'll use a simple approach
    setInterval(() => {
      this.checkNetworkStatus();
    }, 5000);
  }

  async checkNetworkStatus() {
    try {
      // Simple network check by trying to reach your backend
      const response = await fetch(`${YesChefAPI.baseURL}/api/health`, {
        method: 'HEAD',
        timeout: 3000,
      });
      
      const wasOffline = !this.isOnline;
      this.isOnline = response.ok;
      
      // If we just came back online, trigger sync
      if (wasOffline && this.isOnline) {
        console.log('📶 Back online - starting sync');
        this.syncAll();
      }
    } catch (error) {
      this.isOnline = false;
    }
  }

  // Grocery List Offline Operations
  async saveGroceryListOffline(listData) {
    try {
      // Save locally immediately
      await AsyncStorage.setItem('current_grocery_list', JSON.stringify(listData));
      
      // Add to sync queue if online sync is needed
      this.addToSyncQueue({
        type: 'UPDATE_GROCERY_LIST',
        data: listData,
        timestamp: Date.now(),
        id: listData.id || 'current',
      });

      // Try immediate sync if online
      if (this.isOnline) {
        this.syncGroceryList();
      }

      return { success: true };
    } catch (error) {
      console.error('Save grocery list offline error:', error);
      return { success: false, error: 'Failed to save locally' };
    }
  }

  async loadGroceryListOffline() {
    try {
      const stored = await AsyncStorage.getItem('current_grocery_list');
      if (stored) {
        return { success: true, list: JSON.parse(stored) };
      }
      return { success: true, list: null };
    } catch (error) {
      console.error('Load grocery list offline error:', error);
      return { success: false, error: 'Failed to load from storage' };
    }
  }

  // Recipe Caching for Offline Use
  async cacheRecipe(recipe) {
    try {
      const cacheKey = `recipe_cache_${recipe.id}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        ...recipe,
        cached_at: Date.now(),
      }));
      
      // Keep track of cached recipes
      const cachedList = await this.getCachedRecipesList();
      if (!cachedList.includes(recipe.id)) {
        cachedList.push(recipe.id);
        await AsyncStorage.setItem('cached_recipes_list', JSON.stringify(cachedList));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Cache recipe error:', error);
      return { success: false, error: 'Failed to cache recipe' };
    }
  }

  async getCachedRecipe(recipeId) {
    try {
      const cacheKey = `recipe_cache_${recipeId}`;
      const stored = await AsyncStorage.getItem(cacheKey);
      
      if (stored) {
        const recipe = JSON.parse(stored);
        
        // Check if cache is still fresh (24 hours)
        const cacheAge = Date.now() - recipe.cached_at;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge) {
          return { success: true, recipe, fromCache: true };
        }
      }
      
      return { success: false, error: 'Recipe not in cache or expired' };
    } catch (error) {
      console.error('Get cached recipe error:', error);
      return { success: false, error: 'Failed to load from cache' };
    }
  }

  async getCachedRecipesList() {
    try {
      const stored = await AsyncStorage.getItem('cached_recipes_list');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Get cached recipes list error:', error);
      return [];
    }
  }

  // Sync Queue Management
  addToSyncQueue(operation) {
    this.syncQueue.push(operation);
    this.saveSyncQueue();
    
    // Notify listeners about pending syncs
    this.notifyListeners({ type: 'SYNC_QUEUE_UPDATED', count: this.syncQueue.length });
  }

  async saveSyncQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Save sync queue error:', error);
    }
  }

  async loadSyncQueue() {
    try {
      const stored = await AsyncStorage.getItem('sync_queue');
      this.syncQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Load sync queue error:', error);
      this.syncQueue = [];
    }
  }

  // Sync Operations
  async syncAll() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'SYNC_STARTED' });

    try {
      // Process sync queue
      await this.processSyncQueue();
      
      // Sync grocery list
      await this.syncGroceryList();
      
      // Refresh cached data
      await this.refreshCachedData();
      
      this.notifyListeners({ type: 'SYNC_COMPLETED' });
    } catch (error) {
      console.error('Sync all error:', error);
      this.notifyListeners({ type: 'SYNC_ERROR', error });
    } finally {
      this.isSyncing = false;
    }
  }

  async processSyncQueue() {
    const failedOperations = [];
    
    for (const operation of this.syncQueue) {
      try {
        await this.executeSync(operation);
      } catch (error) {
        console.error('Sync operation failed:', operation, error);
        failedOperations.push(operation);
      }
    }
    
    // Keep failed operations in queue for retry
    this.syncQueue = failedOperations;
    await this.saveSyncQueue();
  }

  async executeSync(operation) {
    switch (operation.type) {
      case 'UPDATE_GROCERY_LIST':
        if (operation.id === 'current') {
          await YesChefAPI.saveGroceryList(operation.data);
        } else {
          await YesChefAPI.updateGroceryList(operation.id, operation.data);
        }
        break;
        
      case 'UPDATE_MEAL_PLAN':
        await YesChefAPI.updateMealPlan(operation.data);
        break;
        
      default:
        console.warn('Unknown sync operation type:', operation.type);
    }
  }

  async syncGroceryList() {
    try {
      const localList = await this.loadGroceryListOffline();
      if (localList.success && localList.list) {
        const result = await YesChefAPI.saveGroceryList(localList.list);
        if (result.success) {
          console.log('✅ Grocery list synced to backend');
        }
      }
    } catch (error) {
      console.error('Sync grocery list error:', error);
    }
  }

  async refreshCachedData() {
    try {
      // Refresh recently viewed recipes
      const cachedRecipeIds = await this.getCachedRecipesList();
      
      // Refresh the most recent 5 recipes
      const recentIds = cachedRecipeIds.slice(-5);
      
      for (const recipeId of recentIds) {
        try {
          const result = await YesChefAPI.getRecipe(recipeId);
          if (result.success) {
            await this.cacheRecipe(result.recipe);
          }
        } catch (error) {
          console.error('Refresh cached recipe error:', recipeId, error);
        }
      }
    } catch (error) {
      console.error('Refresh cached data error:', error);
    }
  }

  // Smart Recipe Loading (Cache-first with fallback)
  async loadRecipe(recipeId) {
    // Try cache first for instant loading
    const cached = await this.getCachedRecipe(recipeId);
    
    if (cached.success) {
      // Return cached version immediately
      this.notifyListeners({ 
        type: 'RECIPE_LOADED', 
        recipe: cached.recipe, 
        fromCache: true 
      });
      
      // If online, refresh in background
      if (this.isOnline) {
        this.refreshRecipeInBackground(recipeId);
      }
      
      return cached;
    }
    
    // If not in cache and online, fetch from backend
    if (this.isOnline) {
      const result = await YesChefAPI.getRecipe(recipeId);
      if (result.success) {
        // Cache for future offline use
        await this.cacheRecipe(result.recipe);
        return result;
      }
    }
    
    return { success: false, error: 'Recipe not available offline' };
  }

  async refreshRecipeInBackground(recipeId) {
    try {
      const result = await YesChefAPI.getRecipe(recipeId);
      if (result.success) {
        await this.cacheRecipe(result.recipe);
        
        // Notify if recipe was updated
        this.notifyListeners({ 
          type: 'RECIPE_UPDATED', 
          recipe: result.recipe 
        });
      }
    } catch (error) {
      console.error('Background recipe refresh error:', recipeId, error);
    }
  }

  // Periodic sync for background updates
  startPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, 5 * 60 * 1000);
  }

  // Event system for UI updates
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // Status getters
  getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingSyncCount: this.syncQueue.length,
    };
  }

  // Clear all offline data (for logout)
  async clearOfflineData() {
    try {
      await AsyncStorage.multiRemove([
        'current_grocery_list',
        'sync_queue',
        'cached_recipes_list',
      ]);
      
      // Clear cached recipes
      const cachedIds = await this.getCachedRecipesList();
      const cacheKeys = cachedIds.map(id => `recipe_cache_${id}`);
      await AsyncStorage.multiRemove(cacheKeys);
      
      this.syncQueue = [];
    } catch (error) {
      console.error('Clear offline data error:', error);
    }
  }
}

// Export singleton instance
export default new OfflineSyncManager();
