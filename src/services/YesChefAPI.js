// YesChef API Integration Service - Production Mode (Authentication Required)
// Connects mobile app to your existing Flask backend with PostgreSQL data

import * as SecureStore from 'expo-secure-store';

class YesChefAPI {
  constructor() {
    // 🔧 AUTO-DETECT: Use Railway in production, local in development
    const isDevelopment = __DEV__; // React Native's built-in development flag
    
    if (isDevelopment) {
      // Development: Use local backend
      this.baseURL = 'http://192.168.1.72:5000';
      this.debugMode = true;
      console.log('🔧 YesChefAPI: Using LOCAL backend (development mode)');
    } else {
      // Production: Use Railway
      this.baseURL = 'https://yeschefapp-production.up.railway.app';
      this.debugMode = false;
      console.log('🚀 YesChefAPI: Using RAILWAY backend (production mode)');
    }
    
    this.token = null;
    this.user = null;
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

  // Forgot Password
  async forgotPassword(email) {
    this.log('🔑 Requesting password reset for:', email);
    try {
      const response = await this.debugFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      this.log('Forgot password response:', data);
      
      if (response.ok) {
        this.log('✅ Password reset request successful!');
        return { success: true, message: data.message };
      } else {
        this.error('Forgot password failed:', data);
        return { success: false, error: data.error || 'Failed to send reset link' };
      }
    } catch (error) {
      this.error('Forgot password error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // User Registration
  async register(name, email, password) {
    this.log('📝 Attempting registration for:', email);
    try {
      const response = await this.debugFetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      this.log('Registration response data:', data);
      
      if (response.ok) {
        this.token = data.access_token;
        this.user = data.user;
        
        // Store securely for persistence
        await this.storeAuthData(data);
        this.log('✅ Registration successful!');
        
        return { success: true, user: data.user };
      } else {
        this.error('Registration failed:', data);
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      this.error('Registration error:', error);
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
    this.log('Getting recipes with filters (v2):', filters);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login' };
    }

    try {
      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return connectionTest;
      }

      // Get current user ID from stored data
      const storedUser = await this.getStoredUser();
      const userId = storedUser?.id;
      
      if (!userId) {
        return { success: false, error: 'User ID not found - please re-login' };
      }

      const queryParams = new URLSearchParams();
      
      // Add filters (category, search, etc.)
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      // 🔧 v2: Use /api/v2/recipes/user/:userId endpoint
      const baseUrl = `/api/v2/recipes/user/${userId}`;
      const url = queryParams.toString() ? 
        `${baseUrl}?${queryParams.toString()}` : 
        baseUrl;
      
      this.log('🔍 Making recipes API call (v2) to:', url);
      
      const response = await this.debugFetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        
        // v2 response format: { success: true, data: { items: [...], pagination: {...} } }
        const recipes = data.data?.items || data.recipes || [];
        
        this.log('✅ Recipes fetched successfully (v2):', {
          count: recipes.length
        });
        return { 
          success: true, 
          recipes: recipes  // Return the extracted recipes array
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
    this.log('Getting recipe (v2):', recipeId);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      // Get current user ID
      const storedUser = await this.getStoredUser();
      const userId = storedUser?.id;
      
      // v2: Use /api/v2/recipes/:id with user_id query param
      const url = `/api/v2/recipes/${recipeId}${userId ? `?user_id=${userId}` : ''}`;
      
      const response = await this.debugFetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // v2 response format: { success: true, data: {...} }
        const recipe = responseData.data || responseData.recipe || responseData;
        
        this.log('✅ Recipe fetched successfully (v2):', recipe.title || recipe.name || 'Untitled');
        
        return { success: true, recipe: recipe };
      } else {
        this.error('Get recipe failed (v2):', response.status);
        return { success: false, error: 'Recipe not found' };
      }
    } catch (error) {
      this.error('Get recipe error (v2):', error);
      return { success: false, error: 'Network error' };
    }
  }

  // 🆕 Extract recipe data from URL without saving (for review workflow)
  async extractRecipeFromUrl(url) {
    this.log('Extracting recipe from URL (no save):', url);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      // For now, we'll use the existing import endpoint but delete the recipe if user cancels
      // This is a workaround until we have a proper preview endpoint
      const response = await this.debugFetch('/api/recipes/import/url', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      this.log('Extract response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ Recipe extracted (temporary save):', {
          title: data.recipe_data?.title,
          recipe_id: data.recipe_id,
          confidence: data.confidence
        });
        return { 
          success: true, 
          recipe: data.recipe_data,
          recipe_id: data.recipe_id, // We'll need this for deletion if user cancels
          confidence: data.confidence,
          extraction_method: data.extraction_method
        };
      } else {
        this.error('Extract failed:', data);
        return { success: false, error: data.error || 'Extraction failed' };
      }
    } catch (error) {
      this.error('Extract recipe error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

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

  // 🆕 Save reviewed imported recipe with category
  async saveReviewedImportedRecipe(recipeData) {
    this.log('Saving reviewed imported recipe (v2):', recipeData.title);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      // Get current user ID
      const storedUser = await this.getStoredUser();
      const userId = storedUser?.id;
      
      if (!userId) {
        return { success: false, error: 'User ID not found - please re-login' };
      }
      
      // Clean up the request body - remove undefined values and ensure user_id
      const cleanRequestBody = Object.fromEntries(
        Object.entries({
          ...recipeData,
          user_id: userId,  // Ensure user_id is set
          source: null, // ✅ Match existing recipes (they have source: null)
          is_reviewed: true, // Flag to indicate user reviewed
        }).filter(([key, value]) => value !== undefined && value !== null)
      );
      
      this.log('📤 Sending recipe data to backend (v2):', {
        title: cleanRequestBody.title,
        category: cleanRequestBody.category,
        source: cleanRequestBody.source,
        is_reviewed: cleanRequestBody.is_reviewed,
        hasIngredients: !!cleanRequestBody.ingredients,
        hasInstructions: !!cleanRequestBody.instructions,
        cleanedFields: Object.keys(cleanRequestBody).sort()
      });
      
      // v2: Use /api/v2/recipes endpoint
      const response = await this.debugFetch('/api/v2/recipes', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanRequestBody),
      });

      const data = await response.json();
      this.log('Save reviewed recipe response (v2):', data);
      
      if (response.ok && data.success) {
        // v2 response format: { success: true, data: {...} }
        const recipe = data.data || data.recipe;
        
        this.log('✅ Reviewed recipe saved successfully (v2)!', {
          title: recipeData.title,
          category: recipeData.category,
          recipe_id: recipe?.id,
          backend_response: data
        });
        return { 
          success: true, 
          recipe: recipe,
          recipe_id: recipe?.id
        };
      } else {
        this.error('Save reviewed recipe failed (v2):', data);
        return { success: false, error: data.error || 'Failed to save recipe' };
      }
    } catch (error) {
      this.error('Save reviewed recipe error:', error);
      return { 
        success: false, 
        error: 'Network error - check backend connection',
        details: error.message 
      };
    }
  }

  async deleteRecipe(recipeId) {
    this.log('Deleting recipe (v2):', recipeId);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login' };
    }

    try {
      // Get current user ID
      const storedUser = await this.getStoredUser();
      const userId = storedUser?.id;
      
      // v2: Use /api/v2/recipes/:id with user_id query param
      const url = `/api/v2/recipes/${recipeId}${userId ? `?user_id=${userId}` : ''}`;
      
      const response = await this.debugFetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        this.log('✅ Recipe deleted successfully (v2)');
        return { success: true };
      } else {
        this.error('Delete failed (v2):', data);
        return { success: false, error: data.error || 'Delete failed' };
      }
    } catch (error) {
      this.error('Delete recipe error (v2):', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async updateRecipeCategory(recipeId, categoryId) {
    this.log('Updating recipe category (v2):', { recipeId, categoryId });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login' };
    }

    try {
      // Get current user ID
      const storedUser = await this.getStoredUser();
      const userId = storedUser?.id;
      
      // v2: Use PATCH /api/v2/recipes/:id (not separate /category endpoint)
      const url = `/api/v2/recipes/${recipeId}${userId ? `?user_id=${userId}` : ''}`;
      
      const response = await this.debugFetch(url, {
        method: 'PATCH',  // v2 uses PATCH instead of PUT
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          category: categoryId,
          user_id: userId  // Include in body as well
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // v2 response format: { success: true, data: {...} }
        const recipe = data.data || data.recipe;
        
        this.log('✅ Recipe category updated successfully (v2)');
        return { success: true, recipe: recipe };
      } else {
        this.error('Update category failed (v2):', data);
        return { success: false, error: data.error || 'Update failed' };
      }
    } catch (error) {
      this.error('Update recipe category error (v2):', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // Grocery List Methods - Authenticated Only (v2 API)
  async getGroceryLists() {
    this.log('Getting grocery lists (v2)...');
    
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

      const response = await this.debugFetch(`/api/v2/grocery-lists/user/${this.user.id}`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery lists fetched (v2):', {
          count: data.data?.grocery_lists?.length || 0
        });
        // v2 returns {success, data: {grocery_lists}}
        return { success: true, lists: data.data?.grocery_lists || [] };
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
    this.log('Getting grocery list details (v2) for ID:', listId);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch(`/api/v2/grocery-lists/${listId}?user_id=${this.user.id}`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list details fetched (v2):', {
          id: listId,
          name: data.data?.name
        });
        // v2 returns {success, data: {groceryList}}
        return { success: true, list: data.data };
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
    console.log('🔧 DEBUG: YesChefAPI.saveGroceryList (v2) called with:', listData);
    
    // v2 backend expects: {user_id, name, items}
    const backendData = {
      user_id: this.user.id,
      name: listData.name || listData.list_name,
      items: listData.items || listData.list_data || [],
      meal_plan_id: listData.meal_plan_id || null
    };

    console.log('🔧 DEBUG: v2 Backend format data:', backendData);

    this.log('Saving grocery list (v2):', {
      name: backendData.name,
      itemCount: Array.isArray(backendData.items) ? backendData.items.length : 'complex'
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate required fields
    if (!backendData.name) {
      this.error('Save failed: Missing list name');
      return { success: false, error: 'List name is required' };
    }

    try {
      console.log('🔧 DEBUG: About to send v2 backend format data:', JSON.stringify(backendData));
      
      const response = await this.debugFetch('/api/v2/grocery-lists', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list saved successfully (v2)!');
        // v2 returns {success, data, message}
        return { success: true, list: data.data };
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
    // v2 backend expects: {user_id, name, items}
    const backendData = {
      user_id: this.user.id,
      name: listData.name || listData.list_name,
      items: listData.items || listData.list_data || [],
      meal_plan_id: listData.meal_plan_id || null
    };

    this.log('Updating grocery list (v2):', {
      id: listId,
      name: backendData.name,
      itemCount: Array.isArray(backendData.items) ? backendData.items.length : 'complex'
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch(`/api/v2/grocery-lists/${listId}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Grocery list updated successfully (v2)!');
        // v2 returns {success, data, message}
        return { success: true, list: data.data };
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
    this.log('🗑️ DELETE REQUEST (v2): Deleting grocery list:', { 
      id: listId, 
      idType: typeof listId, 
      isAuthenticated: this.isAuthenticated(),
      authToken: this.token ? 'present' : 'missing'
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const url = `/api/v2/grocery-lists/${listId}?user_id=${this.user.id}`;
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
        this.log('✅ Grocery list deleted successfully (v2)!');
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

  // 🌟 Share Recipe to Community
  async shareRecipe(recipeId, shareData) {
    this.log('Sharing recipe to community:', {
      recipe_id: recipeId,
      community_title: shareData.community_title
    });
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      const response = await this.debugFetch('/api/community/recipes', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe_id: recipeId,
          community_title: shareData.community_title,
          community_description: shareData.community_description,
          community_background: shareData.community_background,
          community_icon: shareData.community_icon,
        }),
      });

      const data = await response.json();
      this.log('Share recipe response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ Recipe shared successfully!', {
          recipe_id: recipeId,
          community_title: shareData.community_title,
          community_background: shareData.community_background,
          community_icon: shareData.community_icon,
          backend_response: data
        });
        return { success: true, shared_recipe: data.shared_recipe };
      } else {
        this.error('Share recipe failed:', data);
        return { success: false, error: data.error || 'Failed to share recipe' };
      }
    } catch (error) {
      this.error('Share recipe error:', error);
      return { success: false, error: 'Network error' };
    }
  }

    // 🎨 Save Profile Avatar
  async saveProfileAvatar(avatarData) {
    this.log('Saving profile avatar:', avatarData);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      const response = await this.debugFetch('/api/profile/avatar', {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          background: avatarData.background,
          icon: avatarData.icon,
        }),
      });

      const data = await response.json();
      this.log('Save avatar response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ Profile avatar saved successfully!', {
          background: avatarData.background,
          icon: avatarData.icon
        });
        return { success: true, avatar: data.avatar };
      } else {
        this.error('Save avatar failed:', data);
        return { success: false, error: data.error || 'Failed to save avatar' };
      }
    } catch (error) {
      this.error('Save avatar error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // 🎨 Get Profile Avatar
  async getProfileAvatar() {
    this.log('Getting profile avatar');
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      const response = await this.debugFetch('/api/profile/avatar', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      this.log('Get avatar response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ Profile avatar loaded successfully!', data.avatar);
        return { success: true, avatar: data.avatar };
      } else {
        this.error('Get avatar failed:', data);
        return { success: false, error: data.error || 'Failed to get avatar' };
      }
    } catch (error) {
      this.error('Get avatar error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // ===================================
  // 🎤 VOICE RECIPE RECORDING (Phase 2 - Oct 6, 2025)
  // ===================================

  // Search languages for voice recording
  async searchLanguages(query = '') {
    this.log('Searching languages:', query);
    
    try {
      const response = await this.debugFetch(`/api/recipes/voice/languages/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
      });

      const data = await response.json();
      this.log('Language search response:', data);
      
      if (response.ok && data.success) {
        this.log(`✅ Found ${data.count} languages`);
        return { 
          success: true, 
          languages: data.languages,
          count: data.count
        };
      } else {
        this.error('Language search failed:', data);
        return { success: false, error: data.error || 'Language search failed' };
      }
    } catch (error) {
      this.error('Language search error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // Process voice recording session (multi-segment)
  async processVoiceSession(sessionData) {
    this.log('Processing voice session:', sessionData.session_id);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add metadata as JSON string
      formData.append('metadata', JSON.stringify({
        session_id: sessionData.session_id,
        total_duration_ms: sessionData.total_duration_ms,
        language_config: sessionData.language_config,
        segments: sessionData.segments.map((seg, idx) => ({
          label: seg.label,
          duration_ms: seg.duration_ms
        }))
      }));
      
      // Add audio files
      sessionData.segments.forEach((segment, index) => {
        // Create blob from audio URI
        formData.append(`segment_${index}`, {
          uri: segment.audio_uri,
          type: 'audio/m4a',
          name: `segment_${index}.m4a`
        });
      });
      
      this.log(`Uploading ${sessionData.segments.length} audio segments...`);
      
      const response = await this.debugFetch('/api/recipes/voice/session/process', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      this.log('Voice session process response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ Voice session processed successfully!', {
          transcript_length: data.combined_transcript?.length,
          confidence: data.confidence,
          segments: data.segments?.length
        });
        return { 
          success: true, 
          transcript: data.auto_edited || data.combined_transcript,
          combined_transcript: data.combined_transcript,
          confidence: data.confidence,
          segments: data.segments,
          language: data.language
        };
      } else {
        this.error('Voice session processing failed:', data);
        return { success: false, error: data.error || 'Session processing failed' };
      }
    } catch (error) {
      this.error('Voice session processing error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // Generate recipe from approved transcript
  async generateRecipeFromTranscript(transcript, metadata) {
    this.log('Generating recipe from transcript');
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      const response = await this.debugFetch('/api/recipes/voice/generate', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          metadata
        }),
      });

      const data = await response.json();
      this.log('Recipe generation response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ Recipe generated from voice!', {
          title: data.recipe_data?.title,
          ingredients: data.recipe_data?.ingredients?.length,
          instructions: data.recipe_data?.instructions?.length,
          confidence: data.confidence
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
        this.error('Recipe generation failed:', data);
        return { success: false, error: data.error || 'Recipe generation failed' };
      }
    } catch (error) {
      this.error('Recipe generation error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // 📷 Process OCR images (camera/gallery photos)
  async processOCRImages(photos) {
    this.log('Processing OCR images:', photos.length);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add metadata
      formData.append('metadata', JSON.stringify({
        photo_count: photos.length,
        timestamp: new Date().toISOString()
      }));
      
      // Add image files
      photos.forEach((photo, index) => {
        formData.append(`image_${index}`, {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `recipe_page_${index + 1}.jpg`
        });
      });
      
      this.log(`📸 Uploading ${photos.length} photos for OCR processing...`);
      
      const response = await this.debugFetch('/api/recipes/import/ocr', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          // Note: Don't set Content-Type for FormData - browser sets it with boundary
        },
        body: formData,
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        this.error('Non-JSON response from server:', text.substring(0, 500));
        return { 
          success: false, 
          error: 'Server error - received HTML instead of JSON. Check backend logs.'
        };
      }

      const data = await response.json();
      this.log('OCR processing response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ OCR images processed successfully!', {
          recipe_title: data.recipe?.title,
          confidence: data.confidence,
          extraction_method: data.extraction_method
        });
        return { 
          success: true, 
          recipe: data.recipe,
          recipe_id: data.recipe_id,
          confidence: data.confidence,
          extraction_method: data.extraction_method
        };
      } else {
        this.error('OCR processing failed:', data);
        return { success: false, error: data.error || 'OCR processing failed' };
      }
    } catch (error) {
      this.error('OCR processing error:', error);
      return { 
        success: false, 
        error: `OCR error: ${error.message || 'Network error - check connection'}`
      };
    }
  }
}

// Export singleton instance
export default new YesChefAPI();
