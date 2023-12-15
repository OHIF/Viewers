import { MeasurementService } from '@ohif/core';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const getValueTypeByGraphicType = graphicType => {
  const { POINT } = MeasurementService.VALUE_TYPES;
  const GRAPHIC_TYPE_TO_VALUE_TYPE = { POINT: POINT };
  return GRAPHIC_TYPE_TO_VALUE_TYPE[graphicType];
};

const DICOMSRDisplayMapping = {
  toAnnotation: () => {},
  toMeasurement: (csToolsEventDetail, displaySetService) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('DICOM SR Diaply tool: Missing metadata or data');
      return null;
    }

    const { graphicType, referencedImageId, FrameOfReferenceUID } = metadata;

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } =
      getSOPInstanceAttributes(referencedImageId);

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    const { points } = data.handles;

    const mappedAnnotations = getMappedAnnotations(annotation, displaySetService);
    const displayText = getDisplayText(mappedAnnotations, displaySet);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      label: data.label[0].value,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      frameNumber: mappedAnnotations[0]?.frameNumber || 1,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeByGraphicType(graphicType),
      getReport: () => {
        throw new Error('Not implemented');
      },
    };
  },
  matchingCriteria: [
    {
      valueType: MeasurementService.VALUE_TYPES.POINT,
      points: 1,
    },
  ],
};

function getMappedAnnotations(annotation, displaySetService) {
  const { metadata, data } = annotation;
  const { text } = data;
  const { referencedImageId } = metadata;

  const annotations = [];

  const { SOPInstanceUID, SeriesInstanceUID, frameNumber } =
    getSOPInstanceAttributes(referencedImageId);

  const displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
    SOPInstanceUID,
    SeriesInstanceUID,
    frameNumber
  );

  const { SeriesNumber } = displaySet;

  annotations.push({
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesNumber,
    frameNumber,
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
  const { SeriesNumber, SOPInstanceUID, frameNumber } = mappedAnnotations[0];

  const instance = displaySet.images.find(image => image.SOPInstanceUID === SOPInstanceUID);
  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  displayText.push(`(S: ${SeriesNumber}${instanceText}${frameText})`);

  return displayText;
}

export default DICOMSRDisplayMapping;
