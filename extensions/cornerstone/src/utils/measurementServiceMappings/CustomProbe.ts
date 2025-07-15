import SUPPORTED_TOOLS from './constants/supportedTools';
import { getDisplayUnit } from './utils';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { utils } from '@ohif/core';
import { getIsLocked } from './utils/getIsLocked';
import { getIsVisible } from './utils/getIsVisible';
const Probe = {
  toAnnotation: measurement => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (
    csToolsEventDetail,
    displaySetService,
    cornerstoneViewportService,
    getValueTypeFromToolType,
    customizationService
  ) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;
    const isLocked = getIsLocked(annotationUID);
    const isVisible = getIsVisible(annotationUID);

    if (!metadata || !data) {
      console.warn('CustomProbe tool: Missing metadata or data');
      return null;
    }

    const { toolName, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType) {
      throw new Error('Tool not supported');
    }

    // Try to get volume information first (volume-based approach)
    let volumeInfo = null;
    let displaySet = null;

    // Check if we can get volume info from the annotation's FrameOfReferenceUID
    if (FrameOfReferenceUID) {
      // Find displaySet by FrameOfReferenceUID (volume-based)
      const displaySets = displaySetService.getActiveDisplaySets();
      displaySet = displaySets.find(ds => {
        // Check if this displaySet has the same FrameOfReferenceUID
        const firstInstance = ds.instances?.[0];
        return firstInstance?.FrameOfReferenceUID === FrameOfReferenceUID;
      });
    }

    // Fallback: Try traditional approach if volume-based didn't work
    if (!displaySet) {
      const { SeriesInstanceUID } = getSOPInstanceAttributes(
        metadata.referencedImageId,
        displaySetService,
        annotation
      );
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)?.[0];
    }

    if (!displaySet) {
      console.warn('CustomProbe: No displaySet found for annotation');
      return null;
    }

    // Check if this is a volume-based annotation
    const isVolumeBasedAnnotation = !metadata.referencedImageId ||
                                   metadata.referencedImageId.startsWith('volumeId:');

    const { points } = data.handles;
    const mappedAnnotations = getMappedAnnotations(annotation, displaySetService);
    const displayText = getDisplayText(mappedAnnotations, displaySet, customizationService);
    const getReport = () =>
      _getReport(mappedAnnotations, points, FrameOfReferenceUID, customizationService);

    return {
      uid: annotationUID,
      // For volume-based measurements, use volumeId instead of SOPInstanceUID
      SOPInstanceUID: isVolumeBasedAnnotation ? undefined : getSOPInstanceAttributes(
        metadata.referencedImageId,
        displaySetService,
        annotation
      ).SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata: {
        ...metadata,
        // Add volume-specific metadata
        isVolumeBasedAnnotation,
        volumeId: isVolumeBasedAnnotation ? `cornerstoneStreamingImageVolume:${displaySet.displaySetInstanceUID}` : undefined,
      },
      isLocked,
      isVisible,
      referenceSeriesUID: displaySet.SeriesInstanceUID,
      referenceStudyUID: displaySet.StudyInstanceUID,
      referencedImageId: metadata.referencedImageId, // Keep for compatibility
      frameNumber: mappedAnnotations?.[0]?.frameNumber || 1,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport,
      // Add volume-specific properties
      // isVolumeBasedMeasurement: isVolumeBasedAnnotation,
    };
  },
};

function getMappedAnnotations(annotation, displaySetService) {
  const { metadata, data } = annotation;
  const { cachedStats } = data;
  const targets = Object.keys(cachedStats);

  if (!targets.length) {
    return;
  }

  const annotations = [];
  Object.keys(cachedStats).forEach(targetId => {
    const targetStats = cachedStats[targetId];

    // Try volume-based approach first
    let SeriesInstanceUID, SOPInstanceUID, frameNumber;

    if (metadata.referencedImageId) {
      const sopAttributes = getSOPInstanceAttributes(
        metadata.referencedImageId,
        displaySetService,
        annotation
      );
      SeriesInstanceUID = sopAttributes.SeriesInstanceUID;
      SOPInstanceUID = sopAttributes.SOPInstanceUID;
      frameNumber = sopAttributes.frameNumber;
    } else {
      // Volume-based annotation - get series from FrameOfReferenceUID
      const displaySets = displaySetService.getActiveDisplaySets();
      const displaySet = displaySets.find(ds => {
        const firstInstance = ds.instances?.[0];
        return firstInstance?.FrameOfReferenceUID === metadata.FrameOfReferenceUID;
      });

      if (displaySet) {
        SeriesInstanceUID = displaySet.SeriesInstanceUID;
        SOPInstanceUID = undefined; // Volume-based annotations don't have SOPInstanceUID
        frameNumber = 1; // Default for volume-based
      }
    }

    if (!SeriesInstanceUID) {
      console.warn('CustomProbe: Could not determine SeriesInstanceUID for annotation');
      return;
    }

    const displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];
    if (!displaySet) {
      console.warn('CustomProbe: DisplaySet not found for SeriesInstanceUID:', SeriesInstanceUID);
      return;
    }

    const { SeriesNumber } = displaySet;
    const { value } = targetStats;
    const unit = 'HU';

    annotations.push({
      SeriesInstanceUID,
      SOPInstanceUID, // Will be undefined for volume-based annotations
      SeriesNumber,
      frameNumber,
      unit,
      value,
      isVolumeBasedAnnotation: !metadata.referencedImageId,
    });
  });

  return annotations;
}

/*
This function is used to convert the measurement data to a format that is
suitable for the report generation (e.g. for the csv report). The report
returns a list of columns and corresponding values.
*/
function _getReport(mappedAnnotations, points, FrameOfReferenceUID, customizationService) {
  const columns = [];
  const values = [];

  // Add Type
  columns.push('AnnotationType');
  values.push('Cornerstone:Probe');

  mappedAnnotations.forEach(annotation => {
    const { value, unit } = annotation;
    columns.push(`Probe (${unit})`);
    values.push(value);
  });

  if (FrameOfReferenceUID) {
    columns.push('FrameOfReferenceUID');
    values.push(FrameOfReferenceUID);
  }

  if (points) {
    columns.push('points');
    values.push(points.map(p => p.join(' ')).join(';'));
  }

  return {
    columns,
    values,
  };
}

function getDisplayText(mappedAnnotations, displaySet, customizationService) {
  const displayText = {
    primary: [],
    secondary: [],
  };

  if (!mappedAnnotations || !mappedAnnotations.length) {
    return displayText;
  }

  const { value, unit, SeriesNumber, SOPInstanceUID, frameNumber, isVolumeBasedAnnotation } = mappedAnnotations[0];

  if (value !== undefined) {
    const roundedValue = utils.roundNumber(value, 2);
    displayText.primary.push(`${roundedValue} ${getDisplayUnit(unit)}`);

    if (isVolumeBasedAnnotation) {
      // For volume-based annotations, show series info only
      displayText.secondary.push(`S: ${SeriesNumber} (Volume)`);
    } else {
      // For instance-based annotations, show detailed instance info
      let InstanceNumber;
      if (SOPInstanceUID && displaySet.instances) {
        const instance = displaySet.instances.find(image => image.SOPInstanceUID === SOPInstanceUID);
        if (instance) {
          InstanceNumber = instance.InstanceNumber;
        }
      }

      const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
      const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';
      displayText.secondary.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
    }
  }

  return displayText;
}

export default Probe;
