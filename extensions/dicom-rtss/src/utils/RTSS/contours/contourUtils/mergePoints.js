function ptInArray(array, pt) {
  let index = -1;
  for (let i = 0; i < array.length; i++) {
    if (isSamePoint(pt, array[i])) {
      index = i;
    }
  }
  return index;
}

function isSamePoint(ptA, ptB) {
  if (ptA[0] == ptB[0] && ptA[1] == ptB[1] && ptA[2] == ptB[2]) {
    return true;
  } else {
    return false;
  }
}

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
