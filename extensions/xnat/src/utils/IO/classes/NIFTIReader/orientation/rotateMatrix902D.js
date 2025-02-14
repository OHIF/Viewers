import ndarray from 'ndarray';

/**
 * anonymous function - Rotates a matrix by 90 degrees.
 *
 * @param  {Ndarray} matrix The matrix to rotate.
 * @return {Ndarry}        The rotated matrix.
 */
export default function(matrix, typedArray) {
  const [rows, cols] = matrix.shape;

  //debugPrintMatrix(matrix);

  let result = ndarray(new typedArray(rows * cols), [cols, rows]);

  let resultColsMinus1 = result.shape[1] - 1;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result.set(j, resultColsMinus1 - i, matrix.get(i, j));
    }
  }

  //debugPrintMatrix(result);

  return result;
}

function debugPrintMatrix(m) {
  console.log(`shape: (${m.shape[0]}, ${m.shape[1]})`);

  for (let i = 0; i < m.shape[0]; i++) {
    let row = '';
    for (let j = 0; j < m.shape[1]; j++) {
      row += `${m.get(i, j)} `;
    }
    console.log(row);
  }
}
