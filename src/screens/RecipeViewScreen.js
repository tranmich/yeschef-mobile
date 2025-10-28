import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YesChefAPI from '../services/YesChefAPI';
import { Icon } from '../components/IconLibrary';
import FullScreenEditor from '../components/FullScreenEditor';

const RecipeViewScreen = ({ route, navigation }) => {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 🆕 Editing state
  const [showEditor, setShowEditor] = useState(false);
  const [editorConfig, setEditorConfig] = useState({
    type: 'title',
    title: 'Edit Title',
    field: 'title',
    value: '',
    multiline: false
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // 🆕 Toast notification (inline like GroceryListScreen)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnimation = useRef(new Animated.Value(0)).current;

  const showToastNotification = (message = 'Saved ✓') => {
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

  // 🔧 Enhanced OCR text repair (from webapp)
  const repairOCRText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    return text
      // Fix common OCR errors
      .replace(/extr a-virgin/g, 'extra-virgin')
      .replace(/ol ive oil/g, 'olive oil') 
      .replace(/unsal ted but ter/g, 'unsalted butter')
      .replace(/gr ated/g, 'grated')
      .replace(/sea son/g, 'season')
      .replace(/tem perature/g, 'temperature')
      .replace(/refrig erate/g, 'refrigerate')
      // Fix fraction characters
      .replace(/¼/g, '1/4')
      .replace(/½/g, '1/2')
      .replace(/¾/g, '3/4')
      .replace(/⅓/g, '1/3')
      .replace(/⅔/g, '2/3')
      .replace(/⅛/g, '1/8')
      .replace(/⅜/g, '3/8')
      .replace(/⅝/g, '5/8')
      .replace(/⅞/g, '7/8')
      // Fix degree symbol
      .replace(/°/g, '°')
      // Remove extra quotes and brackets
      .replace(/^["'\[\]]+|["'\[\]]+$/g, '')
      // Fix double spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 📋 Enhanced Recipe Field Parsing (from webapp)
  const formatRecipeField = (field) => {
    if (!field) return [];
    
    let processedField = field;
    
    // Handle JSON string input
    if (typeof field === 'string') {
      // Check if it's a JSON array string
      if (field.trim().startsWith('[') && field.trim().endsWith(']')) {
        try {
          processedField = JSON.parse(field);
        } catch (e) {
          // If JSON parsing fails, treat as regular string
          processedField = field;
        }
      }
    }
    
    // Handle array input (could be strings or objects)
    if (Array.isArray(processedField)) {
      // console.log('📱 Processing field array with length:', processedField.length);
      
      const result = processedField
        .filter(item => {
          // Better filtering - check if item exists and has usable content
          if (!item) {
            console.log('📱 Filtering out null/undefined item');
            return false;
          }
          
          // If it's an object, check if it has meaningful properties
          if (typeof item === 'object') {
            const hasUsefulData = item.ingredient || item.text || item.name || item.description;
            console.log('📱 Filtering item object:', item, 'Has useful data:', !!hasUsefulData);
            return !!hasUsefulData;
          }
          
          // If it's a string, check if it's not empty or just '[object Object]'
          const stringValue = item.toString().trim();
          const isValid = stringValue && stringValue !== '[object Object]' && !stringValue.startsWith('[');
          // console.log('📱 Filtering item string:', stringValue, 'Valid:', isValid); // Removed verbose logging
          return isValid;
        })
        .map((item, index) => {
          // console.log(`📱 Processing item ${index}:`, item);
          let formatted = '';
          
          // Handle object items (this is the key fix!)
          if (typeof item === 'object' && item !== null) {
            console.log('📱 Processing object item with keys:', Object.keys(item));
            // Try different common object structures
            if (item.ingredient) {
              // This is the exact format we're seeing: {"ingredient": "text"}
              formatted = item.ingredient;
              console.log('📱 Used item.ingredient:', formatted);
            } else if (item.text) {
              formatted = item.text;
              console.log('📱 Used item.text:', formatted);
            } else if (item.name) {
              // Sometimes stored as name field
              const parts = [];
              if (item.quantity) parts.push(item.quantity);
              if (item.unit) parts.push(item.unit);
              parts.push(item.name);
              formatted = parts.join(' ');
              console.log('📱 Built from name parts:', formatted);
            } else if (item.description) {
              formatted = item.description;
              console.log('📱 Used item.description:', formatted);
            } else {
              // Try to extract meaningful text from object
              const values = Object.values(item).filter(v => 
                v && typeof v === 'string' && v.trim() && v !== '[object Object]'
              );
              formatted = values.join(' ') || '[Unable to parse item]';
              console.log('📱 Used fallback values:', formatted);
            }
          } else {
            // Handle string items
            formatted = item.toString().trim();
            // console.log('📱 Used string item:', formatted); // Removed verbose logging
          }
          
          // Remove extra whitespace
          formatted = formatted.replace(/\s+/g, ' ');
          
          // Handle unicode characters
          formatted = formatted.replace(/\\u([0-9a-fA-F]{4})/g, (match, unicode) => {
            return String.fromCharCode(parseInt(unicode, 16));
          });
          
          // Clean up OCR artifacts and JSON remnants
          formatted = repairOCRText(formatted);
          
          // Remove any remaining JSON brackets or quotes
          formatted = formatted.replace(/^["'\[\]]+|["'\[\]]+$/g, '');
          
          // console.log(`📱 Final formatted item ${index}:`, formatted);
          return formatted;
        })
        .filter(item => item && item.trim()); // Remove any empty items
        
      // console.log('📱 Final result array:', result);
      return result;
    }

    // Handle string input - including long concatenated strings
    let text = processedField.toString();
    
    // Clean up the text
    text = repairOCRText(text);
    
    // Handle long concatenated strings with multiple items separated by quotes
    if (text.includes('","') || text.includes('","')) {
      const items = text.split(/[",]+/).filter(item => item.trim() && item !== '[' && item !== ']');
      return items.map(item => item.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ''));
    }
    
    // Convert various formats to array
    if (text.includes('\n')) {
      return text.split('\n')
        .map(item => item.trim())
        .filter(item => item && item !== '\\n' && item !== 'null' && !item.startsWith('['));
    } else if (text.includes('•')) {
      return text.split('•')
        .map(item => item.trim())
        .filter(item => item && item !== '\\n' && item !== 'null');
    } else if (text.includes('. ') && !text.match(/^\d+\./)) {
      return text.split('. ')
        .map(item => item.trim())
        .filter(item => item && item !== '\\n' && item !== 'null');
    } else {
      return [text];
    }
  };

  useEffect(() => {
    if (route.params?.recipe) {
      setRecipe(route.params.recipe);
      setIsLoading(false);
    } else if (route.params?.recipeId) {
      loadRecipe(route.params.recipeId);
    } else {
      // No recipe data provided
      setIsLoading(false);
    }
  }, [route.params]);

  const loadRecipe = async (recipeId) => {
    try {
      setIsLoading(true);
      console.log('📱 Loading recipe by ID:', recipeId);
      
      // Call the API to get the recipe details
      const response = await YesChefAPI.getRecipe(recipeId);
      
      if (response.success && response.recipe) {
        setRecipe(response.recipe);
        console.log('✅ Recipe loaded successfully:', response.recipe.title);
      } else {
        console.error('❌ Failed to load recipe:', response.error);
        Alert.alert('Error', 'Failed to load recipe details');
      }
    } catch (error) {
      console.error('❌ Error loading recipe:', error);
      Alert.alert('Error', 'Unable to load recipe. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Editing Functions
  const openEditor = (type, field, title, multiline = true) => {
    const value = recipe[field];
    
    setEditorConfig({
      type,
      title,
      field,
      value: Array.isArray(value) ? value.join('\n') : (value || ''),
      multiline
    });
    setShowEditor(true);
  };

  const handleEditorSave = async (newValue) => {
    const { field } = editorConfig;
    
    setShowEditor(false);
    setIsSaving(true);
    
    try {
      // Prepare update payload
      let updatedFields = {};
      
      // Handle special case: recipe info (prep_time, cook_time, servings)
      if (field === 'info') {
        const lines = newValue.split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.toLowerCase().startsWith('prep time:')) {
            updatedFields.prep_time = trimmedLine.substring(10).trim();
          } else if (trimmedLine.toLowerCase().startsWith('cook time:')) {
            updatedFields.cook_time = trimmedLine.substring(10).trim();
          } else if (trimmedLine.toLowerCase().startsWith('servings:')) {
            updatedFields.servings = trimmedLine.substring(9).trim();
          }
        });
      }
      // Handle array fields (ingredients, instructions)
      else if (field === 'ingredients' || field === 'instructions') {
        const arrayValue = newValue
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.trim());
        
        updatedFields[field] = arrayValue;
      }
      // Handle simple string fields
      else {
        updatedFields[field] = newValue.trim();
      }
      
      // Update local state immediately for instant feedback
      setRecipe(prev => ({
        ...prev,
        ...updatedFields
      }));
      
      // Save to backend
      console.log('💾 Saving recipe edits:', updatedFields);
      const result = await YesChefAPI.updateRecipe(recipe.id, updatedFields);
      
      if (result.success) {
        console.log('✅ Recipe updated successfully');
        showToastNotification('Saved ✓');
      } else {
        console.error('❌ Failed to update recipe:', result.error);
        showToastNotification('Save failed');
        // Reload recipe to revert changes
        if (recipe.id) {
          await loadRecipe(recipe.id);
        }
      }
    } catch (error) {
      console.error('❌ Error updating recipe:', error);
      showToastNotification('Save failed');
      // Reload recipe to revert changes
      if (recipe.id) {
        await loadRecipe(recipe.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const exitCookingMode = () => {
    setIsCookingMode(false);
    setCurrentStep(0);
  };

  // 🍳 Cooking Mode Functions
  const startCookingMode = () => {
    setIsCookingMode(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (recipe?.instructions && currentStep < recipe.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectRecipeFromCollection = () => {
    navigation.navigate('RecipeCollection');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No Recipe Selected</Text>
        <Text style={styles.emptyStateDescription}>Please select a recipe to view</Text>
        <TouchableOpacity style={styles.selectButton} onPress={selectRecipeFromCollection}>
          <Text style={styles.selectButtonText}>Browse Recipes</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Cooking mode view
  if (isCookingMode) {
    const instructions = formatRecipeField(recipe.instructions);
    
    return (
      <SafeAreaView style={styles.cookingContainer}>
        <View style={styles.cookingHeader}>
          <TouchableOpacity style={styles.exitButton} onPress={exitCookingMode}>
            <Text style={styles.exitButtonText}>Exit Cooking</Text>
          </TouchableOpacity>
          <Text style={styles.cookingTitle}>Step {currentStep + 1} of {instructions.length}</Text>
        </View>

        <ScrollView style={styles.cookingInstructions}>
          <Text style={styles.currentStepText}>
            {instructions[currentStep] || 'No instruction available'}
          </Text>
        </ScrollView>

        <View style={styles.cookingControls}>
          <TouchableOpacity 
            style={[styles.stepButton, currentStep === 0 && styles.stepButtonDisabled]}
            onPress={previousStep}
            disabled={currentStep === 0}
          >
            <Text style={styles.stepButtonText}>← Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.stepButton, currentStep === instructions.length - 1 && styles.stepButtonDisabled]}
            onPress={nextStep}
            disabled={currentStep === instructions.length - 1}
          >
            <Text style={styles.stepButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Regular recipe view
  const ingredients = formatRecipeField(recipe.ingredients);
  const instructions = formatRecipeField(recipe.instructions);

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Back Button Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Recipe</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Recipe Header */}
        <View style={styles.header}>
          <View style={styles.sectionHeader}>
            <Text style={styles.title}>{recipe.title || recipe.name || 'Untitled Recipe'}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => openEditor('title', 'title', 'Edit Title', false)}
            >
              <Icon name="edit" size={16} color="#10b981" />
            </TouchableOpacity>
          </View>
          
          {recipe.description && (
            <View style={styles.descriptionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => openEditor('description', 'description', 'Edit Description', true)}
                >
                  <Icon name="edit" size={16} color="#10b981" />
                </TouchableOpacity>
              </View>
              <Text style={styles.description}>{recipe.description}</Text>
            </View>
          )}
          
          <View style={styles.metadataContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.metadata}>
                {recipe.prep_time && (
                  <Text style={styles.metadataItem}>⏱️ Prep: {recipe.prep_time}</Text>
                )}
                {recipe.cook_time && (
                  <Text style={styles.metadataItem}>🔥 Cook: {recipe.cook_time}</Text>
                )}
                {recipe.servings && (
                  <Text style={styles.metadataItem}>👥 Serves: {recipe.servings}</Text>
                )}
                {recipe.difficulty && (
                  <Text style={styles.metadataItem}>📊 {recipe.difficulty}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
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
                <Icon name="edit" size={16} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

          {recipe.confidence_score && (
            <Text style={styles.confidenceScore}>
              ✨ Quality Score: {recipe.confidence_score}%
            </Text>
          )}
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛒 Ingredients ({ingredients.length})</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => openEditor('ingredients', 'ingredients', 'Edit Ingredients', true)}
            >
              <Icon name="edit" size={16} color="#10b981" />
            </TouchableOpacity>
          </View>
          {ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredient}>
              {ingredient.startsWith('•') ? ingredient : `• ${ingredient}`}
            </Text>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👨‍🍳 Instructions ({instructions.length} steps)</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => openEditor('instructions', 'instructions', 'Edit Instructions', true)}
            >
              <Icon name="edit" size={16} color="#10b981" />
            </TouchableOpacity>
          </View>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionStep}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>

        {/* Source Info */}
        {recipe.source && (
          <View style={styles.section}>
            <Text style={styles.sourceText}>📖 Source: {recipe.source}</Text>
          </View>
        )}
      </ScrollView>

      {/* Start Cooking Button */}
      <TouchableOpacity style={styles.cookingButton} onPress={startCookingMode}>
        <Text style={styles.cookingButtonText}>🔥 Start Cooking Mode</Text>
      </TouchableOpacity>
      
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
      
      {/* Toast Notification (inline) */}
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
      
      {/* Saving Indicator */}
      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#10b981" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Custom Header Styles (matching Categories button style from RecipeCollection)
  customHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#3B82F6', 
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    fontWeight: '600'
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  selectButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 80, // Account for options menu
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 24,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metadataItem: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginRight: 16,
    marginBottom: 4,
  },
  confidenceScore: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#10b981',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  ingredient: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginBottom: 8,
    lineHeight: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#10b981',
    marginRight: 12,
    minWidth: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  sourceText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  cookingButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cookingButtonText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  
  // Cooking Mode Styles
  cookingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  cookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exitButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  cookingTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#1f2937',
  },
  cookingInstructions: {
    flex: 1,
    padding: 24,
  },
  currentStepText: {
    fontSize: 20,
    fontFamily: 'Nunito-Regular',
    color: '#1f2937',
    lineHeight: 32,
  },
  cookingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  stepButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  stepButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  stepButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  
  // 🆕 Editing Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  descriptionContainer: {
    marginTop: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#6b7280',
    marginBottom: 4,
  },
  metadataContainer: {
    marginTop: 8,
  },
  savingOverlay: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Toast Notification Styles (from GroceryListScreen)
  toast: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
  },
});

export default RecipeViewScreen;