/**
 * 🌐 MEAL PLAN API SERVICE
 * 
 * Handles communication with backend meal planning API
 * Integrates with MobileMealPlanAdapter for data conversion
 */

import YesChefAPI from './YesChefAPI';
import MobileMealPlanAdapter from './MobileMealPlanAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MealPlanAPI {
  
  /**
   * Save a meal plan to the backend (v2 API)
   * Now uses direct mobile format - no conversion needed!
   */
  static async saveMealPlan(mobileDays, planTitle, userId = null) {
    console.log('💾 Saving meal plan (v2):', planTitle);
    
    try {
      // Get user ID from YesChefAPI if not provided
      if (!userId) {
        userId = YesChefAPI.user?.id;
        if (!userId) {
          throw new Error('User not logged in');
        }
      }
      
      // Calculate date range
      const startDate = new Date().toISOString().split('T')[0];
      const daysCount = mobileDays?.length || 7;
      const endDate = new Date(Date.now() + (daysCount * 24 * 60 * 60 * 1000))
        .toISOString().split('T')[0];
      
            // v2 API format (matches database schema!)
      const requestData = {
        user_id: userId,
        plan_name: planTitle,
        week_start_date: startDate,
        plan_data: mobileDays  // Direct mobile format!
      };
      
      console.log('🌐 Sending to v2 backend:', {
        user_id: userId,
        plan_name: planTitle,
        meals_count: mobileDays?.length,
        week_start_date: startDate
      });
      console.log('📊 Plan data being saved (first 500 chars):', JSON.stringify(mobileDays).substring(0, 500));
      console.log('📊 Meal data being saved:', JSON.stringify(mobileDays).substring(0, 300));
      
      // Call v2 endpoint
      const response = await YesChefAPI.debugFetch('/api/v2/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...YesChefAPI.getAuthHeaders()
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      console.log('📡 v2 Response:', result);
      
      // v2 returns {success, data}
      if (result.success) {
        console.log('✅ Meal plan saved (v2):', result.data.id);
        
        return {
          success: true,
          planId: result.data.id,
          planName: result.data.plan_name
        };
      } else {
        console.error('❌ v2 save error:', result.error);
        return {
          success: false,
          error: result.error || 'Save failed'
        };
      }
      
    } catch (error) {
      console.error('💥 Save error:', error);
      return {
        success: false,
        error: error.message || 'Network error while saving'
      };
    }
  }

  /**
   * Update an existing meal plan on the backend (v2 API)
   */
  static async updateMealPlan(planId, mobileDays, planTitle = null) {
    console.log('🔄 Updating meal plan (v2):', planId);
    
    try {
      const userId = YesChefAPI.user?.id;
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const updates = {
        user_id: userId,
        plan_data: mobileDays  // Direct mobile format!
      };
      
      if (planTitle) {
        updates.plan_name = planTitle;
      }
      
      console.log('🌐 Updating v2 plan', planId, 'with:', {
        name: planTitle || '(unchanged)',
        meals_count: mobileDays?.length
      });
      
      const response = await YesChefAPI.debugFetch(`/api/v2/meal-plans/${planId}`, {
        method: 'PATCH',  // v2 uses PATCH
        headers: {
          'Content-Type': 'application/json',
          ...YesChefAPI.getAuthHeaders()
        },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Meal plan updated (v2):', planId);
        return {
          success: true,
          planId: result.data.id
        };
      } else {
        console.error('❌ v2 update failed:', result.error);
        return {
          success: false,
          error: result.error || 'Update failed'
        };
      }
      
    } catch (error) {
      console.error('💥 Update error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update meal plan'
      };
    }
  }

  /**
   * Load all meal plans from backend (v2 API)
   * Returns list of available plans
   */
  static async loadMealPlansList() {
    console.log('📂 Loading meal plans list (v2)...');
    
    try {
      const userId = YesChefAPI.user?.id;
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const response = await YesChefAPI.debugFetch(`/api/v2/meal-plans/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...YesChefAPI.getAuthHeaders()
        }
      });
      
      const result = await response.json();
      console.log('📡 v2 Response:', result);
      
      if (result.success) {
        // v2 returns {success, data: {meal_plans, pagination}}
        const plans = result.data.meal_plans || [];
        
        console.log(`✅ Found ${plans.length} meal plans (v2)`);
        return {
          success: true,
          plans: plans
        };
      } else {
        console.error('❌ v2 load error:', result.error);
        return {
          success: false,
          error: result.error || 'Load failed'
        };
      }
      
    } catch (error) {
      console.error('💥 Load error:', error);
      return {
        success: false,
        error: error.message || 'Network error while loading'
      };
    }
  }

  /**
   * Load a specific meal plan by ID (v2 API)
   * Returns direct mobile format - no conversion needed!
   */
  static async loadMealPlan(planId) {
    console.log('📂 Loading meal plan (v2):', planId);
    
    try {
      const userId = YesChefAPI.user?.id;
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const response = await YesChefAPI.debugFetch(`/api/v2/meal-plans/${planId}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...YesChefAPI.getAuthHeaders()
        }
      });
      
      const result = await response.json();
      console.log('📡 v2 Response:', result);
      
      if (result.success) {
        const plan = result.data;
        console.log('✅ Loaded meal plan (v2):', plan.plan_name);
        console.log('📊 Plan data:', Array.isArray(plan.plan_data) ? `Array with ${plan.plan_data.length} days` : typeof plan.plan_data);
        
        // Simple v2 format - just use the data directly!
        const mobileDays = plan.plan_data;
        
        // Validate it's an array
        if (!Array.isArray(mobileDays)) {
          console.error('❌ Invalid plan_data format - expected array, got:', typeof mobileDays);
          return {
            success: false,
            error: 'Invalid meal plan data format - expected array'
          };
        }
        
        console.log('✅ Loaded', mobileDays.length, 'days with', mobileDays.reduce((sum, day) => sum + (day.recipes?.length || 0), 0), 'total recipes');
        
        // Clean v2 response
        return {
          success: true,
          mobileDays: mobileDays,
          planTitle: plan.plan_name,
          planId: plan.id,
          weekStartDate: plan.week_start_date,
          endDate: plan.end_date
        };
      } else {
        console.error('❌ v2 load error:', result.error);
        return {
          success: false,
          error: result.error || 'Load failed'
        };
      }
      
    } catch (error) {
      console.error('💥 Load error:', error);
      return {
        success: false,
        error: error.message || 'Network error while loading'
      };
    }
  }

  /**
   * Delete a meal plan (v2 API)
   */
  static async deleteMealPlan(planId) {
    console.log('🗑️ Deleting meal plan (v2):', planId);
    
    try {
      const userId = YesChefAPI.user?.id;
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const response = await YesChefAPI.debugFetch(`/api/v2/meal-plans/${planId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          ...YesChefAPI.getAuthHeaders(),
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Delete response status:', response.status, response.statusText);
      console.log('📡 Delete response headers:', response.headers);
      
      // Check if the response is actually JSON
      const contentType = response.headers.get('content-type');
      console.log('📡 Response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        // If it's not JSON, get the text to see what the server returned
        const responseText = await response.text();
        console.log('📡 Non-JSON response:', responseText.substring(0, 200));
        
        if (response.status === 200 || response.status === 204) {
          // Some servers return 200/204 with no JSON body for successful deletes
          console.log('✅ Delete appears successful (non-JSON response)');
          return {
            success: true,
            message: 'Meal plan deleted successfully'
          };
        } else {
          throw new Error(`Server returned non-JSON response (${response.status}): ${responseText.substring(0, 100)}`);
        }
      }
      
      const result = await response.json();
      console.log('📡 Backend JSON response:', result);
      
      if (result.success || response.status === 200) {
        console.log('✅ Meal plan deleted successfully');
        return { success: true };
      } else {
        console.error('❌ Backend delete error:', result.error);
        return {
          success: false,
          error: result.error || 'Unknown delete error'
        };
      }
      
    } catch (error) {
      console.error('💥 Delete meal plan error:', error);
      return {
        success: false,
        error: error.message || 'Network error while deleting'
      };
    }
  }

  /**
   * Test API connection
   */
  static async testConnection() {
    console.log('🔌 Testing meal plan API connection...');
    
    try {
      const result = await MealPlanAPI.loadMealPlansList();
      if (result.success) {
        console.log('✅ Meal plan API connection successful');
        return { success: true, plansCount: result.plans.length };
      } else {
        console.log('⚠️ API connection failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log('💥 API connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default MealPlanAPI;
