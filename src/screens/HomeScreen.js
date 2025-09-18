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

export default function HomeScreen({ user = null, onLogout = null }) {
  // 📱 UI State
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // 🍳 Community Recipes State
  const [communityRecipes, setCommunityRecipes] = useState([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);

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

  // 👤 Profile Handler
  const handleProfile = () => {
    setShowOptionsMenu(false);
    console.log('👤 Profile selected');
    // TODO: Navigate to profile screen
  };

  // ⚙️ Account Handler
  const handleAccount = () => {
    setShowOptionsMenu(false);
    console.log('⚙️ Account selected');
    // TODO: Navigate to account settings
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
      
      // Fallback to mock data for development
      setCommunityRecipes([
        { id: 1, title: 'Grandma\'s Pasta', user: 'SarahChef', image: '🍝', likes: 42, community_icon: '🍝' },
        { id: 2, title: 'Perfect Tacos', user: 'MikeChef', image: '🌮', likes: 38, community_icon: '🌮' },
        { id: 3, title: 'Chocolate Cake', user: 'EmmaChef', image: '🍰', likes: 51, community_icon: '🍰' },
        { id: 4, title: 'Curry Bowl', user: 'RajChef', image: '🍛', likes: 29, community_icon: '🍛' },
      ]);
    } finally {
      setIsLoadingCommunity(false);
    }
  };

  // Load community recipes on component mount
  useEffect(() => {
    loadCommunityRecipes();
  }, []);

  // 🔄 Refresh community recipes
  const handleRefreshCommunity = () => {
    loadCommunityRecipes();
  };

  // 📱 Mock data for community content (will be replaced with real data later)
  const mockRecipes = [
    { id: 1, title: 'Grandma\'s Pasta', user: 'Sarah M.', image: '🍝', likes: 42 },
    { id: 2, title: 'Perfect Tacos', user: 'Mike R.', image: '🌮', likes: 38 },
    { id: 3, title: 'Chocolate Cake', user: 'Emma L.', image: '🍰', likes: 51 },
    { id: 4, title: 'Curry Bowl', user: 'Raj P.', image: '🍛', likes: 29 },
  ];

  const mockNews = [
    { id: 1, title: 'New Recipe Sharing Feature!', date: 'Sep 15', preview: 'Share your favorite recipes with the community...' },
    { id: 2, title: 'Fall Cooking Tips', date: 'Sep 12', preview: 'Make the most of seasonal ingredients...' },
    { id: 3, title: 'App Update 2.1.0', date: 'Sep 10', preview: 'Bug fixes and performance improvements...' },
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
                onPress={handleAccount}
              >
                <Icon name="settings" size={16} color="#374151" />
                <Text style={styles.menuOptionText}>Account</Text>
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
                      <TouchableOpacity key={recipe.id} style={styles.recipeHomeCard}>
                        <Text style={styles.recipeHomeImage}>{recipe.community_icon || recipe.image}</Text>
                        <Text style={styles.recipeHomeTitle}>{recipe.title}</Text>
                        <Text style={styles.recipeHomeUser}>by {recipe.user}</Text>
                        <View style={styles.recipeHomeLikes}>
                          <Icon name="heart" size={12} color="#EF4444" />
                          <Text style={styles.likesHomeText}>{recipe.likes}</Text>
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
                {mockNews.map((article) => (
                  <TouchableOpacity key={article.id} style={styles.newsHomeCard}>
                    <View style={styles.newsHomeHeader}>
                      <Text style={styles.newsHomeTitle}>{article.title}</Text>
                      <Text style={styles.newsHomeDate}>{article.date}</Text>
                    </View>
                    <Text style={styles.newsHomePreview}>{article.preview}</Text>
                  </TouchableOpacity>
                ))}
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
  newsHomeTitle: {
    fontSize: 16,
    // fontWeight removed - conflicts with Nunito-Bold (documented in PROJECT_MASTER_GUIDE)
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
    fontFamily: 'Nunito-Bold', // Added consistent font family
  },
  newsHomeDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Nunito-Regular', // Added consistent font family
  },
  newsHomePreview: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontFamily: 'Nunito-Regular', // Added consistent font family
  },
  bottomSpacing: {
    height: 20,
  },
});