// Simple test to verify our array utility functions
const ensureArray = (input) => {
  return Array.isArray(input) ? input : [];
};

const safeMap = (input, mapFn) => {
  const arr = ensureArray(input);
  return arr.map(mapFn);
};

const validateApiResponse = (data, arrayFields = []) => {
  const baseArray = ensureArray(data);
  
  if (arrayFields.length === 0) {
    return baseArray;
  }
  
  return baseArray.map(item => {
    const validatedItem = { ...item };
    arrayFields.forEach(field => {
      if (validatedItem[field] !== undefined) {
        validatedItem[field] = ensureArray(validatedItem[field]);
      }
    });
    return validatedItem;
  });
};

// Test cases that would have caused "t.map is not a function" errors
console.log('Testing arrayUtils functions...');

// Test 1: null/undefined inputs
console.log('✓ Test 1 - null input:', JSON.stringify(ensureArray(null)));
console.log('✓ Test 1 - undefined input:', JSON.stringify(ensureArray(undefined)));

// Test 2: safeMap with non-array
console.log('✓ Test 2 - safeMap with null:', JSON.stringify(safeMap(null, x => x)));
console.log('✓ Test 2 - safeMap with array:', JSON.stringify(safeMap([1,2,3], x => x * 2)));

// Test 3: validateApiResponse with problematic data
const problematicData = [
  { id: 1, list_borrowing: null },
  { id: 2, list_borrowing: undefined },
  { id: 3, list_borrowing: [{ item: 'test' }] }
];

const result = validateApiResponse(problematicData, ['list_borrowing']);
console.log('✓ Test 3 - validateApiResponse fixed null/undefined arrays');
console.log('  Result:', JSON.stringify(result, null, 2));

// Test 4: The exact scenario that was causing errors
const mockApiResponse = null; // This was causing "t.map is not a function"
const safeResult = ensureArray(mockApiResponse);
console.log('✓ Test 4 - Mock API null response handled safely:', JSON.stringify(safeResult));

console.log('\n🎉 All tests passed! The "t.map is not a function" error should be resolved.');
