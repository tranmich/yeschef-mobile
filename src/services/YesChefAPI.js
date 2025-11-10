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

  // ========================================
  // 🔐 AUTHENTICATION METHODS - V2 API
  // ========================================
  // Migrated to V2 API (October 31, 2025)
  // - Uses /api/v2/auth/* endpoints
  // - Token format: data.token (V2) vs access_token (V1)
  // - Response format: wrapped in data object
  // - Google OAuth still on V1 (not yet implemented in V2)
  // ========================================
  
  // Authentication Methods with debugging
  async login(email, password) {
    this.log('Attempting login for:', email);
    try {
      const response = await this.debugFetch('/api/v2/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      this.log('Login response data:', data);
      
      if (response.ok && data.success) {
        // V2 API wraps response in data object
        this.token = data.data.token;
        this.user = data.data.user;
        
        // Store securely for persistence (convert to V1 format for compatibility)
        await this.storeAuthData({ access_token: data.data.token, user: data.data.user });
        this.log('✅ Login successful!');
        
        return { success: true, user: data.data.user };
      } else {
        this.error('Login failed:', data);
        return { success: false, error: data.error || data.message || 'Login failed' };
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
      // Note: Google OAuth not yet implemented in V2, keeping V1 for now
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
      const response = await this.debugFetch('/api/v2/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      this.log('Forgot password response:', data);
      
      if (response.ok && data.success) {
        this.log('✅ Password reset request successful!');
        return { success: true, message: data.message };
      } else {
        this.error('Forgot password failed:', data);
        return { success: false, error: data.error || data.message || 'Failed to send reset link' };
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
      const response = await this.debugFetch('/api/v2/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      this.log('Registration response data:', data);
      
      if (response.ok && data.success) {
        // V2 API wraps response in data object
        this.token = data.data.token;
        this.user = data.data.user;
        
        // Store securely for persistence (convert to V1 format for compatibility)
        await this.storeAuthData({ access_token: data.data.token, user: data.data.user });
        this.log('✅ Registration successful!');
        
        return { success: true, user: data.data.user };
      } else {
        this.error('Registration failed:', data);
        return { success: false, error: data.error || data.message || 'Registration failed' };
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
        await this.debugFetch('/api/v2/auth/logout', {
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

      // Get user ID from this.user
      const userId = this.user?.id;
      
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
      
      // Add high per_page limit to get all recipes (v2 defaults to 20)
      if (!filters.per_page) {
        queryParams.append('per_page', '1000');  // Request up to 1000 recipes
      }

      // 🔧 v2: Use /api/v2/recipes/user/:userId endpoint
      const baseUrl = `/api/v2/recipes/user/${userId}`;
      const url = queryParams.toString() ? 
        `${baseUrl}?${queryParams.toString()}` : 
        `${baseUrl}?per_page=1000`;
      
      this.log('🔍 Making recipes API call (v2) to:', url);
      
      const response = await this.debugFetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        
        // v2 response format: { success: true, data: { items: [...], pagination: {...} } }
        const recipes = data.data?.items || data.recipes || [];
        const pagination = data.data?.pagination;
        
        this.log('✅ Recipes fetched successfully (v2):', {
          count: recipes.length,
          total: pagination?.total,
          page: pagination?.page,
          per_page: pagination?.per_page
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
      // Get user ID from this.user
      const userId = this.user?.id;
      
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
      // v2: Use /api/v2/recipes/import/url
      const response = await this.debugFetch('/api/v2/recipes/import/url', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          user_id: this.user?.id 
        }),
      });

      const responseData = await response.json();
      this.log('Extract response (v2):', responseData);
      
      // v2 response format: { success, data: { recipe, message } }
      if (response.ok && responseData.success) {
        const recipe = responseData.data?.recipe;
        this.log('✅ Recipe extracted (v2):', {
          title: recipe?.title,
          id: recipe?.id
        });
        return { 
          success: true, 
          recipe: recipe,
          recipe_id: recipe?.id,
          confidence: responseData.data?.confidence,
          extraction_method: recipe?.extraction_method
        };
      } else {
        this.error('Extract failed (v2):', responseData);
        return { success: false, error: responseData.error || 'Extraction failed' };
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
      // v2: Use /api/v2/recipes/import/url
      const response = await this.debugFetch('/api/v2/recipes/import/url', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          user_id: this.user?.id 
        }),
      });

      const responseData = await response.json();
      this.log('Import response (v2):', responseData);
      
      // v2 response format: { success, data: { recipe, message } }
      if (response.ok && responseData.success) {
        const recipe = responseData.data?.recipe;
        this.log('✅ Recipe imported successfully (v2)!', {
          title: recipe?.title,
          id: recipe?.id
        });
        return { 
          success: true, 
          recipe: recipe,
          recipe_id: recipe?.id,
          needs_review: recipe?.needs_review,
          extraction_method: recipe?.extraction_method
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
      // Get user ID from this.user
      const userId = this.user?.id;
      
      if (!userId) {
        return { success: false, error: 'User ID not found - please re-login' };
      }
      
      // 🔧 v2 FIX: Ensure ingredients and instructions are arrays (not strings or objects)
      let ingredients = recipeData.ingredients;
      let instructions = recipeData.instructions;
      
      // Convert string to array (split by newlines)
      if (typeof ingredients === 'string') {
        ingredients = ingredients.split('\n').filter(line => line.trim());
      }
      if (typeof instructions === 'string') {
        instructions = instructions.split('\n').filter(line => line.trim());
      }
      
      // 🔧 CRITICAL: Build clean request body with ONLY fields backend expects
      // Remove any nested objects/dicts that might cause psycopg2 errors
      const cleanRequestBody = {
        user_id: userId,
        title: recipeData.title,
        ingredients: ingredients,  // Array
        instructions: instructions,  // Array
        category: recipeData.category,
        source: null
        // NOTE: is_reviewed field removed - column doesn't exist in database
      };
      
      // Add optional fields if they exist and are simple types
      if (recipeData.prep_time && typeof recipeData.prep_time === 'number') {
        cleanRequestBody.prep_time = recipeData.prep_time;
      }
      if (recipeData.cook_time && typeof recipeData.cook_time === 'number') {
        cleanRequestBody.cook_time = recipeData.cook_time;
      }
      if (recipeData.servings && typeof recipeData.servings === 'number') {
        cleanRequestBody.servings = recipeData.servings;
      }
      if (recipeData.image_url && typeof recipeData.image_url === 'string') {
        cleanRequestBody.image_url = recipeData.image_url;
      }
      
      this.log('📤 Sending recipe data to backend (v2):', {
        title: cleanRequestBody.title,
        category: cleanRequestBody.category,
        source: cleanRequestBody.source,
        is_reviewed: cleanRequestBody.is_reviewed,
        ingredientsType: typeof cleanRequestBody.ingredients,
        ingredientsCount: Array.isArray(cleanRequestBody.ingredients) ? cleanRequestBody.ingredients.length : 'N/A',
        instructionsType: typeof cleanRequestBody.instructions,
        instructionsCount: Array.isArray(cleanRequestBody.instructions) ? cleanRequestBody.instructions.length : 'N/A',
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
      // Get user ID from this.user
      const userId = this.user?.id;
      
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
      // Get user ID from this.user
      const userId = this.user?.id;
      
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

    // 🔧 AUTO-RENAME: Check for duplicate names and add (1), (2), etc.
    if (backendData.name) {
      try {
        const existingLists = await this.getGroceryLists();
        if (existingLists.success && existingLists.lists) {
          const duplicates = existingLists.lists.filter(list => {
            // Check for exact match or numbered versions
            const baseName = backendData.name.replace(/\s*\(\d+\)$/, '');
            const listBaseName = list.name.replace(/\s*\(\d+\)$/, '');
            return listBaseName === baseName;
          });
          
          if (duplicates.length > 0) {
            // Find the highest number used
            let highestNumber = 0;
            duplicates.forEach(list => {
              const match = list.name.match(/\((\d+)\)$/);
              if (match) {
                highestNumber = Math.max(highestNumber, parseInt(match[1]));
              }
            });
            
            // Add (1), (2), (3), etc.
            const newNumber = highestNumber + 1;
            backendData.name = `${backendData.name} (${newNumber})`;
            this.log(`📝 Auto-renamed to avoid duplicate: "${backendData.name}"`);
          }
        }
      } catch (error) {
        this.log('⚠️ Could not check for duplicates, proceeding with original name');
      }
    }

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

  // Get user's households
  async getUserHouseholds() {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await this.debugFetch(`/api/v2/households/user/${this.user.id}`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.log('✅ Households fetched:', {
          count: data.data?.households?.length || 0
        });
        return { success: true, households: data.data?.households || [] };
      } else {
        const errorText = await response.text();
        this.error('Get households failed:', {
          status: response.status,
          error: errorText
        });
        return { success: false, error: 'Failed to fetch households' };
      }
    } catch (error) {
      this.error('Get households error:', error);
      return { 
        success: false, 
        error: 'Cannot connect to backend',
        details: error.message 
      };
    }
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
  // 👤 PROFILE API METHODS (V2)
  // =====================================================

  async getProfile() {
    this.log('Getting user profile (v2)...');
    
    if (!this.user?.id) {
      this.error('No user ID available');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // v2: Use /api/v2/profile/:userId
      const response = await this.debugFetch(`/api/v2/profile/${this.user.id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const responseData = await response.json();
      this.log('Profile response (v2):', responseData);
      
      // v2 format: { success, data: {...profile} }
      if (response.ok && responseData.success) {
        this.log('✅ Profile loaded successfully (v2)!', responseData.data);
        return { 
          success: true, 
          profile: responseData.data  // V2: profile is in 'data'
        };
      } else {
        this.error('Get profile failed (v2):', responseData);
        return { success: false, error: responseData.error };
      }
    } catch (error) {
      this.error('Get profile error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async updateProfile(profileData) {
    this.log('Updating user profile (v2)...', profileData);
    
    if (!this.user?.id) {
      this.error('No user ID available');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // v2: Use /api/v2/profile/:userId
      const response = await this.debugFetch(`/api/v2/profile/${this.user.id}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      const responseData = await response.json();
      this.log('Update profile response (v2):', responseData);
      
      // v2 format: { success, data: {...updatedProfile} }
      if (response.ok && responseData.success) {
        this.log('✅ Profile updated successfully (v2)!');
        return { 
          success: true, 
          profile: responseData.data  // V2: updated profile in 'data'
        };
      } else {
        this.error('Update profile failed (v2):', responseData);
        return { success: false, error: responseData.error };
      }
    } catch (error) {
      this.error('Update profile error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // 📊 Get User Statistics (V2)
  async getUserStats() {
    this.log('Getting user statistics (v2)...');
    
    if (!this.user?.id) {
      this.error('No user ID available');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // v2: Use /api/v2/profile/:userId/stats
      const response = await this.debugFetch(`/api/v2/profile/${this.user.id}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const responseData = await response.json();
      this.log('Stats response (v2):', responseData);
      
      // v2 format: { success, data: {...stats} }
      if (response.ok && responseData.success) {
        this.log('✅ User stats loaded successfully (v2)!', responseData.data);
        return { 
          success: true, 
          stats: responseData.data  // V2: stats in 'data'
        };
      } else {
        this.error('Get user stats failed (v2):', responseData);
        return { success: false, error: responseData.error };
      }
    } catch (error) {
      this.error('Get user stats error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  async uploadProfilePhoto(imageUri) {
    this.log('Uploading profile photo (v2)...', imageUri);
    
    if (!this.user?.id) {
      this.error('No user ID available');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // Read image as base64
      // Note: This is a placeholder - actual implementation depends on React Native Image library
      const avatarData = imageUri; // In production, convert to base64 data URI
      
      // v2: Use /api/v2/profile/:userId/avatar
      const response = await this.debugFetch(`/api/v2/profile/${this.user.id}/avatar`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          avatar_data: avatarData,
          filename: 'profile.jpg'
        })
      });

      const responseData = await response.json();
      this.log('Profile photo upload response (v2):', responseData);

      // v2 format: { success, data: { avatar_url } }
      if (response.ok && responseData.success) {
        this.log('✅ Profile photo uploaded successfully (v2)!');
        return { 
          success: true, 
          avatar_url: responseData.data?.avatar_url 
        };
      } else {
        this.error('Profile photo upload failed (v2):', responseData);
        return { success: false, error: responseData.error || 'Failed to upload photo' };
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
  async deleteAccount(password) {
    this.log('🗑️ Initiating account deletion...');
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    // V2 API requires password confirmation for security
    if (!password) {
      return { success: false, error: 'Password is required to delete account' };
    }

    try {
      const response = await this.debugFetch('/api/v2/auth/account', {
        method: 'DELETE',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }), // V2 requires password confirmation
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
    this.log('Searching languages (v2):', query);
    
    try {
      // v2: Use /api/v2/recipes/voice/languages/search
      const response = await this.debugFetch(`/api/v2/recipes/voice/languages/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
      });

      const responseData = await response.json();
      this.log('Language search response (v2):', responseData);
      
      // v2 response format: { success, data: { languages } }
      if (response.ok && responseData.success) {
        const languages = responseData.data?.languages || [];
        this.log(`✅ Found ${languages.length} languages (v2)`);
        return { 
          success: true, 
          languages: languages,
          count: languages.length
        };
      } else {
        this.error('Language search failed (v2):', responseData);
        return { success: false, error: responseData.error || 'Language search failed' };
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
      
      // v2: Use /api/v2/recipes/voice/session/process
      const response = await this.debugFetch('/api/v2/recipes/voice/session/process', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const responseData = await response.json();
      this.log('Voice session process response (v2):', responseData);
      
      // v2 response format: { success, data: { session_id, transcript, language, confidence } }
      if (response.ok && responseData.success) {
        const data = responseData.data || {};
        this.log('✅ Voice session processed successfully (v2)!', {
          transcript_length: data.transcript?.length,
          confidence: data.confidence
        });
        return { 
          success: true, 
          transcript: data.transcript,
          combined_transcript: data.transcript,
          confidence: data.confidence,
          segments: data.segments,
          language: data.language,
          session_id: data.session_id
        };
      } else {
        this.error('Voice session processing failed (v2):', responseData);
        return { success: false, error: responseData.error || 'Session processing failed' };
      }
    } catch (error) {
      this.error('Voice session processing error:', error);
      return { success: false, error: 'Network error - check connection' };
    }
  }

  // Generate recipe from approved transcript
  async generateRecipeFromTranscript(transcript, metadata) {
    this.log('Generating recipe from transcript (v2)');
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login first' };
    }

    try {
      // v2: Use /api/v2/recipes/voice/generate
      const response = await this.debugFetch('/api/v2/recipes/voice/generate', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          language: metadata?.language || 'en',
          user_id: this.user?.id
        }),
      });

      const responseData = await response.json();
      this.log('Recipe generation response (v2):', responseData);
      
      // v2 response format: { success, data: { recipe, confidence, message } }
      if (response.ok && responseData.success) {
        const recipe = responseData.data?.recipe;
        this.log('✅ Recipe generated from voice (v2)!', {
          title: recipe?.title,
          ingredients: recipe?.ingredients?.length,
          instructions: recipe?.instructions?.length,
          confidence: responseData.data?.confidence
        });
        return { 
          success: true, 
          recipe: recipe,
          recipe_id: recipe?.id,
          confidence: responseData.data?.confidence,
          needs_review: recipe?.needs_review,
          extraction_method: 'voice'
        };
      } else {
        this.error('Recipe generation failed (v2):', responseData);
        return { success: false, error: responseData.error || 'Recipe generation failed' };
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
      
      // v2: Use /api/v2/recipes/import/ocr
      const response = await this.debugFetch('/api/v2/recipes/import/ocr', {
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

      const responseData = await response.json();
      this.log('OCR processing response (v2):', responseData);
      
      // v2 response format: { success, data: { recipe, confidence, message } }
      if (response.ok && responseData.success) {
        const recipe = responseData.data?.recipe;
        this.log('✅ OCR images processed successfully (v2)!', {
          recipe_title: recipe?.title,
          confidence: responseData.data?.confidence
        });
        return { 
          success: true, 
          recipe: recipe,
          recipe_id: recipe?.id,
          confidence: responseData.data?.confidence,
          extraction_method: 'ocr'
        };
      } else {
        this.error('OCR processing failed (v2):', responseData);
        return { success: false, error: responseData.error || 'OCR processing failed' };
      }
    } catch (error) {
      this.error('OCR processing error:', error);
      return { 
        success: false, 
        error: `OCR error: ${error.message || 'Network error - check connection'}`
      };
    }
  }

  // 🆕 Update existing recipe (PATCH)
  async updateRecipe(recipeId, updates) {
    this.log('Updating recipe (v2):', recipeId, updates);
    
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required - please login' };
    }

    try {
      // 🔧 Add user_id to updates (required by backend for authorization)
      const updatePayload = {
        user_id: this.user?.id,
        ...updates
      };

      // v2: Use PATCH to /api/v2/recipes/:id
      const response = await this.debugFetch(`/api/v2/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();
      this.log('Update recipe response (v2):', data);
      
      if (response.ok && data.success) {
        this.log('✅ Recipe updated successfully (v2)!', {
          recipe_id: recipeId,
          updated_fields: Object.keys(updates)
        });
        return { 
          success: true, 
          recipe: data.data || data.recipe
        };
      } else {
        this.error('Update recipe failed (v2):', data);
        return { success: false, error: data.error || 'Failed to update recipe' };
      }
    } catch (error) {
      this.error('Update recipe error:', error);
      return { 
        success: false, 
        error: 'Network error - check backend connection',
        details: error.message 
      };
    }
  }
}

// Export singleton instance
export default new YesChefAPI();
