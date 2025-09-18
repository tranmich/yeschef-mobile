import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YesChefAPI from '../services/YesChefAPI';
import MealPlanAPI from '../services/MealPlanAPI';

export default function RecipeCollectionScreen({ navigation }) {
  // 🎨 Background Configuration (matches HomeScreen)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_green.jpg');
  
  // 🔧 Match exact categories from web app CookbookSidebar.js - MOVED TO TOP
  const defaultCategories = [
    { id: 'all', name: 'All Recipes', icon: '📚', color: '#6B7280' },
    { id: 'recent-imports', name: 'Recent Imports', icon: '📥', color: '#059669' },
    { id: 'breakfast', name: 'Breakfast', icon: '🍳', color: '#F59E0B' },
    { id: 'lunch', name: 'Lunch', icon: '🥗', color: '#10B981' },
    { id: 'dinner', name: 'Dinner', icon: '🍽️', color: '#3B82F6' },
    { id: 'desserts', name: 'Desserts', icon: '🍰', color: '#8B5CF6' },
    { id: 'one-pot', name: 'One-Pot', icon: '🥘', color: '#EF4444' },
    { id: 'quick', name: 'Quick', icon: '⚡', color: '#F97316' },
    { id: 'favorites', name: 'Favorites', icon: '⭐', color: '#EC4899' }
  ];

  console.log('🔧 defaultCategories defined:', defaultCategories.length, 'categories');

  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  // 🔧 Enhanced category system - sync with web app
  const [selectedCategory, setSelectedCategory] = useState(null); // null = show category list
  const [categoryOrder, setCategoryOrder] = useState([]);
  // 🔧 Add state for category counts to force updates
  const [categoriesWithCounts, setCategoriesWithCounts] = useState(() => {
    console.log('🔧 Initializing categoriesWithCounts state');
    return defaultCategories.map(cat => ({ ...cat, count: 0 }));
  });
  
  // 🆕 Meal Plan Integration
  const [currentMealPlan, setCurrentMealPlan] = useState(null);
  const [currentPlanId, setCurrentPlanId] = useState(null); // Track the plan ID we're working with
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null); // Track which recipe's menu is open
  const [isUpdatingMealPlan, setIsUpdatingMealPlan] = useState(false); // Prevent reload during update

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const result = await YesChefAPI.getRecipes();
      if (result.success) {
        setRecipes(result.recipes || []);
        console.log(`📚 Loaded ${result.recipes?.length || 0} recipes`);
        
        // 🔧 DEBUG: Log first few recipes to see their structure
        if (result.recipes && result.recipes.length > 0) {
          console.log('🔍 Sample recipe fields:', {
            firstRecipe: Object.keys(result.recipes[0]),
            sampleData: {
              title: result.recipes[0].title,
              name: result.recipes[0].name,
              category: result.recipes[0].category,
              meal_role: result.recipes[0].meal_role,
              imported_at: result.recipes[0].imported_at,
              prep_time: result.recipes[0].prep_time,
              cook_time: result.recipes[0].cook_time,
              total_time: result.recipes[0].total_time
            }
          });
          
          // 🔧 DEBUG: Test a few recipes to see if they have valid titles
          console.log('🔍 Recipe titles sample:', result.recipes.slice(0, 5).map(r => ({
            id: r.id,
            title: r.title,
            titleLength: (r.title || '').length,
            hasTitle: !!r.title
          })));
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to load recipes');
      }
    } catch (error) {
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
      const result = await YesChefAPI.importRecipe(importUrl.trim());
      if (result.success) {
        Alert.alert(
          'Success!', 
          `Recipe "${result.recipe.title}" imported successfully!`,
          [{ text: 'OK', onPress: () => {
            setImportUrl('');
            loadRecipes(); // Refresh the list
          }}]
        );
      } else {
        Alert.alert('Import Failed', result.error || 'Failed to import recipe');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error during import');
    } finally {
      setIsImporting(false);
    }
  };

  const openRecipe = (recipe) => {
    // Pass the full recipe object for faster loading, with fallback to ID
    navigation.navigate('RecipeDetail', { 
      recipe: recipe,
      recipeId: recipe.id 
    });
  };

  // 🆕 Meal Plan Integration Functions
  const loadCurrentMealPlan = async () => {
    if (isUpdatingMealPlan) {
      console.log('🚫 Skipping meal plan reload - update in progress');
      return;
    }
    
    try {
      console.log('🔄 Starting to load meal plan...');
      
      // First get the list of meal plans to find the default/current one
      const plansList = await MealPlanAPI.loadMealPlansList();
      console.log('📅 Available meal plans: count=' + (plansList?.plans?.length || 0));
      
      // Only auto-load if we don't already have a meal plan in progress
      if (plansList && plansList.plans && plansList.plans.length > 0 && 
          (!currentMealPlan || currentMealPlan.length === 0)) {
        // Use the first plan as the default, or find one marked as current
        const defaultPlan = plansList.plans[0];
        console.log('📅 Selected default plan:', defaultPlan.plan_name, '(ID:', defaultPlan.id + ')');
        
        // Load the actual meal plan data
        console.log('📅 Loading meal plan with ID:', defaultPlan.id);
        const result = await MealPlanAPI.loadMealPlan(defaultPlan.id);
        console.log('📅 Raw meal plan data response: success=' + (result?.success || false) + ', days=' + (result?.mobileDays?.length || 0));
        
        if (result && result.days) {
          console.log('✅ Found days in result:', result.days.length);
          setCurrentMealPlan(result.days);
          setCurrentPlanId(defaultPlan.id); // Track the plan ID
        } else if (result && result.mobileDays) {
          console.log('✅ Found mobileDays in result:', result.mobileDays.length);
          setCurrentMealPlan(result.mobileDays);
          setCurrentPlanId(defaultPlan.id); // Track the plan ID
        } else if (result) {
          console.log('⚠️ Result exists but checking for other possible structures...');
          console.log('📅 Result keys:', Object.keys(result));
          
          // Maybe the structure is different - let's check common alternatives
          if (result.mealPlan && result.mealPlan.days) {
            console.log('🔍 Found days in result.mealPlan.days');
            setCurrentMealPlan(result.mealPlan.days);
          } else if (result.data && result.data.days) {
            console.log('🔍 Found days in result.data.days');
            setCurrentMealPlan(result.data.days);
          } else {
            console.log('❌ No recognizable day structure found, using default');
            setCurrentMealPlan([{
              id: 1,
              name: 'Day 1',
              isExpanded: true,
              meals: [
                { id: 'breakfast-1', name: 'Breakfast', recipes: [] },
                { id: 'lunch-1', name: 'Lunch', recipes: [] },
                { id: 'dinner-1', name: 'Dinner', recipes: [] },
              ]
            }]);
          }
        }
      } else if (currentMealPlan && currentMealPlan.length > 0) {
        console.log('📅 Keeping existing meal plan with', currentMealPlan.length, 'days');
      } else {
        console.log('📅 No meal plans available - using default empty plan');
        setCurrentMealPlan(getDefaultMealPlan());
      }
    } catch (error) {
      console.error('❌ Error loading meal plan:', error);
      console.error('❌ Error details:', error.message, error.stack);
      // Set a default structure if loading fails
      console.log('🔄 Using fallback default meal plan');
      setCurrentMealPlan(getDefaultMealPlan());
    }
  };

  // Fallback default meal plan structure (matches MealPlanScreen)
  const getDefaultMealPlan = () => {
    return [
      {
        id: 1,
        name: 'Day 1',
        meals: [
          { id: 'breakfast-1', name: 'Breakfast', recipes: [] },
          { id: 'lunch-1', name: 'Lunch', recipes: [] },
          { id: 'dinner-1', name: 'Dinner', recipes: [] },
        ]
      }
    ];
  };

  const handleAddToMealPlan = useCallback((recipe) => {
    setSelectedRecipeForPlan(recipe);
    setShowOptionsMenu(null); // Close options menu
    setShowMealPlanModal(true);
    
    // Only load meal plan if we don't have it already or if it's empty
    if (!currentMealPlan || currentMealPlan.length === 0) {
      setTimeout(() => {
        loadCurrentMealPlan();
      }, 100);
    }
  }, [currentMealPlan, loadCurrentMealPlan]);

  const handleDeleteRecipe = async (recipe) => {
    try {
      Alert.alert(
        'Delete Recipe',
        `Are you sure you want to delete "${recipe.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await YesChefAPI.deleteRecipe(recipe.id);
              setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipe.id));
              setShowOptionsMenu(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      Alert.alert('Error', 'Failed to delete recipe');
    }
  };

  const addRecipeToMeal = async (dayId, mealId) => {
    try {
      if (!selectedRecipeForPlan) return;
      
      console.log(`📅 Starting to add "${selectedRecipeForPlan.title}" to Day ${dayId}, Meal ${mealId}`);
      setIsUpdatingMealPlan(true); // Prevent reloads during update
      
      // Create a new recipe object in the format expected by the meal plan
      const newRecipe = {
        id: selectedRecipeForPlan.id,
        title: selectedRecipeForPlan.title,
        isCompleted: false
      };
      
      console.log('🔄 Current meal plan before update: days=' + (currentMealPlan?.length || 0));
      
      // Update the local meal plan state
      const updatedMealPlan = currentMealPlan.map(day => {
        if (day.id === dayId) {
          console.log(`✅ Found target day ${dayId}, updating meals...`);
          return {
            ...day,
            meals: day.meals.map(meal => {
              if (meal.id === mealId) {
                console.log(`✅ Found target meal ${mealId}, adding recipe. Current recipes:`, meal.recipes.length);
                const updatedMeal = {
                  ...meal,
                  recipes: [...(meal.recipes || []), newRecipe]
                };
                console.log(`✅ Updated meal now has ${updatedMeal.recipes.length} recipes`);
                return updatedMeal;
              }
              return meal;
            })
          };
        }
        return day;
      });
      
      console.log('🔄 Updated meal plan: days=' + updatedMealPlan.length + ', total recipes=' + updatedMealPlan.reduce((total, day) => total + day.meals.reduce((mealTotal, meal) => mealTotal + (meal.recipes?.length || 0), 0), 0));
      
      // Update the local state first for immediate feedback
      setCurrentMealPlan(updatedMealPlan);
      console.log('✅ Local state updated');
      
      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to save the updated meal plan to backend
      try {
        console.log('💾 Updating meal plan in backend...');
        console.log('💾 Plan to update: ID=' + currentPlanId + ', with', updatedMealPlan.length, 'days');
        
        if (currentPlanId) {
          // Try to update the existing plan
          const updateResult = await MealPlanAPI.updateMealPlan(currentPlanId, updatedMealPlan);
          console.log('💾 Update result: success=' + (updateResult?.success || false));
          
          if (updateResult && updateResult.success) {
            console.log('✅ Meal plan updated successfully in backend');
          } else {
            console.error('❌ Update failed:', updateResult);
            // Check if it's a "not found" error - plan might have been deleted
            if (updateResult?.error?.includes('not found') || updateResult?.error?.includes('Meal plan not found')) {
              console.log('🔄 Meal plan not found - creating new plan instead');
              // Clear the invalid plan ID and create a new plan
              const fallbackResult = await MealPlanAPI.saveMealPlan(updatedMealPlan, 'My Meal Plan (Recovered)');
              if (fallbackResult && fallbackResult.success) {
                console.log('✅ Created new meal plan as fallback:', fallbackResult.planId);
                // Update the currentPlanId to the new plan
                // Note: You might want to pass this back to MealPlanScreen somehow
              } else {
                throw new Error('Failed to create fallback meal plan');
              }
            } else {
              throw new Error('Backend update returned failure');
            }
          }
        } else {
          // Fallback: save as new plan if no current plan ID
          const plansList = await MealPlanAPI.loadMealPlansList();
          if (plansList && plansList.plans && plansList.plans.length > 0) {
            const currentPlan = plansList.plans[0];
            const saveResult = await MealPlanAPI.saveMealPlan(updatedMealPlan, currentPlan.plan_name + ' (Updated)');
            console.log('💾 Fallback save result: success=' + (saveResult?.success || false) + ', newPlanId=' + saveResult?.plan_id);
            
            if (saveResult && saveResult.success) {
              console.log('✅ Meal plan saved successfully to backend');
              setCurrentPlanId(saveResult.plan_id); // Update our tracking
            } else {
              throw new Error('Backend save returned failure');
            }
          }
        }
      } catch (saveError) {
        console.error('⚠️ Failed to save to backend:', saveError);
        // Show a different message if save failed
        Alert.alert(
          'Warning',
          `Recipe was added locally but may not be saved. Error: ${saveError.message}`
        );
        setIsUpdatingMealPlan(false);
        setShowMealPlanModal(false);
        setSelectedRecipeForPlan(null);
        return; // Exit early if save failed
      }
      
      setIsUpdatingMealPlan(false); // Allow reloads again
      setShowMealPlanModal(false);
      setSelectedRecipeForPlan(null);
      
      Alert.alert(
        'Added to Meal Plan!',
        `"${selectedRecipeForPlan.title}" has been added to ${dayId === '1' ? 'Day 1' : `Day ${dayId}`}.\n\nSwitch to the Meal Plan tab to see it.`
      );
    } catch (error) {
      console.error('❌ Error adding recipe to meal plan:', error);
      setIsUpdatingMealPlan(false); // Reset flag on error
      Alert.alert('Error', 'Failed to add recipe to meal plan');
    }
  };

  // 🔧 Category management functions - OPTIMIZED for performance
  const getCategoryRecipes = (categoryId, recipesToFilter = null) => {
    try {
      const safeRecipes = recipesToFilter || filteredRecipes || [];
      
      // Removed excessive logging for performance
      
      if (categoryId === 'all') {
        return safeRecipes;
      }
    
    if (categoryId === 'recent-imports') {
      // Use created_at since imported_at doesn't exist
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return safeRecipes.filter(recipe => {
        const createdDate = recipe.created_at ? new Date(recipe.created_at) : null;
        return createdDate && createdDate > thirtyDaysAgo;
      });
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
          // 🔧 MATCH WEB APP LOGIC: Default main dishes to dinner
          const isBreakfast = title.includes('breakfast') || title.includes('morning') || title.includes('pancake') || title.includes('waffle') || description.includes('breakfast');
          const isLunch = title.includes('lunch') || title.includes('sandwich') || title.includes('salad') || title.includes('wrap') || description.includes('lunch');
          const isDessert = title.includes('dessert') || title.includes('cake') || title.includes('cookie') || title.includes('pie') || title.includes('chocolate') || title.includes('sweet') || description.includes('dessert');
          
          // If it's not breakfast, lunch, or dessert, it's probably dinner (like web app)
          const isDinner = !isBreakfast && !isLunch && !isDessert;
          
          // console.log(`🍽️ DINNER LOGIC for "${title}": isDinner=${isDinner}`); // Removed verbose logging
          
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

  // 🔧 useEffect to update categories when recipes or search changes - DEBOUNCED for performance
  useEffect(() => {
    // Debounce expensive category calculations
    const timeoutId = setTimeout(() => {
      // Calculate filteredRecipes locally in useEffect to avoid dependency issues
      const currentFilteredRecipes = (recipes || []).filter(recipe => {
        if (!searchQuery) return true;
        return (recipe.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
               (recipe.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
               (recipe.source || '').toLowerCase().includes(searchQuery.toLowerCase());
      });
      
      // 🔧 SAFETY: Don't calculate until we have valid recipes
      if (!currentFilteredRecipes || !Array.isArray(currentFilteredRecipes) || currentFilteredRecipes.length === 0) {
        const zeroCategories = defaultCategories.map(cat => ({ ...cat, count: 0 }));
        // setCategoriesWithCounts(zeroCategories); // Temporarily disabled to fix React error
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
        setCategoriesWithCounts(result); // Re-enabled now that React error is fixed
      } catch (error) {
        setCategoriesWithCounts(defaultCategories.map(cat => ({ ...cat, count: 0 }))); // Re-enabled
      }
    }, 100); // 100ms debounce to avoid excessive calculations
    
    return () => clearTimeout(timeoutId);
  }, [recipes, searchQuery]); // Run when underlying data changes, not computed filteredRecipes

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
    const categoryRecipes = selectedCategory ? (getCategoryRecipes(selectedCategory) || []) : [];
    // Limit initial render to first 50 recipes for better performance
    return categoryRecipes.slice(0, 50);
  }, [selectedCategory, filteredRecipes]); // Re-calculate only when category or filtered recipes change

  if (isLoading) {
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

  return (
    <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <TouchableWithoutFeedback onPress={() => setShowOptionsMenu(null)}>
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {selectedCategory && (
                <TouchableOpacity style={styles.backButton} onPress={goBackToCategories}>
                  <Text style={styles.backButtonText}>← Categories</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>
              {selectedCategory 
              ? (categoriesWithCounts || []).find(c => c.id === selectedCategory)?.name || 'Recipes'
              : '📚 Recipe Categories'
            }
          </Text>
        </View>
      </View>

      {/* Import Section - HIDDEN (will be improved later) */}
      {false && !selectedCategory && (
        <View style={styles.importSection}>
          <Text style={styles.importTitle}>🌐 Import Recipe from URL</Text>
          <View style={styles.importInputContainer}>
            <TextInput
              style={styles.importInput}
              value={importUrl}
              onChangeText={setImportUrl}
              placeholder="Paste recipe URL here (e.g., from AllRecipes, Food Network)"
              placeholderTextColor="#9ca3af"
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

      {/* Search - show when viewing recipes in a category */}
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
        {!selectedCategory ? (
          // Category Grid View
          <View style={styles.categoryGrid}>
            {(categoriesWithCounts && Array.isArray(categoriesWithCounts) ? categoriesWithCounts : []).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { borderLeftColor: category.color }]}
                onPress={() => selectCategory(category.id)}
              >
                <View style={styles.categoryCardContent}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                      {category.count || 0} recipe{(category.count || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.categoryArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
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
                          e.stopPropagation(); // Prevent parent touch
                          setShowOptionsMenu(showOptionsMenu === recipe.id ? null : recipe.id);
                        }}
                      >
                        <Text style={styles.optionsIcon}>⋮</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Options Menu Dropdown */}
                    {showOptionsMenu === recipe.id && (
                      <View style={styles.optionsMenu}>
                        <TouchableOpacity
                          style={styles.optionsMenuItem}
                          activeOpacity={0.7}
                          onPress={() => handleAddToMealPlan(recipe)}
                        >
                          <Text style={styles.optionsMenuIcon}>📅</Text>
                          <Text style={styles.optionsMenuText}>+ Meal Plan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.optionsMenuItem, styles.deleteMenuItem]}
                          activeOpacity={0.7}
                          onPress={() => handleDeleteRecipe(recipe)}
                        >
                          <Text style={styles.optionsMenuIcon}>🗑️</Text>
                          <Text style={styles.deleteMenuText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
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
                        {recipe.prep_time && (
                          <Text style={styles.metadataItem}>⏱️ {recipe.prep_time}</Text>
                        )}
                        {recipe.servings && (
                          <Text style={styles.metadataItem}>👥 {recipe.servings}</Text>
                        )}
                      </View>
                      
                      {recipe.source && (
                        <Text style={styles.recipeSource}>📖 {recipe.source}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {selectedCategory 
            ? `${(displayRecipes || []).length} recipe${(displayRecipes || []).length !== 1 ? 's' : ''} in ${(categoriesWithCounts || []).find(c => c.id === selectedCategory)?.name || 'category'}`
            : `${(recipes || []).length} total recipes across ${(categoriesWithCounts || []).filter(c => (c.count || 0) > 0).length} categories`
          }
        </Text>
      </View>

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
                    <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.reloadButtonText}>🔄 Reload</Text>
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
                        onPress={() => addRecipeToMeal(day.id, meal.id)}
                      >
                        <Text style={styles.mealIcon}>🍽️</Text>
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
}

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
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // White opaque overlay for readability
    zIndex: 1,
  },
  whiteText: {
    color: '#ffffff',
  },
  
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed from '#f9fafb' to transparent
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 2, // Above overlay
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,  // ✅ FIXED: Changed from 16 to 20 to match other screens
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
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
  importSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  mainContent: {
    flex: 1,
  },
  // 🔧 Category Grid Styles
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
  // 🔧 Recipe List Container
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'visible', // Allow options menu to overflow
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
    top: 80,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    minWidth: 160,
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
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  // 🆕 Modal Styles
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
});
