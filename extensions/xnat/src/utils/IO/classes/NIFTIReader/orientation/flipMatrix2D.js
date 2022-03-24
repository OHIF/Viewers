import ndarray from 'ndarray';

const flipMatrix2D = {
  h,
  v,
};

export { flipMatrix2D };

/**
 * flipMatrix2D.h - Flips a 2D matrix in the horizontal direction.
 *
 * @param  {Ndarry} matrix The matrix to flip.
 * @return {Ndarry}   The flipped matrix.
 */
function h(matrix, typedArray) {
  const [rows, cols] = matrix.shape;

  const result = ndarray(new typedArray(rows * cols), [rows, cols]);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result.set(i, j, matrix.get(i, cols - 1 - j));
    }
  }

  return result;
}

/**
 * flipMatrix2D.h - Flips a 2D matrix in the vertical direction.
 *
 * @param  {Ndarry} matrix The matrix to flip.
 * @return {Ndarry}   The flipped matrix.
 */
function v(matrix, typedArray) {
  const [rows, cols] = matrix.shape;

  const result = ndarray(new typedArray(rows * cols), [rows, cols]);

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      result.set(i, j, matrix.get(rows - 1 - i, j));
    }
  }

  return result;
}
