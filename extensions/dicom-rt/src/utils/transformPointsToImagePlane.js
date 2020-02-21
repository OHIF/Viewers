export default function transformPointsToImagePlane(points, imagePlane) {
  // See Equation C.7.6.2.1-1 of the DICOM standard

  const {
    rowCosines,
    columnCosines,
    rowPixelSpacing: deltaI,
    columnPixelSpacing: deltaJ,
    imagePositionPatient,
  } = imagePlane;

  const X = [rowCosines[0], rowCosines[1], rowCosines[2]];
  const Y = [columnCosines[0], columnCosines[1], columnCosines[2]];
  const S = [
    imagePositionPatient[0],
    imagePositionPatient[1],
    imagePositionPatient[2],
  ];

  // 9 sets of simulataneous equations to choose from, choose which set to solve
  // Based on the largest component of each direction cosine.
  // This avoids NaNs or floating point errors caused by dividing by very small numbers and ensures a safe mapping
  // when mapping between planes that are close to orthogonal.

  let ix = 0;
  let iy = 0;
  let largestDirectionCosineMagnitude = {
    x: 0,
    y: 0,
  };

  // Find the element with the largest magnitude in each direction cosine vector.
  for (let i = 0; i < X.length; i++) {
    if (Math.abs(X[i]) > largestDirectionCosineMagnitude.x) {
      ix = i;
      largestDirectionCosineMagnitude.x = Math.abs(X[i]);
    }
    if (Math.abs(Y[i]) > largestDirectionCosineMagnitude.y) {
      iy = i;
      largestDirectionCosineMagnitude.y = Math.abs(Y[i]);
    }
  }

  const ci = {
    // Index of max elements in X and Y
    ix,
    iy,
  };

  // Sanity Check
  const directionCosineMagnitude = {
    x: Math.pow(X[0], 2) + Math.pow(X[1], 2) + Math.pow(X[2], 2),
    y: Math.pow(Y[0], 2) + Math.pow(Y[1], 2) + Math.pow(Y[2], 2),
  };

  if (directionCosineMagnitude.x < 0.99 || directionCosineMagnitude.y < 0.99) {
    throw Error(
      `Direction cosines do not sum to 1 in quadrature. There is likely a mistake in the DICOM metadata.` +
        `directionCosineMagnitudes: ${directionCosineMagnitude.x}, ${directionCosineMagnitude.y}`
    );
  }

  // Fill in elements that won't change between points
  const c = [undefined, Y[ci.ix], X[ci.ix], undefined, X[ci.iy], Y[ci.iy]];

  for (let pointI = 0; pointI < points.length; pointI++) {
    // Subtract imagePositionPatient from the coordinate
    const r = [
      points[pointI].x - S[0],
      points[pointI].y - S[1],
      points[pointI].z - S[2],
    ];

    // Set the variable terms in c.
    c[0] = r[ci.ix];
    c[3] = r[ci.iy];

    // General case: Solves the two choosen simulataneous equations to go from the patient coordinate system to the imagePlane.
    const i =
      (c[0] - (c[1] * c[3]) / c[5]) /
      (c[2] * deltaI * (1 - (c[1] * c[4]) / (c[2] * c[5])));
    const j = (c[3] - c[4] * i * deltaI) / (c[5] * deltaJ);

    // NOTE: Add (0.5, 0.5) to the coordinate, as PCS reference frame is with respect to the centre of the first pixel.
    points[pointI].x = i + 0.5;
    points[pointI].y = j + 0.5;
    delete points[pointI].z;
  }

  return;
}
