// This can be calculated by some formula probably, but for now we just use a constant since
// this might be objective
const GRID_MAPPINGS = {
  // 1x2
  '1x2:1x1': {
    0: 0,
  },
  '1x2:1x3': {
    0: 0,
    1: 1,
  },
  '1x2:2x1': {
    0: 0,
    1: 1,
  },
  '1x2:2x2': {
    0: 0,
    1: 1,
  },
  '1x2:2x3': {
    0: 0,
    1: 1,
  },
  '1x2:3x1': {
    0: 0,
    1: 1,
  },
  '1x2:3x2': {
    0: 0,
    1: 1,
  },
  '1x2:3x3': {
    0: 0,
    1: 1,
  },
  // 1x3
  '1x3:1x1': {
    0: 0,
  },
  '1x3:1x2': {
    0: 0,
    1: 1,
  },
  '1x3:2x1': {
    0: 0,
    1: 1,
  },
  '1x3:2x2': {
    0: 0,
    1: 1,
    2: 2,
  },
  '1x3:2x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  '1x3:3x1': {
    0: 0,
    1: 1,
    2: 2,
  },
  '1x3:3x2': {
    0: 0,
    1: 1,
    2: 2,
  },
  '1x3:3x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  // 2x1
  '2x1:1x2': {
    0: 0,
    1: 1,
  },
  '2x1:1x3': {
    0: 0,
    1: 1,
  },
  '2x1:2x2': {
    0: 0,
    2: 1,
  },
  '2x1:2x3': {
    0: 0,
    3: 1,
  },
  '2x1:3x1': {
    0: 0,
    1: 1,
  },
  '2x1:3x2': {
    0: 0,
    2: 1,
  },
  '2x1:3x3': {
    0: 0,
    3: 1,
  },
  // 2x2
  '2x2:1x2': {
    0: 0,
    1: 1,
  },
  '2x2:1x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  '2x2:2x1': {
    0: 0,
    1: 2,
  },
  '2x2:2x3': {
    0: 0,
    1: 1,
    3: 2,
    4: 3,
  },
  '2x2:3x1': {
    0: 0,
    1: 1,
    2: 2,
  },
  '2x2:3x2': {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
  },
  '2x2:3x3': {
    0: 0,
    1: 1,
    3: 2,
    4: 3,
  },
  // 2x3
  '2x3:1x2': {
    0: 0,
    1: 1,
  },
  '2x3:1x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  '2x3:2x1': {
    0: 0,
    1: 3,
  },
  '2x3:2x2': {
    0: 0,
    1: 1,
    2: 3,
    3: 4,
  },
  '2x3:3x1': {
    0: 0,
    1: 1,
    2: 2,
  },
  '2x3:3x2': {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
  '2x3:3x3': {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
  // 3x1
  '3x1:1x2': {
    0: 0,
    1: 1,
  },
  '3x1:1x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  '3x1:2x1': {
    0: 0,
    1: 1,
  },
  // TODO: I'm not sure about the following
  '3x1:2x2': {
    0: 0,
    1: 1,
    2: 2,
  },
  '3x1:2x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  '3x1:3x2': {
    0: 0,
    2: 1,
    4: 2,
  },
  '3x1:3x3': {
    0: 0,
    3: 1,
    6: 2,
  },
  // 3x2
  '3x2:1x2': {
    0: 0,
    1: 1,
  },
  '3x2:1x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  '3x2:2x1': {
    0: 0,
    1: 2,
  },
  '3x2:2x2': {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
  },
  '3x2:2x3': {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
  '3x2:3x1': {
    0: 0,
    1: 2,
    2: 4,
  },
  '3x2:3x3': {
    0: 0,
    1: 1,
    3: 2,
    4: 3,
    6: 4,
    7: 5,
  },
  // 3x3
  '3x3:1x2': {
    0: 0,
    1: 1,
  },
  '3x3:1x3': {
    0: 0,
    1: 1,
    2: 2,
  },
  '3x3:2x1': {
    0: 0,
    1: 3,
  },
  '3x3:2x2': {
    0: 0,
    1: 1,
    2: 3,
    3: 4,
  },
  '3x3:2x3': {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
  '3x3:3x1': {
    0: 0,
    1: 3,
    2: 6,
  },
  '3x3:3x2': {
    0: 0,
    1: 1,
    2: 3,
    3: 4,
    4: 6,
    5: 7,
  },
};

/**
 * The purpose of this function is to convert a grid with numRows and numCols
 * and index for each cell into another grid with different dimensions, but it should
 * intelligently use the data from the original grid to fill the new grid at
 * correct locations.
 *
 * For instance:
 * if the old grid is a 2x2 (numRows = 2, numCols = 2) and the new grid is a 3x3
 * it should intelligently insert the cells in the new grid so that the cells
 * are added to the right most column. Then the mapping is as follows:
 * 0 -> 0, 1 -> 1, 3 -> 2, 4 -> 3 (viewport 2 in the old grid can be used in
 * the place of viewport 3 in the new grid)
 *
 * Or if the old grid is 2x2 and new grid is 2x4, the mapping is as follows:
 * 0 -> 0, 1 -> 1, 4 -> 2 and 5 -> 3
 *
 * Or if the old grid is 2x2 and the new grid is 1x2, the mapping is as follows:
 * 0 -> 0, 1 -> 2
 *
 * @param {Object} oldGrid
 * @param {number} oldGrid.numRows
 * @param {number} oldGrid.numCols
 *
 * @param {Object} newGrid
 * @param {number} newGrid.numRows
 * @param {number} newGrid.numCols
 *
 * @returns {Map} A map that maps the new indices to the old indices
 *
 */
const getGridMapping = (oldGrid, newGrid) => {
  const mapping = {};
  const { numRows: oldNumRows, numCols: oldNumCols } = oldGrid;
  const { numRows: newNumRows, numCols: newNumCols } = newGrid;

  if (oldNumRows === 1 && oldNumCols === 1) {
    // If the old grid is 1x1, then we can just return the first cell
    mapping[0] = 0;
    return mapping;
  }

  if (newNumRows === 1 && newNumCols === 1) {
    // If the new grid is 1x1, then we can just return the first cell
    mapping[0] = 0;
    return mapping;
  }

  const key = `${oldNumRows}x${oldNumCols}:${newNumRows}x${newNumCols}`;
  const map = GRID_MAPPINGS[key];

  if (!map) {
    throw new Error(`No mapping found for ${key}`);
  }

  return map;
};

export default getGridMapping;
