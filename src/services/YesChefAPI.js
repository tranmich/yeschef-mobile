// YesChef API Integration Service - Production Mode (Authentication Required)
// Connects mobile app to your existing Flask backend with PostgreSQL data

import * as SecureStore from 'expo-secure-store';

class YesChefAPI {
  constructor() {
    // 🔧 IMPORTANT: Update this to your computer's IP address!
    // Your backend is running on: http://192.168.1.72:5000
    this.baseURL = 'http://192.168.1.72:5000'; // Use your computer's IP
    // this.baseURL = 'http://localhost:5000'; // Only works in web browser
    
    this.token = null;
    this.user = null;
    this.debugMode = true; // Enable detailed logging
  }

  // Debug logging helper
  log(message, data = null) {
    if (this.debugMode) {
      console.log(`🐛 YesChefAPI: ${message}`, data || '');
    }
  }

  error(message, error = null) {
    console.error(`❌ YesChefAPI: ${message}`, error || '');
  }

  // Network connectivity test
  async testConnection() {
    this.log('Testing connection to backend...');
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        timeout: 5000,
      });
      
      this.log('Connection test response:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      });
      
      if (response.ok) {
        this.log('✅ Backend connection successful!');
        return { success: true, status: 'connected' };
      } else {
        this.error('Backend responded with error:', response.status);
        return { success: false, error: `Server returned ${response.status}` };
      }
    } catch (error) {
      this.error('Connection test failed:', error);
      return { 
        success: false, 
        error: 'Cannot reach backend server',
        details: error.message 
      };
    }
  }

  // Enhanced fetch with debugging
  async debugFetch(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    this.log('Making request:', {
      url: fullUrl,
      method: options.method || 'GET',
      headers: options.headers || {}
    });

    try {
      const response = await fetch(fullUrl, {
        timeout: 10000, // 10 second timeout
        ...options,
      });

      this.log('Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      return response;
    } catch (error) {
      this.error('Fetch error:', {
        url: fullUrl,
        error: error.message,
        type: error.name
      });
      throw error;
    }
  }

  // Authentication Methods with debugging
  async login(email, password) {
    this.log('Attempting login for:', email);
    try {
      const response = await this.debugFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      this.log('Login response data:', data);
      
      if (response.ok) {
        this.token = data.access_token;
        this.user = data.user;
        
        // Store securely for persistence
        await this.storeAuthData(data);
        this.log('✅ Login successful!');
        
        return { success: true, user: data.user };
      } else {
        this.error('Login failed:', data);
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      this.error('Login error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async logout() {
    this.log('Logging out and clearing all auth data...');
    this.token = null;
    this.user = null;
    await this.clearAuthData();
    this.log('✅ Logout complete');
  }

  // Recipe Methods - Authenticated Only
  async getRecipes(filters = {}) {
    this.log('Getting recipes with filters:', filters);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login' };
    }

    try {
      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return connectionTest;
      }

      const queryParams = new URLSearchParams();
      
      // Add filters (category, search, etc.)
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      // 🔧 FIX #1: Request all recipes (increase from default 50 to 10000)
      const url = `/api/recipes?limit=10000${queryParams.toString() ? '&' + queryParams.toString() : ''}`;
      
      const response = await this.debugFetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Recipes fetched successfully:', {
          count: data.recipes?.length || 0
        });
        return { 
          success: true, 
          recipes: data.recipes || []
        };
      } else {
        const errorData = await response.text();
        this.error('Get recipes failed:', errorData);
        return { success: false, error: 'Failed to fetch recipes' };
      }
    } catch (error) {
      this.error('Get recipes error:', error);
      return { 
        success: false, 
        error: 'Network error - check backend connection',
        details: error.message 
      };
    }
  }

  async getRecipe(recipeId) {
    this.log('Getting recipe:', recipeId);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch(`/api/recipes/${recipeId}`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // 🔧 FIX #3: Extract recipe from 'data' field (backend wraps response)
        const recipe = responseData.data || responseData;
        
        this.log('✅ Recipe fetched successfully:', recipe.title || recipe.name || 'Untitled');
        
        // 🔧 FIX #3: Add detailed data structure debugging
        this.log('🔍 Recipe data structure:', {
          hasTitle: !!(recipe.title || recipe.name),
          hasIngredients: !!recipe.ingredients,
          hasInstructions: !!recipe.instructions,
          ingredientsType: typeof recipe.ingredients,
          instructionsType: typeof recipe.instructions,
          ingredientsLength: recipe.ingredients?.length || 'N/A',
          instructionsLength: recipe.instructions?.length || 'N/A',
          rawIngredients: recipe.ingredients,
          rawInstructions: recipe.instructions
        });
        
        return { success: true, recipe: recipe };
      } else {
        this.error('Get recipe failed:', response.status);
        return { success: false, error: 'Recipe not found' };
      }
    } catch (error) {
      this.error('Get recipe error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Import recipe using your Universal Recipe Intelligence System
  async importRecipe(url) {
    this.log('Importing recipe from:', url);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      const response = await this.debugFetch('/api/recipes/import/url', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      this.log('Import response:', data);
      
      if (response.ok) {
        this.log('✅ Recipe imported successfully!', {
          title: data.recipe?.title,
          confidence: data.recipe?.confidence_score
        });
        return { 
          success: true, 
          recipe: data.recipe
        };
      } else {
        this.error('Import failed:', data);
        return { success: false, error: data.error || 'Import failed' };
      }
    } catch (error) {
      this.error('Import recipe error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // Grocery List Methods - Authenticated Only
  async getGroceryLists() {
    this.log('Getting grocery lists...');
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        this.error('Connection test failed before grocery list fetch');
        return connectionTest;
      }

      const response = await this.debugFetch('/api/grocery-lists', {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery lists fetched:', {
          count: data.grocery_lists?.length || 0
        });
        // Backend returns 'grocery_lists', normalize to 'lists' for compatibility
        return { success: true, lists: data.grocery_lists || [] };
      } else {
        const errorText = await response.text();
        this.error('Get grocery lists failed:', {
          status: response.status,
          error: errorText
        });
        return { success: false, error: 'Failed to fetch grocery lists' };
      }
    } catch (error) {
      this.error('Get grocery lists error:', error);
      return { 
        success: false, 
        error: 'Cannot connect to backend - check server',
        details: error.message 
      };
    }
  }

  async getGroceryListDetails(listId) {
    this.log('Getting grocery list details for ID:', listId);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch(`/api/grocery-lists/${listId}`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list details fetched:', {
          id: listId,
          name: data.grocery_list?.list_name
        });
        return { success: true, list: data.grocery_list };
      } else {
        const errorText = await response.text();
        this.error('Get grocery list details failed:', {
          status: response.status,
          error: errorText
        });
        return { success: false, error: 'Failed to fetch grocery list details' };
      }
    } catch (error) {
      this.error('Get grocery list details error:', error);
      return { 
        success: false, 
        error: 'Cannot connect to backend - check server',
        details: error.message 
      };
    }
  }

  async saveGroceryList(listData) {
    this.log('Saving grocery list:', {
      name: listData.name,
      itemCount: listData.items?.length || 0
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch('/api/grocery-lists', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listData),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list saved successfully!');
        return { success: true, list: data };
      } else {
        const errorText = await response.text();
        this.error('Save grocery list failed:', errorText);
        return { success: false, error: 'Failed to save grocery list' };
      }
    } catch (error) {
      this.error('Save grocery list error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async updateGroceryList(listId, listData) {
    this.log('Updating grocery list:', {
      id: listId,
      name: listData.list_name,
      itemCount: Array.isArray(listData.list_data) ? listData.list_data.length : 'complex'
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch(`/api/grocery-lists/${listId}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listData),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list updated successfully!');
        return { success: true, list: data };
      } else {
        const errorText = await response.text();
        this.error('Update grocery list failed:', errorText);
        return { success: false, error: 'Failed to update grocery list' };
      }
    } catch (error) {
      this.error('Update grocery list error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // Utility Methods
  getAuthHeaders() {
    const headers = {
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      this.log('Using auth token in request');
    } else {
      this.error('❌ No auth token available - user must login');
    }
    return headers;
  }

  async storeAuthData(authData) {
    this.log('Storing auth data securely...');
    try {
      await SecureStore.setItemAsync('yeschef_token', authData.access_token);
      await SecureStore.setItemAsync('yeschef_user', JSON.stringify(authData.user));
      this.log('✅ Auth data stored securely');
    } catch (error) {
      this.error('Store auth data error:', error);
    }
  }

  async loadAuthData() {
    this.log('Loading stored auth data...');
    try {
      const token = await SecureStore.getItemAsync('yeschef_token');
      const userStr = await SecureStore.getItemAsync('yeschef_user');
      
      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
        this.log('✅ Auth data loaded from storage');
        return true;
      }
      this.log('ℹ️ No stored auth data found');
      return false;
    } catch (error) {
      this.error('Load auth data error:', error);
      return false;
    }
  }

  async clearAuthData() {
    this.log('Clearing all auth data...');
    try {
      // Clear in-memory data
      this.token = null;
      this.user = null;
      
      // Clear stored data
      await SecureStore.deleteItemAsync('yeschef_token');
      await SecureStore.deleteItemAsync('yeschef_user');
      this.log('✅ All auth data cleared');
    } catch (error) {
      this.error('Clear auth data error:', error);
    }
  }

  // Debug status methods
  getDebugInfo() {
    return {
      baseURL: this.baseURL,
      hasToken: !!this.token,
      hasUser: !!this.user,
      debugMode: this.debugMode,
      userEmail: this.user?.email || 'Not logged in',
      authMode: this.token ? 'Authenticated' : 'Not Authenticated'
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    const authenticated = !!this.token && !!this.user;
    if (!authenticated) {
      this.log('❌ Authentication check failed - no token or user');
    }
    return authenticated;
  }

  // Get current user
  getCurrentUser() {
    this.log('Getting current user:', this.user?.email || 'None');
    return this.user;
  }

  // Enable/disable debug mode
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export default new YesChefAPI();
