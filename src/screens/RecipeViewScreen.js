import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';
import { Icon } from '../components/IconLibrary';
import RecipeSharingModal from '../components/RecipeSharingModal';

const RecipeViewScreen = ({ route, navigation }) => {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);

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
    console.log('📱 formatRecipeField called with:', field);
    console.log('📱 formatRecipeField type check:', typeof field, Array.isArray(field));
    
    if (!field) return [];
    
    let processedField = field;
    
    // Handle JSON string input
    if (typeof field === 'string') {
      // Check if it's a JSON array string
      if (field.trim().startsWith('[') && field.trim().endsWith(']')) {
        try {
          processedField = JSON.parse(field);
          console.log('📱 Parsed JSON field:', processedField);
        } catch (e) {
          // If JSON parsing fails, treat as regular string
          console.warn('📱 Failed to parse field JSON:', field);
          processedField = field;
        }
      }
    }
    
    // Handle array input (could be strings or objects)
    if (Array.isArray(processedField)) {
      console.log('📱 Processing field array with length:', processedField.length);
      
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
          console.log('📱 Filtering item string:', stringValue, 'Valid:', isValid);
          return isValid;
        })
        .map((item, index) => {
          console.log(`📱 Processing item ${index}:`, item);
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
            console.log('📱 Used string item:', formatted);
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
          
          console.log(`📱 Final formatted item ${index}:`, formatted);
          return formatted;
        })
        .filter(item => item && item.trim()); // Remove any empty items
        
      console.log('📱 Final result array:', result);
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

  const exitCookingMode = () => {
    setIsCookingMode(false);
    setCurrentStep(0);
  };

  // 📤 Share Recipe Functionality
  const handleShareRecipe = () => {
    setShowOptionsMenu(false);
    setShowSharingModal(true);
  };

  const handleShareConfirm = async (sharingData) => {
    try {
      // Build the sharing payload
      const sharePayload = {
        // Original recipe reference
        recipe_id: recipe.id,
        
        // Community-specific metadata
        community_title: sharingData.community_title,
        community_description: sharingData.community_description,
        community_background: sharingData.community_background,
        community_icon: sharingData.community_icon,
        
        // 🔧 Include full recipe data for community display
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        servings: recipe.servings,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        source: recipe.source,
        
        // Attribution data
        shared_by: 'Current User', // TODO: Replace with actual user name
        shared_at: new Date().toISOString(),
        likes: 0, // Start with 0 likes
      };

      console.log('� Sharing recipe to community:', sharePayload.community_title);

      // Call the API to share the recipe with full recipe data
      const response = await YesChefAPI.post('/api/community/recipes', sharePayload);

      if (response.success) {
        Alert.alert(
          '🎉 Recipe Shared!', 
          'Your recipe has been shared with the community and will appear in the Community Recipes section.',
          [{ text: 'Awesome!', style: 'default' }]
        );
      } else {
        throw new Error(response.error || 'Failed to share recipe');
      }
    } catch (error) {
      console.error('Failed to share recipe:', error);
      throw error; // Let the modal handle the error
    }
  };

  const handleOptionsMenuPress = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleBackgroundTap = () => {
    if (showOptionsMenu) {
      setShowOptionsMenu(false);
    }
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

  const startCookingMode = () => {
    setIsCookingMode(true);
    setCurrentStep(0);
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
      {/* 🔧 3-Dot Options Menu */}
      <View style={styles.optionsMenuContainer}>
        <TouchableOpacity 
          style={styles.optionsButton} 
          onPress={handleOptionsMenuPress}
        >
          <Icon name="more" size={24} color="#374151" />
        </TouchableOpacity>
        
        {showOptionsMenu && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={handleShareRecipe}
            >
              <Icon name="share" size={18} color="#374151" />
              <Text style={styles.optionText}>Share Recipe</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Background tap area to close menu */}
      <TouchableOpacity 
        style={styles.backgroundTapArea}
        onPress={handleBackgroundTap}
        activeOpacity={1}
      >
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        {/* Recipe Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title || recipe.name || 'Untitled Recipe'}</Text>
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
          
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

          {recipe.confidence_score && (
            <Text style={styles.confidenceScore}>
              ✨ Quality Score: {recipe.confidence_score}%
            </Text>
          )}
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Ingredients ({ingredients.length})</Text>
          {ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredient}>
              {ingredient.startsWith('•') ? ingredient : `• ${ingredient}`}
            </Text>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🍳 Instructions ({instructions.length} steps)</Text>
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

      {/* 📤 Recipe Sharing Modal */}
      <RecipeSharingModal
        visible={showSharingModal}
        recipe={recipe}
        onClose={() => setShowSharingModal(false)}
        onShare={handleShareConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // 🔧 Options Menu Styles (matching HomeScreen pattern)
  optionsMenuContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 20,
  },
  optionsButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionsMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    minWidth: 140,
    zIndex: 30,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'Nunito-Regular',
  },
  backgroundTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
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
});

export default RecipeViewScreen;