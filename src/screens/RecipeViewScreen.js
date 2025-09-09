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

export default function RecipeViewScreen({ navigation, route }) {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCookingMode, setIsCookingMode] = useState(false);

  // 🔧 FIX #3: Repair OCR-corrupted text from cookbook scanning
  const repairOCRText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // This appears to be OCR-corrupted text from cookbook scanning
    // Only fix KNOWN corrupted patterns to avoid breaking valid text
    return text
      // Fix specific known OCR word breaks (very conservative)
      .replace(/extr a-virgin/g, 'extra-virgin')
      .replace(/ol ive oil/g, 'olive oil') 
      .replace(/unsal ted but ter/g, 'unsalted butter')
      .replace(/gr ated/g, 'grated')
      .replace(/lemon z est/g, 'lemon zest')
      .replace(/z ested/g, 'zested')
      .replace(/cor ed/g, 'cored')
      .replace(/sl iced/g, 'sliced')
      .replace(/sha ved/g, 'shaved')
      .replace(/P armesan/g, 'Parmesan')
      .replace(/R omano/g, 'Romano')
      .replace(/boi ling/g, 'boiling')
      .replace(/w ater/g, 'water')
      .replace(/br ead flour/g, 'bread flour')
      .replace(/old-f ashioned/g, 'old-fashioned')
      .replace(/r olled/g, 'rolled')
      .replace(/y east/g, 'yeast')
      .replace(/al l-purpose/g, 'all-purpose')
      .replace(/W orcestershir e/g, 'Worcestershire')
      .replace(/mustar d/g, 'mustard')
      .replace(/baguet te/g, 'baguette')
      .replace(/squeezedfrom/g, 'squeezed from')
      .replace(/ingredientstomake/g, 'ingredients to make')
      .replace(/vegetari\./g, 'vegetarian.')
      .replace(/agrill/g, 'a grill')  // Fix the "Prepare agrill" issue
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix missing spaces before capital letters
      // REMOVED the aggressive single-letter pattern that was breaking "a grill"
      // Only clean up multiple spaces (safe operation)
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 🔧 FIX #3: Use proven web formatting logic + OCR repair
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
          console.warn('Failed to parse JSON field:', field);
          processedField = field;
        }
      }
    }
    
    // Handle array input
    if (Array.isArray(processedField)) {
      return processedField
        .filter(item => item && item.toString().trim())
        .map(item => {
          let formatted = item.toString().trim();
          
          // Apply OCR text repair
          formatted = repairOCRText(formatted);
          
          // Handle unicode characters
          formatted = formatted.replace(/\\u([0-9a-fA-F]{4})/g, (match, unicode) => {
            return String.fromCharCode(parseInt(unicode, 16));
          });
          
          return formatted;
        });
    }
    
    // Handle string input - split by newlines and clean each line
    return processedField
      .split(/\n+/)
      .filter(line => line.trim())
      .map(item => {
        let formatted = item.trim();
        
        // Apply OCR text repair
        formatted = repairOCRText(formatted);
        
        // Handle unicode characters
        formatted = formatted.replace(/\\u([0-9a-fA-F]{4})/g, (match, unicode) => {
          return String.fromCharCode(parseInt(unicode, 16));
        });
        
        return formatted;
      });
  };

  useEffect(() => {
    loadRecipe();
  }, [route?.params?.recipeId]);

  const loadRecipe = async () => {
    setIsLoading(true);
    try {
      // Get recipe ID from route params or use a default
      const recipeId = route?.params?.recipeId;
      
      if (recipeId) {
        const result = await YesChefAPI.getRecipe(recipeId);
        if (result.success) {
          setRecipe(result.recipe);
        } else {
          Alert.alert('Error', result.error || 'Failed to load recipe');
        }
      } else {
        // No recipe selected - show message
        setRecipe(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const startCookingMode = () => {
    setIsCookingMode(true);
    setCurrentStep(0);
  };

  const exitCookingMode = () => {
    setIsCookingMode(false);
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
    navigation.navigate('Recipes');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍🍳</Text>
          <Text style={styles.emptyTitle}>No Recipe Selected</Text>
          <Text style={styles.emptyText}>
            Choose a recipe from your collection to start cooking!
          </Text>
          <TouchableOpacity style={styles.selectButton} onPress={selectRecipeFromCollection}>
            <Text style={styles.selectButtonText}>📚 Browse My Recipes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCookingMode) {
    // 🔧 FIX #3: Use improved parsing for cooking mode
    const instructions = formatRecipeField(recipe.instructions);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cookingHeader}>
          <TouchableOpacity style={styles.exitButton} onPress={exitCookingMode}>
            <Text style={styles.exitButtonText}>← Exit Cooking</Text>
          </TouchableOpacity>
          <Text style={styles.stepCounter}>
            Step {currentStep + 1} of {instructions.length}
          </Text>
        </View>

        <ScrollView style={styles.cookingContent}>
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

  // Regular recipe view - 🔧 FIX #3: Use improved parsing
  const ingredients = formatRecipeField(recipe.ingredients);
  const instructions = formatRecipeField(recipe.instructions);

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  selectButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metadataItem: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 16,
    marginBottom: 4,
  },
  confidenceScore: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  ingredient: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginRight: 12,
    minWidth: 24,
  },
  instructionText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    flex: 1,
  },
  sourceText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  cookingButton: {
    margin: 20,
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cookingButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Cooking Mode Styles
  cookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#dc2626',
  },
  exitButton: {
    padding: 8,
  },
  exitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepCounter: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cookingContent: {
    flex: 1,
    padding: 20,
  },
  currentStepText: {
    fontSize: 20,
    color: '#111827',
    lineHeight: 32,
  },
  cookingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  stepButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  stepButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  stepButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
