/**
 * 🧪 Font Testing Component
 * Tests different font family name variations to find working ones
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FontTest() {
  const testFontNames = [
    'Nunito-Regular',
    'Nunito-ExtraBold', 
    'Nunito-Light',
    'Nunito',
    'NunitoRegular',
    'NunitoExtraBold',
    'Nunito Regular',
    'Nunito ExtraBold',
    'nunito',
    'nunito-regular',
    'nunito-extrabold',
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧪 FONT FAMILY TEST</Text>
      {testFontNames.map((fontName, index) => (
        <Text 
          key={index}
          style={[styles.testText, { fontFamily: fontName }]}
        >
          {fontName}: The quick brown fox jumps over the lazy dog
        </Text>
      ))}
      <Text style={styles.systemFont}>
        SYSTEM FONT: The quick brown fox jumps over the lazy dog
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  testText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#374151',
  },
  systemFont: {
    fontSize: 16,
    marginTop: 10,
    color: '#dc2626',
    fontWeight: 'bold',
  },
});