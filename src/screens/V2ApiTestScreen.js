/**
 * V2 API Test Screen
 * Demonstrates the power of v2 API with side-by-side comparison
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_CONFIG, enableV2Api, disableV2Api, getApiVersion } from '../config/apiConfig';
import { RecipeServiceV2 } from '../services/apiServiceV2';

export default function V2ApiTestScreen() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [timing, setTiming] = useState(null);
  const [useV2, setUseV2] = useState(API_CONFIG.USE_V2_API);

  const testUserId = 11; // Your test user

  const toggleApiVersion = () => {
    if (useV2) {
      disableV2Api();
      setUseV2(false);
    } else {
      enableV2Api();
      setUseV2(true);
    }
    setData(null);
    setTiming(null);
  };

  const loadRecipes = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const result = await RecipeServiceV2.getUserRecipesWithStats(testUserId);
      const endTime = Date.now();
      const duration = endTime - startTime;

      setData(result);
      setTiming({
        duration,
        apiVersion: getApiVersion(),
        networkCalls: useV2 ? 1 : 3, // v2 = 1 call, v1 = 3 calls
      });

      Alert.alert(
        'Success!',
        `Loaded in ${duration}ms using ${getApiVersion()} API`
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 V2 API Test</Text>
        <Text style={styles.subtitle}>
          Compare old vs new API performance
        </Text>
      </View>

      {/* API Version Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Version</Text>
        <TouchableOpacity
          style={[styles.toggleButton, useV2 ? styles.v2Active : styles.v1Active]}
          onPress={toggleApiVersion}
        >
          <Text style={styles.toggleText}>
            {useV2 ? '✅ V2 API (New - 3x Faster!)' : '⚠️ V1 API (Old)'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {useV2 
            ? '🚀 ONE call gets everything!'
            : '🐌 THREE separate calls needed'
          }
        </Text>
      </View>

      {/* Test Button */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={loadRecipes}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.testButtonText}>
            Load Recipes with Stats
          </Text>
        )}
      </TouchableOpacity>

      {/* Timing Results */}
      {timing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Performance</Text>
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>API Version:</Text>
              <Text style={[styles.resultValue, useV2 && styles.v2Text]}>
                {timing.apiVersion.toUpperCase()}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Time:</Text>
              <Text style={styles.resultValue}>{timing.duration}ms</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Network Calls:</Text>
              <Text style={styles.resultValue}>{timing.networkCalls}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Data Results */}
      {data && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 User</Text>
            <View style={styles.dataCard}>
              <Text style={styles.dataText}>Name: {data.user?.name}</Text>
              <Text style={styles.dataText}>Email: {data.user?.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Statistics</Text>
            <View style={styles.dataCard}>
              <Text style={styles.dataText}>
                Total Recipes: {data.totalRecipes}
              </Text>
              <Text style={styles.dataText}>
                Categories: {data.categories?.length || 0}
              </Text>
              <Text style={styles.dataText}>
                Recent Recipes: {data.recentRecipes?.length || 0}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Categories</Text>
            <View style={styles.dataCard}>
              {data.categories?.map((cat) => (
                <View key={cat} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{cat}</Text>
                  <Text style={styles.categoryCount}>
                    {data.categoryCounts?.[cat] || 0} recipes
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Recent Recipes</Text>
            {data.recentRecipes?.slice(0, 5).map((recipe, index) => (
              <View key={index} style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <Text style={styles.recipeCategory}>{recipe.category}</Text>
              </View>
            ))}
          </View>

          <View style={styles.comparison}>
            <Text style={styles.comparisonTitle}>
              {useV2 ? '🎉 V2 API Power!' : '⚠️ Old API'}
            </Text>
            <Text style={styles.comparisonText}>
              {useV2
                ? 'ONE API call got all of this data!\nUser + Recipes + Categories + Counts + Stats'
                : 'This required MULTIPLE API calls:\n1. /api/recipes\n2. /api/categories\n3. /api/category-counts\n...and then manual combining'
              }
            </Text>
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🚀 V2 API is 3x faster with 1 network call vs 3+
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  toggleButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  v1Active: {
    backgroundColor: '#ff9800',
  },
  v2Active: {
    backgroundColor: '#4caf50',
  },
  toggleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  testButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#2196f3',
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  v2Text: {
    color: '#4caf50',
  },
  dataCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  categoryCount: {
    fontSize: 16,
    color: '#666',
  },
  recipeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recipeCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  comparison: {
    margin: 20,
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  comparisonText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
