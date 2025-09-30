/**
 * 🎨 Community Recipe Detail Screen - Clean Build 
 * Beautiful display of community-shared recipes with enhanced formatting
 * Built from working RecipeViewScreen foundation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Vibration,
  StatusBar,
  Platform,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';
import { Icon } from '../components/IconLibrary';
import { getCommunityBackgroundColor } from '../utils/communityStyles';

const CommunityRecipeDetailScreen = ({ route, navigation }) => {
  const { communityRecipe } = route.params;
  
  // Core state
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Community features state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Animation refs
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const downloadScaleAnim = useRef(new Animated.Value(1)).current;

  // 🔧 Enhanced OCR text repair (copied from working RecipeViewScreen)
  const repairOCRText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    return text
      // Fix common OCR/AI transcription errors
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
      // Fix measurement spacing (1cup -> 1 cup)
      .replace(/(\d+)([a-zA-Z])/g, '$1 $2')
      // Fix specific food-related OCR errors
      .replace(/extr a-virgin/g, 'extra-virgin')
      .replace(/ol ive oil/g, 'olive oil') 
      .replace(/unsal ted but ter/g, 'unsalted butter')
      .replace(/gr ated/g, 'grated')
      .replace(/sea son/g, 'season')
      .replace(/tem perature/g, 'temperature')
      .replace(/refrig erate/g, 'refrigerate')
      // Fix fractions
      .replace(/½/g, '1/2')
      .replace(/¼/g, '1/4')
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

  // 📋 Enhanced Recipe Field Parsing (using proven logic from RecipeViewScreen)
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
          console.warn('📱 Failed to parse field JSON:', field);
          processedField = field;
        }
      }
    }
    
    // Handle array input (could be strings or objects)
    if (Array.isArray(processedField)) {
      const result = processedField
        .filter(item => {
          // Better filtering - check if item exists and has usable content
          if (!item) return false;
          
          // If it's an object, check if it has meaningful properties
          if (typeof item === 'object') {
            const hasUsefulData = item.ingredient || item.text || item.name || item.description;
            return !!hasUsefulData;
          }
          
          // If it's a string, check if it's not empty or just '[object Object]'
          const stringValue = item.toString().trim();
          const isValid = stringValue && stringValue !== '[object Object]' && !stringValue.startsWith('[');
          return isValid;
        })
        .map((item, index) => {
          let formatted = '';
          
          // Handle object items (this is the key fix for complex data structures!)
          if (typeof item === 'object' && item !== null) {
            // Try different common object structures
            if (item.ingredient) {
              // This is the exact format we're seeing: {"ingredient": "text"}
              formatted = item.ingredient;
            } else if (item.text) {
              formatted = item.text;
            } else if (item.name) {
              // Sometimes stored as name field
              const parts = [];
              if (item.quantity) parts.push(item.quantity);
              if (item.unit) parts.push(item.unit);
              parts.push(item.name);
              formatted = parts.join(' ');
            } else if (item.description) {
              formatted = item.description;
            } else {
              // Try to extract meaningful text from object
              const values = Object.values(item).filter(v => 
                v && typeof v === 'string' && v.trim() && v !== '[object Object]'
              );
              formatted = values.join(' ') || '[Unable to parse item]';
            }
          } else {
            // Handle string items
            formatted = item.toString().trim();
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
          
          return formatted;
        })
        .filter(item => item && item.trim()); // Remove any empty items
        
      return result;
    }

    // Handle string input - fix order: split first, then clean
    let text = processedField.toString();
    
    // Handle long concatenated strings with multiple items separated by quotes FIRST
    if (text.includes('","') || text.includes('","')) {
      const items = text.split(/[",]+/).filter(item => item.trim() && item !== '[' && item !== ']');
      return items.map(item => repairOCRText(item.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, '')));
    }
    
    // Convert various formats to array - split BEFORE cleaning
    if (text.includes('\n')) {
      return text.split('\n')
        .map(item => item.trim())
        .filter(item => item && item !== '\\n' && item !== 'null' && !item.startsWith('['))
        .map(item => repairOCRText(item)); // Apply cleaning AFTER splitting
    } else if (text.includes('•')) {
      return text.split('•')
        .map(item => item.trim())
        .filter(item => item && item !== '\\n' && item !== 'null')
        .map(item => repairOCRText(item)); // Apply cleaning AFTER splitting
    } else if (text.includes('. ') && !text.match(/^\d+\./)) {
      return text.split('. ')
        .map(item => item.trim())
        .filter(item => item && item !== '\\n' && item !== 'null')
        .map(item => repairOCRText(item)); // Apply cleaning AFTER splitting
    } else {
      return [repairOCRText(text)]; // Apply cleaning to single item
    }
  };

  // Initialize component
  useEffect(() => {
    if (communityRecipe) {
      setRecipe(communityRecipe);
      setIsLoading(false);
      loadLikeData();
      loadComments();
    } else {
      Alert.alert('Error', 'No community recipe data provided');
      navigation.goBack();
    }
  }, [communityRecipe]);

  const loadLikeData = async () => {
    try {
      // TODO: Implement real like system
      setLikeCount(communityRecipe.likes || 0);
      setIsLiked(false); // TODO: Check if current user liked this recipe
    } catch (error) {
      console.error('Failed to load like data:', error);
    }
  };

  const loadComments = async () => {
    try {
      // TODO: Implement real comments system
      setComments([]);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      // Animate like button
      Animated.sequence([
        Animated.timing(likeScaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(likeScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // TODO: Implement real like API call
      if (isLiked) {
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
        Vibration.vibrate(50);
      }
    } catch (error) {
      console.error('Failed to like recipe:', error);
      Alert.alert('Error', 'Failed to like recipe');
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Animate download button
      Animated.timing(downloadScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(downloadScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });

      // TODO: Implement recipe download/save to user's recipes
      Alert.alert(
        '📥 Download Recipe',
        'Save this community recipe to your personal collection?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Recipe', onPress: () => saveRecipeToCollection() }
        ]
      );
    } catch (error) {
      console.error('Failed to download recipe:', error);
      Alert.alert('Error', 'Failed to download recipe');
    } finally {
      setIsDownloading(false);
    }
  };

  const saveRecipeToCollection = async () => {
    try {
      // TODO: Implement save to user's personal recipes
      Alert.alert('Success!', 'Recipe saved to your collection');
    } catch (error) {
      console.error('Failed to save recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading community recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format ingredients and instructions using the enhanced parsing
  const ingredients = formatRecipeField(recipe.ingredients);
  const instructions = formatRecipeField(recipe.instructions);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="back" size="md" color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Recipe</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more" size="md" color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Community Recipe Title Section */}
        <View style={[
          styles.titleSection,
          {
            backgroundColor: getCommunityBackgroundColor(recipe.community_background)
          }
        ]}>
          <Text style={styles.communityIcon}>{recipe.community_icon || '🍽️'}</Text>
          <Text style={styles.title}>{recipe.community_title || recipe.title}</Text>
          <Text style={styles.sharedBy}>Shared by {recipe.shared_by || recipe.user}</Text>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Animated.View style={{ transform: [{ scale: likeScaleAnim }] }}>
              <TouchableOpacity 
                onPress={handleLike} 
                style={[styles.actionButton, isLiked && styles.likedButton]}
              >
                <Icon name="heart" size="sm" color={isLiked ? "#ffffff" : "#6b7280"} />
                <Text style={[styles.actionButtonText, isLiked && styles.likedButtonText]}>
                  {likeCount} Likes
                </Text>
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="chat" size="sm" color="#6b7280" />
              <Text style={styles.actionButtonText}>Comment</Text>
            </TouchableOpacity>
            
            <Animated.View style={{ transform: [{ scale: downloadScaleAnim }] }}>
              <TouchableOpacity 
                onPress={handleDownload} 
                style={[styles.actionButton, styles.downloadButton]}
                disabled={isDownloading}
              >
                <Icon name="download" size="sm" color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.downloadButtonText]}>
                  {isDownloading ? 'Saving...' : 'Download'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Community Description */}
        {recipe.community_description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 About This Recipe</Text>
            <Text style={styles.description}>{recipe.community_description}</Text>
          </View>
        )}

        {/* Recipe Info */}
        <View style={styles.section}>
          <View style={styles.recipeInfoRow}>
            {recipe.servings && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Serves</Text>
                <Text style={styles.infoValue}>{recipe.servings}</Text>
              </View>
            )}
            {recipe.prep_time && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Prep Time</Text>
                <Text style={styles.infoValue}>{recipe.prep_time}</Text>
              </View>
            )}
            {recipe.cook_time && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Cook Time</Text>
                <Text style={styles.infoValue}>{recipe.cook_time}</Text>
              </View>
            )}
          </View>
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
    </SafeAreaView>
  );
};

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
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#1f2937',
  },
  menuButton: {
    padding: 8,
  },
  titleSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  communityIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  sharedBy: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  likedButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  downloadButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-Medium',
    color: '#6b7280',
  },
  likedButtonText: {
    color: '#ffffff',
  },
  downloadButtonText: {
    color: '#ffffff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  recipeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Medium',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#1f2937',
  },
  ingredient: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 6,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    marginRight: 12,
    flexShrink: 0,
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
});

export default CommunityRecipeDetailScreen;