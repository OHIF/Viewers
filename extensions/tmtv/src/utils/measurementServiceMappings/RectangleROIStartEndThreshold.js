import SUPPORTED_TOOLS from './constants/supportedTools';
import { getSOPInstanceAttributes } from '@ohif/extension-cornerstone';

const RectangleROIStartEndThreshold = {
  toAnnotation: (measurement, definition) => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (csToolsEventDetail, displaySetService, cornerstoneViewportService) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('Length tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType) {
      throw new Error('Tool not supported');
    }

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID, displaySetInstanceUID } =
      getSOPInstanceAttributes(referencedImageId, displaySetService, annotation);

    const displaySet = displaySetInstanceUID
      ? displaySetService.getDisplaySetByUID(displaySetInstanceUID)
      : displaySetService.getDisplaySetForSOPInstanceUID(SOPInstanceUID, SeriesInstanceUID);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      // points,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: metadata.label,
      data: data.cachedStats,
      type: 'RectangleROIStartEndThreshold',
    };
  },
};

export default RectangleROIStartEndThreshold;
