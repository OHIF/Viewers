import { locking, visibility } from '@cornerstonejs/tools/annotation';
import { utils, MeasurementService } from '@ohif/core';
import { measurementMappingUtils } from '@ohif/extension-cornerstone';

const { getSOPInstanceAttributes } = measurementMappingUtils;
const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';
let _registered = false;

function getLengthMappedAnnotations(annotation: any, displaySetService: any) {
  const { metadata, data } = annotation;
  const { cachedStats } = data;
  const { referencedImageId } = metadata;
  if (!Object.keys(cachedStats).length) return [];

  const annotations: any[] = [];
  Object.keys(cachedStats).forEach(() => {
    const { SOPInstanceUID, SeriesInstanceUID, frameNumber } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );
    const displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];
    const { SeriesNumber } = displaySet;
    const stats = Object.values(cachedStats)[0] as any;
    const { length, unit = 'mm' } = stats;
    annotations.push({
      SeriesInstanceUID,
      SOPInstanceUID,
      SeriesNumber,
      frameNumber,
      unit,
      length,
    });
  });
  return annotations;
}

function getLengthDisplayText(mappedAnnotations: any[], displaySet: any) {
  const displayText = { primary: [] as string[], secondary: [] as string[] };
  if (!mappedAnnotations?.length) return displayText;

  const { length, SeriesNumber, SOPInstanceUID, frameNumber, unit } = mappedAnnotations[0];
  if (length == null) return displayText;

  const instance = displaySet.instances?.find((img: any) => img.SOPInstanceUID === SOPInstanceUID);
  const instanceText = instance?.InstanceNumber ? ` I: ${instance.InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  displayText.primary.push(`${utils.roundNumber(length, 2)} ${unit}`);
  displayText.secondary.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
  return displayText;
}

function getAngleMappedAnnotations(annotation: any, displaySetService: any) {
  const { metadata, data } = annotation;
  const { cachedStats } = data;
  const { referencedImageId } = metadata;
  if (!Object.keys(cachedStats).length) return [];

  const annotations: any[] = [];
  Object.keys(cachedStats).forEach(() => {
    const { SOPInstanceUID, SeriesInstanceUID, frameNumber } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );
    const displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];
    const { SeriesNumber } = displaySet;
    const stats = Object.values(cachedStats)[0] as any;
    const angle = stats?.angle;
    const unit = '\u00B0';
    annotations.push({ SeriesInstanceUID, SOPInstanceUID, SeriesNumber, frameNumber, unit, angle });
  });
  return annotations;
}

function getAngleDisplayText(mappedAnnotations: any[], displaySet: any) {
  const displayText = { primary: [] as string[], secondary: [] as string[] };
  if (!mappedAnnotations?.length) return displayText;

  const { angle, SeriesNumber, SOPInstanceUID, frameNumber, unit } = mappedAnnotations[0];
  if (angle == null) return displayText;

  const instance = displaySet.instances?.find((img: any) => img.SOPInstanceUID === SOPInstanceUID);
  const instanceText = instance?.InstanceNumber ? ` I: ${instance.InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  displayText.primary.push(`${utils.roundNumber(angle, 2)} ${unit}`);
  displayText.secondary.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
  return displayText;
}

function makeLengthToMeasurement(displaySetService: any) {
  return (csToolsEventDetail: any) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;
    if (!metadata || !data) return null;

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const isLocked = locking.isAnnotationLocked(annotationUID);
    const isVisible = visibility.isAnnotationVisible(annotationUID);

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );

    const displaySet = SOPInstanceUID
      ? displaySetService.getDisplaySetForSOPInstanceUID(SOPInstanceUID, SeriesInstanceUID)
      : displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];

    const { points, textBox } = data.handles;
    const mappedAnnotations = getLengthMappedAnnotations(annotation, displaySetService);
    const displayText = getLengthDisplayText(mappedAnnotations, displaySet);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      textBox,
      isLocked,
      isVisible,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      referencedImageId,
      frameNumber: mappedAnnotations[0]?.frameNumber || 1,
      toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText,
      data: data.cachedStats,
      type: MeasurementService.VALUE_TYPES.POLYLINE,
      getReport: () => ({
        columns: ['AnnotationType', 'Length', 'Unit'],
        values: [toolName, mappedAnnotations[0]?.length ?? '', mappedAnnotations[0]?.unit ?? 'mm'],
      }),
    };
  };
}

function makeAngleToMeasurement(displaySetService: any) {
  return (csToolsEventDetail: any) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;
    if (!metadata || !data) return null;

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const isLocked = locking.isAnnotationLocked(annotationUID);
    const isVisible = visibility.isAnnotationVisible(annotationUID);

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );

    const displaySet = SOPInstanceUID
      ? displaySetService.getDisplaySetForSOPInstanceUID(SOPInstanceUID, SeriesInstanceUID)
      : displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];

    const { points, textBox } = data.handles;
    const mappedAnnotations = getAngleMappedAnnotations(annotation, displaySetService);
    const displayText = getAngleDisplayText(mappedAnnotations, displaySet);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      textBox,
      isLocked,
      isVisible,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      referencedImageId,
      frameNumber: mappedAnnotations[0]?.frameNumber || 1,
      toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText,
      data: data.cachedStats,
      type: MeasurementService.VALUE_TYPES.ANGLE,
      getReport: () => ({
        columns: ['AnnotationType', 'Angle (\u00B0)'],
        values: [toolName, mappedAnnotations[0]?.angle ?? ''],
      }),
    };
  };
}

export function registerDentalMappings(measurementService: any, servicesManager: any): void {
  if (_registered) return;

  const source = measurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );
  if (!source) {
    console.warn(
      '[24x7-dental-ui] Cornerstone3DTools measurement source not found — dental mappings not registered.'
    );
    return;
  }

  const { displaySetService } = servicesManager.services;
  const toAnnotation = () => {}; // no round-trip needed

  const lengthCriteria = [{ valueType: MeasurementService.VALUE_TYPES.POLYLINE, points: 2 }];
  const angleCriteria = [{ valueType: MeasurementService.VALUE_TYPES.ANGLE }];

  measurementService.addMapping(
    source,
    'PALength',
    lengthCriteria,
    toAnnotation,
    makeLengthToMeasurement(displaySetService)
  );
  measurementService.addMapping(
    source,
    'CrownWidth',
    lengthCriteria,
    toAnnotation,
    makeLengthToMeasurement(displaySetService)
  );
  measurementService.addMapping(
    source,
    'RootLength',
    lengthCriteria,
    toAnnotation,
    makeLengthToMeasurement(displaySetService)
  );
  measurementService.addMapping(
    source,
    'CanalAngle',
    angleCriteria,
    toAnnotation,
    makeAngleToMeasurement(displaySetService)
  );

  _registered = true;
}
