/**
 * Generates a combined hash for an array of strings using a modified FNV-1a algorithm
 * @param strings - Array of strings to generate a combined hash for
 * @returns A string representation of the combined hash in base 36
 */
function generateHash(strings: string[]): string {
  let combinedHash = 0x811c9dc5; // Initial FNV offset basis
  for (const str of strings) {
    const strHash = fnv1aHash(str);
    for (let i = 0; i < strHash.length; i++) {
      combinedHash ^= strHash.charCodeAt(i);
      combinedHash +=
        (combinedHash << 1) +
        (combinedHash << 4) +
        (combinedHash << 7) +
        (combinedHash << 8) +
        (combinedHash << 24);
    }
  }
  return `${(combinedHash >>> 0).toString(36)}`;
}

/**
 * Helper function to generate a hash for a string using FNV-1a algorithm
 * @param str - string to hash
 * @returns the hashed string
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

export { generateHash, fnv1aHash };
