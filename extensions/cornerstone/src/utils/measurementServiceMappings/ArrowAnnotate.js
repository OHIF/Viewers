import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const Length = {
  toAnnotation: measurement => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (
    csToolsEventDetail,
    DisplaySetService,
    CornerstoneViewportService,
    getValueTypeFromToolType
  ) => {
    const { annotation, viewportId } = csToolsEventDetail;
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

    const {
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = getSOPInstanceAttributes(
      referencedImageId,
      CornerstoneViewportService,
      viewportId
    );

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = DisplaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    const { points } = data.handles;

    const mappedAnnotations = getMappedAnnotations(
      annotation,
      DisplaySetService
    );

    const displayText = getDisplayText(mappedAnnotations, displaySet);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.text,
      text: data.text,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport: () => {
        throw new Error('Not implemented');
      },
    };
  },
};

function getMappedAnnotations(annotation, DisplaySetService) {
  const { metadata, data } = annotation;
  const { text } = data;
  const { referencedImageId } = metadata;

  const annotations = [];

  const { SOPInstanceUID, SeriesInstanceUID } = getSOPInstanceAttributes(
    referencedImageId
  );

  const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
    SOPInstanceUID,
    SeriesInstanceUID
  );

  const { SeriesNumber } = displaySet;

  annotations.push({
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesNumber,
    text,
  });

  return annotations;
}

function getDisplayText(mappedAnnotations, displaySet) {
  if (!mappedAnnotations) {
    return '';
  }

  const displayText = [];

  // Area is the same for all series
  const { SeriesNumber, SOPInstanceUID } = mappedAnnotations[0];

  const instance = displaySet.images.find(
    image => image.SOPInstanceUID === SOPInstanceUID
  );

  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  displayText.push(
    InstanceNumber
      ? `(S: ${SeriesNumber} I: ${InstanceNumber})`
      : `(S: ${SeriesNumber})`
  );

  return displayText;
}

export default Length;
