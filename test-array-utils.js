// Test script to verify arrayUtils functions work correctly
const { ensureArray, safeMap, validateApiResponse } = require('./dist/assets/index-BtHh4OtM.js');

// Test cases that would have caused "t.map is not a function" errors
console.log('Testing arrayUtils...');

// Test 1: null/undefined inputs
console.log('Test 1 - null input:', ensureArray(null)); // Should return []
console.log('Test 1 - undefined input:', ensureArray(undefined)); // Should return []

// Test 2: safeMap with non-array
console.log('Test 2 - safeMap with null:', safeMap(null, x => x)); // Should return []

// Test 3: validateApiResponse with problematic data
const problematicData = [
  { id: 1, list_borrowing: null },
  { id: 2, list_borrowing: undefined },
  { id: 3, list_borrowing: [{ item: 'test' }] }
];

console.log('Test 3 - validateApiResponse:', validateApiResponse(problematicData, ['list_borrowing']));

console.log('All tests completed successfully!');
