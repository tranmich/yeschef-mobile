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
   * Save a meal plan to the backend
   * Converts mobile format to NotionMealPlanner format for storage
   */
  static async saveMealPlan(mobileDays, planTitle, userId = null) {
    console.log('💾 Saving meal plan:', planTitle);
    console.log('📱 Mobile data:', mobileDays);
    
    try {
      // Convert mobile format to NotionMealPlanner format
      const notionMealPlan = MobileMealPlanAdapter.mobileToNotion(mobileDays, planTitle);
      console.log('🔄 Converted to Notion format for backend:', notionMealPlan);
      
      // Prepare API request
      const requestData = {
        plan_name: planTitle,
        week_start_date: new Date().toISOString().split('T')[0], // Today's date
        meal_data: notionMealPlan,
        plan_type: 'notion_style' // Indicate this is from the mobile app using notion format
      };
      
      console.log('🌐 Sending to backend:', requestData);
      
      // Make API call using YesChefAPI's debugFetch with auth headers
      const response = await YesChefAPI.debugFetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...YesChefAPI.getAuthHeaders()
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      console.log('📡 Backend response:', result);
      
      if (result.success) {
        console.log('✅ Meal plan saved successfully:', result.plan_id);
        
        return {
          success: true,
          planId: result.plan_id,
          planName: result.plan_name
        };
      } else {
        console.error('❌ Backend save error:', result.error);
        return {
          success: false,
          error: result.error || 'Unknown save error'
        };
      }
      
    } catch (error) {
      console.error('💥 Save meal plan error:', error);
      return {
        success: false,
        error: error.message || 'Network error while saving'
      };
    }
  }

  /**
   * Update an existing meal plan by ID
   * Converts mobile format to NotionMealPlanner format for storage
   */
  static async updateMealPlan(planId, mobileDays, planTitle = null) {
    console.log('🔄 Updating meal plan:', planId);
    console.log('📱 Mobile data:', mobileDays);
    
    try {
      // Convert mobile format to NotionMealPlanner format
      const notionMealPlan = MobileMealPlanAdapter.mobileToNotion(mobileDays, planTitle || 'Updated Plan');
      console.log('🔄 Converted to Notion format for backend:', notionMealPlan);
      
      // Prepare API request for update
      const requestData = {
        meal_data: notionMealPlan,
        plan_type: 'notion_style' // Indicate this is from the mobile app using notion format
      };
      
      if (planTitle) {
        requestData.plan_name = planTitle;
      }
      
      console.log('🌐 Updating plan', planId, 'with:', requestData);
      
      // Make API call to update existing plan
      const response = await YesChefAPI.debugFetch(`/api/meal-plans/${planId}`, {
        method: 'PUT', // Use PUT for update
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      console.log('📡 Backend response:', result);
      
      if (result.success) {
        console.log(`✅ Meal plan updated successfully: ${planId}`);
        return {
          success: true,
          planId: planId,
          planName: result.plan_name || planTitle,
          weekStartDate: result.week_start_date
        };
      } else {
        console.error('❌ Backend update failed:', result.error);
        return {
          success: false,
          error: result.error || 'Backend update failed'
        };
      }
      
    } catch (error) {
      console.error('💥 Update meal plan error:', error);
      return {
        success: false,
        error: error.message || 'Network error while updating'
      };
    }
  }

  /**
   * Load all meal plans from backend
   * Returns list of available plans
   */
  static async loadMealPlansList() {
    console.log('📂 Loading meal plans list...');
    
    try {
      const response = await YesChefAPI.debugFetch('/api/meal-plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...YesChefAPI.getAuthHeaders()
        }
      });
      
      const result = await response.json();
      console.log('📡 Backend response:', result);
      
      if (result.success) {
        // For meal plans list, we can't filter by meal_data structure since it's not included
        // We'll return all plans and validate compatibility when loading specific plans
        const allPlans = result.meal_plans || [];
        
        console.log(`✅ Found ${allPlans.length} meal plans (will validate compatibility on load)`);
        return {
          success: true,
          plans: allPlans
        };
      } else {
        console.error('❌ Backend load error:', result.error);
        return {
          success: false,
          error: result.error || 'Unknown load error'
        };
      }
      
    } catch (error) {
      console.error('💥 Load meal plans error:', error);
      return {
        success: false,
        error: error.message || 'Network error while loading'
      };
    }
  }

  /**
   * Load a specific meal plan by ID
   * Converts NotionMealPlanner format back to mobile format
   */
  static async loadMealPlan(planId) {
    console.log('📂 Loading meal plan:', planId);
    
    try {
      const response = await YesChefAPI.debugFetch(`/api/meal-plans/${planId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...YesChefAPI.getAuthHeaders()
        }
      });
      
      const result = await response.json();
      console.log('📡 Backend response:', result);
      
      if (result.success) {
        const backendPlan = result.meal_plan;
        console.log('🗄️ Backend plan data:', backendPlan);
        
        // Convert NotionMealPlanner format to mobile format
        const mobileDays = MobileMealPlanAdapter.notionToMobile(backendPlan.meal_data);
        console.log('🔄 Converted to mobile format:', mobileDays);
        
        return {
          success: true,
          mobileDays: mobileDays,
          planTitle: backendPlan.plan_name,
          planId: backendPlan.id,
          weekStartDate: backendPlan.week_start_date
        };
      } else {
        console.error('❌ Backend load error:', result.error);
        return {
          success: false,
          error: result.error || 'Unknown load error'
        };
      }
      
    } catch (error) {
      console.error('💥 Load meal plan error:', error);
      return {
        success: false,
        error: error.message || 'Network error while loading'
      };
    }
  }

  /**
   * Delete a meal plan
   */
  static async deleteMealPlan(planId) {
    console.log('🗑️ Deleting meal plan:', planId);
    
    try {
      const response = await YesChefAPI.debugFetch(`/api/meal-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          ...YesChefAPI.getAuthHeaders(), // Add authentication headers
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
