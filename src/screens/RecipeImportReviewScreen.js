import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YesChefAPI from '../services/YesChefAPI';
import { Icon } from '../components/IconLibrary';
import FullScreenEditor from '../components/FullScreenEditor';

const RecipeImportReviewScreen = ({ route, navigation }) => {
  const { importResult } = route.params;
  const isTemporary = importResult.isTemporary || false;
  const tempRecipeId = importResult.temp_recipe_id;
  
  // 🎨 Background Configuration (consistent with other screens)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/mintbackground.jpg');
  
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('imported'); // Default to imported to match existing recipes
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // 🆕 Full-Screen Editor State
  const [showEditor, setShowEditor] = useState(false);
  const [editorConfig, setEditorConfig] = useState({
    type: 'title',
    title: 'Edit Title',
    field: 'title',
    value: '',
    multiline: false
  });
  
  // 🆕 Track if temporary recipe has been deleted
  const [tempRecipeDeleted, setTempRecipeDeleted] = useState(false);

    // Available categories (match backend expectations)
  const categories = [
    { id: 'imported', name: 'Recent Imports', icon: '🔥', color: '#059669' },
    { id: 'breakfast', name: 'Breakfast', icon: '🍳', color: '#F59E0B' },
    { id: 'lunch', name: 'Lunch', icon: '🥗', color: '#10B981' },
    { id: 'dinner', name: 'Dinner', icon: '🍽️', color: '#8B5CF6' },
    { id: 'dessert', name: 'Dessert', icon: '🍰', color: '#EC4899' },
    { id: 'snack', name: 'Snack', icon: '🍿', color: '#6B7280' },
  ];

  // 🔧 Enhanced OCR text repair (from RecipeViewScreen)
  const repairOCRText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/extr a-virgin/g, 'extra-virgin')
      .replace(/ol ive oil/g, 'olive oil') 
      .replace(/unsal ted but ter/g, 'unsalted butter')
      .replace(/gr ated/g, 'grated')
      .replace(/sea son/g, 'season')
      .replace(/tem perature/g, 'temperature')
      .replace(/refrig erate/g, 'refrigerate')
      .replace(/¼/g, '1/4')
      .replace(/½/g, '1/2')
      .replace(/¾/g, '3/4')
      .replace(/⅓/g, '1/3')
      .replace(/⅔/g, '2/3')
      .replace(/⅛/g, '1/8')
      .replace(/⅜/g, '3/8')
      .replace(/⅝/g, '5/8')
      .replace(/⅞/g, '7/8')
      .replace(/°/g, '°')
      .replace(/^["'\[\]]+|["'\[\]]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 📋 Enhanced Recipe Field Parsing (from RecipeViewScreen)
  const formatRecipeField = (field) => {
    if (!field) return [];
    
    let processedField = field;
    
    if (typeof field === 'string') {
      if (field.trim().startsWith('[') && field.trim().endsWith(']')) {
        try {
          processedField = JSON.parse(field);
        } catch (e) {
          processedField = field;
        }
      }
    }
    
    if (Array.isArray(processedField)) {
      return processedField
        .filter(item => item && (typeof item === 'string' ? item.trim() : true))
        .map(item => {
          if (typeof item === 'string') {
            return repairOCRText(item.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
          } else if (item && typeof item === 'object' && item.text) {
            return repairOCRText(item.text.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
          }
          return String(item || '').trim();
        })
        .filter(item => item && item.length > 1);
    }
    
    // Handle string input - split by lines
    if (typeof processedField === 'string') {
      return processedField
        .split(/\n|\\n/)
        .filter(line => line && line.trim())
        .map(line => repairOCRText(line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim()))
        .filter(line => line && line.length > 1);
    }
    
    return [];
  };

  useEffect(() => {
    if (importResult && importResult.recipe) {
      // Apply OCR repair and formatting to the imported recipe
      const repairedRecipe = {
        ...importResult.recipe,
        title: repairOCRText(importResult.recipe.title || 'Imported Recipe'),
        description: repairOCRText(importResult.recipe.description || ''),
        ingredients: formatRecipeField(importResult.recipe.ingredients),
        instructions: formatRecipeField(importResult.recipe.instructions),
        prep_time: repairOCRText(importResult.recipe.prep_time || ''),
        cook_time: repairOCRText(importResult.recipe.cook_time || ''),
        servings: repairOCRText(importResult.recipe.servings || ''),
      };
      
      setRecipe(repairedRecipe);
      
      // Auto-suggest category based on recipe title  
      const title = (repairedRecipe.title || '').toLowerCase();
      if (title.includes('breakfast') || title.includes('pancake') || title.includes('waffle')) {
        setSelectedCategory('breakfast');
      } else if (title.includes('lunch') || title.includes('salad') || title.includes('sandwich')) {
        setSelectedCategory('lunch');
      } else if (title.includes('dinner') || title.includes('main') || title.includes('entree')) {
        setSelectedCategory('dinner');
      } else if (title.includes('dessert') || title.includes('cake') || title.includes('cookie')) {
        setSelectedCategory('desserts');
      } else if (title.includes('quick') || title.includes('fast') || title.includes('easy')) {
        setSelectedCategory('quick');
      }
      // Default stays as 'dinner' if no match
    }
  }, [importResult]);

  // 🧹 Cleanup temporary recipe on unmount if not saved
  useEffect(() => {
    return () => {
      // Cleanup function that runs on unmount
      if (isTemporary && tempRecipeId && !recipe?.is_saved && !tempRecipeDeleted) {
        console.log('🧹 Cleaning up temporary recipe on unmount:', tempRecipeId);
        // Don't await this, just fire and forget
        YesChefAPI.deleteRecipe(tempRecipeId).catch(error => {
          console.error('Failed to cleanup temporary recipe on unmount:', error);
        });
      } else if (tempRecipeDeleted) {
        console.log('✅ Temporary recipe already deleted, skipping cleanup');
      }
    };
  }, [isTemporary, tempRecipeId, recipe?.is_saved, tempRecipeDeleted]);

  // 🆕 Full-Screen Editor Functions
  const openEditor = (type, field, title, multiline = true) => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj?.[key], recipe) : 
      recipe[field];
    
    setEditorConfig({
      type,
      title,
      field,
      value: Array.isArray(value) ? value.join('\n') : (value || ''),
      multiline
    });
    setShowEditor(true);
  };

  const handleEditorSave = (newValue) => {
    const { field } = editorConfig;
    
    // Handle recipe info special case
    if (field === 'info') {
      const lines = newValue.split('\n');
      const updates = {};
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith('prep time:')) {
          updates.prep_time = trimmedLine.substring(10).trim();
        } else if (trimmedLine.toLowerCase().startsWith('cook time:')) {
          updates.cook_time = trimmedLine.substring(10).trim();
        } else if (trimmedLine.toLowerCase().startsWith('servings:')) {
          updates.servings = trimmedLine.substring(9).trim();
        }
      });
      
      setRecipe(prev => ({
        ...prev,
        ...updates
      }));
      return;
    }
    
    // Handle array fields (ingredients, instructions)
    if (field === 'ingredients' || field === 'instructions') {
      const arrayValue = newValue
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());
      
      setRecipe(prev => ({
        ...prev,
        [field]: arrayValue
      }));
    } else {
      // Handle simple string fields
      setRecipe(prev => ({
        ...prev,
        [field]: newValue.trim()
      }));
    }
  };

  // 🗑️ Clean up temporary recipe if user cancels or goes back
  const handleCancel = async () => {
    if (isTemporary && tempRecipeId && !tempRecipeDeleted) {
      try {
        console.log('🗑️ Cleaning up temporary recipe:', tempRecipeId);
        await YesChefAPI.deleteRecipe(tempRecipeId);
        console.log('✅ Temporary recipe deleted successfully');
        setTempRecipeDeleted(true);
      } catch (error) {
        console.error('Failed to delete temporary recipe:', error);
        // Don't show error to user, just log it
      }
    }
    navigation.goBack();
  };

  const handleSaveRecipe = async () => {
    if (!recipe) {
      Alert.alert('Error', 'No recipe data to save');
      return;
    }

    if (!recipe.title?.trim()) {
      Alert.alert('Error', 'Recipe title is required');
      return;
    }

    setIsSaving(true);
    try {
      let result;
      
      if (isTemporary && tempRecipeId) {
        // Since backend doesn't support PUT updates, delete temporary and create new
        console.log('�️ Deleting temporary recipe before saving final version:', tempRecipeId);
        
        try {
          await YesChefAPI.deleteRecipe(tempRecipeId);
          console.log('✅ Temporary recipe deleted successfully');
          setTempRecipeDeleted(true); // Mark as deleted to prevent cleanup attempts
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete temporary recipe, continuing with save:', deleteError);
        }
        
        // Create new final recipe
        console.log('💾 Saving final reviewed recipe');
        const recipeToSave = {
          ...recipe,
          category: selectedCategory,
          // Remove meal_role - existing recipes don't have this field
        };
        
        console.log('📊 Recipe data being saved:', {
          title: recipeToSave.title,
          category: recipeToSave.category,
          meal_role: recipeToSave.meal_role,
          hasIngredients: !!recipeToSave.ingredients,
          hasInstructions: !!recipeToSave.instructions
        });
        
        result = await YesChefAPI.saveReviewedImportedRecipe(recipeToSave);
      } else {
        // Fallback: Save as new recipe (for older flow compatibility)
        console.log('💾 Saving as new reviewed recipe (fallback)');
        
        const recipeToSave = {
          ...recipe,
          category: selectedCategory,
          // Remove meal_role - existing recipes don't have this field
        };
        
        result = await YesChefAPI.saveReviewedImportedRecipe(recipeToSave);
      }
      
      if (result.success) {
        // Mark recipe as saved to prevent cleanup
        setRecipe(prev => ({ ...prev, is_saved: true }));
        
        // 🔍 Debug: Try to fetch the saved recipe directly
        const savedRecipeId = result.recipe?.id || result.recipe_id;
        if (savedRecipeId) {
          console.log('🔍 Attempting to verify saved recipe:', savedRecipeId);
          setTimeout(async () => {
            try {
              const verifyResult = await YesChefAPI.getRecipe(savedRecipeId);
              if (verifyResult.success) {
                console.log('✅ Saved recipe verified:', {
                  id: verifyResult.recipe.id,
                  title: verifyResult.recipe.title,
                  category: verifyResult.recipe.category
                });
              } else {
                console.log('❌ Could not verify saved recipe:', verifyResult.error);
              }
            } catch (error) {
              console.log('❌ Error verifying saved recipe:', error);
            }
          }, 500);
        }
        
        Alert.alert(
          'Recipe Saved! ✅',
          `"${recipe.title}" has been saved to your ${categories.find(c => c.id === selectedCategory)?.name || selectedCategory} collection.`,
          [
            { 
              text: 'View Collection', 
              onPress: () => {
                // Navigate to Recipes tab (which contains RecipeCollection)
                navigation.navigate('Recipes', { 
                  screen: 'RecipeCollection',
                  params: { refresh: true }
                });
              }
            },
            {
              text: 'OK',
              onPress: () => {
                // Navigate to Recipes tab (which contains RecipeCollection)
                navigation.navigate('Recipes', { 
                  screen: 'RecipeCollection',
                  params: { refresh: true }
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Save Failed', result.error || 'Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Network error while saving recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldEdit = (field, value) => {
    setRecipe(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldEdit = (field, index, value) => {
    setRecipe(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayFieldItem = (field) => {
    setRecipe(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayFieldItem = (field, index) => {
    setRecipe(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AAC6AD" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground 
      source={SELECTED_BACKGROUND} 
      style={styles.backgroundImage} 
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleCancel}
          >
            <Icon name="chevron-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Recipe</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable Recipe Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📖 Recipe Title</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditor('title', 'title', 'Edit Title', false)}
              >
                <Icon name="edit" size={16} color="#AAC6AD" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.previewTitle}>{recipe.title || 'Untitled Recipe'}</Text>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📝 Description</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditor('description', 'description', 'Edit Description', true)}
              >
                <Icon name="edit" size={16} color="#AAC6AD" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.previewText}>
              {recipe.description || 'No description provided'}
            </Text>
          </View>

          {/* Recipe Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⏱️ Recipe Info</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  // For recipe info, we'll open a custom editor that handles all three fields
                  const infoText = `Prep Time: ${recipe.prep_time || ''}\nCook Time: ${recipe.cook_time || ''}\nServings: ${recipe.servings || ''}`;
                  setEditorConfig({
                    type: 'info',
                    title: 'Edit Recipe Info',
                    field: 'info',
                    value: infoText,
                    multiline: true
                  });
                  setShowEditor(true);
                }}
              >
                <Icon name="edit" size={16} color="#AAC6AD" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Prep</Text>
                <Text style={styles.infoValue}>{recipe.prep_time || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Cook</Text>
                <Text style={styles.infoValue}>{recipe.cook_time || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Serves</Text>
                <Text style={styles.infoValue}>{recipe.servings || '—'}</Text>
              </View>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🥕 Ingredients</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditor('ingredients', 'ingredients', 'Edit Ingredients', true)}
              >
                <Icon name="edit" size={16} color="#AAC6AD" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {ingredient}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyText}>No ingredients listed</Text>
              )}
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👨‍🍳 Instructions</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditor('instructions', 'instructions', 'Edit Instructions', true)}
              >
                <Icon name="edit" size={16} color="#AAC6AD" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((instruction, index) => (
                  <Text key={index} style={styles.listItem}>
                    {index + 1}. {instruction}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyText}>No instructions provided</Text>
              )}
            </View>
          </View>

          {/* Category Selection - Moved to bottom */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📂 Save to Category</Text>
            <TouchableOpacity 
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.categoryIcon}>{selectedCategoryData?.icon}</Text>
              <Text style={styles.categoryName}>{selectedCategoryData?.name}</Text>
              <Icon name="arrowDown" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveRecipe}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Save Recipe</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Full-Screen Editor Modal */}
        <FullScreenEditor
          isVisible={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handleEditorSave}
          title={editorConfig.title}
          initialValue={editorConfig.value}
          multiline={editorConfig.multiline}
          editorType={editorConfig.type}
        />

        {/* Category Selection Modal */}
        {showCategoryModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.categoryModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity 
                  onPress={() => setShowCategoryModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Icon name="x" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.categoryList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={styles.categoryItemIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryItemName,
                      selectedCategory === category.id && styles.categoryItemNameSelected
                    ]}>
                      {category.name}
                    </Text>
                    {selectedCategory === category.id && (
                      <Icon name="save" size={20} color="#059669" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  container: {
    flex: 1,
    zIndex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Nunito-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(170, 198, 173, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#AAC6AD',
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: '#AAC6AD',
    marginLeft: 4,
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937',
    lineHeight: 28,
  },
  previewText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    lineHeight: 22,
    paddingVertical: 2,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#1F2937',
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AAC6AD',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  categoryModal: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.84,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  categoryItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryItemName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
  },
  categoryItemNameSelected: {
    color: '#059669',
    fontFamily: 'Nunito-ExtraBold',
  },
});

export default RecipeImportReviewScreen;