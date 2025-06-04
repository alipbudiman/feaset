/**
 * Utility functions to safely handle arrays and prevent "map is not a function" errors
 */

/**
 * Ensures the input is always an array
 * @param input - The input that should be an array
 * @returns An array (empty if input is not an array)
 */
export const ensureArray = <T>(input: unknown): T[] => {
  return Array.isArray(input) ? input : [];
};

/**
 * Safely maps over an array-like input
 * @param input - The input that should be an array
 * @param mapFn - The mapping function
 * @returns Mapped array or empty array if input is not an array
 */
export const safeMap = <T, R>(input: unknown, mapFn: (item: T, index: number) => R): R[] => {
  const arr = ensureArray<T>(input);
  return arr.map(mapFn);
};

/**
 * Validates API response and ensures nested arrays are properly structured
 * @param data - API response data
 * @param arrayFields - Fields that should be arrays
 * @returns Validated data with properly structured arrays
 */
export const validateApiResponse = <T extends Record<string, any>>(
  data: unknown, 
  arrayFields: string[] = []
): T[] => {
  const baseArray = ensureArray<T>(data);
  
  if (arrayFields.length === 0) {
    return baseArray;
  }
  
  return baseArray.map(item => {
    const validatedItem = { ...item } as any;
    arrayFields.forEach(field => {
      if (validatedItem[field] !== undefined) {
        validatedItem[field] = ensureArray(validatedItem[field]);
      }
    });
    return validatedItem as T;
  });
};
