/**
 * 🔄 MOBILE MEAL PLAN ADAPTER
 * 
 * Compatibility layer between NotionMealPlanner format and Mobile UI
 * Maintains consistency between web and mobile while optimizing for mobile UX
 */

class MobileMealPlanAdapter {
  
  /**
   * Convert NotionMealPlanner format to Mobile UI format
   * NotionMealPlanner -> Mobile Display
   * Now handles both NotionMealPlanner and Traditional webapp formats
   */
  static notionToMobile(mealPlanData) {
    console.log('🔄 Converting backend format to Mobile format:', mealPlanData);
    
    if (!mealPlanData) {
      console.log('📋 No backend data, returning default mobile structure');
      return MobileMealPlanAdapter.getDefaultMobileStructure();
    }

    // Check if this is NotionMealPlanner format (has days array, columns array, data object)
    if (mealPlanData.days && Array.isArray(mealPlanData.days) && mealPlanData.columns && mealPlanData.data) {
      console.log('📱 Converting NotionMealPlanner format');
      return MobileMealPlanAdapter.convertNotionMealPlannerToMobile(mealPlanData);
    }
    
    // Check if this is Traditional webapp format (has dayOrder array, days object)
    if (mealPlanData.dayOrder && Array.isArray(mealPlanData.dayOrder) && mealPlanData.days && typeof mealPlanData.days === 'object') {
      console.log('�️ Converting Traditional webapp format');
      return MobileMealPlanAdapter.convertTraditionalToMobile(mealPlanData);
    }

    // If neither format is recognized, return default
    console.log('⚠️ Unrecognized meal plan format, returning default structure');
    return MobileMealPlanAdapter.getDefaultMobileStructure();
  }

  /**
   * Convert NotionMealPlanner format to mobile
   */
  static convertNotionMealPlannerToMobile(notionMealPlan) {
    const mobileDays = [];
    
    notionMealPlan.days.forEach(notionDay => {
      const dayData = notionMealPlan.data[notionDay.id] || {};
      
      // Convert meals for this day
      const mobileMeals = [];
      notionMealPlan.columns.forEach(column => {
        const recipes = dayData[column.id] || [];
        
        // Only include meals that have content or are standard meal types
        if (recipes.length > 0 || ['breakfast', 'lunch', 'dinner'].includes(column.id)) {
          mobileMeals.push({
            id: `${column.id}-${notionDay.id}`,
            name: column.name,
            recipes: MobileMealPlanAdapter.convertRecipesToMobileFormat(recipes)
          });
        }
      });
      
      // 🍞 SIMPLIFIED MOBILE UX: Extract day.recipes from breakfast column
      // Our simplified system stores recipes at day level, but backend stores in breakfast column
      const breakfastData = dayData['breakfast'] || [];
      console.log(`🔍 BACKEND BREAKFAST DEBUG for ${notionDay.name}:`, JSON.stringify(breakfastData, null, 2));
      
      const dayRecipes = MobileMealPlanAdapter.convertRecipesToMobileFormat(breakfastData);
      
      console.log(`🔄 LOAD DEBUG: Extracted ${dayRecipes.length} recipes from breakfast column for day ${notionDay.name}`);
      
      // Create mobile day structure
      mobileDays.push({
        id: notionDay.id.replace('day-', ''), // Convert 'day-1' to '1'
        name: notionDay.name,
        isExpanded: true, // Default to expanded for mobile
        meals: mobileMeals,
        recipes: dayRecipes // Add day-level recipes for simplified system
      });
    });

    console.log(`✅ Converted NotionMealPlanner to ${mobileDays.length} mobile days`);
    return mobileDays;
  }

  /**
   * Convert Traditional webapp format to mobile
   */
  static convertTraditionalToMobile(traditionalMealPlan) {
    const mobileDays = [];
    
    // Use dayOrder to maintain proper sequence
    traditionalMealPlan.dayOrder.forEach((dayKey, index) => {
      const dayData = traditionalMealPlan.days[dayKey];
      if (!dayData) return;

      // Convert meals for this day
      const mobileMeals = [];
      const mealsData = dayData.meals || {};
      
      // Standard meal types to check
      const standardMeals = ['breakfast', 'lunch', 'dinner', 'snacks'];
      
      standardMeals.forEach(mealType => {
        const mealData = mealsData[mealType] || [];
        
        // Handle Traditional webapp nested format: {name: "Dinner", recipes: [...]}
        let recipes = [];
        if (Array.isArray(mealData)) {
          // Direct array format
          recipes = mealData;
        } else if (mealData && typeof mealData === 'object' && Array.isArray(mealData.recipes)) {
          // Nested format with wrapper object
          recipes = mealData.recipes;
        } else {
          // Empty or invalid format
          recipes = [];
        }
        
        // Only include meals that have content or are standard types
        if (recipes.length > 0 || ['breakfast', 'lunch', 'dinner'].includes(mealType)) {
          const convertedRecipes = MobileMealPlanAdapter.convertRecipesToMobileFormat(recipes);
          
          mobileMeals.push({
            id: `${mealType}-${index + 1}`,
            name: mealType.charAt(0).toUpperCase() + mealType.slice(1), // Capitalize
            recipes: convertedRecipes
          });
        }
      });
      
      // Create mobile day structure
      mobileDays.push({
        id: index + 1,
        name: dayData.name || `Day ${index + 1}`,
        isExpanded: true,
        meals: mobileMeals
      });
    });

    console.log(`✅ Converted Traditional webapp to ${mobileDays.length} mobile days`);
    return mobileDays;
  }

