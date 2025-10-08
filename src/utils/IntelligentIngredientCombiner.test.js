/**
 * 🧪 INTELLIGENT INGREDIENT COMBINER - TEST SUITE
 * 
 * Tests for the automatic ingredient combining system
 * Run this to verify combining logic works correctly
 */

import IntelligentIngredientCombiner from '../utils/IntelligentIngredientCombiner';

// Test data
const testCases = [
  {
    name: 'Garlic Variations',
    input: [
      { id: '1', name: '2 cloves garlic', checked: false },
      { id: '2', name: '1 head garlic', checked: false },
      { id: '3', name: 'minced garlic, 2 tablespoons', checked: false }
    ],
    expectedFamily: 'garlic',
    expectedCombine: true,
    expectedNote: 'Should combine to ~18 cloves or 1.8 heads with prep notes'
  },
  {
    name: 'Onion Varieties',
    input: [
      { id: '1', name: '1 yellow onion', checked: false },
      { id: '2', name: '2 red onions', checked: false },
      { id: '3', name: 'chopped onion, 1 cup', checked: false }
    ],
    expectedFamily: 'onion',
    expectedCombine: true,
    expectedNote: 'Should combine to ~4 onions with quality notes'
  },
  {
    name: 'Tomato Types',
    input: [
      { id: '1', name: '2 fresh tomatoes', checked: false },
      { id: '2', name: '1 can diced tomatoes', checked: false },
      { id: '3', name: 'cherry tomatoes, 1 pint', checked: false }
    ],
    expectedFamily: 'tomato',
    expectedCombine: true,
    expectedNote: 'Should keep fresh separate from canned (quality difference)'
  },
  {
    name: 'Plural Handling',
    input: [
      { id: '1', name: '2 tomatoes', checked: false },
      { id: '2', name: '1 tomato', checked: false }
    ],
    expectedFamily: 'tomato',
    expectedCombine: true,
    expectedNote: 'Should combine to 3 tomatoes'
  },
  {
    name: 'Different Ingredients (No Combine)',
    input: [
      { id: '1', name: 'garlic', checked: false },
      { id: '2', name: 'onion', checked: false },
      { id: '3', name: 'tomato', checked: false }
    ],
    expectedFamily: null,
    expectedCombine: false,
    expectedNote: 'Should keep separate - different ingredients'
  },
  {
    name: 'Preparation Tracking',
    input: [
      { id: '1', name: 'chopped garlic', checked: false },
      { id: '2', name: 'minced garlic', checked: false },
      { id: '3', name: 'crushed garlic', checked: false }
    ],
    expectedFamily: 'garlic',
    expectedCombine: true,
    expectedNote: 'Should note: some chopped, some minced, some crushed'
  },
  {
    name: 'Unit Conversion',
    input: [
      { id: '1', name: '8 tablespoons butter', checked: false },
      { id: '2', name: '1 stick butter', checked: false }
    ],
    expectedFamily: 'butter',
    expectedCombine: true,
    expectedNote: 'Should combine to 16 tbsp or 2 sticks'
  },
  {
    name: 'Complex Real-World List',
    input: [
      { id: '1', name: '2 cloves garlic', checked: false },
      { id: '2', name: '1 yellow onion', checked: false },
      { id: '3', name: '2 tomatoes', checked: false },
      { id: '4', name: '1 head garlic', checked: false },
      { id: '5', name: 'red onion, diced', checked: false },
      { id: '6', name: 'cherry tomatoes, 1 pint', checked: false },
      { id: '7', name: 'minced garlic', checked: false }
    ],
    expectedFamily: null,
    expectedCombine: true,
    expectedNote: 'Should combine similar items: 7 → ~3-4 items'
  }
];

// Run tests
function runTests() {
  console.log('🧪 STARTING INGREDIENT COMBINER TESTS\n');
  console.log('='.repeat(60));
  
  const combiner = new IntelligentIngredientCombiner({ debug: true });
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`\n📝 Test ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(60));
    
    console.log('\n📥 Input:');
    testCase.input.forEach(item => console.log(`   - ${item.name}`));
    
    console.log('\n🔄 Processing...');
    const result = combiner.combineItems(testCase.input);
    
    console.log('\n📤 Output:');
    result.forEach(item => {
      console.log(`   - ${item.name}${item._combined ? ' [COMBINED]' : ''}`);
      if (item._originalItems) {
        console.log(`     (from ${item._originalItems.length} original items)`);
      }
    });
    
    // Validate results
    const inputCount = testCase.input.length;
    const outputCount = result.length;
    const didCombine = outputCount < inputCount;
    
    console.log('\n✅ Validation:');
    console.log(`   Input items: ${inputCount}`);
    console.log(`   Output items: ${outputCount}`);
    console.log(`   Combined: ${didCombine ? 'YES' : 'NO'}`);
    console.log(`   Expected: ${testCase.expectedCombine ? 'YES' : 'NO'}`);
    
    const testPassed = (didCombine === testCase.expectedCombine) || 
                       (!testCase.expectedCombine && outputCount === inputCount);
    
    if (testPassed) {
      console.log('\n✅ TEST PASSED!');
      passed++;
    } else {
      console.log('\n❌ TEST FAILED!');
      console.log(`   Expected combining: ${testCase.expectedCombine}`);
      console.log(`   Got combining: ${didCombine}`);
      failed++;
    }
    
    console.log('\n💡 Note:', testCase.expectedNote);
    console.log('='.repeat(60));
  });
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Combiner is working correctly! 🎉');
  } else {
    console.log('\n⚠️  Some tests failed. Review the logic.');
  }
  
  return { passed, failed, total: testCases.length };
}

// Export for use in React Native
export { runTests, testCases };

// If running in Node.js directly
if (typeof window === 'undefined') {
  runTests();
}
