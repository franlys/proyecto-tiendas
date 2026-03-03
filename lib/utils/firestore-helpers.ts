/**
 * Recursively removes undefined values from an object.
 * Firestore doesn't accept undefined values, so this helper ensures clean data.
 *
 * @param obj - The object to clean
 * @returns A new object with all undefined values removed
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as T;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as T;
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanForFirestore(v)])
    ) as T;
  }
  return obj;
}

/**
 * Alias for cleanForFirestore for backwards compatibility
 */
export const removeUndefined = cleanForFirestore;
