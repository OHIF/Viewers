/**
 * Maps a DICOM RT Struct ROI Contour to a RTStruct data that can be used
 * in Segmentation Service
 *
 * @param structureSet - A DICOM RT Struct ROI Contour
 * @param rtDisplaySetUID - A CornerstoneTools DisplaySet UID
 * @returns An array of object that includes data, id, segmentIndex, color
 * and geometry Id
 */
export function mapROIContoursToRTStructData(structureSet: unknown, rtDisplaySetUID: unknown) {
  return structureSet.ROIContours.map(
    ({ contourPoints, ROINumber, ROIName, colorArray, ROIGroup }) => {
      const data = contourPoints.map(({ points, ...rest }) => {
        const newPoints = points.map(({ x, y, z }) => {
          return [x, y, z];
        });

        return {
          ...rest,
          points: newPoints,
        };
      });

      const id = ROIName || ROINumber;

      return {
        data,
        id,
        segmentIndex: ROINumber,
        color: colorArray,
        group: ROIGroup,
        geometryId: `${rtDisplaySetUID}:${id}:segmentIndex-${ROINumber}`,
      };
    }
  );
}
