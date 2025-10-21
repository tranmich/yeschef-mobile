/**
 * V2 API Service
 * Modern API service using the new v2 endpoints
 * 3x faster than old API!
 */

import { getApiUrl, getApiVersion } from '../config/apiConfig';

/**
 * Base fetch with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const apiVersion = getApiVersion();
  
  console.log(`[${apiVersion}] ${options.method || 'GET'} ${url}`);
  console.log(`[${apiVersion}] Full URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`[${apiVersion}] Response status: ${response.status}`);
    
    const data = await response.json();
    
    // V2 API returns {success: true/false, data: {...}}
    if (apiVersion === 'v2') {
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      return data.data; // Return just the data part
    }
    
    // V1 API returns data directly
    return data;
    
  } catch (error) {
    console.error(`[${apiVersion}] Error:`, error.message);
    console.error(`[${apiVersion}] Full error:`, error);
    throw error;
  }
}

/**
 * V2 Recipe Service
 */
export const RecipeServiceV2 = {
  /**
   * Get user's recipes with statistics (THE STAR!)
   * ONE CALL gets everything: recipes, categories, counts, stats
   */
  async getUserRecipesWithStats(userId) {
    const data = await apiFetch(`recipes/user/${userId}/stats`);
    
    return {
      user: data.user,
      recipes: data.recipes,
      totalRecipes: data.stats.total_recipes,
      categories: data.stats.categories,
      categoryCounts: data.stats.category_counts,
      recentRecipes: data.stats.recent_recipes,
      flavorProfiles: data.stats.flavor_profiles || [],
    };
  },
  
  /**
   * Get user's recipes (paginated)
   */
  async getUserRecipes(userId, page = 1, perPage = 20, category = null) {
    let endpoint = `recipes/user/${userId}?page=${page}&per_page=${perPage}`;
    if (category) {
      endpoint += `&category=${category}`;
    }
    
    const data = await apiFetch(endpoint);
    
    return {
      recipes: data.items,
      pagination: data.pagination,
      totalRecipes: data.total_recipes,
    };
  },
  
  /**
   * Get single recipe by ID
   */
  async getRecipe(recipeId, userId = null) {
    let endpoint = `recipes/${recipeId}`;
    if (userId) {
      endpoint += `?user_id=${userId}`;
    }
    
    return await apiFetch(endpoint);
  },
  
  /**
   * Search recipes
   */
  async searchRecipes(userId, searchTerm, limit = 50) {
    const endpoint = `recipes/search?user_id=${userId}&q=${encodeURIComponent(searchTerm)}&limit=${limit}`;
    const data = await apiFetch(endpoint);
    
    return {
      recipes: data.recipes,
      count: data.count,
      searchTerm: data.search_term,
    };
  },
  
  /**
   * Create recipe (with duplicate detection!)
   */
  async createRecipe(userId, recipeData, checkDuplicates = true) {
    const endpoint = `recipes${checkDuplicates ? '' : '?check_duplicates=false'}`;
    
    try {
      return await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          ...recipeData,
        }),
      });
    } catch (error) {
      // If duplicate detected, error will have details
      if (error.message.includes('duplicate')) {
        throw {
          type: 'DUPLICATE',
          message: error.message,
          existingRecipe: error.details?.existing_recipe,
        };
      }
      throw error;
    }
  },
  
  /**
   * Update recipe
   */
  async updateRecipe(recipeId, userId, updates) {
    return await apiFetch(`recipes/${recipeId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        user_id: userId,
        ...updates,
      }),
    });
  },
  
  /**
   * Delete recipe
   */
  async deleteRecipe(recipeId, userId) {
    return await apiFetch(`recipes/${recipeId}?user_id=${userId}`, {
      method: 'DELETE',
    });
  },
  
  /**
   * Share recipe to community
   */
  async shareRecipe(recipeId, userId) {
    return await apiFetch(`recipes/${recipeId}/share`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },
  
  /**
   * Unshare recipe from community
   */
  async unshareRecipe(recipeId, userId) {
    return await apiFetch(`recipes/${recipeId}/unshare`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },
  
  /**
   * Get community recipes
   */
  async getCommunityRecipes(page = 1, perPage = 20) {
    const endpoint = `recipes/community?page=${page}&per_page=${perPage}`;
    const data = await apiFetch(endpoint);
    
    return {
      recipes: data.items,
      pagination: data.pagination,
    };
  },
};

/**
 * V2 User Service
 */
export const UserServiceV2 = {
  /**
   * Get user by ID
   */
  async getUser(userId) {
    return await apiFetch(`users/${userId}`);
  },
  
  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    return await apiFetch(`users/${userId}/stats`);
  },
  
  /**
   * Search users
   */
  async searchUsers(searchTerm, limit = 50) {
    const endpoint = `users/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`;
    const data = await apiFetch(endpoint);
    
    return {
      users: data.users,
      count: data.count,
    };
  },
  
  /**
   * Update user profile
   */
  async updateProfile(userId, avatarEmoji, avatarBackgroundColor) {
    return await apiFetch(`users/${userId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify({
        avatar_emoji: avatarEmoji,
        avatar_background_color: avatarBackgroundColor,
      }),
    });
  },
};

