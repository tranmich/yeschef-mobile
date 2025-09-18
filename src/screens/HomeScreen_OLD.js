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

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ user = null, onLogout = null }) {
  // 🎨 Static background configuration (easily changeable)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_green.jpg'); // Change this line to switch backgrounds
  
  // 🎨 Background image options (comment/uncomment to change)
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_modern.jpeg');
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_orange.jpg');
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_retro.jpg');
  // const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_yellow.jpg');
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // Animation values
  const [overlayAnimation] = useState(new Animated.Value(0));

  // 🎯 Static background (no cycling) - easily changeable at the top of this file

  // 🎯 Toggle Explorer Mode
  // 🖱️ Handle background tap (close options menu)
  const handleBackgroundTap = () => {
    // Close options menu if open
    if (showOptionsMenu) {
      setShowOptionsMenu(false);
    }
  };

  // 📱 Handle menu options
  const handleProfile = () => {
    setShowOptionsMenu(false);
    console.log('🧑‍💼 Profile selected');
    // TODO: Navigate to profile screen
    // navigation.navigate('Profile');
  };

  const handleAccount = () => {
    setShowOptionsMenu(false);
    console.log('⚙️ Account selected');
    // TODO: Navigate to account settings
    // navigation.navigate('Account');
  };

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

  // 📱 Mock data for explorer (will be replaced with real data later)
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 🖼️ Static Background */}
      <ImageBackground
        source={SELECTED_BACKGROUND}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* 🌫️ Opaque White Overlay */}
        <View style={styles.whiteOverlay} />

        {/* 📱 Top Status Bar Background (White Opaque Header) */}
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

        {/* 🔍 Community Content - Now Integrated into Main Screen */}

        {/* 📱 Main Content Area - ScrollView to contain community features */}
        <SafeAreaView style={styles.mainContentContainer}>
          <ScrollView 
            style={styles.mainScrollView}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* 🍳 Community Recipes Section Container */}
            <View style={styles.sectionContainer}>
              <View style={styles.homeSection}>
                <Text style={styles.homeSectionTitle}>🍳 Community Recipes</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.recipesHomeScroll}
                  contentContainerStyle={styles.recipesHomeContainer}
                >
                  {mockRecipes.map((recipe) => (
                    <TouchableOpacity key={recipe.id} style={styles.recipeHomeCard}>
                      <Text style={styles.recipeHomeImage}>{recipe.image}</Text>
                      <Text style={styles.recipeHomeTitle}>{recipe.title}</Text>
                      <Text style={styles.recipeHomeUser}>by {recipe.user}</Text>
                      <View style={styles.recipeHomeLikes}>
                        <Icon name="heart" size={12} color="#EF4444" />
                        <Text style={styles.likesHomeText}>{recipe.likes}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* 📰 Latest Updates Section Container */}
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
        </SafeAreaView>
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

  // 🌫️ White Opaque Overlay
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Opaque white overlay
    zIndex: 1,
  },
  
  // 🖱️ Background Tap Area
  backgroundTapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

    // 🔧 Options Menu
  optionsMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 140,
    zIndex: 30,
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

  // 📱 Top Status Bar Overlay
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60, // Enough to cover status bar area
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Match explorer button opacity
    zIndex: 1, // Below content but above background
  },

  // 🔧 Floating 3-Dot Menu Container  
  floatingMenuContainer: {
    position: 'absolute',
    top: 70, // Below status bar overlay
    right: 16, // Right margin
    zIndex: 10, // Above everything else
  },

  // 🔧 Menu Button
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

  // 📱 Top Status Bar Overlay
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60, // Enough to cover status bar area
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Match explorer button opacity
    zIndex: 1, // Below content but above background
  },

  // 🔧 Floating Menu Container (Top Right)
  floatingMenuContainer: {
    position: 'absolute',
    top: 70, // Below status bar overlay
    right: 16, // Right margin
    zIndex: 10, // Above everything else
  },

  // 🔧 3-Dot Menu Styles
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsMenu: {
    position: 'absolute',
    top: 45, // Below the menu button
    right: 0, // Aligned with the button
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuOptionText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    marginVertical: 4,
    marginHorizontal: 16,
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
    marginTop: 50, // Reduced margin to shift content up
    zIndex: 2, // Above overlay
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 10, // Reduced top padding
    paddingBottom: 100, // Space for tab navigation
  },

  // 🎨 Section Containers (New visual consistency)
  sectionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },

  homeSection: {
    padding: 20,
  },
  homeSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'left', // Changed from center to left
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeHomeImage: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeHomeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  recipeHomeUser: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
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

  // 📰 News Cards (Vertical List)
  newsHomeCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)', // Slightly different background
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  newsHomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsHomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
  },
  newsHomeDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  newsHomePreview: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});