import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import YesChefAPI from './src/services/YesChefAPI';
import SimpleErrorBoundary from './src/components/SimpleErrorBoundary';
import DevConsole from './src/components/DevConsole';

// Import our screens
import GroceryListScreen from './src/screens/GroceryListScreen';
import RecipeViewScreen from './src/screens/RecipeViewScreen';
import RecipeCollectionScreen from './src/screens/RecipeCollectionScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import DebugScreen from './src/screens/DebugScreen';
import DragTestScreen from './src/screens/DragTestScreen';
import LoginScreen from './src/screens/LoginScreen';

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
        snapToInterval={80} // Width of each tab
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {/* Add Home button */}
        <TouchableOpacity
          style={[styles.customTab, { backgroundColor: '#f3f4f6' }]}
          onPress={() => navigation.navigate('Grocery')} // Default home to Grocery
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
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
    <Stack.Navigator>
      <Stack.Screen 
        name="RecipeCollection" 
        component={RecipeCollectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeViewScreen}
        options={{ 
          title: 'Recipe',
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

  // 🚨 Initialize simple logging for React Native
  useEffect(() => {
    console.log('🚀 YesChef App Starting - React Native Mode');
  }, []);

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

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Initializing YesChef...</Text>
        <Text style={styles.loadingSubtext}>Preparing authentication...</Text>
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main app if authenticated
  return (
    <DevConsole>
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
        {/* #1 PRIORITY - Grocery List (Store Companion) */}
        <Tab.Screen 
          name="Grocery" 
          component={GroceryListScreen}
          options={{
            title: 'Grocery List',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20, color }}>🛒</Text>
            ),
          }}
        />
        
        {/* #2 PRIORITY - Recipe Reader (Cooking Companion) */}
        <Tab.Screen 
          name="Recipe" 
          component={RecipeViewScreen}
          options={{
            title: 'Recipe',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20, color }}>👨‍🍳</Text>
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
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20, color }}>📚</Text>
            ),
          }}
        />
        
        {/* #4 BONUS - Meal Planning (Weekly Review) */}
        <Tab.Screen 
          name="Plan" 
          component={MealPlanScreen}
          options={{
            title: 'Meal Plan',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20, color }}>📅</Text>
            ),
          }}
        />
        
        {/* #5 DRAG TEST - Testing Drag & Drop Functionality */}
        <Tab.Screen 
          name="DragTest"
          options={{
            title: 'Drag Test',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20, color }}>🔄</Text>
            ),
          }}
        >
          {() => <DragTestScreen />}
        </Tab.Screen>

        {/* #6 DEBUG - Development Testing (Hidden unless scrolled) */}
        <Tab.Screen 
          name="Debug"
          options={{
            title: 'Debug',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20, color }}>🔧</Text>
            ),
          }}
        >
          {() => <DebugScreen user={user} onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
    </SimpleErrorBoundary>
    </DevConsole>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#111827',
    marginTop: 12,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    fontWeight: '600',
  },
});
