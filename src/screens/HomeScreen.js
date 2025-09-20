import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/IconLibrary';
import { ThemedText } from '../components/Typography';
import YesChefAPI from '../services/YesChefAPI';

export default function HomeScreen({ navigation, user = null, onLogout = null }) {
  // 📱 UI State
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // 🍳 Community Recipes State
  const [communityRecipes, setCommunityRecipes] = useState([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);

  // 📰 Latest Updates State  
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);

  // Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // Animation values
  const [overlayAnimation] = useState(new Animated.Value(0));

  // 🎯 Static background (no cycling) - easily changeable at the top of this file
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_modern.jpg');
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_green.jpg');
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_orange.jpg');
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_retro.jpg');
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_yellow.jpg');

  // 🖱️ Handle background tap (close options menu)
  const handleBackgroundTap = () => {
    // Close options menu if open
    if (showOptionsMenu) {
      setShowOptionsMenu(false);
    }
  };

  // 🍳 Community Recipe Navigation
  const handleCommunityRecipePress = (recipe) => {
    if (navigation) {
      navigation.navigate('CommunityRecipeDetail', { 
        communityRecipe: recipe 
      });
    } else {
      console.warn('Navigation not available for community recipe');
    }
  };

  // � Community Posts Management
  const handleMyCommunityPosts = () => {
    setShowOptionsMenu(false);
    if (navigation) {
      navigation.navigate('UserCommunityPosts');
    } else {
      console.warn('Navigation not available for community posts');
    }
  };

  // �👤 Profile Handler
  const handleProfile = () => {
    setShowOptionsMenu(false);
    console.log('👤 Profile selected');
    navigation.navigate('Profile');
  };

  // 👋 Logout Handler
  const handleLogout = async () => {
    setShowOptionsMenu(false);
    console.log('👋 Logout selected');
    
    if (onLogout) {
      try {
        console.log('🔄 Calling App.js logout function...');
        await onLogout();
        console.log('✅ Logout completed successfully');
      } catch (error) {
        console.error('❌ Logout error:', error);
        Alert.alert('Error', 'Failed to logout properly');
      }
    } else {
      console.warn('⚠️ No logout function provided to HomeScreen');
      Alert.alert('Error', 'Logout function not available');
    }
  };

  // 🍳 Load Community Recipes from API
  const loadCommunityRecipes = async () => {
    try {
      setIsLoadingCommunity(true);
      
      // Call real API endpoint
      const response = await YesChefAPI.get('/api/community/recipes?limit=10&sort=recent');
      
      if (response.success) {
        setCommunityRecipes(response.recipes || []);
      } else {
        console.error('Failed to load community recipes:', response.error);
        setCommunityRecipes([]);
      }
    } catch (error) {
      console.error('Failed to load community recipes:', error);
      
      // Fallback to mock data for development - start with realistic low counts
      setCommunityRecipes([
        { 
          id: 1, 
          title: 'Grandma\'s Pasta', 
          community_title: 'Grandma\'s Secret Pasta Recipe',
          user: 'SarahChef', 
          shared_by: 'SarahChef',
          image: '🍝', 
          likes: 3, 
          community_icon: '🍝',
          ingredients: ['2 cups pasta', '1 can tomato sauce', '1 onion, diced', '2 cloves garlic'],
          instructions: ['Boil pasta until al dente', 'Sauté onion and garlic', 'Add tomato sauce', 'Combine with pasta']
        },
        { 
          id: 2, 
          title: 'Perfect Tacos', 
          community_title: 'Street-Style Tacos',
          user: 'MikeChef', 
          shared_by: 'MikeChef',
          image: '🌮', 
          likes: 1, 
          community_icon: '🌮',
          ingredients: ['8 corn tortillas', '1 lb ground beef', '1 onion', 'Cilantro', 'Lime'],
          instructions: ['Heat tortillas', 'Cook beef with onions', 'Assemble tacos', 'Garnish with cilantro and lime']
        },
        { 
          id: 3, 
          title: 'Chocolate Cake', 
          community_title: 'Decadent Chocolate Cake',
          user: 'EmmaChef', 
          shared_by: 'EmmaChef',
          image: '🍰', 
          likes: 5, 
          community_icon: '🍰',
          ingredients: ['2 cups flour', '1.5 cups sugar', '3/4 cup cocoa powder', '2 eggs'],
          instructions: ['Preheat oven to 350°F', 'Mix dry ingredients', 'Add wet ingredients', 'Bake for 30 minutes']
        },
        { 
          id: 4, 
          title: 'Curry Bowl', 
          community_title: 'Coconut Curry Bowl',
          user: 'RajChef', 
          shared_by: 'RajChef',
          image: '🍛', 
          likes: 0, 
          community_icon: '🍛',
          ingredients: ['1 can coconut milk', '2 tbsp curry paste', '1 lb chicken', 'Jasmine rice'],
          instructions: ['Cook rice', 'Sauté chicken', 'Add coconut milk and curry paste', 'Simmer until tender']
        },
      ]);
    } finally {
      setIsLoadingCommunity(false);
    }
  };

  // 📰 Load Latest Updates from API
  const loadLatestUpdates = async () => {
    try {
      setIsLoadingUpdates(true);
      
      // Call real API endpoint  
      const response = await YesChefAPI.get('/api/latest-updates');
      
      if (response.success) {
        setLatestUpdates(response.updates || []);
      } else {
        console.error('Failed to load latest updates:', response.error);
        setLatestUpdates([]);
      }
    } catch (error) {
      console.error('Failed to load latest updates:', error);
      
      // Fallback to mock data for development
      setLatestUpdates([
        { 
          id: 'fallback_1', 
          type: 'content',
          title: 'Sheet pan formula', 
          content: 'When you don\'t feel like cooking, throw some protein, a veggie, and your favorite spice on a sheet pan.',
          category: 'tip',
          icon: '💡'
        },
        { 
          id: 'fallback_2', 
          type: 'content',
          title: 'The fastest sauce in the world', 
          content: 'A little garlic in olive oil and a splash of pasta water is all it takes.',
          category: 'technique', 
          icon: '🔥'
        },
        { 
          id: 'fallback_3', 
          type: 'activity',
          title: 'Community Update', 
          content: 'New recipes have been shared in the community!',
          category: 'social',
          icon: '👨‍🍳'
        },
      ]);
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  // Load community recipes on component mount
  useEffect(() => {
    loadCommunityRecipes();
    loadLatestUpdates();
  }, []);

  // 🔄 Refresh community recipes
  const handleRefreshCommunity = () => {
    loadCommunityRecipes();
    loadLatestUpdates();
  };

  // 📱 Mock data for community content (will be replaced with real data later)
  const mockRecipes = [
    { id: 1, title: 'Grandma\'s Pasta', user: 'Sarah M.', image: '🍝', likes: 42 },
    { id: 2, title: 'Perfect Tacos', user: 'Mike R.', image: '🌮', likes: 38 },
    { id: 3, title: 'Chocolate Cake', user: 'Emma L.', image: '🍰', likes: 51 },
    { id: 4, title: 'Curry Bowl', user: 'Raj P.', image: '🍛', likes: 29 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* 🖼️ Static Background */}
      <ImageBackground
        source={SELECTED_BACKGROUND}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* 🌫️ Opaque White Overlay */}
        <View style={styles.whiteOverlay} />

        {/* 📱 Top Status Bar Background - matches GroceryListScreen */}
        <View style={styles.topStatusBarOverlay} />

        {/* 🔧 Floating 3-Dot Menu (Top Right) */}
        <View style={styles.floatingMenuContainer}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
          >
            <Icon name="more" size={20} color="#374151" />
          </TouchableOpacity>

          {/* 📋 Options Menu Dropdown */}
          {showOptionsMenu && (
            <View style={styles.optionsMenu}>
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={handleProfile}
              >
                <Icon name="user" size={16} color="#374151" />
                <Text style={styles.menuOptionText}>Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={handleMyCommunityPosts}
              >
                <Icon name="community" size={16} color="#10b981" />
                <Text style={[styles.menuOptionText, { color: '#10b981' }]}>My Community Posts</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={[styles.menuOption, styles.logoutOption]}
                onPress={handleLogout}
              >
                <Icon name="logout" size={16} color="#DC2626" />
                <Text style={[styles.menuOptionText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 🖱️ Background Tap Area (to close options menu) */}
        <TouchableOpacity 
          style={styles.backgroundTapArea}
          onPress={handleBackgroundTap}
          activeOpacity={1}
        >
        </TouchableOpacity>

        {/* 📱 Main Content Area - Fixed Community Recipes + Scrollable Updates */}
        <View style={styles.mainContentContainer}>
          {/* 🍳 Community Recipes Section - Fixed at top */}
          <View style={styles.fixedRecipesContainer}>
            <View style={[styles.sectionContainer, styles.firstSectionContainer]}>
              <View style={styles.homeSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.homeSectionTitle}>🍳 Community Recipes</Text>
                  <TouchableOpacity 
                    onPress={handleRefreshCommunity} 
                    style={styles.refreshButton}
                    disabled={isLoadingCommunity}
                  >
                    <Icon name="refresh" size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.recipesHomeScroll}
                  contentContainerStyle={styles.recipesHomeContainer}
                >
                  {isLoadingCommunity ? (
                    // Loading state with placeholder cards
                    [1, 2, 3].map((id) => (
                      <View key={id} style={[styles.recipeHomeCard, styles.loadingCard]}>
                        <Text style={styles.recipeHomeImage}>⏳</Text>
                        <Text style={styles.recipeHomeTitle}>Loading...</Text>
                        <Text style={styles.recipeHomeUser}>...</Text>
                      </View>
                    ))
                  ) : communityRecipes.length > 0 ? (
                    // Real community recipes data
                    communityRecipes.map((recipe) => (
                      <TouchableOpacity 
                        key={recipe.id} 
                        style={styles.recipeHomeCard}
                        onPress={() => handleCommunityRecipePress(recipe)}
                      >
                        <Text style={styles.recipeHomeImage}>{recipe.community_icon || recipe.image}</Text>
                        <Text style={styles.recipeHomeTitle}>{recipe.community_title || recipe.title}</Text>
                        <Text style={styles.recipeHomeUser}>by {recipe.shared_by || recipe.user}</Text>
                        <View style={styles.recipeHomeLikes}>
                          <Icon name="heart" size={12} color="#EF4444" />
                          <Text style={styles.likesHomeText}>{recipe.likes || 0}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    // Empty state
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>🍳</Text>
                      <Text style={styles.emptyStateDescription}>No community recipes yet!</Text>
                      <Text style={styles.emptyStateHint}>Be the first to share a recipe!</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* 📰 Latest Updates Section - Scrollable */}
          <ScrollView 
            style={styles.updatesScrollView}
            contentContainerStyle={styles.updatesScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionContainer}>
              <View style={styles.homeSection}>
                <Text style={styles.homeSectionTitle}>📰 Latest Updates</Text>
                {isLoadingUpdates ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading updates...</Text>
                  </View>
                ) : (
                  latestUpdates.map((update) => (
                    <TouchableOpacity key={update.id} style={styles.newsHomeCard}>
                      <View style={styles.newsHomeHeader}>
                        <View style={styles.newsHomeContent}>
                          <Text style={styles.newsHomeTitle}>{update.title}</Text>
                          <Text style={styles.newsHomeCategory}>{update.category}</Text>
                        </View>
                      </View>
                      <Text style={styles.newsHomePreview}>{update.content}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* 🏠 Bottom spacing for tab navigation */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  },

  // 🌫️ White Opaque Overlay (matches GroceryListScreen)
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // White opaque overlay for readability
    zIndex: 1,
  },

  // 🖱️ Background Tap Area
  backgroundTapArea: {
    position: 'absolute', // Make it absolute so it doesn't affect layout
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Behind everything else
  },

  // 📱 Top Status Bar Background (matches GroceryListScreen)
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Enough to cover status bar area
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // More opaque for better status bar visibility
    zIndex: 3, // Above main overlay to ensure status bar area is clearly visible
  },  // 🔧 Floating 3-Dot Menu Container  
  floatingMenuContainer: {
    position: 'absolute',
    top: 55, // Adjusted for restored topStatusBarOverlay
    right: 16, // Right margin
    zIndex: 20, // Above everything else
  },

  // 🔧 Menu Button
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 18,
    // Shadow properties removed to fix opaque square artifact (documented in PROJECT_MASTER_GUIDE)
  },

  // 🔧 Options Menu
  optionsMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    minWidth: 140,
    zIndex: 30,
    // Shadow properties removed to fix opaque square artifact (documented in PROJECT_MASTER_GUIDE)
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuOptionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
    fontFamily: 'Nunito-Regular', // Added consistent font family
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  logoutOption: {
    // Additional styling for logout if needed
  },
  logoutText: {
    color: '#DC2626', // Red color for logout
  },

  // 📱 Main Content Styles (New Integrated Layout)
  mainContentContainer: {
    flex: 1,
    marginTop: 60, // Further reduced margin
    zIndex: 3, // Above overlay
  },

  // 🍳 Fixed Community Recipes Container
  fixedRecipesContainer: {
    paddingTop: 0, // Remove all top padding
    marginTop: 0, // Ensure no top margin
  },

  // 📰 Updates ScrollView
  updatesScrollView: {
    flex: 1,
    marginTop: 10, // Small gap between fixed recipes and scrollable updates
  },
  updatesScrollContainer: {
    paddingBottom: 100, // Space for tab navigation
  },

  // 🎨 Section Containers (New visual consistency) - subtle shadows like GroceryListScreen
  sectionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    // Subtle shadows like GroceryListScreen - these don't create artifacts
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // 🍳 First section container (Community Recipes) - no top margin
  firstSectionContainer: {
    marginTop: 0, // Remove top margin for first section
  },

  homeSection: {
    padding: 15, // Reduced from 20 to bring content closer to top
    paddingTop: 10, // Even less top padding specifically
  },
  
  // 🔄 Section Header with Refresh Button
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  
  homeSectionTitle: {
    fontSize: 20,
    // fontWeight removed - conflicts with Nunito-ExtraBold (documented in PROJECT_MASTER_GUIDE)
    color: '#1F2937',
    textAlign: 'left', // Changed from center to left
    fontFamily: 'Nunito-ExtraBold', // Added consistent font family
  },

  // 🍳 Recipe Cards (Horizontal Scroll)
  recipesHomeScroll: {
    marginTop: 10,
  },
  recipesHomeContainer: {
    paddingLeft: 0,
    paddingRight: 10, // Reduced padding since we're in containers
  },
  recipeHomeCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)', // Slightly different background
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 140,
    // Shadow properties removed to fix opaque square artifact (documented in PROJECT_MASTER_GUIDE)
  },
  recipeHomeImage: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeHomeTitle: {
    fontSize: 14,
    // fontWeight removed - conflicts with Nunito-Bold (documented in PROJECT_MASTER_GUIDE)
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Nunito-Bold', // Added consistent font family
  },
  recipeHomeUser: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Nunito-Regular', // Added consistent font family
  },
  recipeHomeLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likesHomeText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },

  // 🔄 Loading & Empty States for Community Recipes
  loadingCard: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyStateHint: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },

  // 📰 News Cards (Vertical List)
  newsHomeCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)', // Slightly different background
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    // Shadow properties removed to fix opaque square artifact (documented in PROJECT_MASTER_GUIDE)
  },
  newsHomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsHomeIcon: {
    fontSize: 20,
    marginRight: 12,
    alignSelf: 'center',
  },
  newsHomeContent: {
    flex: 1,
  },
  newsHomeTitle: {
    fontSize: 16,
    // fontWeight removed - conflicts with Nunito-Bold (documented in PROJECT_MASTER_GUIDE)
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  newsHomeCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  newsHomeDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Nunito-Regular', // Added consistent font family
  },
  newsHomePreview: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginTop: 4,
    fontFamily: 'Nunito-Regular',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 20,
  },
});