/**
 * 🔧 MINIMAL APP FOR DEBUGGING
 * 
 * A stripped-down version to isolate the TurboModule issue
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import DevConsole from './src/components/DevConsole';
// import './src/utils/DebugLogger'; // Temporarily disabled to avoid import issues

export default function MinimalApp() {
  console.log('🚀 MinimalApp Starting...');

  const testItems = [
    { id: '1', name: 'Apples', checked: false },
    { id: '2', name: 'Bread', checked: true },
    { id: '3', name: 'Milk', checked: false },
  ];

  return (
    <DevConsole>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 YesChef - Debug Mode</Text>
        <Text style={styles.subtitle}>Testing basic functionality</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Basic Grocery List</Text>
          {testItems.map(item => (
            <View key={item.id} style={styles.item}>
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                {item.name}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Debug Info</Text>
          <Text style={styles.debugText}>• React Native Version: {require('react-native/package.json').version}</Text>
          <Text style={styles.debugText}>• Expo SDK: {require('expo/package.json').version}</Text>
          <Text style={styles.debugText}>• Platform: {require('react-native').Platform.OS}</Text>
          <Text style={styles.debugText}>• Debug Mode: {__DEV__ ? 'Enabled' : 'Disabled'}</Text>
        </View>

        <TouchableOpacity style={styles.testButton} onPress={() => {
          console.log('🧪 Test button pressed');
          console.error('🧪 Test error for debugging');
        }}>
          <Text style={styles.testButtonText}>🧪 Test Error Logging</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </DevConsole>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  debugText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  testButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
