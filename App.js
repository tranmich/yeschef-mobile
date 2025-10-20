import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import YesChefAPI from './src/services/YesChefAPI';
import SimpleErrorBoundary from './src/components/SimpleErrorBoundary';
// DevConsole removed - not used in production (was only in MinimalApp.js for debugging)
import { Icon, IconButton } from './src/components/IconLibrary';
import { ThemedText, typography, loadFonts } from './src/components/Typography';
import { PremiumProvider } from './src/contexts/PremiumContext';

// Import our screens
import GroceryListScreen from './src/screens/GroceryListScreen';
import RecipeViewScreen from './src/screens/RecipeViewScreen';
import RecipeCollectionScreen from './src/screens/RecipeCollectionScreen';
import RecipeImportReviewScreen from './src/screens/RecipeImportReviewScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CommunityRecipeDetailScreen from './src/screens/CommunityRecipeDetailScreen';
import UserCommunityPostsScreen from './src/screens/UserCommunityPostsScreen';
// DebugScreen removed
import DragTestScreen from './src/screens/DragTestScreen';
import LoginScreen from './src/screens/LoginScreen';
// 🎤 Voice Recording (Phase 2 - Oct 6, 2025)
import VoiceRecipeRecorder from './src/screens/VoiceRecipeRecorder';
import TranscriptApprovalScreen from './src/screens/TranscriptApprovalScreen';
import AddRecipeScreen from './src/screens/AddRecipeScreen';
// 📷 OCR/Camera Scanning (Phase 3 - Oct 7, 2025)
import CameraRecipeScanner from './src/screens/CameraRecipeScanner';
// 🚀 V2 API Test Screen (Phase 6 - Oct 20, 2025)
import V2ApiTestScreen from './src/screens/V2ApiTestScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 🎯 NEW: Custom Horizontal Scrolling Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.customTabBar}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContainer}
        // FIXED: Remove snap behavior to allow free scrolling
        // snapToInterval={80} // REMOVED - was causing snap-back
        // snapToAlignment="center" // REMOVED - was centering forcefully  
        // decelerationRate="fast" // REMOVED - was making it snap back quickly
        decelerationRate="normal" // Natural scroll feel
        bounces={false} // Disable elastic bounce at edges
        directionalLockEnabled={true} // Lock to horizontal only
      >
        {/* Add Home button */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;
          
          // Get icon from options
          const iconComponent = options.tabBarIcon ? options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? '#28a745' : '#6b7280',
            size: 24
          }) : null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={[
                styles.customTab,
                { backgroundColor: isFocused ? '#e6f7ff' : 'transparent' }
              ]}
              onPress={onPress}
            >
              {iconComponent}
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? '#28a745' : '#6b7280' }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// 🎯 NEW: Stack Navigator for Recipe Stack (with back navigation)
function RecipeStack() {
  return (
    <SimpleErrorBoundary>
      <Stack.Navigator>
        <Stack.Screen 
          name="RecipeCollection" 
          component={RecipeCollectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RecipeDetail" 
          component={RecipeViewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RecipeImportReview" 
          component={RecipeImportReviewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </SimpleErrorBoundary>
  );
}

// ➕ NEW: Stack Navigator for Add Recipe (Phase 2 - Oct 6, 2025)
function AddRecipeStack() {
  return (
    <SimpleErrorBoundary>
      <Stack.Navigator>
        <Stack.Screen 
          name="AddRecipeHub" 
          component={AddRecipeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VoiceRecipeRecorder" 
          component={VoiceRecipeRecorder}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TranscriptApproval" 
          component={TranscriptApprovalScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CameraRecipeScanner" 
          component={CameraRecipeScanner}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RecipeImportReview" 
          component={RecipeImportReviewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </SimpleErrorBoundary>
  );
}

// 🎯 NEW: Stack Navigator for Meal Plan Stack (with recipe navigation)
function MealPlanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MealPlanMain" 
        component={MealPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeViewScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// 🏠 Home Stack Navigator (Community + Exploration)
function HomeStack({ user, onLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        options={{ headerShown: false }}
      >
        {(props) => <HomeScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Profile" 
        options={{ headerShown: false }}
      >
        {(props) => <ProfileScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen 
        name="CommunityRecipeDetail" 
        component={CommunityRecipeDetailScreen}
        options={{ 
          title: 'Community Recipe',
          headerShown: false, // CommunityRecipeDetailScreen handles its own header
          headerBackTitleVisible: false,
          headerTintColor: '#111827',
          headerStyle: {
            backgroundColor: '#fafbfc',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          }
        }}
      />
      <Stack.Screen 
        name="UserCommunityPosts" 
        component={UserCommunityPostsScreen}
        options={{ 
          title: 'My Community Posts',
          headerShown: false, // UserCommunityPostsScreen handles its own header
          headerBackTitleVisible: false,
          headerTintColor: '#111827',
          headerStyle: {
            backgroundColor: '#fafbfc',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          }
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Added missing state variable
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Use consistent mint background across all screens
  const backgroundImages = [
    require('./assets/images/backgrounds/mintbackground.jpg'),
  ];

  // Use the consistent mint background (no random selection)
  const randomBackground = backgroundImages[0];

  // 🚨 Initialize simple logging for React Native + Load fonts
  useEffect(() => {
    console.log('🚀 YesChef App Starting - React Native Mode');
    loadCustomFonts();
  }, []);

  const loadCustomFonts = async () => {
    try {
      await loadFonts(); // Re-enabled font loading
      setFontsLoaded(true);
      console.log('✅ Custom fonts loaded successfully');
    } catch (error) {
      console.error('❌ Error loading fonts:', error);
      setFontsLoaded(true); // Continue anyway with system fonts
    }
  };

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      console.log('🔍 Checking for existing authentication...');
      
      // Force clear auth state on fresh start (for testing)
      console.log('🧹 Clearing any existing auth data...');
      await YesChefAPI.clearAuthData();
      
      // Always start with login screen for proper testing
      console.log('ℹ️ Starting fresh - login required');
      setUser(null);
      setIsLoggedIn(false);
      setIsAuthenticated(false);
      
    } catch (error) {
      console.log('⚠️ Auth check error:', error);
      setUser(null);
      setIsLoggedIn(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setIsAuthenticated(true);
    console.log('✅ User logged in successfully:', userData.email);
  };

  const handleLogout = async () => {
    console.log('👋 Logging out user...');
    await YesChefAPI.logout();
    setUser(null);
    setIsLoggedIn(false);
    setIsAuthenticated(false);
    console.log('✅ User logged out successfully');
  };

  // Show loading screen while checking auth or loading fonts
  if (isLoading || !fontsLoaded) {
    return (
      <ImageBackground 
        source={randomBackground} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>YC</Text>
              </View>
            </View>
            <ActivityIndicator size="large" color="#AAC6AD" />
            <Text style={styles.loadingText}>Initializing YesChef...</Text>
            <Text style={styles.loadingSubtext}>
              {!fontsLoaded ? 'Loading custom fonts...' : 'Preparing authentication...'}
            </Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main app if authenticated
  return (
    <PremiumProvider>
      <SimpleErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
        <Tab.Navigator
          tabBar={props => <CustomTabBar {...props} />}
          screenOptions={{
            headerStyle: styles.header,
            headerTintColor: '#111827',
            headerTitleStyle: styles.headerTitle,
          }}
        >
        {/* 🏠 HOME - Explorer & Inspiration */}
        <Tab.Screen 
          name="Home" 
          options={{
            title: 'Home',
            headerShown: false, // HomeStack handles headers
            tabBarIcon: ({ color, size, focused }) => (
              <Icon 
                name={focused ? 'homeFilled' : 'home'} 
                size={size} 
                color={color}
              />
            ),
          }}
        >
          {(props) => <HomeStack {...props} user={user} onLogout={handleLogout} />}
        </Tab.Screen>
        
        {/* #1 PRIORITY - Grocery List (Store Companion) */}
        <Tab.Screen 
          name="Grocery" 
          component={GroceryListScreen}
          options={{
            title: 'Grocery List',
            headerShown: false, // Hide the navigation header since we have our own clean header
            tabBarIcon: ({ color, size, focused }) => (
              <Icon 
                name={focused ? 'groceryTabFilled' : 'groceryTab'} 
                size={size} 
                color={color}
              />
            ),
          }}
        />
        
        {/* #3 BONUS - Recipe Collection (Evening Browsing) - NOW WITH STACK */}
        <Tab.Screen 
          name="Recipes" 
          component={RecipeStack}
          options={{
            title: 'My Recipes',
            headerShown: false, // Let stack handle headers
            tabBarIcon: ({ color, size, focused }) => (
              <Icon 
                name={focused ? 'recipesTabFilled' : 'recipesTab'} 
                size={size} 
                color={color}
              />
            ),
          }}
        />
        
        {/* ➕ NEW - Add Recipe Hub (Phase 2 - Oct 6, 2025) */}
        <Tab.Screen 
          name="AddRecipe" 
          component={AddRecipeStack}
          options={{
            title: 'Add Recipe',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Icon 
                name={focused ? 'addRecipeFilled' : 'addRecipe'} 
                size={size} 
                color={color}
              />
            ),
          }}
        />
        
        {/* #4 BONUS - Meal Planning (Weekly Review) */}
        <Tab.Screen 
          name="Plan" 
          component={MealPlanStack}
          options={{
            title: 'Meal Plan',
            headerShown: false, // Hide the navigation header since we have our own clean header
            tabBarIcon: ({ color, size, focused }) => (
              <Icon 
                name={focused ? 'mealPlanTabFilled' : 'mealPlanTab'} 
                size={size} 
                color={color}
              />
            ),
          }}
        />
        
        {/* #5 NEW - Friends & Collaboration */}
        <Tab.Screen 
          name="Friends" 
          component={FriendsScreen}
          options={{
            title: 'Friends',
            headerShown: false, // Hide the navigation header since we have our own clean header
            tabBarIcon: ({ color, size, focused }) => (
              <Icon 
                name={focused ? 'user-friends-filled' : 'user-friends'} 
                size={size} 
                color={color}
              />
            ),
          }}
        />
        
        {/* 🚀 V2 API Test - Phase 6 (Oct 20, 2025) */}
        <Tab.Screen 
          name="V2ApiTest" 
          component={V2ApiTestScreen}
          options={{
            title: 'V2 Test',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Text style={{ fontSize: size, color }}>🚀</Text>
            ),
          }}
        />
        
        {/* Debug tab removed for cleaner navigation */}
      </Tab.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
    </SimpleErrorBoundary>
    </PremiumProvider>
  );
}

const styles = StyleSheet.create({
  // 🎨 Beautiful Loading & Background Styles
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Much lighter overlay for brighter background
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Reduced opacity to match login form
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10.32,
    elevation: 16,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Reduced opacity for consistency
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
    fontFamily: 'Nunito-ExtraBold',
  },
  loadingText: {
    fontSize: 18,
    color: '#1F2937',
    marginTop: 16,
    fontWeight: '600',
    fontFamily: 'Nunito-ExtraBold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  // 🎯 NEW: Custom Horizontal Scrolling Tab Bar Styles
  customTabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingBottom: 20, // Extra padding for safe area
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    // IMPROVED: Ensure content is wide enough for all tabs
    minWidth: '100%', // Minimum full width
    flexGrow: 1, // Allow growth beyond screen if needed
  },
  customTab: {
    width: 80,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  // 🎯 OLD: Keep existing header styles
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 8,
    height: 80,
  },
  header: {
    backgroundColor: '#fafbfc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '600',
  },
});
