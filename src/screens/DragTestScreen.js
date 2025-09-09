/**
 * 🧪 DRAG & DROP TEST COMPONENT
 * 
 * A simple test component to verify drag functionality works
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SimpleDraggableList } from '../components/SimpleDragSystem';

const DragTestScreen = () => {
  const [items, setItems] = useState([
    { id: '1', name: '🍎 Apples', category: 'Fruits' },
    { id: '2', name: '🥛 Milk', category: 'Dairy' },
    { id: '3', name: '🍞 Bread', category: 'Bakery' },
    { id: '4', name: '🥕 Carrots', category: 'Vegetables' },
    { id: '5', name: '🧀 Cheese', category: 'Dairy' },
  ]);

  const handleReorder = (newItems, draggedItem, fromIndex, toIndex) => {
    console.log(`🔄 TEST: Reordered "${draggedItem.name}" from ${fromIndex} to ${toIndex}`);
    console.log(`📊 New order:`, newItems.map(item => item.name));
    setItems(newItems);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Drag & Drop Test</Text>
      <Text style={styles.subtitle}>Long press and drag items to reorder</Text>
      
      <SimpleDraggableList
        data={items}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
            {/* 🚫 REMOVED: Drag handle for cleaner look */}
          </View>
        )}
        onReorder={handleReorder}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
      
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={() => setItems([
          { id: '1', name: '🍎 Apples', category: 'Fruits' },
          { id: '2', name: '🥛 Milk', category: 'Dairy' },
          { id: '3', name: '🍞 Bread', category: 'Bakery' },
          { id: '4', name: '🥕 Carrots', category: 'Vegetables' },
          { id: '5', name: '🧀 Cheese', category: 'Dairy' },
        ])}
      >
        <Text style={styles.resetButtonText}>🔄 Reset Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  itemCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 12,
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DragTestScreen;
