// YesChef API Integration Service - Production Mode (Authentication Required)
// Connects mobile app to your existing Flask backend with PostgreSQL data

import * as SecureStore from 'expo-secure-store';

class YesChefAPI {
  constructor() {
    // � PRODUCTION: Use live Railway deployment URL
    this.baseURL = 'https://yeschefapp-production.up.railway.app';
    // this.baseURL = 'http://192.168.1.72:5000'; // Local development
    
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
    
    this.log(`Making request: ${options.method || 'GET'} ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        timeout: 10000, // 10 second timeout
        ...options,
      });

      this.log(`Response: ${response.status} ${response.ok ? '✅' : '❌'}`);

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

  // Google Sign-In authentication
  async googleSignIn(googleUser) {
    this.log('🔐 Attempting Google Sign-In for:', googleUser.email);
    try {
      const response = await this.debugFetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          google_id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          photo: googleUser.picture, // Different field name in Google API v2
        }),
      });

      const data = await response.json();
      this.log('Google Sign-In response data:', data);
      
      if (response.ok) {
        this.token = data.access_token;
        this.user = data.user;
        
        // Store securely for persistence
        await this.storeAuthData(data);
        this.log('✅ Google Sign-In successful!');
        
        return { success: true, user: data.user };
      } else {
        this.error('Google Sign-In failed:', data);
        return { success: false, error: data.error || 'Google sign-in failed' };
      }
    } catch (error) {
      this.error('Google Sign-In error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async logout() {
    this.log('Logging out and clearing all auth data...');
    
    try {
      // Call backend logout endpoint first
      if (this.token) {
        this.log('Calling backend logout endpoint...');
        await this.debugFetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
        this.log('✅ Backend logout successful');
      }
    } catch (error) {
      // Don't fail logout if backend call fails
      this.log('⚠️ Backend logout failed, continuing with local logout:', error);
    }
    
    // Clear local auth data
    this.token = null;
    this.user = null;
    await this.clearAuthData();
    this.log('✅ All auth data cleared - logout complete');
    
    return { success: true, message: 'Logged out successfully' };
  }

  // 🌐 Generic HTTP Methods for API calls
  async get(endpoint, options = {}) {
    this.log(`GET request to: ${endpoint}`);
    
    try {
      const response = await this.debugFetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (response.ok) {
        this.log(`✅ GET ${endpoint} successful`);
        return { success: true, ...data };
      } else {
        this.error(`GET ${endpoint} failed:`, data);
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      this.error(`GET ${endpoint} error:`, error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async post(endpoint, body = {}, options = {}) {
    this.log(`POST request to: ${endpoint}`, body);
    
    try {
      const response = await this.debugFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
          ...options.headers,
        },
        body: JSON.stringify(body),
        ...options,
      });

      const data = await response.json();
      
      if (response.ok) {
        this.log(`✅ POST ${endpoint} successful`);
        return { success: true, ...data };
      } else {
        this.error(`POST ${endpoint} failed:`, data);
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      this.error(`POST ${endpoint} error:`, error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async put(endpoint, body = {}, options = {}) {
    this.log(`PUT request to: ${endpoint}`, body);
    
    try {
      const response = await this.debugFetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
          ...options.headers,
        },
        body: JSON.stringify(body),
        ...options,
      });

      const data = await response.json();
      
      if (response.ok) {
        this.log(`✅ PUT ${endpoint} successful`);
        return { success: true, ...data };
      } else {
        this.error(`PUT ${endpoint} failed:`, data);
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      this.error(`PUT ${endpoint} error:`, error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async delete(endpoint, options = {}) {
    this.log(`DELETE request to: ${endpoint}`);
    
    try {
      const response = await this.debugFetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (response.ok) {
        this.log(`✅ DELETE ${endpoint} successful`);
        return { success: true, ...data };
      } else {
        this.error(`DELETE ${endpoint} failed:`, data);
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      this.error(`DELETE ${endpoint} error:`, error);
      return { success: false, error: 'Network error - check connection' };
    }
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
        
        // Simplified debugging - removed verbose data structure logging
        
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
      
      if (response.ok && data.success) {
        this.log('✅ Recipe imported successfully!', {
          title: data.recipe_data?.title,
          confidence: data.confidence,
          processing_time: data.processing_time
        });
        return { 
          success: true, 
          recipe: data.recipe_data,
          recipe_id: data.recipe_id,
          confidence: data.confidence,
          needs_review: data.needs_review,
          extraction_method: data.extraction_method
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

  async deleteRecipe(recipeId) {
    this.log('Deleting recipe:', recipeId);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login' };
    }

    try {
      const response = await this.debugFetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        this.log('✅ Recipe deleted successfully');
        return { success: true };
      } else {
        this.error('Delete failed:', data);
        return { success: false, error: data.error || 'Delete failed' };
      }
    } catch (error) {
      this.error('Delete recipe error:', error);
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
    console.log('🔧 DEBUG: YesChefAPI.saveGroceryList called with:', listData);
    
    // Convert to backend format (backend expects list_name and list_data)
    const backendData = {
      list_name: listData.name || listData.list_name,
      list_data: listData.items || listData.list_data,
      recipe_ids: listData.recipe_ids || []
    };

    console.log('🔧 DEBUG: Backend format data:', backendData);

    this.log('Saving grocery list (FIXED VERSION):', {
      list_name: backendData.list_name,
      itemCount: Array.isArray(backendData.list_data) ? backendData.list_data.length : 'complex'
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate required fields
    if (!backendData.list_name) {
      this.error('Save failed: Missing list name');
      return { success: false, error: 'List name is required' };
    }

    try {
      console.log('🔧 DEBUG: About to send backend format data:', JSON.stringify(backendData));
      
      const response = await this.debugFetch('/api/grocery-lists', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list saved successfully!');
        return { success: true, list: data };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        this.error('Save grocery list failed:', errorData);
        return { success: false, error: errorData.error || 'Failed to save grocery list' };
      }
    } catch (error) {
      this.error('Save grocery list error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async updateGroceryList(listId, listData) {
    // Convert to backend format (backend expects list_name and list_data)
    const backendData = {
      list_name: listData.name || listData.list_name,
      list_data: listData.items || listData.list_data,
      recipe_ids: listData.recipe_ids || []
    };

    this.log('Updating grocery list:', {
      id: listId,
      list_name: backendData.list_name,
      itemCount: Array.isArray(backendData.list_data) ? backendData.list_data.length : 'complex'
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
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list updated successfully!');
        return { success: true, list: data };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        this.error('Update grocery list failed:', errorData);
        return { success: false, error: errorData.error || 'Failed to update grocery list' };
      }
    } catch (error) {
      this.error('Update grocery list error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async deleteGroceryList(listId) {
    this.log('🗑️ DELETE REQUEST: Deleting grocery list:', { 
      id: listId, 
      idType: typeof listId, 
      isAuthenticated: this.isAuthenticated(),
      authToken: this.token ? 'present' : 'missing'
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const url = `/api/grocery-lists/${listId}`;
      this.log('🗑️ DELETE URL:', url);
      
      const response = await this.debugFetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      this.log('🗑️ DELETE RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        this.log('✅ Grocery list deleted successfully!');
        return { success: true };
      } else {
        const errorText = await response.text();
        this.error('❌ Delete grocery list failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          listId: listId,
          url: url
        });
        return { success: false, error: 'Failed to delete grocery list' };
      }
    } catch (error) {
      this.error('Delete grocery list error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // Generate grocery list from meal plan
  async generateGroceryListFromMealPlan(mealPlanId) {
    this.log('Generating grocery list from meal plan:', mealPlanId);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch(`/api/meal-plans/${mealPlanId}/grocery-list`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.log('✅ Grocery list generated successfully:', {
          recipeCount: data.recipe_count,
          ingredientCount: data.ingredient_count
        });
        return data;
      } else {
        this.error('Generate grocery list failed:', {
          status: response.status,
          error: data.error || data.message
        });
        return { success: false, error: data.error || data.message || 'Failed to generate grocery list' };
      }
    } catch (error) {
      this.error('Generate grocery list error:', error);
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

  // Collaboration Methods
  async inviteToCollaborate(inviteData) {
    this.log('Sending collaboration invite:', inviteData);
    try {
      const response = await this.debugFetch('/api/collaboration/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      const data = await response.json();
      this.log('Invite response:', data);
      
      if (response.ok) {
        this.log('✅ Invitation sent successfully!');
        return { success: true, data };
      } else {
        this.error('Invite failed:', data);
        return { success: false, error: data.error || 'Invitation failed' };
      }
    } catch (error) {
      this.error('Invite error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async getSharedResources() {
    this.log('Getting shared meal plans and grocery lists...');
    try {
      const response = await this.debugFetch('/api/collaboration/my-shared', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      this.log('Shared resources response:', data);
      
      if (response.ok) {
        this.log('✅ Shared resources loaded successfully!');
        return { success: true, ...data };
      } else {
        this.error('Get shared resources failed:', data);
        return { success: false, error: data.error || 'Failed to load shared resources' };
      }
    } catch (error) {
      this.error('Get shared resources error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // =====================================================
  // 👤 PROFILE API METHODS
  // =====================================================

  async getProfile() {
    this.log('Getting user profile...');
    try {
      const response = await this.get('/api/profile');
      
      if (response.success) {
        this.log('✅ Profile loaded successfully!', response.profile);
        return response;
      } else {
        this.error('Get profile failed:', response.error);
        return response;
      }
    } catch (error) {
      this.error('Get profile error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async updateProfile(profileData) {
    this.log('Updating user profile...', profileData);
    try {
      const response = await this.put('/api/profile', profileData);
      
      if (response.success) {
        this.log('✅ Profile updated successfully!');
        return response;
      } else {
        this.error('Update profile failed:', response.error);
        return response;
      }
    } catch (error) {
      this.error('Update profile error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // 📊 Get User Statistics
  async getUserStats() {
    this.log('Getting user statistics...');
    try {
      const response = await this.get('/api/profile/stats');
      
      if (response.success) {
        this.log('✅ User stats loaded successfully!', response.stats);
        return response;
      } else {
        this.error('Get user stats failed:', response.error);
        return response;
      }
    } catch (error) {
      this.error('Get user stats error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async uploadProfilePhoto(imageUri) {
    this.log('Uploading profile photo...', imageUri);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const token = await this.getToken();
      if (!token) {
        this.error('No authentication token available');
        return { success: false, error: 'Authentication required' };
      }

      const response = await fetch(`${this.baseURL}/api/profile/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      this.log('Profile photo upload response:', data);

      if (response.ok) {
        this.log('✅ Profile photo uploaded successfully!');
        return { success: true, ...data };
      } else {
        this.error('Profile photo upload failed:', data);
        return { success: false, error: data.error || 'Failed to upload photo' };
      }
    } catch (error) {
      this.error('Profile photo upload error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async checkUsernameAvailability(username) {
    this.log('Checking username availability...', username);
    try {
      const response = await this.post('/api/profile/username/check', { username });
      
      if (response.success) {
        this.log('✅ Username availability checked!', response);
        return response;
      } else {
        this.error('Username check failed:', response.error);
        return response;
      }
    } catch (error) {
      this.error('Username check error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // 🗑️ Delete user account permanently
  async deleteAccount() {
    this.log('🗑️ Initiating account deletion...');
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Account deleted successfully');
        
        // Clear all auth data after successful deletion
        await this.clearAuthData();
        
        return { success: true, ...data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.error('❌ Account deletion failed:', response.status, errorData);
        return { success: false, error: errorData.error || `Failed to delete account (HTTP ${response.status})` };
      }
    } catch (error) {
      this.error('Account deletion error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }
}

// Export singleton instance
export default new YesChefAPI();
