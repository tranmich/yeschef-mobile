/**
 * 🔄 MEAL PLAN SYNC SERVICE
 * 
 * Hybrid local-first + cloud sync for meal plans
 * Combines LocalDataManager with MealPlanServiceV2
 * 
 * ARCHITECTURE:
 * - Local storage for fast, offline access
 * - Optional cloud sync for backup and cross-device
 * - User controls when to sync
 */

import { Alert } from 'react-native';
import { MealPlanServiceV2 } from './apiServiceV2';
import LocalDataManager from './LocalDataManager';
import YesChefAPI from './YesChefAPI';

class MealPlanSyncService {
  
  /**
   * 🌐 Save meal plan to cloud (v2 API)
   * 
   * @param {Array} days - Meal plan days data
   * @param {String} title - Meal plan title
   * @param {Number|null} currentPlanId - Existing plan ID (for update) or null (for create)
   * @returns {Object} { success, planId, message }
   */
  static async saveToCloud(days, title, currentPlanId = null) {
    console.log('☁️ Saving meal plan to cloud...');
    
    try {
      // Get user ID
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      // Calculate date range from days
      const startDate = new Date().toISOString().split('T')[0];
      const daysCount = days?.length || 7;
      const endDate = new Date(Date.now() + (daysCount * 24 * 60 * 60 * 1000))
        .toISOString().split('T')[0];
      
      const mealPlanData = {
        name: title || 'My Meal Plan',
        startDate: startDate,
        endDate: endDate,
        meals: days || []
      };
      
      let result;
      
      if (currentPlanId) {
        // Update existing plan
        console.log('📝 Updating existing plan:', currentPlanId);
        result = await MealPlanServiceV2.updateMealPlan(
          currentPlanId,
          userId,
          mealPlanData
        );
      } else {
        // Create new plan
        console.log('✨ Creating new plan');
        result = await MealPlanServiceV2.createMealPlan(userId, mealPlanData);
      }
      
      console.log('✅ Cloud save successful:', result.id);
      
      return {
        success: true,
        planId: result.id,
        message: currentPlanId ? 'Meal plan updated in cloud!' : 'Meal plan saved to cloud!'
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
   * 📥 Load meal plan from cloud
   * 
   * @param {Number} planId - Plan ID to load
   * @returns {Object} { success, mealPlan, message }
   */
  static async loadFromCloud(planId) {
    console.log('📥 Loading meal plan from cloud:', planId);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const mealPlan = await MealPlanServiceV2.getMealPlan(planId, userId);
      
      console.log('✅ Loaded meal plan:', mealPlan.name);
      
      return {
        success: true,
        mealPlan: {
          id: mealPlan.id,
          name: mealPlan.name,
          startDate: mealPlan.start_date,
          endDate: mealPlan.end_date,
          days: mealPlan.meals || []
        },
        message: 'Meal plan loaded from cloud!'
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
   * 📋 Get list of user's meal plans from cloud
   * 
   * @returns {Object} { success, plans, message }
   */
  static async getCloudPlans() {
    console.log('📋 Fetching cloud meal plans...');
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      const result = await MealPlanServiceV2.getUserMealPlans(userId);
      
      console.log(`✅ Found ${result.mealPlans.length} cloud meal plans`);
      
      return {
        success: true,
        plans: result.mealPlans || [],
        total: result.total || 0
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch cloud plans:', error);
      return {
        success: false,
        plans: [],
        error: error.message || 'Failed to load plans'
      };
    }
  }
  
  /**
   * 🗑️ Delete meal plan from cloud
   * 
   * @param {Number} planId - Plan ID to delete
   * @returns {Object} { success, message }
   */
  static async deleteFromCloud(planId) {
    console.log('🗑️ Deleting meal plan from cloud:', planId);
    
    try {
      const userId = await YesChefAPI.getUserId();
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      await MealPlanServiceV2.deleteMealPlan(planId, userId);
      
      console.log('✅ Meal plan deleted from cloud');
      
      return {
        success: true,
        message: 'Meal plan deleted from cloud'
      };
      
    } catch (error) {
      console.error('❌ Delete from cloud failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete from cloud'
      };
    }
  }
  
  /**
   * 🔄 Full sync: Save local draft to cloud and mark as saved
   * 
   * @param {Array} days - Meal plan days
   * @param {String} title - Meal plan title
   * @param {Number|null} currentPlanId - Current plan ID
   * @param {Function} markAsSaved - Callback to mark local data as saved
   * @returns {Object} { success, planId }
   */
  static async syncToCloud(days, title, currentPlanId, markAsSaved) {
    const result = await this.saveToCloud(days, title, currentPlanId);
    
    if (result.success && markAsSaved) {
      markAsSaved(); // Mark local data as synced
    }
    
    return result;
  }
}

export default MealPlanSyncService;
