import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';

export default function DebugScreen({ user = null, onLogout = null }) {
  const [debugInfo, setDebugInfo] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [testResults, setTestResults] = useState([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    refreshDebugInfo();
  }, []);

  const refreshDebugInfo = () => {
    const info = YesChefAPI.getDebugInfo();
    setDebugInfo(info);
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResults([]);
    
    try {
      // Test 1: Backend connection
      addTestResult('🔌 Testing backend connection...');
      const connectionTest = await YesChefAPI.testConnection();
      
      if (connectionTest.success) {
        addTestResult('✅ Backend connection: Success');
        setConnectionStatus('connected');
      } else {
        addTestResult(`❌ Backend connection: ${connectionTest.error}`);
        setConnectionStatus('failed');
        return;
      }

      // Test 2: Authentication check
      addTestResult('🔐 Checking authentication...');
      if (YesChefAPI.isAuthenticated()) {
        addTestResult('✅ Authentication: Valid token present');
      } else {
        addTestResult('❌ Authentication: No valid token');
        return;
      }

      // Test 3: Grocery lists
      addTestResult('🛒 Testing grocery lists API...');
      const groceryResult = await YesChefAPI.getGroceryLists();
      if (groceryResult.success) {
        addTestResult(`✅ Grocery lists: Fetched ${groceryResult.lists?.length || 0} lists`);
      } else {
        addTestResult(`❌ Grocery lists: ${groceryResult.error}`);
      }

      // Test 4: Recipes
      addTestResult('📚 Testing recipes API...');
      const recipesResult = await YesChefAPI.getRecipes();
      if (recipesResult.success) {
        addTestResult(`✅ Recipes: Fetched ${recipesResult.recipes?.length || 0} recipes`);
      } else {
        addTestResult(`❌ Recipes: ${recipesResult.error}`);
      }

      // Test 5: Recipe import simulation
      addTestResult('🌐 Testing recipe import API...');
      const importResult = await YesChefAPI.importRecipe('https://example.com/test-recipe');
      if (importResult.success) {
        addTestResult('✅ Recipe import: API responded successfully');
      } else {
        addTestResult(`❌ Recipe import: ${importResult.error}`);
      }

    } catch (error) {
      addTestResult(`💥 Test failed: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const addTestResult = (message) => {
    setTestResults(prev => [...prev, message]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout? You will need to enter your credentials again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Logout', 
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header with Logout */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>🔧 Debug Console</Text>
              <Text style={styles.subtitle}>Development & Testing Tools</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Current User Session</Text>
          <View style={styles.userCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not logged in'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID:</Text>
              <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, styles.success]}>
                ✅ Authenticated
              </Text>
            </View>
          </View>
        </View>

        {/* Connection Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔌 Backend Connection</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Backend URL:</Text>
            <Text style={styles.infoValue}>{debugInfo.baseURL}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Has Token:</Text>
            <Text style={[styles.infoValue, debugInfo.hasToken ? styles.success : styles.error]}>
              {debugInfo.hasToken ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Auth Mode:</Text>
            <Text style={styles.infoValue}>{debugInfo.authMode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Connection:</Text>
            <Text style={[
              styles.infoValue,
              connectionStatus === 'connected' ? styles.success : 
              connectionStatus === 'failed' ? styles.error : styles.warning
            ]}>
              {connectionStatus === 'connected' ? '✅ Connected' :
               connectionStatus === 'failed' ? '❌ Failed' : '⚠️ Testing...'}
            </Text>
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 API Test Results</Text>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No tests run yet. Click "Run API Tests" below.</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.testResult}>
                {result}
              </Text>
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={testConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>🔍 Run Full API Tests</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={refreshDebugInfo}
          >
            <Text style={styles.secondaryButtonText}>🔄 Refresh Debug Info</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>🚪 Logout & Clear Session</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 App Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0 - Production</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mode:</Text>
            <Text style={styles.infoValue}>Authenticated Only</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data Source:</Text>
            <Text style={styles.infoValue}>PostgreSQL Database</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>React Native + Expo</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
    flex: 2,
    textAlign: 'right',
  },
  success: {
    color: '#059669',
  },
  error: {
    color: '#dc2626',
  },
  warning: {
    color: '#d97706',
  },
  noResults: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  testResult: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