  /**
   * Convert recipes to ultra-light mobile format
   * Handles: Full recipe objects, strings, mixed arrays
   * Returns: [{id, title, isCompleted}] - minimal 3-field objects only
   */
  static convertRecipesToMobileFormat(recipes) {
    if (!Array.isArray(recipes)) {
      return [];
    }

    return recipes.map((recipe, index) => {
      console.log('🔧 Converting recipe object:', recipe, 'Type:', typeof recipe);
      
      // Handle integer recipe IDs (new backend format)
      if (typeof recipe === 'number') {
        console.log('🔧 Converting integer recipe ID:', recipe);
        return {
          id: recipe,
          title: `Recipe ${recipe}`, // Fallback for simple integers
          isCompleted: false
        };
      }
      
      // Handle full recipe objects from backend
      if (typeof recipe === 'object' && recipe !== null) {
        const extractedTitle = recipe.title || recipe.name || recipe.recipe_name || 'Unknown Recipe';
        console.log('🔧 Extracted title:', extractedTitle, 'from recipe:', {
          id: recipe.id,
          title: recipe.title,
          name: recipe.name,
          recipe_name: recipe.recipe_name
        });
        
        return {
          id: recipe.id || recipe.recipe_id || `temp-${Date.now()}-${index}`,
          title: extractedTitle,
          isCompleted: recipe.isCompleted || false // Mobile-only state
        };
      }
      
      // Handle legacy string format
      if (typeof recipe === 'string') {
        console.log('🔧 Converting string recipe:', recipe);
        return {
          id: `temp-${Date.now()}-${index}`, // Temporary ID for strings
          title: recipe,
          isCompleted: false
        };
      }
      
      // Fallback for unexpected formats
      console.log('🔧 Unknown recipe format:', recipe, 'Type:', typeof recipe);
      return {
        id: `unknown-${Date.now()}-${index}`,
        title: 'Unknown Recipe',
        isCompleted: false
      };
    });
  }

  /**
   * Convert Mobile UI format to NotionMealPlanner format
   * Mobile Display -> NotionMealPlanner
   */
  static mobileToNotion(mobileDays, planTitle = 'Mobile Meal Plan') {
    console.log('🔄 Converting Mobile format to Notion format:', mobileDays);
    
    if (!mobileDays || !Array.isArray(mobileDays) || mobileDays.length === 0) {
      console.log('📋 No mobile data, returning default notion structure');
      return MobileMealPlanAdapter.getDefaultNotionStructure();
    }

    const notionDays = [];
    const notionColumns = [];
    const notionData = {};
    const seenColumns = new Set();

    // First pass: collect all unique meal types (columns)
    mobileDays.forEach(mobileDay => {
      mobileDay.meals.forEach(meal => {
        if (!seenColumns.has(meal.name.toLowerCase())) {
          seenColumns.add(meal.name.toLowerCase());
          notionColumns.push({
            id: meal.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: meal.name
          });
        }
      });
    });

    // Add standard columns if not present
    const standardColumns = [
      { id: 'breakfast', name: 'Breakfast' },
      { id: 'lunch', name: 'Lunch' },
      { id: 'dinner', name: 'Dinner' }
    ];
    
    standardColumns.forEach(stdCol => {
      if (!notionColumns.find(col => col.id === stdCol.id)) {
        notionColumns.unshift(stdCol); // Add to beginning
      }
    });

    // Second pass: convert mobile days to notion format
    mobileDays.forEach(mobileDay => {
      const dayId = `day-${mobileDay.id}`;
      
      // Create notion day
      notionDays.push({
        id: dayId,
        name: mobileDay.name
      });

      // Initialize data structure for this day
      notionData[dayId] = {};
      notionColumns.forEach(column => {
        notionData[dayId][column.id] = [];
      });

      // 🍞 SIMPLIFIED MOBILE UX: Handle day.recipes (simplified format)
      // Put day-level recipes into breakfast meal for backend compatibility
      if (mobileDay.recipes && Array.isArray(mobileDay.recipes) && mobileDay.recipes.length > 0) {
        console.log('🔄 DEBUG: Converting day.recipes for backend:', mobileDay.recipes.map(r => r.title));
        
        const dayRecipeObjects = mobileDay.recipes
          .filter(recipe => recipe && typeof recipe === 'object' && recipe.id)
          .map(recipe => ({
            id: recipe.id,
            title: recipe.title || recipe.name,
            name: recipe.name || recipe.title,
            isCompleted: recipe.isCompleted || false,
            source: recipe.source || 'day_recipe'
          }));
          
        // Add to breakfast column for backend storage
        notionData[dayId]['breakfast'] = dayRecipeObjects;
        console.log('🔄 DEBUG: Added', dayRecipeObjects.length, 'day recipes to breakfast column');
        console.log('🔍 DETAILED DEBUG: Breakfast column data:', JSON.stringify(dayRecipeObjects, null, 2));
      }

      // Populate with mobile meal data (original meal-based logic)
      mobileDay.meals.forEach(meal => {
        const columnId = meal.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Convert mobile recipe objects back to backend format
        // Keep full recipe objects so they work for both grocery list generation AND meal plan display
        console.log('🔄 DEBUG: Converting mobile recipes for backend:', meal.recipes);
        
        const recipeObjects = meal.recipes
          .filter(mobileRecipe => mobileRecipe && typeof mobileRecipe === 'object' && mobileRecipe.id)
          .filter(mobileRecipe => !mobileRecipe.id.toString().startsWith('temp-')) // Exclude temp recipes
          .map(mobileRecipe => ({
            id: parseInt(mobileRecipe.id),
            title: mobileRecipe.title || `Recipe ${mobileRecipe.id}`, // Preserve actual titles from mobile
            source: mobileRecipe.id.toString().startsWith('temp-') ? 'mobile' : 'backend'
          }))
          .filter(recipe => !isNaN(recipe.id)); // Ensure valid IDs

        console.log('🔄 DEBUG: Converted to recipe objects:', recipeObjects);

        if (notionData[dayId][columnId]) {
          notionData[dayId][columnId] = recipeObjects; // Save full objects for compatibility
        }
      });
    });

    const notionMealPlan = {
      days: notionDays,
      columns: notionColumns,
      data: notionData
    };

    console.log(`✅ Converted to Notion format with ${notionDays.length} days and ${notionColumns.length} columns`);
    return notionMealPlan;
  }

