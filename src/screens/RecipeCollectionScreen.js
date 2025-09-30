import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YesChefAPI from '../services/YesChefAPI';
import MealPlanAPI from '../services/MealPlanAPI';
import RecipeOptionsModal from '../components/RecipeOptionsModal';
import RecipeSharingModal from '../components/RecipeSharingModal';
import DaySelectionModal from '../components/DaySelectionModal';

// Safety function to ensure proper text rendering
const safeTextRender = (value, fallback = '') => {
  const result = value || fallback;
  return typeof result === 'string' ? result : String(result || fallback || '');
};

const RecipeCollectionScreen = ({ navigation, route }) => {
  // Background configuration (matches HomeScreen)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/mintbackground.jpg');
  
  try {
  
  // 📚 Match exact categories from web app CookbookSidebar.js
  const defaultCategories = [
    { id: 'all', name: 'All Recipes', icon: '📚', color: '#6B7280' },
    { id: 'recent-imports', name: 'Recent Imports', icon: '🔥', color: '#059669' },
    { id: 'breakfast', name: 'Breakfast', icon: '🥞', color: '#F59E0B' },
    { id: 'lunch', name: 'Lunch', icon: '🥗', color: '#10B981' },
    { id: 'dinner', name: 'Dinner', icon: '🍽️', color: '#3B82F6' },
    { id: 'desserts', name: 'Desserts', icon: '🧁', color: '#8B5CF6' },
    { id: 'one-pot', name: 'One-Pot', icon: '🍲', color: '#EF4444' },
    { id: 'quick', name: 'Quick', icon: '⚡', color: '#F97316' },
    { id: 'favorites', name: 'Favorites', icon: '❤️', color: '#EC4899' }
  ];

  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // null = show category list
  const [categoriesWithCounts, setCategoriesWithCounts] = useState(() => {
    const initialCategories = defaultCategories.map(cat => ({ ...cat, count: 0 }));
    return initialCategories;
  });
  // Meal Plan Integration
  const [currentMealPlan, setCurrentMealPlan] = useState(null);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(null);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [selectedRecipeForSharing, setSelectedRecipeForSharing] = useState(null);
  const [hiddenRecipeIds, setHiddenRecipeIds] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Added ✓');
  const [showDaySelection, setShowDaySelection] = useState(false);
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedRecipeForDay, setSelectedRecipeForDay] = useState(null);

  // Load hidden recipe IDs from AsyncStorage on mount
  useEffect(() => {
    const loadHiddenRecipes = async () => {
      try {
        const hiddenIds = await AsyncStorage.getItem('hiddenRecipeIds');
        if (hiddenIds) {
          setHiddenRecipeIds(new Set(JSON.parse(hiddenIds)));
        }
      } catch (error) {
        console.error('Failed to load hidden recipes:', error);
      }
    };
    loadHiddenRecipes();
  }, []);

  // Save hidden recipe IDs to AsyncStorage whenever it changes
  useEffect(() => {
    const saveHiddenRecipes = async () => {
      try {
        await AsyncStorage.setItem('hiddenRecipeIds', JSON.stringify([...hiddenRecipeIds]));
      } catch (error) {
        console.error('Failed to save hidden recipes:', error);
      }
    };
    if (hiddenRecipeIds.size > 0) {
      saveHiddenRecipes();
    }
  }, [hiddenRecipeIds]);

  // 🧹 Clean up hidden recipe IDs that no longer exist in backend
  useEffect(() => {
    if (recipes && recipes.length > 0 && hiddenRecipeIds.size > 0) {
      const existingRecipeIds = new Set(recipes.map(recipe => recipe.id));
      const validHiddenIds = new Set([...hiddenRecipeIds].filter(id => existingRecipeIds.has(id)));
      
      if (validHiddenIds.size !== hiddenRecipeIds.size) {
        console.log(`🧹 Cleaning up hidden recipes: ${hiddenRecipeIds.size - validHiddenIds.size} IDs removed`);
        setHiddenRecipeIds(validHiddenIds);
      }
    }
  }, [recipes, hiddenRecipeIds]);

  // 🔄 Refresh hidden recipes when screen comes into focus (e.g., returning from RecipeView)
  // 🔄 Load hidden recipes from storage on focus (no infinite loop)
  useFocusEffect(
    useCallback(() => {
      const loadHiddenRecipes = async () => {
        try {
          const hiddenIds = await AsyncStorage.getItem('hiddenRecipeIds');
          if (hiddenIds) {
            const newHiddenSet = new Set(JSON.parse(hiddenIds));
            console.log('🔄 Refreshed hidden recipes on focus:', newHiddenSet.size, 'hidden');
            setHiddenRecipeIds(newHiddenSet);
          }
        } catch (error) {
          console.error('Failed to load hidden recipes:', error);
        }
      };
      
      loadHiddenRecipes();
    }, [])
  );
  
  const [isUpdatingMealPlan, setIsUpdatingMealPlan] = useState(false);

  // 🍞 Toast notification state
  const [toastAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadRecipes();
  }, []);

  // 🆕 Listen for refresh parameter (from import workflow)
  useEffect(() => {
    if (route.params?.refresh) {
      console.log('🔄 Refreshing recipes due to route param');
      loadRecipes();
      // Clear the refresh param to prevent repeated refreshes
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh]);

  // 🆕 Listen for force refresh parameter (delayed refresh)
  useEffect(() => {
    if (route.params?.forceRefresh) {
      console.log('🔄🔄 Force refreshing recipes due to delayed param');
      loadRecipes();
      // Clear the forceRefresh param
      navigation.setParams({ forceRefresh: undefined });
    }
  }, [route.params?.forceRefresh]);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 RECIPE DEBUG: Loading recipes...');
      
      // Single API call with simple parameters
      const result = await YesChefAPI.getRecipes();
      
      console.log('🔍 RECIPE DEBUG: API result:', {
        success: result.success,
        recipesLength: result.recipes?.length,
        error: result.error
      });
      
      if (result.success) {
        setRecipes(result.recipes || []);
        console.log(`✅ Loaded ${result.recipes?.length || 0} recipes`);
        
        // 🔍 Debug: Check for recently saved recipe
        if (result.recipes && result.recipes.length > 0) {
          const recentRecipes = result.recipes
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 3);
          console.log('🔍 Most recent recipes:', recentRecipes.map(r => ({
            id: r.id,
            title: r.title,
            category: r.category,
            created_at: r.created_at
          })));
          
          // 🎯 Success! Recipe import system is working
          console.log('🎉 Recipe import system operational - showing most recent recipes:');
          
          // 🚨 Check for specific missing recipe (2599 from latest logs) 
          const recipe2599 = result.recipes.find(r => r.id === 2599);
          if (recipe2599) {
            console.log('✅ Found recipe 2599:', {
              id: recipe2599.id,
              title: recipe2599.title,
              category: recipe2599.category,
              created_at: recipe2599.created_at,
              user_id: recipe2599.user_id,
              source: recipe2599.source
            });
          } else {
            console.log('❌ Recipe 2599 NOT FOUND in backend response');
            
            // Check for ALL BBQ Mushroom Pizza recipes to see what's different
            const bbqRecipes = result.recipes.filter(r => 
              r.title && r.title.toLowerCase().includes('bbq mushroom')
            );
            console.log('🔍 All BBQ Mushroom recipes found:', bbqRecipes.map(r => ({
              id: r.id,
              title: r.title,
              category: r.category,
              source: r.source,
              user_id: r.user_id
            })));
            
            // Check if any recipe with similar title exists
            const similarRecipes = result.recipes.filter(r => 
              r.title && r.title.toLowerCase().includes('bbq mushroom pizza test')
            );
            if (similarRecipes.length > 0) {
              console.log('🔍 Found similar recipes:', similarRecipes.map(r => ({
                id: r.id,
                title: r.title,
                category: r.category
              })));
            } else {
              console.log('❌ No recipes with "BBQ Mushroom Pizza Test" found at all');
              
              // Check total count vs expected
              console.log('📊 Recipe count analysis:', {
                backend_count: result.recipes.length,
                expected_with_new_recipe: 23, // Should be 23 if recipe 2597 was included
              });
            }
          }
        }
      } else {
        console.log('❌ RECIPE DEBUG: Failed to load recipes:', result.error);
        Alert.alert('Error', result.error || 'Failed to load recipes');
      }
    } catch (error) {
      console.log('❌ RECIPE DEBUG: Exception loading recipes:', error);
      Alert.alert('Error', 'Failed to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const importRecipeFromUrl = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a recipe URL');
      return;
    }

    setIsImporting(true);
    try {
      // 🆕 NEW APPROACH: Extract recipe data without saving to backend
      const result = await YesChefAPI.extractRecipeFromUrl(importUrl.trim());
      if (result.success) {
        console.log('🔍 EXTRACT SUCCESS: Navigating to review screen');
        
        setImportUrl(''); // Clear the URL input
        setIsImporting(false); // Reset loading state
        
        // Navigate to the review screen with extracted (but unsaved) data
        navigation.navigate('RecipeImportReview', {
          importResult: {
            recipe: result.recipe,
            temp_recipe_id: result.recipe_id, // Temporary ID for deletion if cancelled
            confidence: result.confidence,
            extraction_method: result.extraction_method,
            needs_review: true, // Always needs review since it's not saved yet
            isTemporary: true // Flag to indicate this is not yet saved
          }
        });
        
      } else {
        setIsImporting(false);
        Alert.alert('Import Failed', result.error || 'Failed to extract recipe from URL');
      }
    } catch (error) {
      setIsImporting(false);
      console.error('Import error:', error);
      Alert.alert('Error', 'Network error during import');
    }
  };

  const openRecipe = (recipe) => {
    navigation.navigate('RecipeDetail', { 
      recipe: recipe,
      recipeId: recipe.id 
    });
  };

  // Fallback default meal plan structure - TRANSITIONAL: Both old and new structure
  const getDefaultMealPlan = () => {
    return [
      {
        id: 1,
        name: 'Day 1',
        isExpanded: true,
        recipes: [], // NEW: Direct recipe list for simplified UI
        // OLD: Keep meals for compatibility with current modal
        meals: [
          { id: 'breakfast-1', name: 'Breakfast', recipes: [] },
          { id: 'lunch-1', name: 'Lunch', recipes: [] },
          { id: 'dinner-1', name: 'Dinner', recipes: [] },
        ]
      }
    ];
  };

  // 🍞 Show gentle mint toast notification with custom message
  const showToastNotification = (message = 'Added ✓') => {
    setToastMessage(message);
    setShowToast(true);
    
    // Gentle fade in
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 400, // Slower, calmer animation
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 2.5 seconds - calm timing
    setTimeout(() => {
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 400, // Slower fade out
        useNativeDriver: true,
      }).start(() => {
        setShowToast(false);
      });
    }, 2500);
  };

  // 🔄 Save local meal plan to AsyncStorage for cross-screen sharing
  const saveLocalMealPlan = async (mealPlan) => {
    try {
      await AsyncStorage.setItem('localMealPlan', JSON.stringify({
        mealPlan: mealPlan,
        lastUpdated: Date.now(),
        isLocal: true
      }));
      console.log('💾 Local meal plan saved to AsyncStorage');
    } catch (error) {
      console.error('❌ Failed to save local meal plan:', error);
    }
  };

  const handleAddToMealPlan = useCallback(async (recipe) => {
    setShowOptionsMenu(null); // Close options menu
    
    try {
      // 🎯 SMART DAY DETECTION: Check current meal plan for multiple days
      // 🎯 SMART DAY DETECTION: Always check AsyncStorage first (MealPlanScreen format)
      let mealPlanDays = [];
      
      const localMealPlan = await AsyncStorage.getItem('localMealPlan');
      if (localMealPlan) {
        const parsed = JSON.parse(localMealPlan);
        console.log('🔍 FULL AsyncStorage data structure:', JSON.stringify(parsed, null, 2));
        // FIXED: The mealPlan is an array directly, not an object with days
        mealPlanDays = parsed.mealPlan || parsed.days || [];
        console.log('🔍 Found AsyncStorage meal plan with', mealPlanDays.length, 'days');
        console.log('🔍 Day details:', mealPlanDays.map(day => ({ id: day.id, name: day.name, recipes: day.recipes?.length || 0 })));
      } else {
        console.log('🔍 No AsyncStorage meal plan - checking local state');
        mealPlanDays = currentMealPlan || [];
      }
      
      // Filter to include all valid days (not just days with recipes)
      const activeDays = mealPlanDays.filter(day => 
        day && (day.id || day.name) // Include any day that exists
      );
      
      console.log('🎯 Smart day detection:', activeDays.length, 'active days found');
      
      if (activeDays.length === 0) {
        // No days exist - create a default Day 1 and add recipe directly
        console.log('📱 No days found - creating Day 1 and adding recipe directly');
        
        const defaultMealPlan = {
          mealPlan: [{
            id: 1,
            name: 'Day 1',
            isExpanded: true,
            recipes: [recipe],
            meals: []
          }],
          lastUpdated: Date.now(),
          isLocal: true
        };
        
        await AsyncStorage.setItem('localMealPlan', JSON.stringify(defaultMealPlan));
        showToastNotification('Added ✓');
        
      } else if (activeDays.length === 1) {
        // Single day exists - add directly to that day
        console.log('📱 Single day - adding directly to day:', activeDays[0].id);
        
        const updatedDays = activeDays.map(day => 
          ({ ...day, recipes: [...(day.recipes || []), recipe] })
        );
        
        const localMealPlan = await AsyncStorage.getItem('localMealPlan');
        const parsed = JSON.parse(localMealPlan);
        const updatedMealPlan = {
          ...parsed,
          mealPlan: updatedDays,
          lastUpdated: Date.now()
        };
        
        await AsyncStorage.setItem('localMealPlan', JSON.stringify(updatedMealPlan));
        showToastNotification('Added ✓');
        
      } else {
        // Multiple days - show smart day selection modal
        console.log('📅 Multiple days - showing day selection modal');
        setSelectedRecipeForDay(recipe);
        setAvailableDays(activeDays);
        setShowDaySelection(true);
      }
      
    } catch (error) {
      console.error('Error in smart day detection:', error);
      // Fallback to existing modal system
      setSelectedRecipeForPlan(recipe);
      setShowMealPlanModal(true);
    }
  }, [currentMealPlan]);

  // 📅 Handle day selection from smart day modal - FIXED to use AsyncStorage
  const handleDaySelected = useCallback(async (dayId) => {
    console.log('📅 Day selected:', dayId, 'for recipe:', selectedRecipeForDay?.title);
    
    try {
      // Get the current AsyncStorage data (same as smart day detection)
      const localMealPlan = await AsyncStorage.getItem('localMealPlan');
      if (!localMealPlan) {
        console.error('❌ No meal plan data found in AsyncStorage');
        return;
      }
      
      const parsed = JSON.parse(localMealPlan);
      const mealPlanDays = parsed.mealPlan || [];
      
      // Add recipe to the selected day
      console.log('🔍 RECIPE FORMAT DEBUG - selectedRecipeForDay:', JSON.stringify(selectedRecipeForDay, null, 2));
      const updatedDays = mealPlanDays.map(day => 
        day.id === dayId 
          ? { ...day, recipes: [...(day.recipes || []), selectedRecipeForDay] }
          : day
      );
      
      // Save back to AsyncStorage
      const updatedMealPlan = {
        ...parsed,
        mealPlan: updatedDays,
        lastUpdated: Date.now()
      };
      
      await AsyncStorage.setItem('localMealPlan', JSON.stringify(updatedMealPlan));
      console.log('💾 Recipe added to day', dayId, 'and saved to AsyncStorage');
      
      setShowDaySelection(false);
      
      // Show success toast
      showToastNotification('Added ✓');
      
    } catch (error) {
      console.error('❌ Error in handleDaySelected:', error);
    }
    
    console.log('✅ Recipe added to day', dayId, '- new recipe count:', 
      updatedMealPlan.find(d => d.id === dayId)?.recipes?.length);
  }, [currentMealPlan, selectedRecipeForDay, showToastNotification]);

  const handleDeleteRecipe = async (recipe) => {
    Alert.alert(
      'Remove Recipe',
      `Remove "${recipe.title}" from your recipes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'default', // Changed from 'destructive' to be less scary
          onPress: () => {
            // Add to hidden recipes set
            setHiddenRecipeIds(prev => new Set([...prev, recipe.id]));
            
            // Also remove from current recipes list for immediate UI update
            setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipe.id));
            
            // Close the modal
            setShowBottomSheet(null);
            
            // Show light mint toast instead of heavy alert
            showToastNotification('Removed ✓');
          }
        }
      ]
    );
  };

  // � Share recipe handler
  const handleShareRecipe = async (recipe) => {
    console.log('🔄 Sharing recipe:', {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      hasIngredients: !!recipe.ingredients,
      hasInstructions: !!recipe.instructions
    });
    
    try {
      // Fetch full recipe details to ensure we have all data
      console.log('🔍 Fetching full recipe details for sharing...');
      const fullRecipe = await YesChefAPI.getRecipe(recipe.id);
      
      if (fullRecipe.success) {
        console.log('✅ Full recipe loaded for sharing:', {
          id: fullRecipe.recipe.id,
          title: fullRecipe.recipe.title,
          description: fullRecipe.recipe.description,
          hasIngredients: !!fullRecipe.recipe.ingredients,
          hasInstructions: !!fullRecipe.recipe.instructions
        });
        setSelectedRecipeForSharing(fullRecipe.recipe);
      } else {
        console.error('❌ Failed to load full recipe details:', fullRecipe.error);
        setSelectedRecipeForSharing(recipe); // Fallback to original recipe
      }
    } catch (error) {
      console.error('❌ Error fetching recipe details:', error);
      setSelectedRecipeForSharing(recipe); // Fallback to original recipe
    }
    
    setShowSharingModal(true);
  };

  // �🌟 SIMPLIFIED: Add recipe directly to day.recipes (no meal containers)
  const addRecipeToDay = async (dayId, recipeToAdd = null) => {
    try {
      // Use passed recipe or fall back to selectedRecipeForPlan
      const recipe = recipeToAdd || selectedRecipeForPlan;
      
      if (!recipe) {
        console.log('❌ No recipe available for adding to day');
        Alert.alert('Error', 'No recipe selected');
        return;
      }

      console.log('🌟 SIMPLIFIED: Adding recipe directly to day:', dayId, recipe.title);

      // Ensure we have a meal plan - Load fresh from storage to avoid stale state
      let mealPlanToUse;
      try {
        const localData = await AsyncStorage.getItem('localMealPlan');
        if (localData) {
          const { mealPlan } = JSON.parse(localData);
          mealPlanToUse = mealPlan;
        } else if (currentMealPlan && currentMealPlan.length > 0) {
          mealPlanToUse = currentMealPlan;
        } else {
          mealPlanToUse = getDefaultMealPlan();
        }
      } catch (error) {
        console.error('❌ Error loading meal plan, using fallback:', error);
        mealPlanToUse = currentMealPlan || getDefaultMealPlan();
      }

      // 🔍 DEBUG: Check meal plan structure before update
      console.log('🔍 MEAL PLAN STRUCTURE DEBUG:', {
        mealPlanLength: mealPlanToUse.length,
        firstDayId: mealPlanToUse[0]?.id,
        firstDayName: mealPlanToUse[0]?.name,
        firstDayRecipesCount: mealPlanToUse[0]?.recipes?.length || 0,
        dayIdWeAreLookingFor: dayId,
        dayIdWithPrefix: `day-${dayId}`
      });

      // Add recipe directly to day.recipes array
      const updatedMealPlan = mealPlanToUse.map(day => {
        console.log(`🔍 DAY MATCH DEBUG: Checking day ${day.id} vs ${dayId} or day-${dayId}`);
        console.log(`🔍 DAY MATCH TYPES: day.id type=${typeof day.id}, dayId type=${typeof dayId}`);
        console.log(`🔍 DAY MATCH COMPARISON: day.id === dayId = ${day.id === dayId}`);
        
        // Fix comparison - both should be numbers for reliable matching
        if (day.id === dayId || day.id === String(dayId)) {
          console.log(`✅ MATCHED DAY: ${day.id}, adding recipe to this day`);
          const existingRecipes = day.recipes || [];
          const recipeExists = existingRecipes.some(r => r.id === recipe.id);
          
          if (recipeExists) {
            console.log('⚠️ Recipe already exists in this day, skipping duplicate');
            return day;
          }
          
          const newRecipe = {
            id: recipe.id,
            title: recipe.title,
            name: recipe.title,
            isCompleted: false,
            source: 'simplified_add',
            addedAt: Date.now()
          };
          
          console.log('✅ Adding recipe to day.recipes array:', newRecipe.title);
          console.log('🔍 BEFORE ADD: day.recipes.length =', existingRecipes.length);
          
          const updatedDay = {
            ...day,
            recipes: [...existingRecipes, newRecipe]
          };
          
          console.log('🔍 AFTER ADD: updatedDay.recipes.length =', updatedDay.recipes.length);
          return updatedDay;
        } else {
          console.log(`❌ NO MATCH: day ${day.id} !== ${dayId}`);
        }
        return day;
      });

      // Update the meal plan
      console.log('🔍 FINAL MEAL PLAN AFTER MAP:', updatedMealPlan.map(day => ({
        id: day.id,
        name: day.name,
        recipesCount: day.recipes?.length || 0,
        recipeTitles: day.recipes?.map(r => r.title) || []
      })));
      
      setCurrentMealPlan(updatedMealPlan);
      
      // � DEBUG: Check what's being saved
      console.log('🔍 SAVE DEBUG - Updated meal plan recipe count:', updatedMealPlan[0]?.recipes?.length);
      console.log('🔍 SAVE DEBUG - Recipe titles:', updatedMealPlan[0]?.recipes?.map(r => r.title));
      
      // �🔄 COMPATIBILITY: For saving, put day.recipes into breakfast meal (replace, don't append)
      const saveCompatibleMealPlan = updatedMealPlan.map(day => ({
        ...day,
        meals: day.meals.map(meal => 
          meal.id === 'breakfast-1' 
            ? { ...meal, recipes: day.recipes || [] } // REPLACE breakfast recipes with current day.recipes
            : meal
        )
      }));
      
      await saveLocalMealPlan(saveCompatibleMealPlan);

      // Show gentle success notification
      showToastNotification('Added ✓');
      setSelectedRecipeForPlan(null);
      
    } catch (error) {
      console.error('❌ Error adding recipe to day:', error);
      Alert.alert('Error', 'Failed to add recipe to day');
    }
  };

  // 🎯 UNIFIED: Single function to add recipes to meal plans
  const addRecipeToMealPlan = async (dayId, mealIdentifier) => {
    try {
      if (!selectedRecipeForPlan) {
        Alert.alert('Error', 'No recipe selected');
        return;
      }

      // 🔧 Ensure we have a local meal plan (local-first approach)
      if (!currentMealPlan || currentMealPlan.length === 0) {
        console.log('🎯 No meal plan - creating default local meal plan');
        setCurrentMealPlan(getDefaultMealPlan());
        // Give React a moment to update state
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Prevent multiple simultaneous updates
      if (isUpdatingMealPlan) {
        console.log('⚠️ Meal plan update already in progress, skipping');
        return;
      }

      console.log('🎯 Adding recipe to meal plan:', {
        recipe: selectedRecipeForPlan.title,
        dayId: dayId,
        mealIdentifier: mealIdentifier,
        currentPlanId: currentPlanId
      });

      setIsUpdatingMealPlan(true); // Prevent concurrent updates

      // Find the day and meal in the current meal plan
      const updatedMealPlan = currentMealPlan.map(day => {
        if (day.id === dayId || day.id === `day-${dayId}`) {
          // Found the matching day, update the meal
          const updatedMeals = day.meals.map(meal => {
            // Check if this is the target meal using meal.id
            if (meal.id === mealIdentifier) {
              // Found the matching meal, check if recipe already exists
              const existingRecipes = meal.recipes || [];
              const recipeExists = existingRecipes.some(r => r.id === selectedRecipeForPlan.id);
              
              if (recipeExists) {
                console.log('⚠️ Recipe already exists in this meal slot, skipping duplicate');
                return meal; // Return unchanged if recipe already exists
              }
              
              // Create comprehensive recipe object
              const newRecipe = {
                id: selectedRecipeForPlan.id,
                title: selectedRecipeForPlan.title,
                name: selectedRecipeForPlan.title,
                isCompleted: false,
                source: 'mobile_add',
                addedAt: Date.now()
              };
              
              console.log(`✅ Adding recipe to meal ${meal.name || meal.id}. Current recipes:`, existingRecipes.length);
              
              return {
                ...meal,
                recipes: [...existingRecipes, newRecipe]
              };
            }
            return meal;
          });
          
          return {
            ...day,
            meals: updatedMeals
          };
        }
        return day;
      });

      // Check if the recipe was actually added (not a duplicate)
      const wasAdded = updatedMealPlan.some(day => 
        day.meals.some(meal => 
          meal.recipes && meal.recipes.some(r => 
            r.id === selectedRecipeForPlan.id && r.addedAt
          )
        )
      );

      if (!wasAdded) {
        // Recipe was already in the meal plan
        setIsUpdatingMealPlan(false);
        setShowMealPlanModal(false);
        Alert.alert(
          'Recipe Already Added',
          `"${selectedRecipeForPlan.title}" is already in this meal slot.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedRecipeForPlan(null);
              }
            }
          ]
        );
        return;
      }

      // Update local state first for immediate UI feedback
      setCurrentMealPlan(updatedMealPlan);
      console.log('✅ Local state updated');

      // 🔄 Save to AsyncStorage for cross-screen sharing
      await saveLocalMealPlan(updatedMealPlan);

      // 🎯 Handle saving based on whether this is a new or existing plan
      if (currentPlanId) {
        console.log('� Existing saved plan detected - updating backend...');
        try {
          const updateResult = await MealPlanAPI.updateMealPlan(currentPlanId, updatedMealPlan);
          if (updateResult && updateResult.success) {
            console.log('✅ Meal plan updated successfully in backend');
          } else {
            console.error('⚠️ Backend update failed, but local changes saved');
            Alert.alert(
              'Saved Locally',
              `Recipe added to meal plan! Backend sync failed, but changes are saved locally.`
            );
          }
        } catch (saveError) {
          console.error('⚠️ Failed to update backend:', saveError);
          Alert.alert(
            'Saved Locally', 
            `Recipe added to meal plan! You can sync to backend later from the Meal Plan screen.`
          );
        }
      } else {
        console.log('📝 New local meal plan - recipe added successfully');
      }

      // Close modal and show success
      setShowMealPlanModal(false);
      setIsUpdatingMealPlan(false);
      
      Alert.alert(
        'Added to Meal Plan!',
        `"${selectedRecipeForPlan.title}" has been added to your meal plan.\n\n${currentPlanId ? 'Changes synced to saved plan.' : 'Visit the Meal Plan tab to save when ready.'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedRecipeForPlan(null);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('🚨 Error adding recipe to meal plan:', error);
      setIsUpdatingMealPlan(false);
      Alert.alert('Error', 'Failed to add recipe to meal plan: ' + error.message);
    }
  };

  // 📚 Category management functions - OPTIMIZED for performance
  const getCategoryRecipes = (categoryId, recipesToFilter = null) => {
    try {
      const safeRecipes = recipesToFilter || filteredRecipes || [];
      
      // Removed excessive logging for performance
      
      if (categoryId === 'all') {
        return safeRecipes;
      }
    
    if (categoryId === 'recent-imports') {
      // Show most recently created recipes (last 30 days or top 20 most recent)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentRecipes = safeRecipes.filter(recipe => {
        const createdDate = recipe.created_at ? new Date(recipe.created_at) : null;
        return createdDate && createdDate > thirtyDaysAgo;
      });
      
      // If less than 10 recent recipes, show the 20 most recently created overall
      if (recentRecipes.length < 10) {
        return safeRecipes
          .filter(recipe => recipe.created_at)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 20);
      }
      
      // Sort by creation date (newest first)
      return recentRecipes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    if (categoryId === 'favorites') {
      // Since is_favorite doesn't exist, use confidence_score as proxy
      return safeRecipes.filter(recipe => 
        recipe.confidence_score && recipe.confidence_score >= 80
      );
    }
    
    if (categoryId === 'quick') {
      // Use prep_time and cook_time fields that actually exist
      return safeRecipes.filter(recipe => {
        const prepTime = recipe.prep_time || '';
        const cookTime = recipe.cook_time || '';
        const timeStr = `${prepTime} ${cookTime}`.toLowerCase();
        
        return timeStr.includes('30 min') || 
               timeStr.includes('20 min') || 
               timeStr.includes('15 min') ||
               timeStr.includes('quick') ||
               timeStr.includes('fast');
      });
    }
    
    if (categoryId === 'one-pot') {
      return safeRecipes.filter(recipe => {
        const title = (recipe.title || '').toLowerCase();
        const description = (recipe.description || '').toLowerCase();
        
        return title.includes('one-pot') || 
               title.includes('one pot') ||
               description.includes('one-pot') ||
               description.includes('one pot');
      });
    }
    
    // Standard meal categories - use title-based detection since meal_role doesn't exist
    return safeRecipes.filter(recipe => {
      const title = (recipe.title || '').toLowerCase();
      const description = (recipe.description || '').toLowerCase();
      const source = (recipe.source || '').toLowerCase();
      
      switch (categoryId) {
        case 'breakfast':
          return title.includes('breakfast') || 
                 title.includes('morning') ||
                 title.includes('pancake') ||
                 title.includes('waffle') ||
                 title.includes('cereal') ||
                 title.includes('oatmeal') ||
                 description.includes('breakfast');
                 
        case 'lunch':
          return title.includes('lunch') || 
                 title.includes('sandwich') ||
                 title.includes('salad') ||
                 title.includes('wrap') ||
                 description.includes('lunch');
                 
        case 'dinner':
          // ?? MATCH WEB APP LOGIC: Default main dishes to dinner
          const isBreakfast = title.includes('breakfast') || title.includes('morning') || title.includes('pancake') || title.includes('waffle') || description.includes('breakfast');
          const isLunch = title.includes('lunch') || title.includes('sandwich') || title.includes('salad') || title.includes('wrap') || description.includes('lunch');
          const isDessert = title.includes('dessert') || title.includes('cake') || title.includes('cookie') || title.includes('pie') || title.includes('chocolate') || title.includes('sweet') || description.includes('dessert');
          
          // If it's not breakfast, lunch, or dessert, it's probably dinner (like web app)
          const isDinner = !isBreakfast && !isLunch && !isDessert;
          
          // console.log(`?+ DINNER LOGIC for "${title}": isDinner=${isDinner}`); // Removed verbose logging
          
          return isDinner;
                 
        case 'desserts':
          return title.includes('dessert') || 
                 title.includes('cake') ||
                 title.includes('cookie') ||
                 title.includes('pie') ||
                 title.includes('chocolate') ||
                 title.includes('sweet') ||
                 title.includes('sugar') ||
                 title.includes('cream') ||
                 description.includes('dessert');
                 
        default:
          return false;
      }
    });
    } catch (error) {
      // Simplified error handling for performance
      return [];
    }
  };

  const getCategoryWithCount = (category) => {
    try {
      const categoryRecipes = getCategoryRecipes(category.id) || [];
      
      // Removed debug logging for performance
      
      return {
        ...category,
        count: categoryRecipes.length
      };
    } catch (error) {
      // Simplified error handling for performance
      return {
        ...category,
        count: 0
      };
    }
  };

  // useEffect to update categories when recipes or search changes - debounced for performance
  useEffect(() => {
    // Debounce expensive category calculations
    const timeoutId = setTimeout(() => {
      // Calculate filteredRecipes locally in useEffect to avoid dependency issues
      const currentFilteredRecipes = (recipes || []).filter(recipe => {
        // First filter by search query
        const matchesSearch = !searchQuery || 
          (recipe.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (recipe.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (recipe.source || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        // Then filter out hidden recipes
        const notHidden = !hiddenRecipeIds.has(recipe.id);
        
        return matchesSearch && notHidden;
      });
      
      // ?? SAFETY: Don't calculate until we have valid recipes
      if (!currentFilteredRecipes || !Array.isArray(currentFilteredRecipes) || currentFilteredRecipes.length === 0) {
        const zeroCategories = defaultCategories.map(cat => ({ ...cat, count: 0 }));
        // console.log('?? SETTING ZERO CATEGORIES - about to update state');
        
        // Use setTimeout to defer state update and prevent batching issues
        setTimeout(() => {
          setCategoriesWithCounts(zeroCategories);
          // console.log('?? ZERO CATEGORIES state updated');
        }, 0);
        
        return;
      }
      
      try {
        // Create a local getCategoryWithCount function that uses currentFilteredRecipes
        const getCategoryWithCountLocal = (category) => {
          try {
            const categoryRecipes = getCategoryRecipes(category.id, currentFilteredRecipes);
            return {
              ...category,
              count: categoryRecipes ? categoryRecipes.length : 0
            };
          } catch (error) {
            return {
              ...category,
              count: 0
            };
          }
        };
        
        const result = defaultCategories.map(getCategoryWithCountLocal);
        // DISABLED: Extensive debugging
        // console.log('?? CALCULATED CATEGORIES - structure:', JSON.stringify(result.map(c => ({
        //   id: c.id,
        //   name: c.name,
        //   icon: c.icon,
        //   color: c.color,
        //   count: c.count,
        //   nameType: typeof c.name,
        //   iconType: typeof c.icon,
        //   colorType: typeof c.color,
        //   countType: typeof c.count,
        //   allProps: Object.keys(c)
        // })), null, 2));
        
        // console.log('?? ABOUT TO CALL setCategoriesWithCounts - current state type:', typeof categoriesWithCounts);
        // console.log('?? ABOUT TO CALL setCategoriesWithCounts - new data valid:', result.every(c => 
        //   typeof c.name === 'string' && 
        //   typeof c.icon === 'string' && 
        //   typeof c.color === 'string' && 
        //   typeof c.count === 'number'
        // ));
        
        // Use setTimeout to defer state update and prevent batching issues
        setTimeout(() => {
          setCategoriesWithCounts(result);
          // console.log('?? CALCULATED CATEGORIES state updated');
        }, 0);
      } catch (error) {
        setCategoriesWithCounts(defaultCategories.map(cat => ({ ...cat, count: 0 }))); // Re-enabled
      }
    }, 100); // 100ms debounce to avoid excessive calculations
    
    return () => clearTimeout(timeoutId);
  }, [recipes, searchQuery, hiddenRecipeIds]); // Run when underlying data changes, not computed filteredRecipes

  const selectCategory = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  const goBackToCategories = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const filteredRecipes = useMemo(() => {
    const result = (recipes || []).filter(recipe => {
      if (!searchQuery) return true; // If no search query, return all recipes
      
      return (recipe.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (recipe.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (recipe.source || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    return result;
  }, [recipes, searchQuery]);

  // Get recipes for currently selected category with safety check - MEMOIZED for performance
  const displayRecipes = useMemo(() => {
    if (!selectedCategory) return [];
    
    let categoryRecipes = getCategoryRecipes(selectedCategory) || [];
    
    // Filter out hidden recipes
    categoryRecipes = categoryRecipes.filter(recipe => !hiddenRecipeIds.has(recipe.id));
    
    // Apply search filter if there's a search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      categoryRecipes = categoryRecipes.filter(recipe =>
        (recipe.title && recipe.title.toLowerCase().includes(query)) ||
        (recipe.description && recipe.description.toLowerCase().includes(query)) ||
        (recipe.ingredients && recipe.ingredients.toLowerCase().includes(query)) ||
        (recipe.source && recipe.source.toLowerCase().includes(query))
      );
    }
    
    // Limit initial render to first 100 recipes for better performance
    return categoryRecipes.slice(0, 100);
  }, [selectedCategory, searchQuery, recipes, hiddenRecipeIds]); // Re-calculate when category, search, recipes, or hidden recipes change

  // Check loading and recipes state occasionally
  // console.log('?? Component state - isLoading:', isLoading, 'recipes count:', recipes.length);

  if (isLoading) {
    // console.log('?? STUCK IN LOADING STATE - isLoading is true');
    return (
      <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.overlay} />
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={[styles.loadingText, styles.whiteText]}>Loading your recipes...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // Main content render

  // Main component render
  return (
    <ImageBackground 
      source={SELECTED_BACKGROUND} 
      style={styles.backgroundImage} 
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      {/* White overlay removed to show mint background */}
      
      {/* Top status bar background */}
      <View style={styles.topStatusBarOverlay} />
      
      {/* 🍞 Gentle Mint Toast - Bottom positioned for calm UX */}
      {showToast && (
        <Animated.View 
          style={[
            styles.simpleToast,
            {
              opacity: toastAnimation,
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0], // Gentle slide up from bottom
                }),
              }],
            }
          ]}
        >
          <Text style={styles.simpleToastText}>{toastMessage}</Text>
        </Animated.View>
      )}
      
      {/* Header positioned outside problematic container */}
      {selectedCategory && (
        <View style={{
          position: 'absolute', 
          top: 60, // Below status bar
          left: 16, 
          right: 16, 
          zIndex: 9999, 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity 
              style={{marginRight: 12}} 
              onPress={goBackToCategories}
            >
              <Text style={{
                color: '#3B82F6', 
                fontSize: 16,
                fontFamily: 'Nunito-Regular',
                fontWeight: '600'
              }}>← Categories</Text>
            </TouchableOpacity>
            <Text style={{
              fontSize: 18, 
              color: '#111827', 
              flex: 1,
              fontFamily: 'Nunito-ExtraBold'
            }}>
              {(() => {
                const category = (categoriesWithCounts || []).find(c => c.id === selectedCategory);
                const categoryName = category?.name;
                return typeof categoryName === 'string' ? categoryName : 'Recent Imports';
              })()}
            </Text>
          </View>
        </View>
      )}
      
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent={true}
          animated={true}
        />
        
        {/* Search positioned outside problematic innerContainer */}
        {selectedCategory && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            marginHorizontal: 16,
            marginTop: 70, // REDUCED from 72 to create smaller gap
            marginBottom: 8,
            padding: 12,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            zIndex: 100,
          }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: '#ffffff',
                color: '#374151',
                fontFamily: 'Nunito-Regular', // Added proper font
              }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search recipes..."
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
        
        <TouchableWithoutFeedback onPress={() => setShowBottomSheet(null)}>
          <View style={styles.innerContainer}>
            {/* Header moved outside for testing */}
            {/* Original header removed for testing */}

            {/* Original search removed - moved outside problematic container */}

            <ScrollView style={styles.mainContent}>
              {/* Recipe import section */}
              {!selectedCategory && (
                <View style={styles.importCard}>
                  <Text style={styles.importTitle}>Import Recipe from URL</Text>
                  <View style={styles.importInputContainer}>
                    <TextInput
                      style={styles.importInput}
                      value={importUrl}
                      onChangeText={setImportUrl}
                      placeholder="Add URL here"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                    <TouchableOpacity
                      style={[styles.importButton, isImporting && styles.importButtonDisabled]}
                      onPress={importRecipeFromUrl}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.importButtonText}>Import</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {(() => {
                return !selectedCategory ? (
                  // Category Grid View
                  <View style={styles.categoryGrid}>
                    {(() => {
                      const categoriesToRender = (categoriesWithCounts && Array.isArray(categoriesWithCounts) ? categoriesWithCounts : []);
                      
                      if (categoriesToRender.length === 0) {
                        return <Text style={{ color: 'white' }}>No categories available</Text>;
                      }
                      
                      return categoriesToRender.map((category, index) => {
                        return (
                          <TouchableOpacity
                            key={category?.id || `category-${index}`}
                            style={[styles.categoryCard, { borderLeftColor: category?.color || '#6B7280' }]}
                            onPress={() => selectCategory(category?.id)}
                          >
                            <View style={styles.categoryCardContent}>
                              <Text style={styles.categoryIcon}>
                                {safeTextRender(category?.icon, '📚')}
                              </Text>
                              <View style={styles.categoryInfo}>
                                <Text style={styles.categoryName}>
                                  {safeTextRender(category?.name, 'Unknown')}
                                </Text>
                                <Text style={styles.categoryCount}>
                                  {(() => {
                                    const count = category?.count || 0;
                                    const countText = `${count} recipe${count !== 1 ? 's' : ''}`;
                                    return safeTextRender(countText, '0 recipes');
                                  })()}
                                </Text>
                              </View>
                              <Text style={styles.categoryArrow}>{'>'}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>
                ) : (
                  // Recipe List View - RESTORED (PERFORMANCE OPTIMIZED)
                  <View style={styles.recipeGrid}>
                    {displayRecipes.map((recipe, index) => (
                      <TouchableOpacity
                        key={recipe.id || index}
                        style={styles.recipeCard}
                        onPress={() => openRecipe(recipe)}
                      >
                        <View style={styles.recipeContent}>
                          <View style={styles.recipeHeader}>
                            <TouchableOpacity 
                              style={styles.recipeTitleContainer}
                              onPress={() => openRecipe(recipe)}
                            >
                              <Text style={styles.recipeTitle}>{recipe.title || 'Untitled Recipe'}</Text>
                            </TouchableOpacity>
                            
                            {/* Options Menu Button */}
                            <TouchableOpacity
                              style={styles.optionsButton}
                              activeOpacity={0.7}
                              onPress={(e) => {
                                console.log('? Button pressed for recipe:', recipe.id);
                                e.stopPropagation();
                                setShowBottomSheet(showBottomSheet === recipe.id ? null : recipe.id);
                              }}
                            >
                              <Text style={styles.optionsIcon}>⋮</Text>
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.recipeMainContent}
                            onPress={() => openRecipe(recipe)}
                          >
                            {recipe.description && (
                              <Text style={styles.recipeDescription} numberOfLines={2}>
                                {recipe.description}
                              </Text>
                            )}
                            
                            <View style={styles.recipeMetadata}>
                              {recipe.prep_time && typeof recipe.prep_time === 'string' && (
                                <Text style={styles.metadataItem}>⏱️ {recipe.prep_time}</Text>
                              )}
                              {recipe.servings && typeof recipe.servings !== 'number' && (
                                <Text style={styles.metadataItem}>👥 {recipe.servings}</Text>
                              )}
                              {recipe.servings && typeof recipe.servings === 'number' && (
                                <Text style={styles.metadataItem}>👥 {recipe.servings} servings</Text>
                              )}
                            </View>
                            
                            {recipe.source && (
                              <Text style={styles.recipeSource}>?? {recipe.source}</Text>
                            )}
                          </TouchableOpacity>

                          {/* Options menu replaced with bottom sheet */}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>

            {/* 📅 Meal Plan Selection Modal - USING REAL DATA */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={showMealPlanModal}
              onRequestClose={() => setShowMealPlanModal(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowMealPlanModal(false)}>
                <View style={styles.bottomSheetOverlay}>
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={styles.mealPlanModalContent}>
                      <View style={styles.bottomSheetHandle} />
                      
                      <Text style={styles.mealPlanModalTitle}>
                        Add "{selectedRecipeForPlan?.title}" to Meal Plan
                      </Text>
                      
                      <ScrollView style={styles.mealPlanDaysList} showsVerticalScrollIndicator={false}>
                        {currentMealPlan && currentMealPlan.length > 0 ? (
                          currentMealPlan.map((day, dayIndex) => (
                            <View key={day.id || dayIndex} style={styles.mealPlanDaySection}>
                              <Text style={styles.mealPlanDayTitle}>{day.name || `Day ${day.id || (dayIndex + 1)}`}</Text>
                              
                              {/* Show actual meals from current meal plan */}
                              {day.meals && day.meals.map((meal, mealIndex) => (
                                <TouchableOpacity
                                  key={`${day.id}-${meal.id}-${mealIndex}`}
                                  style={styles.mealPlanMealOption}
                                  onPress={() => {
                                    addRecipeToMealPlan(day.id || (dayIndex + 1).toString(), meal.id);
                                    setShowMealPlanModal(false);
                                  }}
                                >
                                  <View style={styles.mealPlanMealInfo}>
                                    <Text style={styles.mealPlanMealType}>
                                      {meal.name || 'Meal'} ({day.name || `Day ${day.id}`})
                                    </Text>
                                    {meal.recipes && meal.recipes.length > 0 ? (
                                      <Text style={styles.mealPlanCurrentRecipes}>
                                        Current: {meal.recipes.map(r => r.title || r.name).join(', ')}
                                      </Text>
                                    ) : (
                                      <Text style={styles.mealPlanEmptySlot}>Empty slot</Text>
                                    )}
                                  </View>
                                  <Ionicons name="add-circle-outline" size={20} color="#059669" />
                                </TouchableOpacity>
                              ))}
                            </View>
                          ))
                        ) : (
                          // Empty state fallback
                          <View style={styles.mealPlanEmptyState}>
                            <Text style={styles.mealPlanEmptyTitle}>No Meal Plan Found</Text>
                            <Text style={styles.mealPlanEmptyText}>
                              Create a meal plan first to add recipes to it.
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                      
                      <TouchableOpacity
                        style={[styles.bottomSheetButton, styles.cancelButton]}
                        onPress={() => setShowMealPlanModal(false)}
                      >
                        <Text style={styles.bottomSheetButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
            
            {/* Recipe Options Modal - Reusable component */}
            <RecipeOptionsModal
              visible={showBottomSheet !== null}
              onClose={() => setShowBottomSheet(null)}
              recipe={displayRecipes.find(r => r.id === showBottomSheet)}
              onAddToMealPlan={(recipe) => handleAddToMealPlan(recipe)}
              onShare={(recipe) => handleShareRecipe(recipe)}
              onDelete={(recipe) => handleDeleteRecipe(recipe)}
              showShare={true}
              showAddToMealPlan={true}
              showDelete={true}
            />

            {/* 📅 Smart Day Selection Modal */}
            <DaySelectionModal
              visible={showDaySelection}
              onClose={() => setShowDaySelection(false)}
              onSelectDay={handleDaySelected}
              availableDays={availableDays}
              recipe={selectedRecipeForDay}
            />

            {/* Recipe Sharing Modal */}
            <RecipeSharingModal
              visible={showSharingModal}
              recipe={selectedRecipeForSharing}
              onClose={() => {
                setShowSharingModal(false);
                setSelectedRecipeForSharing(null);
              }}
              onShare={async (shareData) => {
                console.log('🔄 Sharing recipe to community:', {
                  recipe_id: selectedRecipeForSharing?.id,
                  community_title: shareData.community_title,
                  community_description: shareData.community_description
                });
                
                try {
                  // Call the sharing API
                  const result = await YesChefAPI.shareRecipe(selectedRecipeForSharing.id, shareData);
                  
                  if (result.success) {
                    console.log('✅ Recipe shared successfully!');
                    setShowSharingModal(false);
                    setSelectedRecipeForSharing(null);
                    Alert.alert('Success', 'Recipe shared to community successfully!');
                  } else {
                    console.error('❌ Failed to share recipe:', result.error);
                    throw new Error(result.error);
                  }
                } catch (error) {
                  console.error('❌ Failed to share recipe:', error);
                  throw error; // Re-throw so modal can handle it
                }
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </ImageBackground>
  );

  // DISABLED: Component render state debugging
  // console.log('?? COMPONENT RENDER - categoriesWithCounts state:', {
  //   type: typeof categoriesWithCounts,
  //   isArray: Array.isArray(categoriesWithCounts),
  //   length: categoriesWithCounts?.length,
  //   isEmpty: !categoriesWithCounts || categoriesWithCounts.length === 0,
  //   firstCategory: categoriesWithCounts?.[0] ? {
  //     id: categoriesWithCounts[0].id,
  //     name: categoriesWithCounts[0].name,
  //     nameType: typeof categoriesWithCounts[0].name,
  //     icon: categoriesWithCounts[0].icon,
  //     iconType: typeof categoriesWithCounts[0].icon,
  //     allProps: Object.keys(categoriesWithCounts[0])
  //   } : 'NO_FIRST_CATEGORY'
  // });

  // ?? SAFETY: Don't render if categoriesWithCounts is in invalid state
  // TEMPORARILY DISABLED TO TEST IF THIS CAUSES THE ERROR
  /*
  if (!categoriesWithCounts || !Array.isArray(categoriesWithCounts) || categoriesWithCounts.length === 0) {
    console.log('?? SAFETY: Rendering fallback due to invalid categoriesWithCounts');
    return (
      <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.overlay} />
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={[styles.loadingText, styles.whiteText]}>Loading categories...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }
  */

  return (
    <ImageBackground 
      source={SELECTED_BACKGROUND} 
      style={styles.backgroundImage} 
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      {/* ?? Top Status Bar Background (Clean Header for Phone Status) */}
      <View style={styles.topStatusBarOverlay} />
      
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent={true}
          animated={true}
        />
      <TouchableWithoutFeedback onPress={() => setShowOptionsMenu(null)}>
        <View style={styles.innerContainer}>
          {/* Header - Only show when in category view */}
          {selectedCategory && (
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity style={styles.backButton} onPress={goBackToCategories}>
                  <Text style={styles.backButtonText}>← Categories</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                  {(() => {
                    const category = (categoriesWithCounts || []).find(c => c.id === selectedCategory);
                    const categoryName = category?.name;
                    return typeof categoryName === 'string' ? categoryName : 'Recipes';
                  })()}
                </Text>
              </View>
            </View>
          )}

          {/* TEMPORARILY DISABLED TO TEST IF THIS CAUSES THE ERROR */}
          {/*
          {!selectedCategory && (
            <View style={styles.importCard}>
              <Text style={styles.importTitle}>Import Recipe from URL</Text>
              <View style={styles.importInputContainer}>
                <TextInput
                  style={styles.importInput}
                  value={importUrl}
                  onChangeText={setImportUrl}
                  placeholder="Add URL here"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity
                  style={[styles.importButton, isImporting && styles.importButtonDisabled]}
                  onPress={importRecipeFromUrl}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.importButtonText}>Import</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          */}      {/* Search - show when viewing recipes in a category */}
      {selectedCategory && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recipes..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      )}

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {(() => {
          return !selectedCategory ? (
          // Category Grid View
          <View style={styles.categoryGrid}>
            <Text style={styles.loadingText}>Categories will appear here</Text>
          </View>
          ) : (
          // Recipe List View
          <View style={styles.recipeListContainer}>
            {(displayRecipes || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>No Recipes Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `No recipes match "${searchQuery}" in this category.`
                    : "This category doesn't have any recipes yet."
                  }
                </Text>
              </View>
            ) : (
              (displayRecipes || []).map((recipe) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <View style={styles.recipeContent}>
                    <View style={styles.recipeHeader}>
                      <TouchableOpacity 
                        style={styles.recipeTitleContainer}
                        onPress={() => openRecipe(recipe)}
                      >
                        <Text style={styles.recipeTitle}>{recipe.title || 'Untitled Recipe'}</Text>
                      </TouchableOpacity>
                      
                      {/* Options Menu Button */}
                      <TouchableOpacity
                        style={styles.optionsButton}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          console.log('?? BUTTON TOUCHED!!! Recipe ID:', recipe.id);
                          e.stopPropagation(); // Prevent parent touch
                          console.log('?? 3-dot pressed, setting bottom sheet for recipe:', recipe.id);
                          setShowBottomSheet(showBottomSheet === recipe.id ? null : recipe.id);
                        }}
                      >
                        <Text style={styles.optionsIcon}>⋮</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Options menu replaced with bottom sheet */}
                    
                    {/* Recipe Content - Also tappable */}
                    <TouchableOpacity 
                      style={styles.recipeDetailsSection}
                      onPress={() => openRecipe(recipe)}
                    >
                      {recipe.description && (
                        <Text style={styles.recipeDescription} numberOfLines={2}>
                          {recipe.description}
                        </Text>
                      )}
                      
                      <View style={styles.recipeMetadata}>
                        {recipe.prep_time && typeof recipe.prep_time === 'string' && (
                          <Text style={styles.metadataItem}>⏱️ {recipe.prep_time}</Text>
                        )}
                        {recipe.servings && typeof recipe.servings !== 'number' && (
                          <Text style={styles.metadataItem}>👥 {recipe.servings}</Text>
                        )}
                        {recipe.servings && typeof recipe.servings === 'number' && (
                          <Text style={styles.metadataItem}>👥 {recipe.servings} servings</Text>
                        )}
                      </View>
                      
                      {recipe.source && (
                        <Text style={styles.recipeSource}>?? {recipe.source}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        );
        })()}
      </ScrollView>

      {/* Meal Plan Selection Modal */}
      <Modal
        visible={showMealPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMealPlanModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMealPlanModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.mealPlanModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add to Meal Plan</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowMealPlanModal(false)}
                  >
                    <Text style={styles.modalCloseText}>?</Text>
                  </TouchableOpacity>
                </View>
            
            <Text style={styles.selectedRecipeText}>
              "{selectedRecipeForPlan?.title}"
            </Text>
            
            {/* Debug info */}
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Meal plan loaded: {currentMealPlan ? `${currentMealPlan.length} days` : 'None'}
              </Text>
              <TouchableOpacity 
                style={styles.reloadButton}
                onPress={loadCurrentMealPlan}
              >
                <Text style={styles.reloadButtonText}>?? Reload</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.mealPlanContent}>
              {!currentMealPlan || currentMealPlan.length === 0 ? (
                <View style={styles.emptyMealPlan}>
                  <Text style={styles.emptyMealPlanText}>Loading meal plan...</Text>
                  <Text style={styles.emptyMealPlanSubtext}>
                    If this persists, make sure you have a meal plan created.
                  </Text>
                </View>
              ) : (
                currentMealPlan.map((day) => (
                  <View key={day.id} style={styles.daySection}>
                    <Text style={styles.dayTitle}>{day.name}</Text>
                    
                    {day.meals && day.meals.map((meal) => (
                      <TouchableOpacity
                        key={meal.id}
                        style={styles.mealOption}
                        onPress={() => addRecipeToMealPlan(day.id, meal.id)}
                      >
                        <Text style={styles.mealIcon}>?+</Text>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealRecipeCount}>
                          ({(meal.recipes || []).length} recipe{(meal.recipes || []).length !== 1 ? 's' : ''})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
    
    </ImageBackground>
  );
  
  } catch (error) {
    console.error('Component render error:', error);
    return (
      <ImageBackground 
        source={SELECTED_BACKGROUND} 
        style={{ flex: 1 }} 
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 18 }}>Error loading recipes...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }
};

export default React.memo(RecipeCollectionScreen);

const styles = StyleSheet.create({
  // Background and Overlay Styles
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Light overlay to let mint background show through
    zIndex: 1,
  },
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent', // Let mint background show through
    zIndex: 2,
  },
  whiteText: {
    color: '#ffffff',
  },
  
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed from '#f9fafb' to transparent
    paddingTop: 10, // Match GroceryListScreen padding
    zIndex: 2, // Above overlay
  },
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    backgroundColor: 'transparent', // Let mint background show through
    zIndex: 10,
  },
  
  // Header Card Styles
  headerCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent', // Let mint background show through
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'visible', // Ensure content isn't clipped
    zIndex: 1000, // MUCH higher than topStatusBarOverlay (10)
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  basicText: {
    fontSize: 16,
    color: '#000000',
    // NO fontFamily, NO fontWeight - use system default
  },
  searchCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,  // ? FIXED: Changed from 16 to 20 to match other screens
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 18, // Increased size for visibility
    fontFamily: 'Nunito-Regular',
    color: '#FF0000', // RED for debugging
    backgroundColor: '#FFFF00', // YELLOW background for debugging
    // Removed all font properties to test system font
  },
  headerTitle: {
    fontSize: 20, // Increased size for visibility
    color: '#FF0000', // RED for debugging
    fontFamily: 'Nunito-ExtraBold',
    backgroundColor: '#00FF00', // GREEN background for debugging
    flex: 1,
    // Removed all font properties to test system font
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
  importCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16, // Better spacing like other screens
    marginTop: 0, // Proper spacing from status bar
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  importTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  importInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  importInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    backgroundColor: '#f9fafb',
  },
  importButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 30,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
  },
  mainContent: {
    flex: 1,
    marginTop: 0, // Consistent with other screens for proper status bar spacing
    // Removed extra padding - content should flow naturally
  },
  // ?? Category Grid Styles
  categoryGrid: {
    padding: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18, // Back to normal size
    fontFamily: 'Nunito-ExtraBold',
    // fontWeight: 'bold', // REMOVED - conflicts with ExtraBold
    color: '#111827',
    marginBottom: 4,
    includeFontPadding: false,
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  categoryArrow: {
    fontSize: 20,
    fontFamily: 'Nunito-Regular',
    color: '#9ca3af',
  },
  // ?? Recipe List Container
  recipeListContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    // fontWeight: 'bold', // REMOVED - conflicts with ExtraBold
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  recipeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white like GroceryList
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'visible', // Allow options menu to overflow
  },
  recipeGrid: {
    paddingVertical: 16,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  recipeContent: {
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    // fontWeight: 'bold', // REMOVED - conflicts with ExtraBold
    color: '#111827',
    textAlign: 'left',
    includeFontPadding: false,
  },
  recipeDetailsSection: {
    // Separate touchable area for recipe content
  },
  optionsButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  optionsIcon: {
    fontSize: 18,
    color: '#374151',
    fontWeight: 'bold',
  },
  optionsMenu: {
    position: 'absolute',
    top: 25, // Higher up to show both menu items
    right: 10, // More space from edge
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 9999,
    minWidth: 130, // Wider to fit "Delete" text
    maxWidth: 150,
    // Ensure menu content is not clipped
    overflow: 'visible',
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48, // Better touch target
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  optionsMenuIcon: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    marginRight: 8,
  },
  optionsMenuText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    flex: 1,
  },
  deleteMenuText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#dc2626',
    flex: 1,
  },
  recipeDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metadataItem: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginRight: 16,
    marginBottom: 4,
  },
  recipeSource: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // ?? Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mealPlanModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    // fontWeight: 'bold', // REMOVED - conflicts with ExtraBold
    color: '#111827',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6b7280',
  },
  selectedRecipeText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  mealPlanContent: {
    maxHeight: 400,
  },
  daySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  mealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  mealName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  mealRecipeCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Debug and Empty States
  debugInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  reloadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  reloadButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyMealPlan: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMealPlanText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMealPlanSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  // ?? Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bottomSheetButtonIcon: {
    marginRight: 12,
  },
  bottomSheetButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  cancelButton: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    justifyContent: 'center',
    marginTop: 8,
  },
  
  // 📅 Meal Plan Modal Styles
  mealPlanModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mealPlanModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
    paddingTop: 16,
  },
  mealPlanDaysList: {
    maxHeight: 400,
  },
  mealPlanDaySection: {
    marginBottom: 20,
  },
  mealPlanDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 4,
  },
  mealPlanMealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mealPlanMealInfo: {
    flex: 1,
  },
  mealPlanMealType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  mealPlanCurrentRecipes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  mealPlanEmptySlot: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  mealPlanEmptyState: {
    padding: 40,
    alignItems: 'center',
  },
  mealPlanEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  mealPlanEmptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // 🍞 Gentle mint toast notification styles
  simpleToast: {
    position: 'absolute',
    bottom: 120, // Bottom positioning for calm feel
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9998,
  },
  simpleToastText: {
    backgroundColor: '#e6fffa', // Soft mint color (Tailwind teal-50)
    color: '#1f2937', // Gentle dark gray text
    fontSize: 15,
    fontWeight: '500', // Lighter weight for calm feel
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#a7f3d0', // Subtle mint border (Tailwind emerald-200)
    textAlign: 'center',
    overflow: 'hidden',
    // Soft shadow for subtle depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
