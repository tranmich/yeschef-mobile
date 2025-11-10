/**
 * 🎨 YesChef Mobile Icon Library
 * Centralized icon management system using Expo Vector Icons
 * Consistent icons across the app with your custom styling
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Ionicons, 
  MaterialIcons, 
  MaterialCommunityIcons, 
  Feather, 
  AntDesign 
} from '@expo/vector-icons';

// Icon mappings - using available vector icon sets
const ICON_MAPPINGS = {
  // UI Actions
  add: { family: Ionicons, name: 'add' },
  plus: { family: Ionicons, name: 'add' },
  minus: { family: Ionicons, name: 'remove' },
  back: { family: Ionicons, name: 'arrow-back' },
  cancel: { family: Ionicons, name: 'close' },
  close: { family: Ionicons, name: 'close-outline' },
  x: { family: Ionicons, name: 'close' },
  delete: { family: Ionicons, name: 'trash-outline' },
  edit: { family: Ionicons, name: 'pencil-outline' },
  save: { family: Ionicons, name: 'checkmark' },
  eye: { family: Ionicons, name: 'eye-outline' },
  tag: { family: Ionicons, name: 'pricetag-outline' },
  calendar: { family: Ionicons, name: 'calendar-outline' },
  'shopping-cart': { family: Ionicons, name: 'cart-outline' },
  activity: { family: Ionicons, name: 'pulse-outline' },
  alert: { family: Ionicons, name: 'alert-circle-outline' },
  clipboard: { family: Ionicons, name: 'clipboard-outline' },
  'ellipsis-vertical': { family: Feather, name: 'more-vertical' },
  'person-add': { family: MaterialIcons, name: 'person-add' },
  
  // Navigation
  forward: { family: Ionicons, name: 'arrow-forward' },
  'chevron-left': { family: Ionicons, name: 'chevron-back' },
  'chevron-right': { family: Ionicons, name: 'chevron-forward' },
  menu: { family: Ionicons, name: 'menu' },
  more: { family: Ionicons, name: 'ellipsis-horizontal' },
  'more-horizontal': { family: Feather, name: 'more-horizontal' },
  'help-circle': { family: Feather, name: 'help-circle' },
  settings: { family: Feather, name: 'settings' },
  'refresh-cw': { family: Feather, name: 'refresh-cw' },
  
  // Search & Filter
  search: { family: Ionicons, name: 'search' },
  filter: { family: Ionicons, name: 'funnel-outline' },
  sort: { family: MaterialIcons, name: 'sort' },
  
  // Sync & Status
  refresh: { family: Ionicons, name: 'refresh' },
  sync: { family: Ionicons, name: 'sync' },
  loading: { family: Ionicons, name: 'refresh' },
  
  // Auth & User
  login: { family: Ionicons, name: 'key-outline' },
  logout: { family: Ionicons, name: 'log-out-outline' },
  user: { family: Ionicons, name: 'person-outline' },
  'user-friends': { family: Ionicons, name: 'people-outline' },
  'user-friends-filled': { family: Ionicons, name: 'people' },
  'user-plus': { family: Ionicons, name: 'person-add-outline' },
  
  // Social & Community  
  community: { family: Ionicons, name: 'people-outline' },
  share: { family: Ionicons, name: 'share-outline' },
  chat: { family: Ionicons, name: 'chatbubble-outline' },
  comment: { family: Ionicons, name: 'chatbubble-outline' },
  send: { family: Ionicons, name: 'send' },
  camera: { family: Ionicons, name: 'camera-outline' },
  download: { family: Ionicons, name: 'download-outline' },
  
  home: { family: Ionicons, name: 'home-outline' },
  password: { family: Ionicons, name: 'lock-closed-outline' },
  email: { family: Ionicons, name: 'mail-outline' },
  
  // Status & Feedback
  success: { family: Ionicons, name: 'checkmark-circle' },
  error: { family: Ionicons, name: 'close-circle' },
  warning: { family: Ionicons, name: 'warning' },
  info: { family: Ionicons, name: 'information-circle' },
  star: { family: Ionicons, name: 'star' },
  
  // Local-first UI Icons
  clock: { family: Ionicons, name: 'time-outline' },
  circle: { family: Ionicons, name: 'ellipse' },
  'check-circle': { family: Ionicons, name: 'checkmark-circle' },
  'alert-circle': { family: Ionicons, name: 'alert-circle' },
  
  // System
  settings: { family: Ionicons, name: 'settings-outline' },
  download: { family: Ionicons, name: 'download-outline' },
  share: { family: Ionicons, name: 'share-outline' },
  network: { family: Ionicons, name: 'wifi' },
  battery: { family: Ionicons, name: 'battery-half' },
  
  // Grocery List Menu Icons
  folder: { family: Ionicons, name: 'folder-open-outline' },
  folderFilled: { family: Ionicons, name: 'folder-open' },
  grocery: { family: Ionicons, name: 'basket-outline' }, // For Make List menu item
  list: { family: Ionicons, name: 'list-outline' }, // Alternative list icon
  
  // Tab Icons (special optimized versions)
  home: { family: Ionicons, name: 'home-outline' },
  homeFilled: { family: Ionicons, name: 'home' },
  groceryTab: { family: Ionicons, name: 'basket-outline' },
  groceryTabFilled: { family: Ionicons, name: 'basket' },
  recipesTab: { family: Ionicons, name: 'book-outline' },
  recipesTabFilled: { family: Ionicons, name: 'book' },
  addRecipe: { family: Ionicons, name: 'add-circle-outline' },
  addRecipeFilled: { family: Ionicons, name: 'add-circle' },
  mealPlanTab: { family: Ionicons, name: 'calendar-outline' },
  mealPlanTabFilled: { family: Ionicons, name: 'calendar' },
  debugTab: { family: Ionicons, name: 'settings-outline' },
  debugTabFilled: { family: Ionicons, name: 'settings' },
  
  // Explorer icons
  arrowUp: { family: Ionicons, name: 'chevron-up' },
  arrowDown: { family: Ionicons, name: 'chevron-down' },
  heart: { family: Ionicons, name: 'heart' },
};

// Icon size presets
const SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

// Color themes - Beautiful food-inspired color palette
const COLORS = {
  // Primary Brand Colors (from your palettes)
  primary: '#1E40AF',        // Vibrant Deep Blue - navigation, headers
  secondary: '#EEDCA7',      // Banana Cream - backgrounds
  accent: '#E7993F',         // Warm Caramel - CTAs, highlights
  
  // Semantic Colors
  success: '#22C55E',        // Vibrant Green - saved, completed states
  warning: '#F4D03F',        // Lemon Yellow - attention needed
  error: '#DC313F',          // Fresh Strawberry - errors, delete
  
  // Neutral & Accent Colors
  dark: '#422821',           // Dark Chocolate - premium text
  light: '#F5C7BA',          // Vanilla Chocolate - soft backgrounds  
  fresh: '#A8B977',          // Cucumber Green - produce, healthy
  warm: '#EB9977',           // Grapefruit Pink - friendly accents
  
  // System Colors (fallbacks)
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  
  // Legacy aliases for existing code
  blue: '#2D3E56',           // Maps to primary
  green: '#AACGAD',          // Maps to success
  red: '#DC313F',            // Maps to error
  orange: '#E7993F',         // Maps to accent
};

/**
 * 🎯 Icon Component - Smart icon renderer using vector icons
 */
export const Icon = ({ 
  name, 
  size = 'md', 
  color = 'primary', 
  style,
  testID 
}) => {
  const iconMapping = ICON_MAPPINGS[name];
  const iconSize = typeof size === 'number' ? size : SIZES[size];
  const iconColor = COLORS[color] || color;

  if (!iconMapping) {
    console.warn(`🎨 Icon "${name}" not found in IconLibrary`);
    return null;
  }

  const IconComponent = iconMapping.family;
  const iconName = iconMapping.name;

  return (
    <IconComponent
      name={iconName}
      size={iconSize}
      color={iconColor}
      style={style}
      testID={testID}
    />
  );
};

/**
 * 🎨 Icon Button - Touchable icon with consistent styling
 */
export const IconButton = ({ 
  name, 
  size = 'md', 
  color = 'primary',
  onPress,
  disabled = false,
  style,
  testID
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.iconButton,
        disabled && styles.iconButtonDisabled,
        style
      ]}
      testID={testID}
    >
      <Icon 
        name={name} 
        size={size} 
        color={disabled ? 'gray' : color} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
});

// Export available icons list for reference
export const AVAILABLE_ICONS = Object.keys(ICON_MAPPINGS);

// Export sizes and colors for external use
export { SIZES, COLORS };