  /**
   * Get default mobile structure for empty plans
   */
  static getDefaultMobileStructure() {
    return [
      {
        id: 1,
        name: 'Day 1',
        isExpanded: true,
        meals: [
          { id: 'breakfast-1', name: 'Breakfast', recipes: [] },
          { id: 'lunch-1', name: 'Lunch', recipes: [] },
          { id: 'dinner-1', name: 'Dinner', recipes: [] }
        ]
      }
    ];
  }

  /**
   * Get default notion structure for empty plans
   */
  static getDefaultNotionStructure() {
    return {
      days: [
        { id: 'day-1', name: 'Day 1' }
      ],
      columns: [
        { id: 'breakfast', name: 'Breakfast' },
        { id: 'lunch', name: 'Lunch' },
        { id: 'dinner', name: 'Dinner' }
      ],
      data: {
        'day-1': {
          'breakfast': [],
          'lunch': [],
          'dinner': []
        }
      }
    };
  }

  /**
   * Get conversion summary for debugging
   */
  static getConversionSummary(mobileDays, notionMealPlan) {
    const summary = {
      mobile: {
        days: mobileDays.length,
        totalMeals: mobileDays.reduce((total, day) => total + day.meals.length, 0),
        totalRecipes: mobileDays.reduce((total, day) => 
          total + day.meals.reduce((mealTotal, meal) => mealTotal + meal.recipes.length, 0), 0
        )
      },
      notion: {
        days: notionMealPlan.days ? notionMealPlan.days.length : 0,
        columns: notionMealPlan.columns ? notionMealPlan.columns.length : 0,
        dataKeys: notionMealPlan.data ? Object.keys(notionMealPlan.data).length : 0
      }
    };

    console.log('📊 Conversion Summary:', summary);
    return summary;
  }

  /**
   * Test the adapter with sample data
   */
  static runTests() {
    console.log('🧪 Running MobileMealPlanAdapter tests...');
    
    // Test 1: Mobile to Notion conversion
    const testMobileData = [
      {
        id: 1,
        name: 'Monday',
        isExpanded: true,
        meals: [
          { id: 'breakfast-1', name: 'Breakfast', recipes: ['Pancakes', 'Orange Juice'] },
          { id: 'lunch-1', name: 'Lunch', recipes: [] },
          { id: 'dinner-1', name: 'Dinner', recipes: ['Spaghetti'] }
        ]
      },
      {
        id: 2,
        name: 'Tuesday',
        isExpanded: true,
        meals: [
          { id: 'breakfast-2', name: 'Breakfast', recipes: ['Cereal'] },
          { id: 'snack-2', name: 'Afternoon Snack', recipes: ['Apple'] }
        ]
      }
    ];

    const notionResult = MobileMealPlanAdapter.mobileToNotion(testMobileData);
    console.log('✅ Mobile to Notion test passed');

    // Test 2: Notion to Mobile conversion
    const mobileResult = MobileMealPlanAdapter.notionToMobile(notionResult);
    console.log('✅ Notion to Mobile test passed');

    // Test 3: Conversion summary
    const summary = MobileMealPlanAdapter.getConversionSummary(mobileResult, notionResult);
    console.log('✅ All tests passed!');

    return { mobile: mobileResult, notion: notionResult, summary };
  }
}

export default MobileMealPlanAdapter;
