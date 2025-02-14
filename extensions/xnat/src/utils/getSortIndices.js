import SORT_ORDER from '../constants/sortOrder';

/**
 * getSortIndices
 *
 * @param objectArray
 * @param key
 * @param sortOrder
 * @return {*[]}
 */
const getSortIndices = (objectArray, key, sortOrder) => {
  let sortIndices = [];
  const order = sortOrder[key];

  if (order === SORT_ORDER.NONE) {
    for (let i = 0; i < objectArray.length; i++) {
      sortIndices.push(i);
    }

    return sortIndices;
  }

  const toSort = objectArray.map((item, index) => ({
    [key]: item[key],
    index: index,
  }));

  if (order === SORT_ORDER.ASCENDING) {
    toSort.sort((a, b) => a[key].localeCompare(b[key]));
  } else if (order === SORT_ORDER.DESCENDING) {
    toSort.sort((a, b) => b[key].localeCompare(a[key]));
  }

  sortIndices = toSort.map(item => item.index);

  return sortIndices;
};

export default getSortIndices;
