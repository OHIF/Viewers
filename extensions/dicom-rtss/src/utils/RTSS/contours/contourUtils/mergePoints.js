/**
 * Checks if point is within array
 * @param {*} array
 * @param {*} pt
 * @returns
 */
function ptInArray(array, pt) {
  let index = -1;
  for (let i = 0; i < array.length; i++) {
    if (isSamePoint(pt, array[i])) {
      index = i;
    }
  }
  return index;
}

/**
 * Checks if point A and point B contain same values
 * @param {*} ptA
 * @param {*} ptB
 * @returns
 */
function isSamePoint(ptA, ptB) {
  if (ptA[0] == ptB[0] && ptA[1] == ptB[1] && ptA[2] == ptB[2]) {
    return true;
  } else {
    return false;
  }
}

/**
 * Goes through linesArray and replaces all references of old index with new index
 * @param {*} linesArray
 * @param {*} oldIndex
 * @param {*} newIndex
 */
function replacePointIndexReferences(linesArray, oldIndex, newIndex) {
  for (let i = 0; i < linesArray.length; i++) {
    const line = linesArray[i];
    if (line.a == oldIndex) {
      line.a = newIndex;
    } else if (line.b == oldIndex) {
      line.b = newIndex;
    }
  }
}

/**
 * Iterate through polyData from vtkjs and merge any points that are the same
 * then update merged point references within lines array
 * @param {*} polyData
 * @param {*} bypass
 * @returns
 */
export function removeDuplicatePoints(polyData, bypass) {
  const points = polyData.getPoints();
  const lines = polyData.getLines();

  const pointsArray = [];
  for (let i = 0; i < points.getNumberOfPoints(); i++) {
    const pt = points.getPoint(i).slice();
    pointsArray.push(pt);
  }
  const linesArray = [];
  for (let i = 0; i < lines.getNumberOfCells(); i++) {
    const cell = lines.getCell(i * 3).slice();
    //console.log(JSON.stringify(cell));
    const a = cell[0];
    const b = cell[1];
    const line = {
      a,
      b,
    };
    linesArray.push(line);
  }

  if (bypass) {
    return { points: pointsArray, lines: linesArray };
  }

  // Iterate through points and replace any duplicates
  const newPoints = [];
  for (let i = 0; i < pointsArray.length; i++) {
    const pt = pointsArray[i];
    let index = ptInArray(newPoints, pt);

    if (index >= 0) {
      // Duplicate Point -> replace references in lines
      replacePointIndexReferences(linesArray, i, index);
    } else {
      index = newPoints.length;
      newPoints.push(pt);
      replacePointIndexReferences(linesArray, i, index);
    }
  }

  // Final pass through lines, remove any that refer to exact same point
  const newLines = [];
  linesArray.forEach(line => {
    if (line.a != line.b) {
      newLines.push(line);
    }
  });

  return { points: newPoints, lines: newLines };
}

export default { removeDuplicatePoints };
