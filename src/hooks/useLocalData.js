/**
 * 🎣 LOCAL DATA HOOK
 * 
 * React hook for easy integration with LocalDataManager
 * Provides state management and auto-save functionality for screens
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import LocalDataManager from '../services/LocalDataManager';

export function useLocalData(dataType, initialData = null) {
  const [data, setData] = useState(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  
  const dataTypeKey = `${dataType}_current`;
  const lastDataRef = useRef(initialData);

  // ==============================================
  // 🔄 AUTO-SAVE FUNCTIONALITY
  // ==============================================

  const performAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !data) return;
    
    try {
      console.log('⏰ AUTO-SAVE: Starting auto-save with data:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: data?.length,
        firstDayRecipes: data?.[0]?.recipes?.length,
        firstDayTitles: data?.[0]?.recipes?.map(r => r.title)
      });
      
      setIsAutoSaving(true);
      setError(null);
      
      let saveResult;
      if (dataType === 'mealPlan') {
        saveResult = await LocalDataManager.saveMealPlanDraft(
          data,
          null, // Auto-generated name
          { source: 'auto_save' }
        );
      } else if (dataType === 'groceryList') {
        saveResult = await LocalDataManager.saveGroceryListDraft(
          data,
          null, // Auto-generated name
          { source: 'auto_save' }
        );
      }
      
      if (saveResult?.success) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        LocalDataManager.setUnsavedChanges(dataTypeKey, false);
        console.log(`✅ Auto-save completed for ${dataType}`);
      } else {
        setError(saveResult?.error || 'Auto-save failed');
      }
      
    } catch (error) {
      console.error(`❌ Auto-save failed for ${dataType}:`, error);
      setError(error.message);
    } finally {
      setIsAutoSaving(false);
    }
  }, [dataType, data, hasUnsavedChanges, dataTypeKey]);

  // ==============================================
  // 🎯 INITIALIZATION AND CLEANUP
  // ==============================================

  useEffect(() => {
    // Start auto-save timer when component mounts
    LocalDataManager.startAutoSave(dataTypeKey, performAutoSave);
    
    // Cleanup when component unmounts
    return () => {
      LocalDataManager.stopAutoSave(dataTypeKey);
    };
  }, [dataTypeKey, performAutoSave]);

  // ==============================================
  // 📝 DATA CHANGE DETECTION
  // ==============================================

  useEffect(() => {
    // Detect changes by comparing with last known data
    const hasChanges = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    
    if (hasChanges && data !== null) {
      setHasUnsavedChanges(true);
      LocalDataManager.setUnsavedChanges(dataTypeKey, true);
      console.log(`📝 Unsaved changes detected for ${dataType}`);
    }
    
    lastDataRef.current = data;
  }, [data, dataType, dataTypeKey]);

  // ==============================================
  // 🛠️ PUBLIC METHODS
  // ==============================================

  /**
   * Manually save current data as draft
   */
  const saveAsDraft = useCallback(async (draftName) => {
    if (!data) return { success: false, error: 'No data to save' };
    
    try {
      setError(null);
      
      let saveResult;
      if (dataType === 'mealPlan') {
        saveResult = await LocalDataManager.saveMealPlanDraft(
          data,
          draftName,
          { source: 'manual_save' }
        );
      } else if (dataType === 'groceryList') {
        saveResult = await LocalDataManager.saveGroceryListDraft(
          data,
          draftName,
          { source: 'manual_save' }
        );
      }
      
      if (saveResult?.success) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        LocalDataManager.setUnsavedChanges(dataTypeKey, false);
      }
      
      return saveResult;
      
    } catch (error) {
      const errorMsg = error.message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [data, dataType, dataTypeKey]);

  /**
   * Load data from a draft
   */
  const loadFromDraft = useCallback(async (draftId) => {
    try {
      setError(null);
      
      // Create backup of current data before loading
      if (data && hasUnsavedChanges) {
        await LocalDataManager.createTempBackup(dataType, data);
      }
      
      let loadResult;
      if (dataType === 'mealPlan') {
        loadResult = await LocalDataManager.loadMealPlanDraft(draftId);
      } else if (dataType === 'groceryList') {
        loadResult = await LocalDataManager.loadGroceryListDraft(draftId);
      }
      
      if (loadResult?.success) {
        setData(loadResult.data);
        setHasUnsavedChanges(false);
        LocalDataManager.setUnsavedChanges(dataTypeKey, false);
        setLastSaved(new Date(loadResult.meta.timestamp));
      }
      
      return loadResult;
      
    } catch (error) {
      const errorMsg = error.message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [data, dataType, hasUnsavedChanges, dataTypeKey]);

  /**
   * Get all available drafts
   */
  const getDrafts = useCallback(async () => {
    try {
      if (dataType === 'mealPlan') {
        return await LocalDataManager.getMealPlanDrafts();
      } else if (dataType === 'groceryList') {
        return await LocalDataManager.getGroceryListDrafts();
      }
      return [];
    } catch (error) {
      setError(error.message);
      return [];
    }
  }, [dataType]);

  /**
   * Update data (triggers change detection)
   */
  const updateData = useCallback((newData) => {
    console.log('🔧 LOCAL HOOK: updateData called with:', {
      newDataType: typeof newData,
      isArray: Array.isArray(newData),
      length: newData?.length,
      firstDayRecipes: newData?.[0]?.recipes?.length,
      firstDayTitles: newData?.[0]?.recipes?.map(r => r.title)
    });
    
    setData(newData);
    lastDataRef.current = newData;
  }, []);

  /**
   * Force auto-save now
   */
  const forceAutoSave = useCallback(async () => {
    return await performAutoSave();
  }, [performAutoSave]);

  /**
   * Clear unsaved changes flag
   */
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    LocalDataManager.setUnsavedChanges(dataTypeKey, false);
    setLastSaved(new Date());
  }, [dataTypeKey]);

  // ==============================================
  // 🎯 RETURN HOOK INTERFACE
  // ==============================================

  return {
    // Data state
    data,
    updateData,
    
    // Save state
    hasUnsavedChanges,
    isAutoSaving,
    lastSaved,
    error,
    
    // Methods
    saveAsDraft,
    loadFromDraft,
    getDrafts,
    forceAutoSave,
    markAsSaved,
    
    // Utils
    performAutoSave
  };
}

/**
 * Hook specifically for meal plan data
 */
export function useMealPlanData(initialData = null) {
  return useLocalData('mealPlan', initialData);
}

/**
 * Hook specifically for grocery list data
 */
export function useGroceryListData(initialData = null) {
  return useLocalData('groceryList', initialData);
}

export default { useLocalData, useMealPlanData, useGroceryListData };