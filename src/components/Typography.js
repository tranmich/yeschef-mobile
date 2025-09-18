/**
 * 🔤 YesChe// Load custom fonts
export const loadFonts = async () => {
  try {
    console.log('🔤 FONT DEBUG: Starting font load...');
    await Font.loadAsync({
      // Main font variants from app.json
      'Nunito-Regular': require('../../assets/images/fonts/Nunito-Regular.ttf'),
      'Nunito-Light': require('../../assets/images/fonts/Nunito-Light.ttf'),
      'Nunito-ExtraBold': require('../../assets/images/fonts/Nunito-ExtraBold.ttf'),
      
      // Alternative names that might work
      'Nunito': require('../../assets/images/fonts/Nunito-Regular.ttf'),
      'NunitoExtraBold': require('../../assets/images/fonts/Nunito-ExtraBold.ttf'),
      'Nunito-Bold': require('../../assets/images/fonts/Nunito-ExtraBold.ttf'),
    });
    console.log('✅ FONT DEBUG: All fonts loaded successfully');
  } catch (error) {
    console.error('❌ FONT DEBUG: Error:', error.message);
    throw error;
  }
};hy System
 * Centralized font management with beautiful Nunito typeface
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import * as Font from 'expo-font';

// Font family mappings
export const FONTS = {
  regular: 'Nunito-Regular',
  light: 'Nunito-Light', 
  bold: 'Nunito-ExtraBold',
};

// Load custom fonts
export const loadFonts = async () => {
  try {
    console.log('� FONT DEBUG: Starting font load...');
    await Font.loadAsync({
      'Nunito-Regular': require('../../assets/images/fonts/Nunito-Regular.ttf'),
      'Nunito-Light': require('../../assets/images/fonts/Nunito-Light.ttf'),
      'Nunito-ExtraBold': require('../../assets/images/fonts/Nunito-ExtraBold.ttf'),
      'Nunito': require('../../assets/images/fonts/Nunito-Regular.ttf'),
      'NunitoExtraBold': require('../../assets/images/fonts/Nunito-ExtraBold.ttf'),
    });
    console.log('✅ FONT DEBUG: All fonts loaded');
  } catch (error) {
    console.error('❌ FONT DEBUG: Error:', error.message);
    throw error;
  }
};

// Typography scale
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 48,
};

// Line heights (relative to font size)
export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
};

// Font weights (mapped to our Nunito variants)
export const FONT_WEIGHTS = {
  light: 'Nunito-Light',
  normal: 'Nunito-Regular', 
  bold: 'Nunito-ExtraBold',
};

/**
 * 🎨 Typography Styles - Ready-to-use text styles
 */
export const typography = StyleSheet.create({
  // Headings
  h1: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: FONT_SIZES['4xl'] * LINE_HEIGHTS.tight,
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['3xl'],
    lineHeight: FONT_SIZES['3xl'] * LINE_HEIGHTS.tight,
  },
  h3: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: FONT_SIZES['2xl'] * LINE_HEIGHTS.normal,
  },
  h4: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.normal,
  },
  h5: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
  },
  h6: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
  },

  // Body text
  body: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
  },
  bodyLarge: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
  },
  bodySmall: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },

  // UI elements
  button: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.tight,
  },
  buttonSmall: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.tight,
  },
  caption: {
    fontFamily: FONTS.light,
    fontSize: FONT_SIZES.xs,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },

  // Special styles
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['6xl'],
    lineHeight: FONT_SIZES['6xl'] * LINE_HEIGHTS.tight,
  },
  subtitle: {
    fontFamily: FONTS.light,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.relaxed,
  },
  overline: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

/**
 * 🎯 Text Component Helper - Creates consistent text with typography
 */
export const ThemedText = ({ 
  variant = 'body', 
  color = '#000000',
  children, 
  style,
  ...props 
}) => {
  const textStyle = typography[variant] || typography.body;
  
  return (
    <Text 
      style={[
        textStyle,
        { color },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

// Export for external customization
export const createTextStyle = (variant, customStyle = {}) => {
  return [typography[variant] || typography.body, customStyle];
};