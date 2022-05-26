import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const RectangleRoiStartEndThreshold = {
  toAnnotation: (measurement, definition) => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (
    csToolsAnnotation,
    DisplaySetService,
    ViewportService,
    getValueTypeFromToolType
  ) => {
    const { toolData, sceneUID } = csToolsAnnotation;
    const { metadata, data } = toolData;

    if (!metadata || !data) {
      console.warn('Length tool: Missing metadata or data');
      return null;
    }

    const {
      toolName,
      referencedImageId,
      FrameOfReferenceUID,
      toolDataUID,
    } = metadata;

    const validToolType = SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType) {
      throw new Error('Tool not supported');
    }

    const {
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = getSOPInstanceAttributes(ViewportService, referencedImageId, sceneUID);

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = DisplaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    const { cachedStats } = data;
    // const { displayText, details } = getDataFromAnnotation(toolData);

    // /*
    // This function is used to convert the measurement data to a format that is
    // suitable for the report generation (e.g. for the csv report). The report
    // returns a list of columns and corresponding values.
    // */
    // const getReport = details => {
    //   const { Length } = details;
    //   const { value, unit } = Length;

    //   const columns = [`Length ${unit}`];
    //   const values = [value];

    //   const { FrameOfReferenceUID } = toolData.metadata;
    //   const { points } = toolData.data.handles;
    //   if (FrameOfReferenceUID) {
    //     columns.push('FrameOfReferenceUID');
    //     values.push(FrameOfReferenceUID);
    //   }

    //   if (points) {
    //     columns.push('points');
    //     // points has the form of [[x1, y1, z1], [x2, y2, z2], ...]
    //     // convert it to string of [[x1 y1 z1];[x2 y2 z2];...]
    //     // so that it can be used in the csv report
    //     values.push(points.map(p => p.join(' ')).join(';'));
    //   }

    //   return {
    //     columns,
    //     values,
    //   };
    // };

    return {
      id: toolDataUID,
      FrameOfReferenceUID,
      SOPInstanceUID: SOPInstanceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: metadata.label,
      toolName: metadata.toolName,
      // description: 'measurementData.description',
      type: getValueTypeFromToolType(toolName),
      points: data.handles,
      // displayText: displayText,
      // getReport: () => getReport(details),
      data: cachedStats,
      metadata,
    };
  },
};

export default RectangleRoiStartEndThreshold;
