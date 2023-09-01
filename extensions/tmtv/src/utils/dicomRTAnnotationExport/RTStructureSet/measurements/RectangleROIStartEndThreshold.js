// comment
class RectangleROIStartEndThreshold {
  constructor() {}

  static getContourSequence(toolData, metadataProvider) {
    const { data } = toolData;
    const { projectionPoints, projectionPointsImageIds } = data.cachedStats;

    return projectionPoints.map((point, index) => {
      const ContourData = getPointData(point);
      const ContourImageSequence = getContourImageSequence(
        projectionPointsImageIds[index],
        metadataProvider
      );

      return {
        NumberOfContourPoints: ContourData.length / 3,
        ContourImageSequence,
        ContourGeometricType: 'CLOSED_PLANAR',
        ContourData,
      };
    });
  }
}

RectangleROIStartEndThreshold.toolName = 'RectangleROIStartEndThreshold';

function getPointData(points) {
  // Since this is a closed contour, the order of the points is important.
  // re-order the points to be in the correct order clockwise
  // Spread to make sure Float32Arrays are converted to arrays
  const orderedPoints = [...points[0], ...points[1], ...points[3], ...points[2]];
  const pointsArray = orderedPoints.flat();

  // reduce the precision of the points to 2 decimal places
  const pointsArrayWithPrecision = pointsArray.map(point => {
    return point.toFixed(2);
  });

  return pointsArrayWithPrecision;
}

function getContourImageSequence(imageId, metadataProvider) {
  const sopCommon = metadataProvider.get('sopCommonModule', imageId);

  return {
    ReferencedSOPClassUID: sopCommon.sopClassUID,
    ReferencedSOPInstanceUID: sopCommon.sopInstanceUID,
  };
}
export default RectangleROIStartEndThreshold;
