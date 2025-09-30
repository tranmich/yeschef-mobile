/**
 * 🎨 Community Recipe Styling Utilities
 * Shared color and style mappings for community recipes
 */

// 🎨 Background color mapping for community recipes
export const getCommunityBackgroundColor = (backgroundType) => {
  const backgroundOptions = {
    'default': '#f8fafc',   // Light gray
    'warm': '#fef3e2',      // Light orange/cream
    'fresh': '#f0fdf4',     // Light green
    'elegant': '#faf7ff',   // Light purple
    'sunset': '#fef2f2',    // Light red/pink
    'ocean': '#eff6ff',     // Light blue
    'earth': '#fefce8',     // Light yellow
    'lavender': '#f3e8ff',  // Light lavender
    'mint': '#ecfdf5',      // Light mint green
    'peach': '#fff7ed',     // Light peach
    'sky': '#f0f9ff',       // Light sky blue
    'rose': '#fdf2f8',      // Light rose pink
  };
  
  return backgroundOptions[backgroundType] || backgroundOptions['default'];
};

// 🎨 Get all available background options
export const getBackgroundOptions = () => [
  { id: 'default', name: 'Classic', color: '#f8fafc' },
  { id: 'warm', name: 'Warm', color: '#fef3e2' },
  { id: 'fresh', name: 'Fresh', color: '#f0fdf4' },
  { id: 'elegant', name: 'Elegant', color: '#faf7ff' },
  { id: 'sunset', name: 'Sunset', color: '#fef2f2' },
  { id: 'ocean', name: 'Ocean', color: '#eff6ff' },
  { id: 'earth', name: 'Earth', color: '#fefce8' },
  { id: 'lavender', name: 'Lavender', color: '#f3e8ff' },
  { id: 'mint', name: 'Mint', color: '#ecfdf5' },
  { id: 'peach', name: 'Peach', color: '#fff7ed' },
  { id: 'sky', name: 'Sky', color: '#f0f9ff' },
  { id: 'rose', name: 'Rose', color: '#fdf2f8' },
];

// 🍽️ Get all available icon options - 48 diverse food emojis organized by category!
export const getIconOptions = () => [
  // General & Cooking
  '🍽️', '🍳', '🥘', '🍲', '🥄', '🔪',
  
  // Breads & Breakfast  
  '🍞', '🥖', '🥨', '🧇', '🥞', '🥐',
  
  // Proteins & Mains
  '🍗', '🍖', '🥩', '🍤', '🦞', '🍣',
  
  // Popular Foods
  '🍕', '🍔', '🌭', '🌮', '🌯', '🍝',
  
  // Healthy & Fresh
  '🥗', '🥑', '🍅', '🌶️', '🥕', '🌽',
  
  // Fruits
  '🍎', '🍊', '🍌', '🍇', '🍓', '🥝',
  
  // Desserts & Treats
  '🍰', '🧁', '🍪', '🍩', '🍫', '🍭',
  
  // Beverages & Drinks
  '☕', '🍵', '🥤', '🧋', '🍷', '🥛'
];

// 🏷️ Get organized icon categories for better UX
export const getIconCategories = () => [
  {
    title: '🍽️ General & Cooking',
    icons: ['🍽️', '🍳', '🥘', '🍲', '🥄', '🔪']
  },
  {
    title: '🍞 Breads & Breakfast',
    icons: ['🍞', '🥖', '🥨', '🧇', '🥞', '🥐']
  },
  {
    title: '🍖 Proteins & Mains',
    icons: ['🍗', '🍖', '🥩', '🍤', '🦞', '🍣']
  },
  {
    title: '🍕 Popular Foods',
    icons: ['🍕', '🍔', '🌭', '🌮', '🌯', '🍝']
  },
  {
    title: '🥗 Healthy & Fresh',
    icons: ['🥗', '🥑', '🍅', '🌶️', '🥕', '🌽']
  },
  {
    title: '🍎 Fruits',
    icons: ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝']
  },
  {
    title: '🍰 Desserts & Treats',
    icons: ['🍰', '🧁', '🍪', '🍩', '🍫', '🍭']
  },
  {
    title: '☕ Beverages & Drinks',
    icons: ['☕', '🍵', '🥤', '🧋', '🍷', '🥛']
  }
];

// 🏷️ Get theme name from ID
export const getThemeName = (themeId) => {
  const option = getBackgroundOptions().find(bg => bg.id === themeId);
  return option ? option.name : 'Classic';
};