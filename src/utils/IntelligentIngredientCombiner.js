/**
 * 🧠 INTELLIGENT INGREDIENT COMBINER
 * 
 * Automatically combines similar grocery list ingredients using:
 * - Ingredient family recognition
 * - Unit conversions
 * - Preparation tracking
 * - Semantic understanding
 * 
 * @author YesChef Team
 * @date October 8, 2025
 */

class IntelligentIngredientCombiner {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.aggressive = options.aggressive !== false; // Default to aggressive
    
    // Initialize ingredient families (top 100 ingredients)
    this.ingredientFamilies = this.loadIngredientFamilies();
    
    // Initialize unit conversions
    this.unitConversions = this.loadUnitConversions();
    
    // Preparation keywords
    this.preparationKeywords = [
      'minced', 'chopped', 'diced', 'sliced', 'crushed', 
      'grated', 'shredded', 'julienned', 'cubed', 'whole',
      'fresh', 'dried', 'canned', 'frozen', 'jarred'
    ];
  }

  /**
   * Main entry point - combines grocery items intelligently
   * @param {Array} items - Array of grocery items {id, name, checked, ...}
   * @returns {Array} - Combined items
   */
  combineItems(items) {
    if (!items || items.length === 0) return [];
    
    this.log('🧠 Starting intelligent combining...', { itemCount: items.length });
    
    // Step 1: Group items by base ingredient
    const groups = this.groupByIngredient(items);
    this.log('📊 Grouped into families:', { groupCount: groups.size });
    
    // Step 2: Combine within each group
    const combined = this.mergeGroups(groups);
    this.log('✅ Combined result:', { finalCount: combined.length });
    
    // Step 3: Sort for optimal shopping order
    return this.sortForShopping(combined);
  }

  /**
   * Group items by their base ingredient family
   */
  groupByIngredient(items) {
    const groups = new Map();
    
    items.forEach(item => {
      const base = this.findBaseIngredient(item.name);
      
      if (!groups.has(base)) {
        groups.set(base, []);
      }
      
      groups.get(base).push(item);
      this.log(`  📌 "${item.name}" → family: "${base}"`);
    });
    
    return groups;
  }

  /**
   * Find the base ingredient family for a given text
   */
  findBaseIngredient(text) {
    const lower = text.toLowerCase().trim();
    
    // Check against known ingredient families
    for (const [family, variations] of Object.entries(this.ingredientFamilies)) {
      for (const variation of variations) {
        if (this.isMatch(lower, variation)) {
          return family;
        }
      }
    }
    
    // Fallback: extract main noun (last meaningful word)
    const words = lower
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.isQuantityWord(w));
    
    return words[words.length - 1] || text;
  }

  /**
   * Check if text matches a variation (fuzzy matching)
   */
  isMatch(text, variation) {
    // Exact match
    if (text === variation) return true;
    
    // Contains match (for compound variations like "garlic clove")
    if (text.includes(variation)) return true;
    
    // Variation contains text (for "garlic" matching "garlic cloves")
    if (variation.includes(text)) return true;
    
    return false;
  }

  /**
   * Check if word is a quantity-related word to ignore
   */
  isQuantityWord(word) {
    const quantityWords = [
      'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'tsp',
      'teaspoon', 'teaspoons', 'ounce', 'ounces', 'oz', 'pound', 
      'pounds', 'lb', 'lbs', 'gram', 'grams', 'kilogram', 'kg',
      'clove', 'cloves', 'head', 'heads', 'piece', 'pieces',
      'can', 'cans', 'jar', 'jars', 'package', 'packages',
      'small', 'medium', 'large', 'whole', 'half'
    ];
    return quantityWords.includes(word.toLowerCase());
  }

  /**
   * Merge groups of similar ingredients
   */
  mergeGroups(groups) {
    const combined = [];
    
    groups.forEach((items, family) => {
      if (items.length === 1) {
        // Single item, keep as-is
        combined.push(items[0]);
      } else {
        // Multiple items, combine them
        const merged = this.combineMultipleItems(family, items);
        combined.push(merged);
      }
    });
    
    return combined;
  }

  /**
   * Combine multiple items of the same ingredient family
   */
  combineMultipleItems(family, items) {
    this.log(`🔄 Combining ${items.length} items for "${family}":`, 
      items.map(i => i.name));
    
    // Extract all quantities and units
    const quantities = items.map(item => this.extractQuantity(item.name));
    
    // Extract all preparation methods
    const preparations = new Set();
    items.forEach(item => {
      const preps = this.extractPreparations(item.name);
      preps.forEach(p => preparations.add(p));
    });
    
    // Track quality modifiers (fresh, canned, etc.)
    const qualities = new Set();
    items.forEach(item => {
      const quals = this.extractQualities(item.name);
      quals.forEach(q => qualities.add(q));
    });
    
    // Combine quantities (convert to common unit if possible)
    const combinedQuantity = this.combineQuantities(family, quantities);
    
    // Build display name
    let displayName = this.buildDisplayName(
      family, 
      combinedQuantity, 
      Array.from(preparations),
      Array.from(qualities)
    );
    
    // Preserve metadata
    const sections = new Set();
    const recipes = new Set();
    let anyChecked = false;
    
    items.forEach(item => {
      if (item._backendRef?.section) sections.add(item._backendRef.section);
      if (item.recipes) item.recipes.forEach(r => recipes.add(r));
      if (item.checked) anyChecked = true;
    });
    
    return {
      id: `combined-${family}-${Date.now()}`,
      name: displayName,
      checked: anyChecked,
      _combined: true,
      _originalItems: items,
      _family: family,
      _backendRef: {
        section: sections.values().next().value || 'other'
      },
      recipes: Array.from(recipes)
    };
  }

  /**
   * Extract quantity and unit from ingredient text
   */
  extractQuantity(text) {
    // Match patterns: "2 cups", "1/2 tsp", "3.5 lbs", "1-2 cloves", "6 eggs", "6 large eggs"
    const patterns = [
      /(\d+\.?\d*)\s*([a-zA-Z]+)/,           // "2 cups" or "6 eggs"
      /(\d+\/\d+)\s*([a-zA-Z]+)/,            // "1/2 cup"
      /(\d+)-(\d+)\s*([a-zA-Z]+)/,           // "1-2 cloves"
      /(\d+\.?\d*)/                           // Just number
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let amount;
        let unit = '';
        
        if (match[3]) {
          // Range like "1-2"
          amount = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
          unit = match[3];
        } else if (match[1].includes('/')) {
          // Fraction like "1/2"
          const [num, den] = match[1].split('/').map(Number);
          amount = num / den;
          unit = match[2] || '';
        } else {
          // Regular number
          amount = parseFloat(match[1]);
          unit = match[2] || '';
        }
        
        // Normalize the unit (handles adjectives, ingredient names, etc.)
        unit = this.normalizeUnit(unit.toLowerCase(), text.toLowerCase());
        return { amount, unit };
      }
    }
    
    // No quantity found, return 1 whole
    return { amount: 1, unit: '' };
  }
  
  /**
   * Normalize units for consistent combining
   * Treats 'whole', 'count', 'piece', or the ingredient name itself as empty unit (count)
   */
  normalizeUnit(unit, fullText = '') {
    if (!unit) return '';
    
    const lower = unit.toLowerCase();
    
    // These are all "count" units - normalize to empty string
    const countUnits = ['whole', 'count', 'piece', 'pieces', 'item', 'items'];
    if (countUnits.includes(lower)) {
      return '';
    }
    
    // Common adjectives that aren't units
    const adjectives = ['large', 'medium', 'small', 'fresh', 'dried', 'frozen', 
                        'raw', 'cooked', 'ripe', 'organic', 'free-range'];
    if (adjectives.includes(lower)) {
      return ''; // Skip adjectives, they're not units
    }
    
    // If the unit matches a known ingredient name, it's actually a count
    // e.g., "6 eggs" → unit='eggs', which should be treated as a count
    for (const [family, variations] of Object.entries(this.ingredientFamilies)) {
      if (variations.includes(lower) || family === lower) {
        return ''; // It's the ingredient itself, not a unit
      }
    }
    
    return lower;
  }

  /**
   * Extract preparation methods from text
   */
  extractPreparations(text) {
    const lower = text.toLowerCase();
    const found = [];
    
    this.preparationKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        found.push(keyword);
      }
    });
    
    return found;
  }

  /**
   * Extract quality modifiers (fresh, canned, etc.)
   */
  extractQualities(text) {
    const qualities = ['fresh', 'dried', 'canned', 'frozen', 'jarred', 'organic'];
    const lower = text.toLowerCase();
    const found = [];
    
    qualities.forEach(quality => {
      if (lower.includes(quality)) {
        found.push(quality);
      }
    });
    
    return found;
  }

  /**
   * Combine quantities using unit conversions
   */
  combineQuantities(family, quantities) {
    if (!quantities || quantities.length === 0) return null;
    
    // Get conversion table for this ingredient family
    const conversions = this.unitConversions[family];
    
    if (!conversions) {
      // No conversions available, try to add same units
      return this.combineSimpleQuantities(quantities);
    }
    
    // Convert all to base unit
    let totalInBaseUnit = 0;
    const baseUnit = conversions.baseUnit;
    
    quantities.forEach(({ amount, unit }) => {
      const conversionFactor = conversions[unit] || 1;
      totalInBaseUnit += amount * conversionFactor;
    });
    
    // Convert back to best display unit
    return this.selectBestUnit(family, totalInBaseUnit, conversions);
  }

  /**
   * Combine quantities with same unit
   */
  combineSimpleQuantities(quantities) {
    // Group by unit
    const byUnit = {};
    
    quantities.forEach(({ amount, unit }) => {
      if (!byUnit[unit]) byUnit[unit] = 0;
      byUnit[unit] += amount;
    });
    
    // If only one unit, return combined
    const units = Object.keys(byUnit);
    if (units.length === 1) {
      return { amount: byUnit[units[0]], unit: units[0] };
    }
    
    // Multiple units, can't combine
    return null;
  }

  /**
   * Select the best unit to display (e.g., 15 cloves → 1.5 heads)
   */
  selectBestUnit(family, totalInBaseUnit, conversions) {
    const baseUnit = conversions.baseUnit;
    
    // Check if a larger unit makes more sense
    for (const [unit, factor] of Object.entries(conversions)) {
      if (unit === 'baseUnit') continue;
      
      const amountInThisUnit = totalInBaseUnit / factor;
      
      // Use larger unit if amount is >= 1
      if (factor > 1 && amountInThisUnit >= 1) {
        return { amount: amountInThisUnit, unit };
      }
    }
    
    return { amount: totalInBaseUnit, unit: baseUnit };
  }

  /**
   * Build readable display name
   */
  buildDisplayName(family, quantity, preparations, qualities) {
    let name = '';
    
    // Add quantity if available
    if (quantity) {
      const { amount, unit } = quantity;
      
      // Format amount nicely
      const formattedAmount = amount % 1 === 0 
        ? amount.toString() 
        : amount.toFixed(1);
      
      // If unit is empty or 'whole', it's a count - just show number + ingredient
      if (!unit || unit === 'whole' || unit === '') {
        name = `${formattedAmount} ${family}`;
      } else {
        // Has a real unit (cups, lbs, etc.)
        name = `${formattedAmount} ${unit} ${family}`;
      }
    } else {
      name = family;
    }
    
    // Add preparation notes
    const notes = [];
    
    if (qualities.length > 0) {
      notes.push(qualities.join(', '));
    }
    
    if (preparations.length > 0) {
      notes.push(`some ${preparations.join(', ')}`);
    }
    
    if (notes.length > 0) {
      name += ` (${notes.join('; ')})`;
    }
    
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Sort items for optimal shopping order
   */
  sortForShopping(items) {
    const sectionOrder = ['produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'bakery', 'other'];
    
    return items.sort((a, b) => {
      // Sort by section first
      const sectionA = a._backendRef?.section || 'other';
      const sectionB = b._backendRef?.section || 'other';
      
      const orderA = sectionOrder.indexOf(sectionA);
      const orderB = sectionOrder.indexOf(sectionB);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Then alphabetically within section
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Load ingredient families (expandable database)
   */
  loadIngredientFamilies() {
    return {
      // Vegetables
      'garlic': ['garlic', 'garlic clove', 'garlic cloves', 'minced garlic', 
                 'chopped garlic', 'crushed garlic', 'garlic powder', 'garlic head'],
      'onion': ['onion', 'onions', 'yellow onion', 'white onion', 'red onion',
                'sweet onion', 'vidalia onion', 'diced onion', 'chopped onion', 
                'sliced onion', 'green onion', 'scallion'],
      'tomato': ['tomato', 'tomatoes', 'cherry tomatoes', 'grape tomatoes',
                 'roma tomatoes', 'plum tomatoes', 'diced tomatoes', 'crushed tomatoes',
                 'tomato paste', 'tomato sauce', 'sun-dried tomatoes'],
      'potato': ['potato', 'potatoes', 'russet potato', 'red potato', 'yukon gold',
                 'sweet potato', 'sweet potatoes', 'baby potatoes'],
      'carrot': ['carrot', 'carrots', 'baby carrots', 'shredded carrots'],
      'celery': ['celery', 'celery stalk', 'celery stalks', 'celery ribs'],
      'bell pepper': ['bell pepper', 'bell peppers', 'red bell pepper', 'green bell pepper',
                      'yellow bell pepper', 'orange bell pepper', 'sweet pepper'],
      'mushroom': ['mushroom', 'mushrooms', 'button mushroom', 'cremini', 
                   'shiitake', 'portobello', 'white mushroom'],
      'spinach': ['spinach', 'baby spinach', 'fresh spinach', 'frozen spinach'],
      'lettuce': ['lettuce', 'romaine', 'iceberg', 'butter lettuce', 'mixed greens'],
      'cucumber': ['cucumber', 'cucumbers', 'english cucumber', 'persian cucumber'],
      'zucchini': ['zucchini', 'zucchinis', 'yellow squash'],
      
      // Proteins
      'chicken': ['chicken', 'chicken breast', 'chicken breasts', 'chicken thigh',
                  'chicken thighs', 'whole chicken', 'chicken drumsticks', 'chicken wings'],
      'beef': ['beef', 'ground beef', 'beef chuck', 'sirloin', 'ribeye', 'beef stew meat',
               'beef roast', 'flank steak', 'brisket'],
      'pork': ['pork', 'pork chop', 'pork chops', 'pork loin', 'pork shoulder',
               'ground pork', 'bacon', 'pork tenderloin'],
      'salmon': ['salmon', 'salmon fillet', 'salmon fillets', 'smoked salmon'],
      'shrimp': ['shrimp', 'prawns', 'jumbo shrimp', 'medium shrimp'],
      'egg': ['egg', 'eggs', 'large eggs', 'medium eggs'],
      'tofu': ['tofu', 'firm tofu', 'extra firm tofu', 'silken tofu'],
      
      // Dairy
      'milk': ['milk', 'whole milk', '2% milk', 'skim milk', 'low-fat milk'],
      'butter': ['butter', 'unsalted butter', 'salted butter'],
      'cheese': ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'swiss cheese',
                 'shredded cheese', 'cream cheese', 'feta', 'goat cheese'],
      'yogurt': ['yogurt', 'greek yogurt', 'plain yogurt', 'vanilla yogurt'],
      'cream': ['cream', 'heavy cream', 'whipping cream', 'sour cream', 'half and half'],
      
      // Pantry Staples
      'flour': ['flour', 'all-purpose flour', 'bread flour', 'whole wheat flour'],
      'sugar': ['sugar', 'granulated sugar', 'white sugar', 'brown sugar', 'powdered sugar'],
      'rice': ['rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice'],
      'pasta': ['pasta', 'spaghetti', 'penne', 'fettuccine', 'macaroni', 'linguine'],
      'oil': ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil'],
      'salt': ['salt', 'kosher salt', 'sea salt', 'table salt', 'iodized salt'],
      'pepper': ['pepper', 'black pepper', 'ground pepper', 'peppercorns'],
      'beans': ['beans', 'black beans', 'kidney beans', 'pinto beans', 'cannellini beans',
                'chickpeas', 'garbanzo beans'],
      'stock': ['stock', 'broth', 'chicken stock', 'beef stock', 'vegetable stock',
                'chicken broth', 'beef broth', 'vegetable broth'],
      
      // Herbs & Spices
      'basil': ['basil', 'fresh basil', 'dried basil', 'basil leaves'],
      'parsley': ['parsley', 'fresh parsley', 'dried parsley', 'flat-leaf parsley'],
      'cilantro': ['cilantro', 'fresh cilantro', 'coriander', 'cilantro leaves'],
      'thyme': ['thyme', 'fresh thyme', 'dried thyme'],
      'rosemary': ['rosemary', 'fresh rosemary', 'dried rosemary'],
      'oregano': ['oregano', 'dried oregano', 'fresh oregano'],
      'cumin': ['cumin', 'ground cumin', 'cumin seeds'],
      'paprika': ['paprika', 'smoked paprika', 'sweet paprika'],
      'ginger': ['ginger', 'fresh ginger', 'ground ginger', 'ginger root'],
      
      // Fruits
      'apple': ['apple', 'apples', 'granny smith', 'gala apple', 'honeycrisp'],
      'banana': ['banana', 'bananas'],
      'lemon': ['lemon', 'lemons', 'lemon juice'],
      'lime': ['lime', 'limes', 'lime juice'],
      'orange': ['orange', 'oranges', 'orange juice'],
      'berry': ['berry', 'berries', 'strawberry', 'strawberries', 'blueberry', 
                'blueberries', 'raspberry', 'raspberries', 'blackberry', 'blackberries'],
    };
  }

  /**
   * Load unit conversion tables
   */
  loadUnitConversions() {
    return {
      'garlic': {
        baseUnit: 'clove',
        'clove': 1,
        'cloves': 1,
        'head': 10,        // 1 head ≈ 10 cloves
        'heads': 10,
        'tablespoon': 3,   // 1 tbsp ≈ 3 cloves minced
        'tbsp': 3,
        'teaspoon': 1,
        'tsp': 1
      },
      'onion': {
        baseUnit: 'whole',
        'whole': 1,
        'small': 0.75,
        'medium': 1,
        'large': 1.5,
        'cup': 1,          // 1 medium onion ≈ 1 cup chopped
        'cups': 1
      },
      'butter': {
        baseUnit: 'tablespoon',
        'tablespoon': 1,
        'tbsp': 1,
        'tablespoons': 1,
        'teaspoon': 0.33,
        'tsp': 0.33,
        'cup': 16,         // 1 cup = 16 tbsp
        'cups': 16,
        'stick': 8,        // 1 stick = 8 tbsp
        'sticks': 8
      },
      // Add more as needed...
    };
  }

  /**
   * Debug logging
   */
  log(message, data = null) {
    if (this.debug) {
      console.log(`[IngredientCombiner] ${message}`, data || '');
    }
  }
}

export default IntelligentIngredientCombiner;
