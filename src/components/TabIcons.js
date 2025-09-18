/**
 * 🛒 YesChef Tab Icons - Specialized icons for navigation tabs
 * These are optimized for tab bar usage with filled/outline states
 */

// Create symbolic links or copies of appropriate UI icons for tab use
// We'll map existing UI icons to tab contexts

// Tab icon mappings (using your existing ui-icons)
export const TAB_ICONS = {
  // Grocery List tab - we'll use a shopping-focused icon
  grocery: {
    outline: require('../../assets/images/icons/ui-icons/more-dots-three.svg'), // Placeholder - will create proper grocery icon
    filled: require('../../assets/images/icons/ui-icons/more-dots-three.svg'),  // Placeholder - will create proper grocery icon
  },
  
  // Recipe Collection tab  
  recipes: {
    outline: require('../../assets/images/icons/ui-icons/menu-hamburger.svg'), // Temporary - represents recipe collection
    filled: require('../../assets/images/icons/ui-icons/menu-hamburger.svg'),
  },
  
  // Meal Planning tab
  mealPlan: {
    outline: require('../../assets/images/icons/ui-icons/more-dots-three.svg'), // Placeholder - will create calendar icon
    filled: require('../../assets/images/icons/ui-icons/more-dots-three.svg'),
  },
  
  // Debug/Settings tab
  debug: {
    outline: require('../../assets/images/icons/ui-icons/user-profile.svg'), // Settings-like icon
    filled: require('../../assets/images/icons/ui-icons/user-profile.svg'),
  },
};

// Export for use in navigation
export default TAB_ICONS;