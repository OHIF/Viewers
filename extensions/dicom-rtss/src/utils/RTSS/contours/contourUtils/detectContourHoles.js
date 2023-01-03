import vtkPolygon from '@kitware/vtk.js/Common/DataModel/Polygon';

/**
 * Functions for detecting and dealing with holes within contours.
 * Expected Contour format:
 * {
 *   type,
 *   contourPoints
 * }
 */

/**
 * Checks if point is inside polygon defined by vertices array
 * Code from
 * https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
 * most original version based on:
 * https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
 * @param {*} point
 * @param {*} vertices
 * @returns
 */
const getIsPointInsidePolygon = (point, vertices) => {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0],
      yi = vertices[i][1];
    const xj = vertices[j][0],
      yj = vertices[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Check if inner contour is completely surrounded by outer contour.
 * @param {*} outerContour
 * @param {*} innerContour
 * @returns
 */
function checkEnclosed(outerContour, innerContour, points) {
  const vertices = [];
  outerContour.contourPoints.forEach(point => {
    vertices.push([points[point][0], points[point][1]]);
  });

  let pointsNotEnclosed = 0;
  innerContour.contourPoints.forEach(point => {
    const result = getIsPointInsidePolygon(
      [points[point][0], points[point][1]],
      vertices
    );
    //console.log(result);

    if (!result) {
      pointsNotEnclosed++;
    }
  });

  return pointsNotEnclosed === 0;
}

/**
 * Check if contours have holes, if so update contour accordingly
 * @param {*} polyData
 * @param {*} bypass
 */
export function processContourHoles(contours, points, useXOR = true) {
  //console.log(points);

  // Add non-closed planars to contour list
  const retContours = contours.filter(
    contour => contour.type !== 'CLOSED_PLANAR'
  );

  // Find closed planar contours
  const closedContours = contours.filter(
    contour => contour.type === 'CLOSED_PLANAR'
  );

  // Iterate through each contour in list check for contours that have holes
  const contourWithHoles = [];
  let contourWithoutHoles = [];
  closedContours.forEach((contour, index) => {
    const holes = [];

    // Check if any other contour is a hole surrounded by current contour
    closedContours.forEach((hContour, hIndex) => {
      if (index != hIndex) {
        // Check if inner loop contour is a hole of outer loop contour
        if (checkEnclosed(contour, hContour, points)) {
          holes.push(hIndex);
        }
      }
    });

    // Check if holes were found
    if (holes.length > 0) {
      // Note current contour and reference of its holes
      contourWithHoles.push({
        contour,
        holes,
      });
    } else {
      // Note contour index without holes
      contourWithoutHoles.push(index);
    }
  });

  if (useXOR) {
    // XOR method
    contourWithHoles.forEach(contourHoleSet => {
      // Modify contour with hole to type CLOSEDPLANAR_XOR
      contourHoleSet.contour.type = 'CLOSEDPLANAR_XOR';
      retContours.push(contourHoleSet.contour);

      contourHoleSet.holes.forEach(holeIndex => {
        // Modify hole type to CLOSEDPLANAR_XOR
        // and add to contour list to be returned
        closedContours[holeIndex].type = 'CLOSEDPLANAR_XOR';
        retContours.push(closedContours[holeIndex]);

        // Remove hole from list of contours without holes
        contourWithoutHoles = contourWithoutHoles.filter(contourIndex => {
          return contourIndex !== holeIndex;
        });
      });
    });

    // Add remaining contours to list (neither hole nor have holes)
    contourWithoutHoles.forEach(contourIndex => {
      retContours.push(closedContours[contourIndex]);
    });
  } else {
    // Keyhole method, not implemented
  }

  return retContours;
}

export default { processContourHoles };
