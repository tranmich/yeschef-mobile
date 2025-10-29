import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
  Alert,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon, IconButton } from '../components/IconLibrary';
import { ThemedText, typography } from '../components/Typography';
import DayOptionsModal from '../components/DayOptionsModal';
// 🎨 SMOOTH DRAG: Using LightweightDragSystem for smooth Google Keep-style dragging
import { SimpleDraggableList } from '../components/LightweightDragSystem';
// 🚫 REMOVED: Complex CrossContainerDragSystem (572 lines) - replaced with simple move buttons
// OLD: import { CrossContainerDragProvider, CrossContainerDraggableList } from '../components/CrossContainerDragSystem';
import MobileMealPlanAdapter from '../services/MobileMealPlanAdapter';
import MealPlanAPI from '../services/MealPlanAPI';
import YesChefAPI from '../services/YesChefAPI';
import FriendsAPI from '../services/FriendsAPI';
import MobileGroceryAdapter from '../services/MobileGroceryAdapter';
// 🔄 LOCAL-FIRST ARCHITECTURE
import { useMealPlanData } from '../hooks/useLocalData';
import { LocalDataStatus, DraftPicker } from '../components/LocalDataStatus';

function MealPlanScreen({ navigation, route }) {
  // 🎨 Background Configuration (matches HomeScreen)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/mintbackground.jpg');
  
  // Main meal plan state
  const [mealPlanTitle, setMealPlanTitle] = useState('Weekly Meal Plan');
  const [originalPlanName, setOriginalPlanName] = useState(null); // Track original name for detecting changes
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDayOptionsModal, setShowDayOptionsModal] = useState(null); // Track which day's bottom sheet is open
  const [showMealOptionsMenu, setShowMealOptionsMenu] = useState(null); // Track which meal's menu is open
  const [editingDayId, setEditingDayId] = useState(null); // Track which day name is being edited
  const [editingMealId, setEditingMealId] = useState(null); // Track which meal name is being edited
  const [isLoading, setIsLoading] = useState(false); // Track API loading states
  const [showLoadModal, setShowLoadModal] = useState(false); // Show load plans modal
  const [availablePlans, setAvailablePlans] = useState([]); // Available plans to load
  const [currentPlanId, setCurrentPlanId] = useState(null); // Track currently loaded plan for refresh
  const [lastRefreshTime, setLastRefreshTime] = useState(0); // Throttle refreshes
  
  // Refs for keyboard handling
  const scrollViewRef = useRef(null);
  const editingInputRef = useRef(null);
  
  // Function to handle day name editing with keyboard-aware scrolling
  const handleEditDayName = (dayId, dayIndex) => {
    setEditingDayId(dayId);
    
    // Scroll to the editing field after a short delay to ensure the TextInput is rendered
    setTimeout(() => {
      if (scrollViewRef.current && dayIndex !== undefined) {
        // More accurate position calculation - account for header and day spacing
        // Each day container height varies but average around 180-250px depending on meals
        const headerHeight = 120; // Approximate header height
        const averageDayHeight = 220; // Average day container height including meals
        const targetYPosition = headerHeight + (dayIndex * averageDayHeight);
        
        // Add some offset to ensure the input is well above the keyboard
        const keyboardOffset = 100;
        
        scrollViewRef.current.scrollTo({
          y: Math.max(0, targetYPosition - keyboardOffset),
          animated: true,
        });
      }
    }, 150); // Slightly longer delay to ensure TextInput is rendered
  };
  
  // 📋 Default empty meal plan structure
  const getDefaultMealPlan = () => {
    return [
      {
        id: 1,  // Use number ID to match RecipeCollectionScreen expectations
        name: 'Day 1',
        isExpanded: true,
        recipes: []
      }
    ];
  };
  
  // Invite functionality state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [households, setHouseholds] = useState([]);
  const [householdMembers, setHouseholdMembers] = useState([]);
  
  // 🆕 Toast notification (inline like GroceryListScreen)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnimation = useRef(new Animated.Value(0)).current;

  const showToastNotification = (message = 'Success ✓') => {
    setToastMessage(message);
    setShowToast(true);
    
    // Gentle fade in
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 2.5 seconds
    setTimeout(() => {
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowToast(false);
      });
    }, 2500);
  };
  
  // 🔄 LOCAL-FIRST ARCHITECTURE: Replace days state with local data management
  const {
    data: days,
    updateData: setDays,
    hasUnsavedChanges,
    isAutoSaving,
    lastSaved,
    error: localDataError,
    saveAsDraft,
    loadFromDraft,
    getDrafts,
    forceAutoSave,
    markAsSaved
  } = useMealPlanData(getDefaultMealPlan()); // Use our consistent default structure

  // 🔄 LOCAL DATA STATUS: UI state for draft management
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftsList, setDraftsList] = useState([]);

  // � INITIALIZATION: Clean start
  useEffect(() => {
    console.log('🎬 MealPlanScreen initializing...');
    
    // If no plan is loaded, ensure we start clean
    if (!currentPlanId) {
      console.log('🧹 No saved plan - ensuring clean start with default data');
      // Small delay to avoid conflicts with focus effects
      setTimeout(async () => {
        await createNewMealPlan();
      }, 100);
    }
  }, []);

  // 🆕 Handle recipe addition from RecipeViewScreen
  useEffect(() => {
    const handleRecipeFromView = async () => {
      if (route.params?.addRecipeFromView && global.tempRecipeToAdd) {
        const { dayId, recipe } = global.tempRecipeToAdd;
        console.log('📱 Adding recipe from RecipeView:', recipe.title);
        
        // Add recipe to the specified day - FIXED to preserve existing recipes
        setDays(prevDays => {
          console.log('🔍 Previous days before adding recipe:', prevDays.length, 'days');
          const updatedDays = prevDays.map(day => {
            if (day.id === dayId) {
              const existingRecipes = day.recipes || [];
              const newRecipes = [...existingRecipes, recipe];
              console.log('📝 Day', dayId, 'recipes before:', existingRecipes.length, 'after:', newRecipes.length);
              return { ...day, recipes: newRecipes };
            }
            return day;
          });
          return updatedDays;
        });
        
        // ALSO save to AsyncStorage to maintain persistence
        try {
          const localMealPlan = await AsyncStorage.getItem('localMealPlan');
          if (localMealPlan) {
            const mealPlanData = JSON.parse(localMealPlan);
            const updatedDays = mealPlanData.mealPlan.days.map(day => 
              day.id === dayId 
                ? { ...day, recipes: [...(day.recipes || []), recipe] }
                : day
            );
            
            const updatedMealPlan = {
              ...mealPlanData,
              mealPlan: { ...mealPlanData.mealPlan, days: updatedDays },
              lastUpdated: Date.now()
            };
            
            await AsyncStorage.setItem('localMealPlan', JSON.stringify(updatedMealPlan));
            console.log('💾 Recipe also saved to AsyncStorage for persistence');
          }
        } catch (error) {
          console.error('⚠️ Failed to save to AsyncStorage:', error);
        }
        
        // Clear the global temp data
        global.tempRecipeToAdd = null;
        
        // Clear the route params to prevent re-adding on re-renders
        navigation.setParams({ addRecipeFromView: false });
      }
    };
    
    handleRecipeFromView();
  }, [route.params?.addRecipeFromView]);

  const createNewMealPlan = async () => {
    console.log('🆕 Creating new meal plan - clean slate');
    
    // Clear all local state first
    await clearAllLocalState();
    
    // Reset to default empty state
    const defaultDays = getDefaultMealPlan();
    setDays(defaultDays);
    setMealPlanTitle('Weekly Meal Plan');
    setCurrentPlanId(null);
    
    console.log('✅ New meal plan ready with', defaultDays.length, 'days');
  };
  const clearAllLocalState = async () => {
    try {
      console.log('🧹 CLEARING ALL LOCAL STATE for clean slate');
      
      // Clear the legacy AsyncStorage that causes conflicts
      await AsyncStorage.removeItem('localMealPlan');
      console.log('🧹 Cleared localMealPlan AsyncStorage');
      
      // Clear any meal plan backups (we'll rely on backend only)
      const keys = await AsyncStorage.getAllKeys();
      const mealPlanKeys = keys.filter(key => key.startsWith('meal_plan_'));
      if (mealPlanKeys.length > 0) {
        await AsyncStorage.multiRemove(mealPlanKeys);
        console.log('🧹 Cleared', mealPlanKeys.length, 'meal plan backups');
      }
      
      console.log('✅ Local state cleared - clean slate ready');
    } catch (error) {
      console.error('❌ Error clearing local state:', error);
    }
  };
  // 🔄 SIMPLIFIED: Only sync AsyncStorage for new/local plans (not saved plans)
  const checkForLocalMealPlan = async () => {
    try {
      const localData = await AsyncStorage.getItem('localMealPlan');
      if (localData) {
        const { mealPlan, lastUpdated, isLocal } = JSON.parse(localData);
        console.log('🔄 Found local meal plan from AsyncStorage, updated:', new Date(lastUpdated).toLocaleTimeString());
        
        // Process AsyncStorage data and force sync with local-first system
        if (mealPlan && Array.isArray(mealPlan)) {
          console.log('📦 SYNC: Force updating local-first system with AsyncStorage data');
          
          // 🔧 NORMALIZE DATA: Consolidate recipes from both old and new formats
          const normalizedMealPlan = mealPlan.map(day => {
            // Get recipes from new format (day.recipes)
            const newFormatRecipes = day.recipes || [];
            
            // Get recipes from old format (day.meals[].recipes)
            const oldFormatRecipes = [];
            if (day.meals && Array.isArray(day.meals)) {
              day.meals.forEach(meal => {
                if (meal.recipes && Array.isArray(meal.recipes)) {
                  oldFormatRecipes.push(...meal.recipes);
                }
              });
            }
            
            // Combine both formats, avoiding duplicates
            const allRecipes = [...newFormatRecipes];
            oldFormatRecipes.forEach(oldRecipe => {
              // Check if recipe already exists in new format (avoid duplicates)
              const exists = allRecipes.some(newRecipe => 
                newRecipe.id === oldRecipe.id || newRecipe.title === oldRecipe.title
              );
              if (!exists) {
                allRecipes.push(oldRecipe);
              }
            });
            
            console.log(`🔧 NORMALIZED Day ${day.name}:`, {
              oldRecipesCount: newFormatRecipes.length,
              migratedRecipesCount: oldFormatRecipes.length,
              totalRecipesCount: allRecipes.length
            });
            
            return {
              ...day,
              recipes: allRecipes, // All recipes in unified format
              meals: day.meals || [] // Keep meals structure but recipes are now in day.recipes
            };
          });
          
          // Ensure proper expansion state for better UX
          const mealPlanWithExpansion = normalizedMealPlan.map(day => ({
            ...day,
            isExpanded: day.isExpanded !== undefined ? day.isExpanded : true
          }));
          
          // 🔄 SYNC WITH LOCAL-FIRST SYSTEM: Update the hook's state directly
          setDays(mealPlanWithExpansion);
          
          // Force mark as unsaved to trigger the correct state
          setTimeout(() => {
            // 🛡️ DRAG PROTECTION: Don't force sync if recent drag
            const now = Date.now();
            if (now - lastDragTime.current < DRAG_PROTECTION_DURATION) {
              const remainingProtection = DRAG_PROTECTION_DURATION - (now - lastDragTime.current);
              console.log(`🛡️ DRAG PROTECTION: Skipping force sync (${remainingProtection}ms remaining)`);
              return;
            }
            
            console.log('🔄 FORCE SYNC: Marking as unsaved to refresh UI state');
            // This will trigger the change detection in the hook
            setDays([...mealPlanWithExpansion]);
          }, 100);
          
          if (!currentPlanId) {
            // Keep the clean "Weekly Meal Plan" title for new plans
            console.log('🏷️ Keeping clean title "Weekly Meal Plan" for unsaved plan');
          } else {
            // For saved plans, keep the existing title but sync the recipe data
            console.log('🏷️ Syncing recipes for saved plan but preserving title');
          }
          
          // � DEBUG: Check what was actually loaded
          mealPlan.forEach((day, index) => {
            console.log(`🔍 LOAD DEBUG Day ${day.name}:`, {
              recipesCount: (day.recipes || []).length,
              breakfastRecipes: day.meals?.find(m => m.name === 'Breakfast')?.recipes?.length || 0,
              recipeTitles: (day.recipes || []).map(r => r.title)
            });
          });
          
          // �🔄 PERSISTENCE: Keep local storage for unsaved changes (don't auto-clear)
          console.log('✅ Local meal plan loaded (keeping in storage for persistence)');
        }
      }
    } catch (error) {
      console.error('❌ Failed to check local meal plan:', error);
    }
  };

  // 🧹 RESET: Clear corrupted local storage (temporary debug function)
  const clearLocalStorage = async () => {
    try {
      await AsyncStorage.removeItem('localMealPlan');
      console.log('🧹 RESET: Cleared corrupted local storage');
      Alert.alert('Storage Cleared', 'Local meal plan storage has been reset. Please restart the app.');
    } catch (error) {
      console.error('❌ Failed to clear local storage:', error);
    }
  };

  // 🔄 Throttling for screen focus to prevent infinite loops
  const [lastFocusCheck, setLastFocusCheck] = useState(0);

  // 🔄 Refresh meal plan when screen comes into focus (e.g., returning from My Recipes)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (now - lastFocusCheck < 2000) { // Throttle to max once every 2 seconds
        return;
      }
      
      // 🛡️ DRAG PROTECTION: Skip sync if recent drag operation
      if (now - lastDragTime.current < DRAG_PROTECTION_DURATION) {
        return;
      }
      
      setLastFocusCheck(now);
      
      // 🔄 IMPROVED SYNC: Always sync AsyncStorage but preserve saved plan state
      if (!currentPlanId) {
        checkForLocalMealPlan();
      } else {
        console.log('💾 Saved plan mode - syncing recipes but preserving plan identity');
        checkForLocalMealPlan(); // Allow sync to pick up new recipe additions
      }
      
      if (currentPlanId) {
        // 🔒 LOCAL-FIRST PROTECTION: Skip ALL backend refreshes - use local data only
        console.log('🛡️ SKIPPING ALL BACKEND REFRESHES: Using local-first data exclusively');
        return;
      } else {
        console.log('📋 No current plan loaded - staying with current state');
        // Removed auto-load logic - let the user manually load plans if needed
      }
    }, [currentPlanId, days, lastFocusCheck, hasUnsavedChanges])
  );

  // API Functions (Stage 2: Real backend integration)

  const handleSave = async () => {
    if (!mealPlanTitle.trim()) {
      console.log('⚠️ No plan title provided, using default');
      setMealPlanTitle('My Meal Plan');
    }

    setIsLoading(true);
    console.log('💾 Saving meal plan:', mealPlanTitle);
    
    try {
      // 🔍 CHECK IF NAME CHANGED: If we have a plan loaded and the name changed, create new plan
      console.log('🔍 Name check:', {
        currentPlanId,
        originalPlanName,
        mealPlanTitle,
        hasOriginalName: !!originalPlanName
      });
      
      const nameChanged = currentPlanId && originalPlanName && 
                         originalPlanName.toLowerCase().trim() !== mealPlanTitle.toLowerCase().trim();
      
      console.log('📝 Name changed?', nameChanged);
      
      // Use local variable to track if we should create new plan
      let planIdToUse = currentPlanId;
      
      if (nameChanged) {
        console.log('📝 Name changed from', originalPlanName, 'to', mealPlanTitle, '- creating NEW plan');
        // Use null to force creation of new plan (don't rely on async state update)
        planIdToUse = null;
        setCurrentPlanId(null);
        setOriginalPlanName(null);
      }
      
      // 🔍 CHECK FOR DUPLICATES: Get existing meal plans to check for name conflicts
      const existingPlansResult = await MealPlanAPI.loadMealPlansList();
      const existingPlans = existingPlansResult.success ? existingPlansResult.plans : [];
      const existingPlan = existingPlans.find(plan => 
        plan.plan_name.toLowerCase().trim() === mealPlanTitle.toLowerCase().trim()
      );
      
      if (existingPlan) {
        // If we're updating the same plan (planIdToUse matches), allow it without dialog
        if (planIdToUse && planIdToUse.toString() === existingPlan.id.toString()) {
          console.log('🔄 Updating same plan - no dialog needed');
        } else {
          // Different plan with same name - show dialog
          console.log('🔄 Different plan with same name - showing dialog');
          
          // Show confirmation dialog for overwrite
          const shouldOverwrite = await new Promise((resolve) => {
            Alert.alert(
              'Duplicate Name Detected',
              `A meal plan named "${mealPlanTitle}" already exists. Do you want to replace it?`,
              [
                {
                  text: 'Cancel', 
                  style: 'cancel',
                  onPress: () => resolve(false)
                },
                {
                  text: 'Replace',
                  style: 'destructive', 
                  onPress: () => resolve(true)
                }
              ]
            );
          });
          
          if (!shouldOverwrite) {
            setIsLoading(false);
            console.log('💾 Save cancelled by user - duplicate name');
            return;
          }
          
          console.log('🔄 Overwriting existing meal plan:', existingPlan.id);
          
          // Delete the existing plan first to avoid duplicates
          console.log('🗑️ Deleting existing plan before save:', existingPlan.id);
          const deleteResult = await MealPlanAPI.deleteMealPlan(existingPlan.id);
          if (!deleteResult.success) {
            console.error('❌ Failed to delete existing plan for overwrite');
            Alert.alert('Error', 'Could not overwrite existing meal plan. Please try again.');
            setIsLoading(false);
            return;
          }
          console.log('✅ Existing plan deleted, proceeding with save');
          
          // Ensure we don't have a planIdToUse set (this will be a new plan)
          planIdToUse = null;
          setCurrentPlanId(null);
        }
      }
      
      // 🔧 CHOOSE API CALL: Use update if we have planIdToUse, create if new plan
      let result;
      if (planIdToUse) {
        console.log('🔄 Updating existing plan:', planIdToUse);
        result = await MealPlanAPI.updateMealPlan(planIdToUse, days, mealPlanTitle);
      } else {
        console.log('➕ Creating new plan');
        result = await MealPlanAPI.saveMealPlan(days, mealPlanTitle);
      }
      
      if (result.success) {
        console.log('✅ Meal plan saved successfully! Plan ID:', result.planId);
        
        // 🔧 DON'T CLEAR: Keep AsyncStorage so recipe addition can find the plan data
        // await clearAllLocalState();
        // console.log('🧹 Local state cleared after successful save');
        
        console.log('💾 Keeping AsyncStorage data for recipe addition compatibility');
        
        // Update the current plan ID and original name so we can track this plan for future updates
        setCurrentPlanId(result.planId);
        setOriginalPlanName(mealPlanTitle); // Update original name after successful save
        console.log('🆔 Set current plan ID to:', result.planId);
        // Could show success message to user here
      } else {
        console.error('❌ Save failed:', result.error);
        // Could show error message to user here
      }
    } catch (error) {
      console.error('💥 Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    setIsLoading(true);
    console.log('� Loading meal plans list...');
    
    try {
      const result = await MealPlanAPI.loadMealPlansList();
      
      if (result.success) {
        console.log(`✅ Found ${result.plans.length} meal plans`);
        console.log('📋 Available plans:', result.plans.map(p => ({ id: p.id, name: p.plan_name })));
        
        setAvailablePlans(result.plans);
        setShowLoadModal(true); // Show selection modal instead of auto-loading
      } else {
        console.error('❌ Load failed:', result.error);
      }
    } catch (error) {
      console.error('💥 Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpecificPlan = async (planId) => {
    setIsLoading(true);
    console.log('📂 Loading specific plan:', planId);
    
    try {
      const result = await MealPlanAPI.loadMealPlan(planId);
      
      if (result.success) {
        console.log('✅ Plan loaded successfully!');
        console.log('🔄 Setting mobile data:', result.mobileDays);
        
        // 🧹 CLEAN SLATE: Clear all local state before loading
        await clearAllLocalState();
        console.log('🧹 Local state cleared before loading plan data');
        
        // 🎯 CLEAN v2 FORMAT: Just use the recipes directly
        const compatibleDays = result.mobileDays.map(day => {
          console.log('📂 Loading day:', {
            dayName: day.name,
            recipesCount: (day.recipes || []).length
          });
          
          return {
            ...day,
            recipes: day.recipes || []  // Simple! Just use what's there
          };
        });
        
        // Update the mobile app state with loaded data
        const loadedPlanName = result.planName || result.planTitle || `Plan ${planId}`;
        setDays(compatibleDays);
        setMealPlanTitle(loadedPlanName);
        setOriginalPlanName(loadedPlanName); // Track original name for change detection
        setCurrentPlanId(planId); // Track the loaded plan
        
        // 🔧 FIX: Save loaded data to AsyncStorage so RecipeCollectionScreen can detect it
        const asyncStorageData = {
          mealPlan: compatibleDays,
          lastUpdated: Date.now(),
          isLocal: false, // This is from backend, not local
          planId: planId  // Track which backend plan this is
        };
        
        await AsyncStorage.setItem('localMealPlan', JSON.stringify(asyncStorageData));
        console.log('💾 Loaded plan data saved to AsyncStorage for recipe adding compatibility');
        
        console.log('🎉 Meal plan loaded into mobile app!');
      } else {
        console.error('❌ Load specific plan failed:', result.error);
      }
    } catch (error) {
      console.error('💥 Load specific plan error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Refresh current meal plan (for when returning from other screens)
  const refreshCurrentPlan = async () => {
    if (!currentPlanId) {
      console.log('📋 No current plan to refresh');
      return;
    }
    
    // Throttle refreshes to avoid multiple calls
    const now = Date.now();
    if (now - lastRefreshTime < 2000) { // 2 second throttle
      console.log('🚫 Refresh throttled - too soon since last refresh');
      return;
    }
    setLastRefreshTime(now);
    
    console.log('🔄 Refreshing current meal plan:', currentPlanId);
    
    // 🔒 LOCAL-FIRST PROTECTION: Disable ALL backend refreshes - use local data exclusively
    console.log('🛡️ SKIPPING BACKEND REFRESH: Local-first mode - using local data only');
    return;
    
    try {
      const result = await MealPlanAPI.loadMealPlan(currentPlanId);
      console.log('📡 Refresh API response: success=' + result.success + ', days=' + (result.mobileDays?.length || 0));
      
      if (result.success) {
        console.log('✅ Plan refreshed successfully!');
        
        // 🔄 COMPATIBILITY: Move breakfast recipes to day.recipes for simplified UI
        const compatibleDays = result.mobileDays.map(day => {
          const breakfastMeal = day.meals?.find(meal => meal.name === 'Breakfast' || meal.id === 'breakfast-1');
          const breakfastRecipes = breakfastMeal?.recipes || [];
          
          console.log('🔄 REFRESH COMPATIBILITY DEBUG:', {
            dayName: day.name,
            breakfastMeal: breakfastMeal?.name,
            breakfastRecipeCount: breakfastRecipes.length,
            existingDayRecipes: (day.recipes || []).length
          });
          
          return {
            ...day,
            recipes: [...(day.recipes || []), ...breakfastRecipes], // Merge existing + breakfast
            meals: day.meals?.map(meal => 
              (meal.name === 'Breakfast' || meal.id === 'breakfast-1')
                ? { ...meal, recipes: [] } // Clear breakfast recipes since they're now in day.recipes
                : meal
            ) || []
          };
        });
        
        console.log('📊 Loaded data:', {
          daysCount: compatibleDays.length,
          totalRecipes: compatibleDays.reduce((total, day) => total + (day.recipes?.length || 0), 0)
        });
        
        setDays(compatibleDays);
        setMealPlanTitle(result.planTitle);
        
        console.log(`🔄 State updated with ${result.mobileDays.length} days`);
      } else {
        console.log('❌ Refresh failed:', result);
      }
    } catch (error) {
      console.error('💥 Refresh error:', error);
    }
  };

  const handleNew = async () => {
    console.log('➕ Creating new meal plan');
    
    // 🔧 FIX: Clear AsyncStorage to prevent stale data confusion
    await clearAllLocalState();
    console.log('🧹 Cleared stale AsyncStorage data for new plan');
    
    setDays([
      {
        id: 1,
        name: 'Day 1',
        isExpanded: true,
        recipes: []
      }
    ]);
    setMealPlanTitle('New Meal Plan');
    setCurrentPlanId(null); // Clear saved plan ID
  };

  const handleDelete = () => {
    if (!currentPlanId) {
      Alert.alert('Error', 'No meal plan is currently loaded to delete.');
      return;
    }

    Alert.alert(
      'Delete Meal Plan',
      `Are you sure you want to delete "${mealPlanTitle}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              console.log('🗑️ Deleting meal plan:', currentPlanId);
              const result = await MealPlanAPI.deleteMealPlan(currentPlanId);
              
              if (result.success) {
                console.log('✅ Meal plan deleted successfully');
                
                // 🔧 FIX: Clear AsyncStorage to prevent stale data confusion
                await clearAllLocalState();
                console.log('🧹 Cleared stale AsyncStorage data after delete');
                
                // Clear the current plan state
                setCurrentPlanId(null);
                setMealPlanTitle('Weekly Meal Plan');
                setDays([
                  {
                    id: 1,
                    name: 'Day 1',
                    isExpanded: true,
                    meals: [
                      { id: 'breakfast-1', name: 'Breakfast', recipes: [] },
                      { id: 'lunch-1', name: 'Lunch', recipes: [] },
                      { id: 'dinner-1', name: 'Dinner', recipes: [] },
                    ]
                  }
                ]);
                
                Alert.alert('Success', 'Meal plan deleted successfully');
              } else {
                console.error('❌ Delete failed:', result.error);
                Alert.alert('Error', result.error || 'Failed to delete meal plan');
              }
            } catch (error) {
              console.error('💥 Delete error:', error);
              Alert.alert('Error', 'Failed to delete meal plan');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Helper function to save days to local storage
  const saveDaysToStorage = async (updatedDays) => {
    try {
      await AsyncStorage.setItem('localMealPlan', JSON.stringify({
        mealPlan: updatedDays,
        lastUpdated: Date.now(),
        isLocal: true
      }));
      console.log('💾 Days saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save days to storage:', error);
    }
  };

  const handleAddDay = async () => {
    const newDayId = Date.now();
    const newDay = {
      id: newDayId,
      name: 'New Day',
      isExpanded: true,
      recipes: []
    };
    
    const updatedDays = [...days, newDay];
    setDays(updatedDays);
    
    // Save to AsyncStorage to persist the change
    await saveDaysToStorage(updatedDays);
    
    // Auto-edit the new day name
    setEditingDayId(newDayId);
  };
  const handleGenerateGroceryList = async () => {
    if (!currentPlanId) {
      Alert.alert('No Meal Plan', 'Please save your meal plan first to generate a grocery list.');
      return;
    }

    try {
      console.log('🛒 Generating grocery list for plan:', currentPlanId);
      
      // Show loading state
      Alert.alert('Generating...', 'Creating your grocery list from meal plan recipes.');

      // 🎯 USE V2 API - The power endpoint!
      const userId = YesChefAPI.user?.id;
      if (!userId) {
        Alert.alert('Error', 'Please log in first');
        return;
      }

      console.log('🎯 Calling v2 API: /api/v2/grocery-lists/from-meal-plan/' + currentPlanId);
      
      const response = await YesChefAPI.debugFetch(
        `/api/v2/grocery-lists/from-meal-plan/${currentPlanId}?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...YesChefAPI.getAuthHeaders()
          }
        }
      );
      
      const result = await response.json();
      console.log('📡 v2 Response:', result.success ? '✅ SUCCESS' : '❌ FAILED');
      
      if (result.success && result.data) {
        const groceryList = result.data;
        console.log('✅ Grocery list generated:', groceryList.items?.length, 'items');
        
        // v2 API returns ready-to-use format!
        const mobileItems = groceryList.items || [];

        console.log('📱 Mobile items ready:', mobileItems.length);
        
        // Store the generated list for the grocery screen to access
        global.tempGeneratedGroceryList = {
          items: mobileItems,
          title: groceryList.name || `Grocery List - ${mealPlanTitle}`,
          sourceType: 'meal_plan',
          sourceName: mealPlanTitle,
          generatedAt: new Date().toISOString(),
          backendId: groceryList.id  // v2 API creates it in DB!
        };
        
        console.log('✅ Grocery list ready for grocery screen');
        
        // Show success message with option to view list
        Alert.alert(
          'Grocery List Generated!', 
          `Successfully generated ${mobileItems.length} items from your meal plan.`,
          [
            { text: 'Stay Here', style: 'cancel' },
            { 
              text: 'View List', 
              onPress: () => navigation.navigate('Grocery')
            }
          ]
        );
        
      } else {
        console.error('❌ Failed to generate grocery list:', result);
        Alert.alert('Generation Failed', result.message || result.error || 'Could not generate grocery list from meal plan.');
      }
      
    } catch (error) {
      console.error('💥 Error generating grocery list:', error);
      Alert.alert('Error', 'Failed to generate grocery list. Please try again.');
    }
  };

  // Recipe action handlers
  const handleToggleRecipeComplete = (dayId, mealId, recipeId) => {
    console.log(`🍽️ Toggling recipe completion: ${recipeId} in meal ${mealId} on day ${dayId}`);
    
    setDays(prevDays => 
      prevDays.map(day => 
        day.id === dayId 
          ? {
              ...day,
              meals: day.meals.map(meal =>
                meal.id === mealId
                  ? {
                      ...meal,
                      recipes: meal.recipes.map(recipe =>
                        recipe.id === recipeId
                          ? { ...recipe, isCompleted: !recipe.isCompleted }
                          : recipe
                      )
                    }
                  : meal
              )
            }
          : day
      )
    );
  };

  const handleDeleteRecipe = (dayId, mealId, recipeId) => {
    console.log(`🗑️ Deleting recipe: ${recipeId} from meal ${mealId} on day ${dayId}`);
    
    setDays(prevDays => 
      prevDays.map(day => 
        day.id === dayId 
          ? {
              ...day,
              meals: day.meals.map(meal =>
                meal.id === mealId
                  ? {
                      ...meal,
                      recipes: meal.recipes.filter(recipe => recipe.id !== recipeId)
                    }
                  : meal
              )
            }
          : day
      )
    );
  };

  const handleViewRecipe = (recipeId) => {
    console.log(`👁️ Viewing recipe: ${recipeId}`);
    
    // Handle temporary IDs (user-added recipes that don't exist in database)
    if (recipeId.toString().startsWith('temp-') || recipeId.toString().startsWith('unknown-')) {
      alert('This recipe was added manually and cannot be viewed in detail.\n\nOnly recipes from the database can be opened.');
      return;
    }

    // Navigate to RecipeViewScreen with recipe ID
    navigation.navigate('RecipeDetail', { recipeId: recipeId });
  };

  // Recipe drag reorder handler
  const handleRecipeReorder = (dayId, mealId, newRecipes, draggedRecipe, fromIndex, toIndex) => {
    console.log(`🔄 Reordering recipe "${draggedRecipe.title}" from ${fromIndex} to ${toIndex} in ${mealId} on day ${dayId}`);
    
    setDays(prevDays => 
      prevDays.map(day => 
        day.id === dayId 
          ? {
              ...day,
              meals: day.meals.map(meal =>
                meal.id === mealId
                  ? { ...meal, recipes: newRecipes }
                  : meal
              )
            }
          : day
      )
    );
  };

  // Meal reorder handler (NEW)
  const handleMealReorder = (dayId, newMealsOrder) => {
    console.log(`🔄 Reordering meals in day ${dayId}:`, newMealsOrder.map(m => m.name));
    
    setDays(prevDays => 
      prevDays.map(day => 
        day.id === dayId 
          ? { ...day, meals: newMealsOrder }
          : day
      )
    );
  };

  // Cross-container move handler (NEW)
  const handleCrossContainerMove = (recipe, sourceContainer, targetContainer) => {
    console.log(`🔄 Cross-container move: "${recipe.title}" from ${sourceContainer.dayId}-${sourceContainer.mealId} to ${targetContainer.dayId}-${targetContainer.mealId}`);
    
    setDays(prevDays => {
      return prevDays.map(day => {
        // Handle same day moves (both remove and add in one operation)
        if (day.id === sourceContainer.dayId && day.id === targetContainer.dayId) {
          console.log(`📋 Same day move within day ${day.id}`);
          return {
            ...day,
            meals: day.meals.map(meal => {
              // Remove from source meal
              if (meal.id === sourceContainer.mealId) {
                return { ...meal, recipes: meal.recipes.filter(r => r.id !== recipe.id) };
              }
              // Add to target meal
              else if (meal.id === targetContainer.mealId) {
                return { ...meal, recipes: [...meal.recipes, recipe] };
              }
              // Other meals unchanged
              return meal;
            })
          };
        }
        // Handle cross-day moves - remove from source
        else if (day.id === sourceContainer.dayId) {
          console.log(`📤 Removing from source day ${day.id}`);
          return {
            ...day,
            meals: day.meals.map(meal =>
              meal.id === sourceContainer.mealId
                ? { ...meal, recipes: meal.recipes.filter(r => r.id !== recipe.id) }
                : meal
            )
          };
        }
        // Handle cross-day moves - add to target
        else if (day.id === targetContainer.dayId) {
          console.log(`📥 Adding to target day ${day.id}`);
          return {
            ...day,
            meals: day.meals.map(meal =>
              meal.id === targetContainer.mealId
                ? { ...meal, recipes: [...meal.recipes, recipe] }
                : meal
            )
          };
        }
        // Other days unchanged
        // Other days unchanged
        return day;
      });
    });
  };

  // Day handlers (placeholders)
  const toggleDayExpansion = (dayId) => {
    setDays(days.map(day => 
      day.id === dayId ? { ...day, isExpanded: !day.isExpanded } : day
    ));
  };

  const handleAddMeal = (dayId) => {
    const newMealId = `meal-${Date.now()}`;
    setDays(days.map(day => 
      day.id === dayId 
        ? {
            ...day, 
            meals: [...day.meals, { 
              id: newMealId, 
              name: 'New Meal', 
              recipes: [] 
            }]
          }
        : day
    ));
    // Auto-edit the new meal name
    setEditingMealId(newMealId);
  };

  const handleRemoveSection = (dayId) => {
    // Remove the last meal section from the day
    setDays(days.map(day => 
      day.id === dayId && day.meals.length > 1
        ? { ...day, meals: day.meals.slice(0, -1) }
        : day
    ));
  };

  const handleDeleteMeal = (dayId, mealId) => {
    console.log(`🗑️ Deleting meal section: ${mealId} from day ${dayId}`);
    
    setDays(prevDays => 
      prevDays.map(day => 
        day.id === dayId 
          ? {
              ...day,
              meals: day.meals.filter(meal => meal.id !== mealId)
            }
          : day
      )
    );
  };
  
  const handleDeleteDay = async (dayId) => {
    const updatedDays = days.filter(day => day.id !== dayId);
    setDays(updatedDays);
    
    // Save to AsyncStorage to persist the change
    await saveDaysToStorage(updatedDays);
    
    console.log(`🗑️ Deleted day ${dayId} and saved to storage`);
  };

  // Editing functions
  const updateDayName = async (dayId, newName) => {
    const updatedDays = days.map(day => 
      day.id === dayId ? { ...day, name: newName } : day
    );
    setDays(updatedDays);
    
    // Save to AsyncStorage to persist the change
    await saveDaysToStorage(updatedDays);
  };

  const updateMealName = (dayId, mealId, newName) => {
    setDays(days.map(day => 
      day.id === dayId 
        ? {
            ...day, 
            meals: day.meals.map(meal => 
              meal.id === mealId ? { ...meal, name: newName } : meal
            )
          }
        : day
    ));
  };

  // 🌟 NEW SIMPLIFIED HANDLERS: Work directly with day.recipes
  // 🛡️ Drag protection: Prevent AsyncStorage override during recent drags
  const lastDragTime = useRef(0);
  const DRAG_PROTECTION_DURATION = 3000; // 3 seconds protection after drag

  const handleRecipeReorderInDay = (dayId, newRecipes) => {
    // 🛡️ Mark drag time to prevent AsyncStorage override
    lastDragTime.current = Date.now();
    
    // 🎯 Immediate state update to prevent race conditions
    setDays(prevDays => {
      const updatedDays = prevDays.map(day => 
        day.id === dayId 
          ? { ...day, recipes: [...newRecipes] } // Create new array to ensure fresh reference
          : day
      );
      
      return updatedDays;
    });
    
    // 🔄 Update local storage immediately with new order
    setTimeout(() => {
      // This will trigger the useLocalData hook to save the new state
    }, 100);
  };

  const handleDeleteRecipeFromDay = async (dayId, recipeId) => {
    console.log(`🗑️ Deleting recipe ${recipeId} from day ${dayId}`);
    
    const updatedDays = days.map(day => 
      day.id === dayId 
        ? { 
            ...day, 
            recipes: (day.recipes || []).filter(recipe => recipe.id !== recipeId),
            // 🔄 COMPATIBILITY: Also remove from breakfast meal to prevent resurrection
            meals: day.meals?.map(meal => 
              (meal.name === 'Breakfast' || meal.id === 'breakfast-1')
                ? { ...meal, recipes: (meal.recipes || []).filter(recipe => recipe.id !== recipeId) }
                : meal
            ) || []
          }
        : day
    );
    
    // Update state
    setDays(updatedDays);
    
    // 🔄 PERSISTENCE: Save to local storage to prevent resurrection on refresh
    try {
      await AsyncStorage.setItem('localMealPlan', JSON.stringify({
        mealPlan: updatedDays,
        lastUpdated: Date.now(),
        isLocal: true
      }));
      console.log('💾 Recipe deletion saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save recipe deletion:', error);
    }
  };

  const handleToggleRecipeCompleteInDay = (dayId, recipeId) => {
    console.log(`✅ Toggling recipe completion: ${recipeId} in day ${dayId}`);
    
    setDays(prevDays => 
      prevDays.map(day => 
        day.id === dayId 
          ? {
              ...day,
              recipes: (day.recipes || []).map(recipe => 
                recipe.id === recipeId 
                  ? { ...recipe, completed: !recipe.completed }
                  : recipe
              )
            }
          : day
      )
    );
  };
  
  // Wrapper for grocery list generation for menu
  const handleConvertToGroceryList = () => {
    handleGenerateGroceryList();
  };

  // ==============================================
  // 🔄 LOCAL-FIRST DRAFT MANAGEMENT
  // ==============================================

  /**
   * Handle manual save as draft
   */
  const handleSaveAsDraft = async () => {
    const draftName = `${mealPlanTitle} - ${new Date().toLocaleTimeString()}`;
    const result = await saveAsDraft(draftName);
    
    if (result.success) {
      Alert.alert(
        'Draft Saved! 📝',
        `Your meal plan has been saved as "${result.draftName}"`,
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Save Failed',
        result.error || 'Could not save draft',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  /**
   * Show drafts list modal
   */
  const handleShowDrafts = async () => {
    const drafts = await getDrafts();
    setDraftsList(drafts);
    setShowDraftsModal(true);
  };

  /**
   * Load selected draft
   */
  const handleLoadDraft = async (draft) => {
    setShowDraftsModal(false);
    
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Loading this draft will replace your current work.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Load Draft', 
            style: 'destructive',
            onPress: async () => {
              const result = await loadFromDraft(draft.id);
              if (result.success) {
                setMealPlanTitle(draft.name.replace(/ - \d+:\d+:\d+ [AP]M$/, '') || 'Loaded Meal Plan');
                console.log('✅ Draft loaded successfully');
              } else {
                Alert.alert('Load Failed', result.error || 'Could not load draft');
              }
            }
          }
        ]
      );
    } else {
      const result = await loadFromDraft(draft.id);
      if (result.success) {
        setMealPlanTitle(draft.name.replace(/ - \d+:\d+:\d+ [AP]M$/, '') || 'Loaded Meal Plan');
        console.log('✅ Draft loaded successfully');
      } else {
        Alert.alert('Load Failed', result.error || 'Could not load draft');
      }
    }
  };

  /**
   * Force auto-save current changes
   */
  const handleForceAutoSave = async () => {
    await forceAutoSave();
  };

  // Calculate total number of recipes for display - SIMPLIFIED: Only count day.recipes
  const totalMealCount = days.reduce((total, day) => {
    return total + (day.recipes?.length || 0);
  }, 0);

  // Load households for invitation
  const loadHouseholds = async () => {
    console.log('🏠 HOUSEHOLDS DEBUG: Loading households...');
    try {
      const result = await FriendsAPI.getHouseholds();
      console.log('🏠 HOUSEHOLDS DEBUG: API result:', result);
      if (result.success) {
        setHouseholds(result.households);
        console.log('🏠 HOUSEHOLDS DEBUG: Set households:', result.households);
      } else {
        console.error('Failed to load households:', result.error);
      }
    } catch (error) {
      console.error('Error loading households:', error);
    }
  };

  // Handle inviting household members to meal plan
  const handleInviteToMealPlan = () => {
    console.log('🎯 INVITE DEBUG: handleInviteToMealPlan called');
    console.log('🎯 INVITE DEBUG: Current meal plan title:', mealPlanTitle);
    console.log('🎯 INVITE DEBUG: Current plan ID:', currentPlanId);
    loadHouseholds();
    setShowInviteModal(true);
    console.log('🎯 INVITE DEBUG: Modal should be opening...');
  };

  // Handle inviting specific household
  const handleInviteHousehold = async (household) => {
    try {
      console.log('🎯 INVITE DEBUG: Inviting household:', household);
      console.log('🎯 INVITE DEBUG: Current plan ID:', currentPlanId);
      console.log('🎯 INVITE DEBUG: Current plan title:', mealPlanTitle);
      
      if (!currentPlanId) {
        Alert.alert(
          'Save Required', 
          'Please save your meal plan first before inviting collaborators.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Now', 
              onPress: async () => {
                const saveResult = await handleSave();
                if (saveResult && currentPlanId) {
                  // Retry invitation after save
                  handleInviteHousehold(household);
                }
              }
            }
          ]
        );
        return;
      }
      
      // Call the backend collaboration API
      const inviteData = {
        resource_type: 'meal_plan',
        resource_id: currentPlanId,
        household_id: household.id,
        permission_level: 'editor'
      };
      
      console.log('🎯 INVITE DEBUG: Sending invite data:', inviteData);
      
      // Call the real backend collaboration API
      const result = await YesChefAPI.inviteToCollaborate(inviteData);
      
      if (result.success) {
        Alert.alert(
          'Invitation Sent!', 
          `Successfully invited ${household.name} household (${household.members || 0} members) to collaborate on "${mealPlanTitle}". They will now be able to see and edit this meal plan!`
        );
        console.log('🎯 INVITE SUCCESS:', result.data);
      } else {
        Alert.alert(
          'Invitation Failed',
          result.error || 'Failed to send invitation. Please try again.'
        );
        console.error('🎯 INVITE FAILED:', result.error);
      }
      
      setShowInviteModal(false);
      
    } catch (error) {
      console.error('🎯 INVITE ERROR:', error);
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  return (
    <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay} />
      
      {/* 📱 Top Status Bar Background (Clean Header for Phone Status) */}
      <View style={styles.topStatusBarOverlay} />
      
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} animated={true} />
      
      <TouchableWithoutFeedback onPress={() => setShowMealOptionsMenu(null)}>
        <View style={{ flex: 1 }}>
          {/* 🚫 REMOVED: CrossContainerDragProvider - replaced with simple move buttons */}
            
            {/* 🏷️ Card 1: Title Section */}
            <View style={styles.titleCard}>
              <View style={styles.titleContainer}>
                {isEditingTitle ? (
                  <TextInput
                    style={styles.titleInput}
                    value={mealPlanTitle}
                    onChangeText={setMealPlanTitle}
                    onBlur={() => setIsEditingTitle(false)}
                    onSubmitEditing={() => setIsEditingTitle(false)}
                    autoFocus
                    placeholder="Enter meal plan title"
                    placeholderTextColor="#9ca3af"
                    selectionColor="#3b82f6"
                  />
                ) : (
                  <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
                    <Text style={styles.title}>{mealPlanTitle}</Text>
                    {console.log('🔧 MEAL PLAN TITLE DEBUG:', mealPlanTitle)}
                  </TouchableOpacity>
                )}
                
                {/* Show meal count */}
                <Text style={styles.itemCount}>{totalMealCount} meals planned</Text>
              </View>

              {/* Options Menu Button */}
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => setShowOptionsMenu(!showOptionsMenu)}
              >
                <Text style={styles.optionsIcon}>⋯</Text>
              </TouchableOpacity>
            </View>

            {/* 📝 LOCAL DATA STATUS - Show draft/save status */}
            <LocalDataStatus
              hasUnsavedChanges={hasUnsavedChanges}
              isAutoSaving={isAutoSaving}
              lastSaved={lastSaved}
              error={localDataError}
              onSaveAsDraft={handleSaveAsDraft}
              onShowDrafts={handleShowDrafts}
              style={styles.localDataStatus}
            />

      {/* Options Menu Modal - Fullscreen */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meal Plan Options</Text>
              <TouchableOpacity onPress={() => setShowOptionsMenu(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent} 
              contentContainerStyle={{ paddingBottom: 0 }}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => { setShowOptionsMenu(false); handleSave(); }}
              >
                <Icon name="save" size={22} color="#22C55E" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>Save Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => { setShowOptionsMenu(false); handleLoad(); }}
              >
                <Icon name="folder" size={22} color="#1E40AF" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>Load Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => { setShowOptionsMenu(false); handleNew(); }}
              >
                <Icon name="add" size={22} color="#E7993F" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>New Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => { setShowOptionsMenu(false); handleAddDay(); }}
              >
                <Icon name="add" size={22} color="#7C3AED" style={{marginRight: 16}} />
                <Text style={styles.modalMenuText}>Add Day</Text>
              </TouchableOpacity>
              
              <View style={styles.modalDivider} />
              
              <TouchableOpacity 
                style={styles.modalMenuItem}
                onPress={() => { 
                  setShowOptionsMenu(false); 
                  handleInviteToMealPlan();
                }}
              >
                <Text style={{ fontSize: 22, color: "#7C3AED", marginRight: 16 }}>👥</Text>
                <Text style={styles.modalMenuText}>Invite Friends</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalMenuItem, {backgroundColor: '#f0fdf4'}]}
                onPress={() => { setShowOptionsMenu(false); handleConvertToGroceryList(); }}
              >
                <Icon name="list" size={22} color="#059669" style={{marginRight: 16}} />
                <Text style={[styles.modalMenuText, {color: '#059669'}]}>Make Grocery List</Text>
              </TouchableOpacity>
              
              <View style={styles.modalDivider} />
              
              <TouchableOpacity 
                style={[
                  styles.modalMenuItem,
                  styles.modalDeleteMenuItem,
                  !currentPlanId && {opacity: 0.5}
                ]} 
                onPress={() => { 
                  setShowOptionsMenu(false); 
                  if (currentPlanId) handleDelete(); 
                }}
                disabled={!currentPlanId}
              >
                <Icon 
                  name="delete" 
                  size={22} 
                  color={currentPlanId ? "#DC313F" : "#9ca3af"} 
                  style={{marginRight: 16}} 
                />
                <Text style={[styles.modalDeleteText, !currentPlanId && {color: '#9ca3af'}]}>
                  {currentPlanId ? 'Delete Plan' : 'No Plan Loaded'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Main content area with days */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={!!editingDayId}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={true}
          alwaysBounceVertical={true}
          removeClippedSubviews={false}
        >
        {days.map((day, dayIndex) => (
          <View key={`day-${day.id}-${dayIndex}`} style={styles.dayContainer}>
            {/* Enhanced Day Header with drag handle and options */}
            <View style={styles.dayHeader}>
              {/* Drag handle */}
              <View style={styles.dragHandle}>
                <View style={styles.dragDots}>
                  <View style={styles.dotRow}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                  <View style={styles.dotRow}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>
              </View>

              {/* Day name (editable) */}
              <View style={styles.dayNameContainer}>
                {editingDayId === day.id ? (
                  <TextInput
                    ref={editingInputRef}
                    style={styles.dayNameInput}
                    value={day.name}
                    onChangeText={(text) => updateDayName(day.id, text)}
                    onBlur={() => setEditingDayId(null)}
                    onSubmitEditing={() => setEditingDayId(null)}
                    autoFocus
                    placeholder="Enter day name"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                ) : (
                  <TouchableOpacity onPress={() => handleEditDayName(day.id, dayIndex)}>
                    <Text style={styles.dayName}>{day.name}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Expand/Collapse button */}
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => toggleDayExpansion(day.id)}
              >
                <Text style={styles.expandIcon}>
                  {day.isExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* Day options menu */}
              <TouchableOpacity 
                style={styles.dayOptionsButton}
                onPress={() => setShowDayOptionsModal(day.id)}
              >
                <Text style={styles.optionsIcon}>⋯</Text>
              </TouchableOpacity>
            </View>



            {day.isExpanded && (
              <View style={styles.dayContent}>
                {/* 🎨 SMOOTH DRAG: Using LightweightDragSystem for within-day recipe reordering */}
                <SimpleDraggableList
                  key={`day-${day.id}-recipes`} // 🎯 FIX: Stable key to prevent component recreation
                  data={day.recipes || []}
                  keyExtractor={(recipe) => recipe.id}
                  renderItem={({ item, index }) => (
                    <RecipeCard
                      recipe={item}
                      dayId={day.id}
                      recipeIndex={index}
                      onToggleComplete={(recipeId) => handleToggleRecipeCompleteInDay(day.id, recipeId)}
                      onDelete={(recipeId) => handleDeleteRecipeFromDay(day.id, recipeId)}
                      onView={(recipeId) => handleViewRecipe(recipeId)}
                    />
                  )}
                  onReorder={(newRecipes, draggedRecipe, fromIndex, toIndex) => 
                    handleRecipeReorderInDay(day.id, newRecipes)
                  }
                  style={(day.recipes?.length || 0) === 0 ? styles.emptyDropZone : undefined}
                />
                
                {/* Empty state */}
                {(!day.recipes || day.recipes.length === 0) && (
                  <View style={styles.emptyDayState}>
                    <Text style={styles.emptyDayText}>No recipes yet</Text>
                    <Text style={styles.emptyDaySubtext}>Add recipes from the Recipe Collection!</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Load Plans Modal */}
      <Modal
        visible={showLoadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLoadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Load Meal Plan</Text>
              <TouchableOpacity onPress={() => setShowLoadModal(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.loadModalScrollArea}>
              <Text style={styles.modalSubtitle}>
                Choose a plan to load (current changes will be lost):
              </Text>
              
              <ScrollView style={styles.loadListContainer} showsVerticalScrollIndicator={false}>
                {availablePlans.length > 0 ? (
                  availablePlans.map(plan => (
                    <TouchableOpacity
                      key={plan.id}
                      style={styles.modalMenuItem}
                      onPress={async () => {
                        setShowLoadModal(false);
                        await loadSpecificPlan(plan.id);
                      }}
                    >
                      <Icon name="folder" size={20} color="#1E40AF" style={{marginRight: 12}} />
                      <View style={{flex: 1}}>
                        <Text style={styles.modalMenuText}>{plan.plan_name}</Text>
                        <Text style={styles.listInfo}>{plan.week_start_date}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No meal plans found</Text>
                    <Text style={styles.emptySubtext}>Create a new plan to get started</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
          {/* 🚫 REMOVED: CrossContainerDragProvider closing tag */}
        </View>
      </TouchableWithoutFeedback>

      {/* Invite Household Modal */}
      {console.log('🎯 MODAL DEBUG: showInviteModal =', showInviteModal)}
      {console.log('🎯 MODAL DEBUG: households =', households)}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Household</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.loadModalScrollArea}>
              <Text style={styles.modalSubtitle}>
                Invite a household to collaborate on "{mealPlanTitle}":
              </Text>
              
              <ScrollView style={styles.loadListContainer} showsVerticalScrollIndicator={false}>
                {households.length > 0 ? (
                  households.map(household => (
                    <TouchableOpacity
                      key={household.id}
                      style={styles.modalMenuItem}
                      onPress={() => handleInviteHousehold(household)}
                    >
                      <Text style={{ fontSize: 22, color: "#7C3AED", marginRight: 12 }}>👥</Text>
                      <View style={{flex: 1}}>
                        <Text style={styles.modalMenuText}>{household.name}</Text>
                        <Text style={styles.listInfo}>{household.members || 0} members</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No households found</Text>
                    <Text style={styles.emptySubtext}>Create a household first to invite members</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📝 DRAFTS MODAL - Local-first draft management */}
      {showDraftsModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDraftsModal}
          onRequestClose={() => setShowDraftsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.draftModalContent}>
              <View style={styles.draftModalHeader}>
                <Text style={styles.draftModalTitle}>Load Draft</Text>
                <TouchableOpacity onPress={() => setShowDraftsModal(false)}>
                  <Icon name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.draftsList}>
                {draftsList.map((draft) => (
                  <TouchableOpacity
                    key={draft.id}
                    style={styles.draftItem}
                    onPress={() => handleLoadDraft(draft)}
                  >
                    <View style={styles.draftInfo}>
                      <Text style={styles.draftName}>{draft.name}</Text>
                      <Text style={styles.draftMeta}>
                        {new Date(draft.timestamp).toLocaleString()} • 
                        {draft.recipeCount} recipes • 
                        {draft.autoGenerated ? ' Auto-saved' : ' Manual save'}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
                
                {draftsList.length === 0 && (
                  <View style={styles.emptyDraftsState}>
                    <Icon name="file" size={48} color="#ccc" />
                    <Text style={styles.emptyDraftsText}>No drafts available</Text>
                    <Text style={styles.emptyDraftsSubtext}>
                      Your auto-saves and manual drafts will appear here
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Day Options Bottom Sheet Modal */}
      <DayOptionsModal
        visible={!!showDayOptionsModal}
        onClose={() => setShowDayOptionsModal(null)}
        dayName={showDayOptionsModal ? days.find(d => d.id === showDayOptionsModal)?.name : ''}
        onAddMeal={() => {
          // Navigate to My Recipes section
          navigation.navigate('Recipes', { 
            screen: 'RecipeCollection',
            params: { 
              fromMealPlan: true,
              selectedDayId: showDayOptionsModal 
            }
          });
        }}
        onDeleteDay={() => {
          if (showDayOptionsModal) {
            handleDeleteDay(showDayOptionsModal);
          }
        }}
      />

      {/* Toast Notification (inline like GroceryListScreen) */}
      {showToast && (
        <Animated.View 
          style={[
            styles.toast,
            {
              opacity: toastAnimation,
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

    </SafeAreaView>
    </ImageBackground>
  );
}

// Recipe Card Component - Clean text-only layout like grocery list with drag support
const RecipeCard = ({ recipe, onToggleComplete, onDelete, onView, isDragging = false }) => {
  return (
    <View style={[
      styles.recipeCard,
      isDragging && styles.recipeCardDragging
    ]}>
      {/* Checkbox for completion */}
      <TouchableOpacity
        style={styles.recipeCheckbox}
        onPress={() => onToggleComplete(recipe.id)}
      >
        <Text style={styles.recipeCheckboxIcon}>
          {recipe.isCompleted ? '✅' : '☐'}
        </Text>
      </TouchableOpacity>

      {/* Recipe title - tap to view, truncated with ellipsis */}
      <TouchableOpacity
        style={styles.recipeTitleContainer}
        onPress={() => onView(recipe.id)}
      >
        <Text
          style={[
            styles.recipeTitle,
            recipe.isCompleted && styles.recipeTitleCompleted
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {recipe.title}
        </Text>
      </TouchableOpacity>

      {/* Delete button - red trash can like grocery list */}
      <TouchableOpacity
        style={styles.recipeDeleteButton}
        onPress={() => onDelete(recipe.id)}
      >
        <Icon name="delete" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // 🎨 Background and Overlay Styles
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent', // Let mint background show through
    zIndex: 1,
  },
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Enough to cover status bar area
    backgroundColor: 'transparent', // Let mint background show through
    zIndex: 3, // Above main overlay to ensure status bar area is clearly visible
  },
  
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed from '#f9fafb' to transparent
    zIndex: 2, // Above overlay
    paddingTop: 50, // Add padding to push content below status bar
  },

  // 🎨 Card Styles - Beautiful bubble design
  titleCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
    paddingTop: 4,
    justifyContent: 'flex-start',
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
  },
  titleInput: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingVertical: 4,
  },
  optionsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginLeft: 12,
  },
  optionsIcon: {
    fontSize: 18,
    color: '#374151',
    fontWeight: 'bold',
  },
  infoBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // Horizontal padding only
    paddingTop: 8,         // Reduced top padding
    paddingBottom: 16,     // Keep bottom padding for scroll space
  },
  dayContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dragHandle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dragDots: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6b7280',
    marginHorizontal: 1,
  },
  dayNameContainer: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold', // Added Nunito font
    color: '#111827',
  },
  dayNameInput: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold', // Added Nunito font
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingVertical: 2,
  },
  expandButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  dayOptionsButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },

  dayContent: {
    padding: 16,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealSectionDragging: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingRight: 4,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealOptionsButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  mealOptionsIcon: {
    fontSize: 18,
    color: '#9ca3af', // Light grey
    lineHeight: 18,
  },
  mealOptionsMenu: {
    position: 'absolute',
    top: 24,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 100,
  },
  mealMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteMealMenuItem: {
    borderRadius: 6,
  },
  deleteMealText: {
    fontSize: 14,
    color: '#ef4444', // Red text
    marginLeft: 8,
  },
  mealName: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular', // Added Nunito font
    color: '#374151',
  },
  mealNameInput: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular', // Added Nunito font
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingVertical: 2,
    paddingLeft: 12, // Account for the bullet point spacing
  },
  recipesContainer: {
    paddingLeft: 16,
  },
  recipeItem: {
    paddingVertical: 4,
  },
  recipeText: {
    fontSize: 14,
    color: '#111827',
  },
  recipeTextCompleted: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  emptyRecipeItem: {
    paddingVertical: 4,
  },
  emptyRecipeText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  emptyDropZone: {
    minHeight: 44, // Match the CrossContainerDragSystem
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  groceryButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  // Fullscreen Modal Styles (matching GroceryListScreen)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    width: '100%',  // ✅ Full width edge-to-edge
    borderTopLeftRadius: 20,  // Match GroceryListScreen rounded corners
    borderTopRightRadius: 20,  // Match GroceryListScreen rounded corners
    height: '100%',  // ✅ Full height - truly flush with bottom
    paddingBottom: 0, // ✅ Flush with bottom - no gap
    marginBottom: 0, // ✅ No bottom margin
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 0, // ✅ No bottom padding - flush with screen
  },
  modalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#f9fafb',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  modalMenuText: {
    fontSize: 17,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    flex: 1,
  },
  modalDivider: {
    height: 8,
    marginVertical: 8,
  },
  modalDeleteMenuItem: {
    backgroundColor: '#fef2f2',
  },
  modalDeleteText: {
    fontSize: 17,
    fontFamily: 'Nunito-Regular',
    color: '#dc2626',
    flex: 1,
  },
  
  // Load/Invite Modal Specific Styles
  loadModalScrollArea: {
    flex: 1,
    paddingTop: 8,
  },
  loadListContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listInfo: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  // Recipe Card Styles - Clean text-only layout like grocery list with drag support
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44, // Touch-friendly height
    backgroundColor: '#ffffff',
  },
  recipeCardDragging: {
    backgroundColor: '#f3f4f6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeCheckbox: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipeCheckboxIcon: {
    fontSize: 18,
  },
  recipeTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular', // Added Nunito font
    color: '#111827',
    lineHeight: 20,
  },
  recipeTitleCompleted: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  recipeDeleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 🌟 NEW SIMPLIFIED UI STYLES
  emptyDayState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    borderRadius: 8,
    margin: 8,
  },
  emptyDayText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Nunito-SemiBold',
  },
  emptyDaySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    fontFamily: 'Nunito-Regular',
  },

  // ==============================================
  // 📝 LOCAL-FIRST UI STYLES
  // ==============================================

  localDataStatus: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Draft Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  draftModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },

  draftModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  draftModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Nunito-Bold',
  },

  draftsList: {
    maxHeight: 400,
  },

  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  draftInfo: {
    flex: 1,
  },

  draftName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Nunito-SemiBold',
  },

  draftMeta: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Nunito-Regular',
  },

  emptyDraftsState: {
    alignItems: 'center',
    padding: 32,
  },

  emptyDraftsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontFamily: 'Nunito-SemiBold',
  },

  emptyDraftsSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },

  // Toast styles (matches GroceryListScreen mint toast)
  toast: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -100,
    width: 200,
    backgroundColor: '#10b981', // Mint green
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
});

export default MealPlanScreen;
