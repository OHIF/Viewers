/**
 * Given the flatten index, and rows and column, it returns the
 * row and column index
 */
const unravelIndex = (index, numRows, numCols) => {
  const row = Math.floor(index / numCols);
  const col = index % numCols;
  return { row, col };
};

export default unravelIndex;
