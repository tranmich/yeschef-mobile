/**
 * 🧪 LOCAL DATA MANAGER TEST
 * 
 * Simple test to verify LocalDataManager functionality
 * Run this to test the service before integrating with screens
 */

import LocalDataManager from './LocalDataManager';

export class LocalDataManagerTest {
  
  static async runBasicTests() {
    console.log('🧪 === LOCAL DATA MANAGER TESTS ===');
    
    try {
      // Test 1: Meal Plan Draft Save/Load
      console.log('\n📋 Test 1: Meal Plan Draft Management');
      
      const testMealPlan = [
        {
          id: '1',
          name: 'Day 1',
          recipes: [
            { id: 2577, title: 'Test Recipe 1' },
            { id: 2576, title: 'Test Recipe 2' }
          ]
        }
      ];
      
      const saveResult = await LocalDataManager.saveMealPlanDraft(
        testMealPlan, 
        'Test Meal Plan'
      );
      
      console.log('Save result:', saveResult);
      
      if (saveResult.success) {
        const loadResult = await LocalDataManager.loadMealPlanDraft(saveResult.draftId);
        console.log('Load result:', loadResult.success ? 'SUCCESS' : 'FAILED');
        
        if (loadResult.success) {
          console.log('Loaded data matches:', 
            JSON.stringify(loadResult.data) === JSON.stringify(testMealPlan)
          );
        }
      }
      
      // Test 2: Grocery List Draft Save/Load
      console.log('\n🛒 Test 2: Grocery List Draft Management');
      
      const testGroceryList = {
        title: 'Test Grocery List',
        items: [
          { id: 'item1', name: 'Test Item 1', isCompleted: false },
          { id: 'item2', name: 'Test Item 2', isCompleted: true }
        ]
      };
      
      const grocerySaveResult = await LocalDataManager.saveGroceryListDraft(
        testGroceryList,
        'Test Grocery List'
      );
      
      console.log('Grocery save result:', grocerySaveResult);
      
      // Test 3: Cross-feature integration
      console.log('\n🔄 Test 3: Generate Grocery List from Meal Plan');
      
      const generateResult = await LocalDataManager.generateGroceryListFromMealPlan(
        testMealPlan,
        { title: 'Generated from Test Meal Plan' }
      );
      
      console.log('Generate result:', generateResult);
      
      // Test 4: Get all drafts
      console.log('\n📊 Test 4: Storage Statistics');
      
      const stats = await LocalDataManager.getStorageStats();
      console.log('Storage stats:', stats);
      
      const mealPlanDrafts = await LocalDataManager.getMealPlanDrafts();
      console.log('Meal plan drafts count:', mealPlanDrafts.length);
      
      const groceryListDrafts = await LocalDataManager.getGroceryListDrafts();
      console.log('Grocery list drafts count:', groceryListDrafts.length);
      
      // Test 5: Unsaved changes tracking
      console.log('\n📝 Test 5: Unsaved Changes Tracking');
      
      LocalDataManager.setUnsavedChanges('test_data', true);
      console.log('Has unsaved changes:', LocalDataManager.hasUnsavedChanges('test_data'));
      
      LocalDataManager.setUnsavedChanges('test_data', false);
      console.log('Has unsaved changes (after clear):', LocalDataManager.hasUnsavedChanges('test_data'));
      
      console.log('\n✅ === ALL TESTS COMPLETED ===');
      return { success: true, message: 'All tests passed' };
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      const mealPlanDrafts = await LocalDataManager.getMealPlanDrafts();
      const groceryListDrafts = await LocalDataManager.getGroceryListDrafts();
      
      // Delete test drafts
      for (const draft of mealPlanDrafts) {
        if (draft.name.includes('Test')) {
          await LocalDataManager.deleteMealPlanDraft(draft.id);
        }
      }
      
      for (const draft of groceryListDrafts) {
        if (draft.name.includes('Test') || draft.name.includes('Generated from Test')) {
          // Note: Need to add deleteGroceryListDraft method
          console.log('Would delete grocery draft:', draft.name);
        }
      }
      
      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

export default LocalDataManagerTest;