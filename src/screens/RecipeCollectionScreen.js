import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';

export default function RecipeCollectionScreen({ navigation }) {
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
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  // 🔧 Category management functions - FIXED for actual data structure
  const getCategoryRecipes = (categoryId) => {
    try {
      const safeRecipes = filteredRecipes || [];
      
      console.log(`🔍 getCategoryRecipes called for "${categoryId}" with ${safeRecipes.length} filtered recipes`);
      
      if (categoryId === 'all') {
        console.log(`  → Returning all ${safeRecipes.length} recipes for "all" category`);
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
          
          console.log(`🍽️ DINNER LOGIC for "${title}": isDinner=${isDinner} (not breakfast=${!isBreakfast}, not lunch=${!isLunch}, not dessert=${!isDessert})`);
          
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
      console.warn(`🚨 Error in getCategoryRecipes for ${categoryId}:`, error);
      return [];
    }
  };

  const getCategoryWithCount = (category) => {
    try {
      const categoryRecipes = getCategoryRecipes(category.id) || [];
      
      // 🔧 DEBUG: Log category matching for debugging
      console.log(`🔍 Category "${category.name}" (${category.id}): ${categoryRecipes.length} recipes`);
      if (categoryRecipes.length > 0) {
        console.log(`  Sample matches:`, categoryRecipes.slice(0, 2).map(r => ({
          title: r.title,
          category: r.category,
          meal_role: r.meal_role
        })));
      }
      
      return {
        ...category,
        count: categoryRecipes.length
      };
    } catch (error) {
      console.warn(`🚨 Error calculating count for category ${category.id}:`, error);
      return {
        ...category,
        count: 0
      };
    }
  };

  // 🔧 useEffect to update categories when filteredRecipes changes
  useEffect(() => {
    console.log('🔄 useEffect TRIGGERED for category calculation');
    console.log('🔄 Current filteredRecipes in useEffect:', filteredRecipes ? filteredRecipes.length : 'undefined');
    console.log('🔄 Current recipes state:', recipes ? recipes.length : 'undefined'); 
    console.log('🔄 Current categoriesWithCounts state:', categoriesWithCounts ? categoriesWithCounts.length : 'undefined');
    
    // 🔧 SAFETY: Don't calculate until we have valid filteredRecipes
    if (!filteredRecipes || !Array.isArray(filteredRecipes) || filteredRecipes.length === 0) {
      console.log('🔄 Categories not ready in useEffect - setting zero counts');
      const zeroCategories = defaultCategories.map(cat => ({ ...cat, count: 0 }));
      console.log('🔄 Setting zero categories:', zeroCategories.length);
      setCategoriesWithCounts(zeroCategories);
      return;
    }
    
    console.log('🔄 Calculating categories in useEffect with', filteredRecipes.length, 'filtered recipes');
    
    try {
      const result = defaultCategories.map(getCategoryWithCount);
      
      // 🔧 DEBUG: Log final category counts for grid display
      console.log('📊 FINAL CATEGORY COUNTS FOR GRID (useEffect):');
      result.forEach(cat => {
        console.log(`  ${cat.name}: ${cat.count} recipes`);
      });
      
      console.log('🔄 Setting categoriesWithCounts to:', result.length, 'categories');
      setCategoriesWithCounts(result);
    } catch (error) {
      console.error('🚨 Error in category calculation useEffect:', error);
      setCategoriesWithCounts(defaultCategories.map(cat => ({ ...cat, count: 0 })));
    }
  }, [filteredRecipes]); // Run when filteredRecipes changes

  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const goBackToCategories = () => {
    setSelectedCategory(null);
  };

  const filteredRecipes = useMemo(() => {
    const result = (recipes || []).filter(recipe => {
      if (!searchQuery) return true; // If no search query, return all recipes
      
      return (recipe.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (recipe.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (recipe.source || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    // 🔧 DEBUG: Log the filtering process
    console.log('🔍 Filtering debug:', {
      totalRecipes: (recipes || []).length,
      searchQuery: searchQuery,
      filteredCount: result.length
    });

    // 🔧 DEBUG: Force log when filteredRecipes changes
    console.log('🔄 filteredRecipes updated, will trigger category recalculation');

    return result;
  }, [recipes, searchQuery]);

  // Get recipes for currently selected category with safety check
  const displayRecipes = selectedCategory ? (getCategoryRecipes(selectedCategory) || []) : [];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Navigate to Debug tab for logout
            navigation.navigate('Debug');
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading your recipes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Import Section - only show when in categories view */}
      {!selectedCategory && (
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
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => openRecipe(recipe)}
                >
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeTitle}>{recipe.title || 'Untitled Recipe'}</Text>
                    {recipe.confidence_score && (
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>
                          {Math.round(recipe.confidence_score)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryArrow: {
    fontSize: 20,
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
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  recipeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  confidenceBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: 14,
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
    color: '#6b7280',
    marginRight: 16,
    marginBottom: 4,
  },
  recipeSource: {
    fontSize: 12,
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
    color: '#6b7280',
    textAlign: 'center',
  },
});