/**
 * V2 Meal Plan Service
 * 🎯 PHASE 1: Critical Feature
 */
export const MealPlanServiceV2 = {
  /**
   * Create a new meal plan
   */
  async createMealPlan(userId, mealPlanData) {
    const { name, startDate, endDate, meals } = mealPlanData;
    
    return await apiFetch('meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        name: name,
        start_date: startDate,
        end_date: endDate,
        meals: meals,
      }),
    });
  },
  
  /**
   * Get a specific meal plan by ID
   */
  async getMealPlan(planId, userId) {
    return await apiFetch(`meal-plans/${planId}?user_id=${userId}`);
  },
  
  /**
   * Get all meal plans for a user
   */
  async getUserMealPlans(userId, limit = 50, offset = 0) {
    const endpoint = `meal-plans/user/${userId}?limit=${limit}&offset=${offset}`;
    const data = await apiFetch(endpoint);
    
    return {
      mealPlans: data.items || data.meal_plans || [],
      pagination: data.pagination,
      total: data.total || data.items?.length || 0,
    };
  },
  
  /**
   * Get meal plans within a date range
   */
  async getMealPlansByDateRange(userId, startDate, endDate) {
    const endpoint = `meal-plans/user/${userId}/date-range?start_date=${startDate}&end_date=${endDate}`;
    const data = await apiFetch(endpoint);
    
    return {
      mealPlans: data.items || data.meal_plans || [],
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };
  },
  
  /**
   * Update an existing meal plan
   */
  async updateMealPlan(planId, userId, updates) {
    return await apiFetch(`meal-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        user_id: userId,
        ...updates,
      }),
    });
  },
  
  /**
   * Delete a meal plan
   */
  async deleteMealPlan(planId, userId) {
    return await apiFetch(`meal-plans/${planId}?user_id=${userId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * V2 Grocery List Service
 * 🎯 PHASE 1: Critical Feature
 */
export const GroceryListServiceV2 = {
  /**
   * Create a new grocery list
   */
  async createGroceryList(userId, listData) {
    const { name, items = [] } = listData;
    
    return await apiFetch('grocery-lists', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        name: name,
        items: items,
      }),
    });
  },
  
  /**
   * Create grocery list from meal plan
   */
  async createFromMealPlan(userId, mealPlanId) {
    return await apiFetch(`grocery-lists/from-meal-plan/${mealPlanId}?user_id=${userId}`, {
      method: 'POST',
    });
  },
  
  /**
   * Get a specific grocery list
   */
  async getGroceryList(listId, userId) {
    return await apiFetch(`grocery-lists/${listId}?user_id=${userId}`);
  },
  
  /**
   * Get all grocery lists for a user
   */
  async getUserGroceryLists(userId, limit = 50, offset = 0) {
    const endpoint = `grocery-lists/user/${userId}?limit=${limit}&offset=${offset}`;
    const data = await apiFetch(endpoint);
    
    return {
      groceryLists: data.items || data.grocery_lists || [],
      pagination: data.pagination,
      total: data.total || data.items?.length || 0,
    };
  },
  
  /**
   * Update grocery list (name, etc.)
   */
  async updateGroceryList(listId, userId, updates) {
    return await apiFetch(`grocery-lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        user_id: userId,
        ...updates,
      }),
    });
  },
  
  /**
   * Add item to grocery list
   */
  async addItem(listId, userId, item) {
    return await apiFetch(`grocery-lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        item: item,
      }),
    });
  },
  
  /**
   * Remove item from grocery list
   */
  async removeItem(listId, userId, itemIndex) {
    return await apiFetch(`grocery-lists/${listId}/items/${itemIndex}?user_id=${userId}`, {
      method: 'DELETE',
    });
  },
  
  /**
   * Mark item as purchased/unpurchased
   */
  async markItemPurchased(listId, userId, itemIndex, purchased = true) {
    return await apiFetch(`grocery-lists/${listId}/items/${itemIndex}/purchase`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        purchased: purchased,
      }),
    });
  },
  
  /**
   * Clear all purchased items from list
   */
  async clearPurchasedItems(listId, userId) {
    return await apiFetch(`grocery-lists/${listId}/clear-purchased`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
      }),
    });
  },
  
  /**
   * Delete entire grocery list
   */
  async deleteGroceryList(listId, userId) {
    return await apiFetch(`grocery-lists/${listId}?user_id=${userId}`, {
      method: 'DELETE',
    });
  },
};

export default {
  RecipeServiceV2,
  UserServiceV2,
  MealPlanServiceV2,
  GroceryListServiceV2,
};
