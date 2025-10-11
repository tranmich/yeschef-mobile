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
    // Configuration
    this.debug = options.debug !== undefined ? options.debug : true; // Enable debug by default
    this.aggressive = options.aggressive !== undefined ? options.aggressive : true;
    
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
   * @param {Object} spacyMetadata - Optional spaCy metadata for intelligent combining
   * @param {Object} groqAnalysis - Optional Groq LLM analysis for highest quality combining
   * @returns {Array} - Combined items
   */
  combineItems(items, spacyMetadata = null, groqAnalysis = null) {
    if (!items || items.length === 0) return [];
    
    this.spacyMetadata = spacyMetadata; // Store for use in grouping
    this.groqAnalysis = groqAnalysis; // Store Groq analysis
    
    console.log('\n🧠 ===== TIER 2: JAVASCRIPT COMBINING =====');
    console.log(`📊 Input: ${items.length} items`);
    console.log(`🤖 Using Groq guidance: ${!!groqAnalysis}`);
    
    if (groqAnalysis && groqAnalysis.groups) {
      console.log(`📦 Groq provided ${groqAnalysis.groups.length} groups to combine\n`);
    }
    
    // Step 1: Group items by base ingredient
    const groups = this.groupByIngredient(items);
    console.log(`\n📊 After grouping: ${groups.size} groups`);
    
    // Step 2: Combine within each group
    const combined = this.mergeGroups(groups);
    console.log(`\n✅ After combining: ${combined.length} items (reduced by ${items.length - combined.length})`);
    console.log('=========================================\n');
    
    // Step 3: Sort for optimal shopping order
    return this.sortForShopping(combined);
  }

  /**
   * Group items by their base ingredient family
   * Uses Groq LLM analysis first, then spaCy metadata if available
   */
  groupByIngredient(items) {
    const groups = new Map();
    
    // Build Groq decision map for quick lookup
    const groqShouldCombine = new Map(); // Map<item_name, Set<other_items_to_combine_with>>
    const groqShouldSeparate = new Set(); // Set of items that should stay separate
    const groqGroupNames = new Map(); // Map<group_key, suggested_name>
    const itemsInGroups = new Set(); // Track which items are already in groups
    
    if (this.groqAnalysis) {
      // FIRST: Process Groq's combining recommendations (PRIORITY!)
      if (this.groqAnalysis.groups) {
        this.groqAnalysis.groups.forEach((group, groupIndex) => {
          const groupKey = `groq_group_${groupIndex}`;
          
          // Store the suggested name for this group
          groqGroupNames.set(groupKey, group.combined_name || group.items[0]);
          
          group.items.forEach(itemName => {
            // Track that this item is in a group
            itemsInGroups.add(itemName);
            
            if (!groqShouldCombine.has(itemName)) {
              groqShouldCombine.set(itemName, {
                groupKey: groupKey,
                partners: new Set()
              });
            }
            // Add all other items in this group as combine partners
            group.items.forEach(otherItem => {
              if (otherItem !== itemName) {
                groqShouldCombine.get(itemName).partners.add(otherItem);
              }
            });
          });
        });
      }
      
      // SECOND: Process items that should stay separate
      // BUT: Ignore items that are already in groups (groups take priority!)
      if (this.groqAnalysis.separate) {
        this.groqAnalysis.separate.forEach(sep => {
          // Only add to separate list if NOT already in a group
          if (!itemsInGroups.has(sep.item)) {
            groqShouldSeparate.add(sep.item);
          } else {
            this.log(`  ⚠️ Groq: Ignoring contradictory "separate" decision for "${sep.item}" (already in a group)`);
          }
        });
      }
    }
    
    items.forEach(item => {
      let base;
      let shouldSeparate = false;
      let source = 'javascript'; // Track which system made the decision
      
      // PRIORITY 1: Check Groq LLM decisions (highest quality)
      if (this.groqAnalysis) {
        // Try to match this item with Groq's decisions
        // Groq might have the item without quantities, so we need fuzzy matching
        const itemNameClean = this.cleanNameForMatching(item.name);
        
        let groqMatch = null;
        
        // Check if item matches any Groq group (exact or fuzzy match)
        for (const [groqName, groupInfo] of groqShouldCombine.entries()) {
          const groqNameClean = this.cleanNameForMatching(groqName);
          if (itemNameClean === groqNameClean || item.name.includes(groqName) || groqName.includes(itemNameClean)) {
            groqMatch = { type: 'combine', info: groupInfo, matchedName: groqName };
            break;
          }
        }
        
        // If not in combine list, check separate list
        if (!groqMatch) {
          for (const groqName of groqShouldSeparate) {
            const groqNameClean = this.cleanNameForMatching(groqName);
            if (itemNameClean === groqNameClean || item.name.includes(groqName) || groqName.includes(itemNameClean)) {
              groqMatch = { type: 'separate', matchedName: groqName };
              break;
            }
          }
        }
        
        // Apply Groq decision
        if (groqMatch) {
          if (groqMatch.type === 'separate') {
            base = `groq_separate_${item.name}`;
            shouldSeparate = true;
            source = 'groq-separate';
            this.log(`  🤖 Groq: Keeping "${item.name}" separate`);
          } else {
            // Use the group key from Groq
            base = groqMatch.info.groupKey;
            source = 'groq-combine';
            
            // Store the suggested name on the item
            item._groqSuggestedName = groqGroupNames.get(groqMatch.info.groupKey);
            
            const partners = Array.from(groqMatch.info.partners);
            this.log(`  🤖 Groq: "${item.name}" → group "${item._groqSuggestedName}" (matched via "${groqMatch.matchedName}")`);
          }
        }
      }
      
      // PRIORITY 2: Check spaCy metadata (if Groq didn't decide)
      if (!base && this.spacyMetadata && this.spacyMetadata[item.id]) {
        const metadata = this.spacyMetadata[item.id];
        base = metadata.core_ingredient;
        shouldSeparate = metadata.should_separate;
        source = 'spacy';
        
        // If spaCy says to keep separate (different quality), add quality to key
        if (shouldSeparate && metadata.qualities && metadata.qualities.length > 0) {
          base = `${base}_${metadata.qualities.join('_')}`;
          this.log(`  ✨ spaCy: Keeping "${item.name}" separate (quality: ${metadata.qualities.join(', ')})`);
        } else {
          this.log(`  ✨ spaCy: "${item.name}" → "${base}"`);
        }
      }
      
      // PRIORITY 3: Fallback to JavaScript detection
      if (!base) {
        base = this.findBaseIngredient(item.name);
        source = 'javascript';
        this.log(`  📌 JavaScript: "${item.name}" → "${base}"`);
      }
      
      // Store decision source for debugging
      item._decisionSource = source;
      
      if (!groups.has(base)) {
        groups.set(base, []);
      }
      
      groups.get(base).push(item);
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
    // Step 1: Remove parenthetical content
    const withoutParens = lower.replace(/\([^)]*\)/g, '').trim();
    
    // Step 2: Remove quantity patterns (numbers, fractions, measurements)
    const withoutQuantity = withoutParens
      .replace(/^\d+\.?\d*\s*/g, '')  // Remove leading numbers
      .replace(/^\d+\/\d+\s*/g, '')   // Remove fractions
      .replace(/^(cup|tbsp|tsp|oz|lb|pound|tablespoon|teaspoon|ounce)s?\s+/gi, ''); // Remove leading units
    
    // Step 3: Split into words, filter out descriptors and quantity words
    const descriptorWords = ['finely', 'chopped', 'minced', 'diced', 'sliced', 'grated', 
                             'crushed', 'fresh', 'dried', 'canned', 'frozen', 'jarred',
                             'large', 'small', 'medium', 'whole', 'ground', 'boneless',
                             'bone-in', 'scrubbed', 'well', 'needed', 'taste', 'serving',
                             'optional', 'garnish', 'as', 'for', 'to', 'of', 'and', 'or'];
    
    const words = withoutQuantity
      .replace(/[^\w\s-]/g, ' ') // Remove punctuation except hyphens
      .split(/\s+/)
      .filter(w => w.length > 2 && 
                   !this.isQuantityWord(w) && 
                   !descriptorWords.includes(w));
    
    // Return the last meaningful word (usually the noun)
    const baseWord = words[words.length - 1] || text;
    
    this.log(`    🔍 findBaseIngredient("${text}") → "${baseWord}"`);
    return baseWord;
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
   * Clean name for matching (remove quantities, parentheses, etc.)
   */
  cleanNameForMatching(name) {
    return name
      .toLowerCase()
      .replace(/^\d+\.?\d*\s*(cup|cups|tablespoon|tablespoons|tbsp|tsp|teaspoon|teaspoons|ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kg|clove|cloves|large|medium|small)\s*/i, '')
      .replace(/\(.*?\)/g, '') // Remove parentheses
      .replace(/\s+/g, ' ')
      .trim();
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
    
    this.log('\n🔄 ===== MERGING GROUPS =====');
    this.log(`Total groups to merge: ${groups.size}`);
    
    groups.forEach((items, family) => {
      this.log(`\n📦 Group: "${family}" (${items.length} items)`);
      items.forEach(item => {
        this.log(`   - "${item.name}"`);
      });
      
      if (items.length === 1) {
        // Single item, keep as-is
        this.log(`   ✓ Single item, keeping as-is`);
        combined.push(items[0]);
      } else {
        // Multiple items, combine them
        this.log(`   🔨 Combining ${items.length} items...`);
        const merged = this.combineMultipleItems(family, items);
        this.log(`   ✅ Result: "${merged.name}"`);
        combined.push(merged);
      }
    });
    
    this.log('\n============================\n');
    
    return combined;
  }

  /**
   * Combine multiple items of the same ingredient family
   */
  combineMultipleItems(family, items) {
    this.log(`\n� ===== COMBINING ITEMS =====`);
    this.log(`Family: "${family}"`);
    this.log(`Items to combine: ${items.length}`);
    items.forEach((item, i) => {
      this.log(`  ${i + 1}. "${item.name}"`);
    });
    
    // Extract all quantities and units
    const quantities = items.map(item => {
      const qty = this.extractQuantity(item.name);
      this.log(`  Quantity extracted from "${item.name}":`, qty);
      return qty;
    });
    
    // Extract all preparation methods
    const preparations = new Set();
    items.forEach(item => {
      const preps = this.extractPreparations(item.name);
      if (preps.length > 0) {
        this.log(`  Preparations from "${item.name}": ${preps.join(', ')}`);
      }
      preps.forEach(p => preparations.add(p));
    });
    
    // Track quality modifiers (fresh, canned, etc.)
    const qualities = new Set();
    items.forEach(item => {
      const quals = this.extractQualities(item.name);
      if (quals.length > 0) {
        this.log(`  Qualities from "${item.name}": ${quals.join(', ')}`);
      }
      quals.forEach(q => qualities.add(q));
    });
    
    // Combine quantities (convert to common unit if possible)
    this.log(`\n  🧮 Combining quantities...`);
    const combinedQuantity = this.combineQuantities(family, quantities);
    this.log(`  Combined quantity:`, combinedQuantity);
    
    // Check if Groq suggested a name for this group
    let displayName;
    const groqSuggestedName = items[0]._groqSuggestedName;
    
    if (groqSuggestedName && family.startsWith('groq_group_')) {
      // Use Groq's suggested name with our combined quantity
      console.log(`\n  🤖 GROQ GROUP: "${groqSuggestedName}"`);
      console.log(`     Items in group: ${items.length}`);
      items.forEach(item => console.log(`       - "${item.name}"`));
      console.log(`     Extracted quantities:`, quantities);
      console.log(`     Combined quantity:`, combinedQuantity);
      
      if (combinedQuantity && combinedQuantity.amount !== null && combinedQuantity.amount !== undefined) {
        // Format the quantity
        const quantityStr = this.formatQuantity(combinedQuantity.amount);
        displayName = `${quantityStr}${combinedQuantity.unit ? ' ' + combinedQuantity.unit : ''} ${groqSuggestedName}`;
        console.log(`     ✅ Final name: "${displayName}"\n`);
      } else {
        displayName = groqSuggestedName;
        console.log(`     ⚠️ No quantity! Using name only: "${displayName}"\n`);
      }
      
      // Add qualities if any
      if (qualities.size > 0) {
        displayName += ` (${Array.from(qualities).join('; ')})`;
      }
    } else {
      // Build display name normally
      displayName = this.buildDisplayName(
        family, 
        combinedQuantity, 
        Array.from(preparations),
        Array.from(qualities)
      );
    }
    
    this.log(`  📝 Final display name: "${displayName}"`);
    this.log(`============================\n`);
    
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
    // Check for "as needed" or "to taste" - these are uncountable
    if (/(as needed|to taste|optional|garnish|for serving)/i.test(text)) {
      return { amount: null, unit: 'as needed' };
    }
    
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
    
    // No quantity found - if it says "as needed", don't assign a count
    if (/(as needed|to taste|optional)/i.test(text)) {
      return { amount: null, unit: 'as needed' };
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
    
    // Normalize plural/singular forms to singular
    const unitNormalization = {
      'cups': 'cup',
      'tablespoons': 'tablespoon',
      'teaspoons': 'teaspoon',
      'ounces': 'ounce',
      'pounds': 'pound',
      'grams': 'gram',
      'cloves': 'clove',
      'sprigs': 'sprig',
      'leaves': 'leaf',
      'tbsp': 'tablespoon',
      'tsp': 'teaspoon',
      'oz': 'ounce',
      'lb': 'pound',
      'lbs': 'pound',
      'g': 'gram',
      'kg': 'kilogram'
    };
    
    // Check if we have a normalized form
    if (unitNormalization[lower]) {
      return unitNormalization[lower];
    }
    
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
    this.log(`    🧮 combineQuantities called:`, { family, quantities });
    
    if (!quantities || quantities.length === 0) {
      this.log(`    ⚠️ No quantities to combine`);
      return null;
    }
    
    // Get conversion table for this ingredient family
    const conversions = this.unitConversions[family];
    
    if (!conversions) {
      // No conversions available, try to add same units
      this.log(`    📊 No conversions for "${family}", using simple combine`);
      const result = this.combineSimpleQuantities(quantities);
      this.log(`    ✓ Simple combine result:`, result);
      return result;
    }
    
    this.log(`    📊 Using conversions for "${family}"`);
    
    // Convert all to base unit
    let totalInBaseUnit = 0;
    const baseUnit = conversions.baseUnit;
    
    quantities.forEach(({ amount, unit }) => {
      const conversionFactor = conversions[unit] || 1;
      totalInBaseUnit += amount * conversionFactor;
      this.log(`    ↳ ${amount} ${unit} × ${conversionFactor} = ${amount * conversionFactor} ${baseUnit}`);
    });
    
    this.log(`    📊 Total in base unit: ${totalInBaseUnit} ${baseUnit}`);
    
    // Convert back to best display unit
    const result = this.selectBestUnit(family, totalInBaseUnit, conversions);
    this.log(`    ✓ Final result:`, result);
    return result;
  }

  /**
   * Combine quantities with same unit
   */
  combineSimpleQuantities(quantities) {
    this.log(`      🔢 combineSimpleQuantities:`, quantities);
    
    // Filter out "as needed" items - we'll combine the countable ones
    const countableQuantities = quantities.filter(q => q.amount !== null && q.unit !== 'as needed');
    
    // Check if all items are "as needed"
    if (countableQuantities.length === 0) {
      this.log(`      ⚠️ All items are 'as needed', returning null`);
      return { amount: null, unit: 'as needed' };
    }
    
    this.log(`      ℹ️ Found ${countableQuantities.length} countable items (ignoring ${quantities.length - countableQuantities.length} 'as needed' items)`);
    
    // Group by unit
    const byUnit = {};
    
    countableQuantities.forEach(({ amount, unit }) => {
      this.log(`        Processing: ${amount} ${unit}`);
      if (!byUnit[unit]) byUnit[unit] = 0;
      byUnit[unit] += amount;
    });
    
    this.log(`      Grouped by unit:`, byUnit);
    
    // If only one unit, return combined
    const units = Object.keys(byUnit);
    if (units.length === 1) {
      const result = { amount: byUnit[units[0]], unit: units[0] };
      this.log(`      ✓ Single unit result:`, result);
      return result;
    }
    
    // Multiple units, can't combine
    this.log(`      ⚠️ Multiple different units, can't combine:`, units);
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
   * Format a quantity number for display
   */
  formatQuantity(amount) {
    if (amount === null || amount === undefined) return '';
    
    // Check if it's a whole number
    if (Number.isInteger(amount)) {
      return amount.toString();
    }
    
    // Check if it's close to a common fraction
    const fractions = {
      0.25: '¼',
      0.33: '⅓',
      0.5: '½',
      0.66: '⅔',
      0.75: '¾'
    };
    
    const whole = Math.floor(amount);
    const decimal = amount - whole;
    
    // Check if decimal part matches a common fraction
    for (const [value, symbol] of Object.entries(fractions)) {
      if (Math.abs(decimal - value) < 0.05) {
        return whole > 0 ? `${whole}${symbol}` : symbol;
      }
    }
    
    // Otherwise, format to 1 decimal place if needed
    return amount.toFixed(amount % 1 === 0 ? 0 : 1);
  }

  /**
   * Build readable display name
   */
  buildDisplayName(family, quantity, preparations, qualities) {
    let name = '';
    
    // Add quantity if available
    if (quantity && quantity.amount !== null) {
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
    } else if (quantity && quantity.unit === 'as needed') {
      // "As needed" items - just show the name
      name = family;
    } else {
      // No quantity info
      name = family;
    }
    
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
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
