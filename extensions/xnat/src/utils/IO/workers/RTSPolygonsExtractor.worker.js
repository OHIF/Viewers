import registerWebWorker from 'webworker-promise/lib/register';

function readFixedString(byteArray, position, length) {
  if (length < 0) {
    throw 'dicomParser.readFixedString - length cannot be less than 0';
  }

  if (position + length > byteArray.length) {
    throw 'dicomParser.readFixedString: attempt to read past end of buffer';
  }

  var result = '';
  var byte;

  for (var i = 0; i < length; i++) {
    byte = byteArray[position + i];
    if (byte === 0) {
      position += length;

      return result;
    }
    result += String.fromCharCode(byte);
  }

  return result;
}

function string(byteArray, element, index) {
  if (element && element.Value) return element.Value;

  if (element && element.length > 0) {
    var fixedString = readFixedString(
      byteArray,
      element.dataOffset,
      element.length
    );

    if (index >= 0) {
      var values = fixedString.split('\\');
      // trim trailing spaces

      return values[index].trim();
    }
    // trim trailing spaces
    return fixedString.trim();
  }

  return undefined;
}

function intString(byteArray, element, index) {
  if (element && element.length > 0) {
    index = (index !== undefined) ? index : 0;
    var value = string(byteArray, element, index);

    if (value !== undefined) {
      return parseInt(value);
    }
  }

  return undefined;
}

function floatString(byteArray, element, index) {
  if (element && element.length > 0) {
    index = (index !== undefined) ? index : 0;
    var value = string(byteArray, element, index);

    if (value !== undefined) {
      return parseFloat(value);
    }
  }

  return undefined;
}

registerWebWorker(async (message, emit) => {
  const {
    ROINumber,
    byteArray,
    polygonItems,
    sopInstancesInSeries,
    sopInstanceUid,
    workerId,
  } = message;

  for (let i = 0; i < polygonItems.length; i++) {
    const polygonItem = polygonItems[i];
    let polygonData;

    const contourGeometricType = string(
      byteArray,
      polygonItem.ContourGeometricType
    );
    if (contourGeometricType !== 'CLOSED_PLANAR') {
      emit('WorkerUpdate', { workerId, polygonData });
      continue;
    }

    const referencedSopInstanceUid = string(
      byteArray,
      polygonItem.ContourImageSequence.ReferencedSOPInstanceUID
    );
    // Don't extract polygon if it doesn't belong to the series being imported
    if (!sopInstancesInSeries.includes(referencedSopInstanceUid)) {
      emit('WorkerUpdate', { workerId, polygonData });
      continue;
    }

    const referencedFrameNumber = string(
      byteArray,
      polygonItem.ContourImageSequence.ReferencedFrameNumber
    );

    // const contourNumber = string(byteArray, polygonItem.ContourNumber);
    // const polygonUid = `${sopInstanceUid}.${ROINumber}.${contourNumber}`;

    // Extract Points
    const points = [];
    const numPoints = intString(byteArray, polygonItem.NumberOfContourPoints);
    const numValues = numPoints * 3;
    let p = 0;
    while (p < numValues) {
      points.push({
        x: floatString(byteArray, polygonItem.ContourData, p++),
        y: floatString(byteArray, polygonItem.ContourData, p++),
        z: floatString(byteArray, polygonItem.ContourData, p++),
      });
    }

    polygonData = {
      points,
      referencedSopInstanceUid,
      // polygonUid,
      referencedFrameNumber,
    };

    emit('WorkerUpdate', { workerId, polygonData });
  }

  return true;
});
