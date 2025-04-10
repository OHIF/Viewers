import ndarray from 'ndarray';

const flipMatrix2D = {
  h,
  v,
};

export { flipMatrix2D };

/**
 * FlipMatrix2D.h - Flips a 2D matrix in the horizontal direction.
 *
 * @param  {Ndarry} matrix The matrix to flip.
 * @returns {Ndarry}   The flipped matrix.
 */
function h(matrix) {
  const [rows, cols] = matrix.shape;

  const result = ndarray(new Uint8Array(rows * cols), [rows, cols]);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result.set(i, j, matrix.get(i, cols - 1 - j));
    }
  }

  return result;
}

/**
 * FlipMatrix2D.h - Flips a 2D matrix in the vertical direction.
 *
 * @param  {Ndarry} matrix The matrix to flip.
 * @returns {Ndarry}   The flipped matrix.
 */
function v(matrix) {
  const [rows, cols] = matrix.shape;

  const result = ndarray(new Uint8Array(rows * cols), [rows, cols]);

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      result.set(i, j, matrix.get(rows - 1 - i, j));
    }
  }

  return result;
}
