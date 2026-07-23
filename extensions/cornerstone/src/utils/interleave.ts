/**
 * Interleave the items from all the lists so that the first items are first
 * in the returned list, the second items are next etc.
 * Does this in a O(n) fashion, and return lists[0] if there is only one list.
 *
 * @param lists - Array of arrays to interleave
 * @returns Array reordered to be breadth first traversal of lists
 */
export default function interleave<T>(lists: T[][]): T[] {
  if (!lists || !lists.length) {
    return [];
  }
  if (lists.length === 1) {
    return lists[0];
  }

  const useLists = [...lists];
  const ret = [];
  for (let i = 0; useLists.length > 0; i++) {
    for (let j = 0; j < useLists.length; j++) {
      const list = useLists[j];
      if (i >= list.length) {
        useLists.splice(j, 1);
        j--; // Adjust index after removal to avoid iterator skipping
        continue;
      }
      ret.push(list[i]);
    }
  }

  return ret;
}
