import ndarray from 'ndarray';

/**
 * Anonymous function - Rotates a matrix by 90 degrees.
 *
 * @param  {Ndarray} matrix The matrix to rotate.
 * @returns {Ndarry}        The rotated matrix.
 */
export default function(matrix) {
  const [rows, cols] = matrix.shape;

  // DebugPrintMatrix(matrix);

  const result = ndarray(new Uint8Array(rows * cols), [cols, rows]);

  const resultColsMinus1 = result.shape[1] - 1;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result.set(j, resultColsMinus1 - i, matrix.get(i, j));
    }
  }

  // DebugPrintMatrix(result);

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
