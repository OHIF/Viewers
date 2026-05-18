import { Types, annotation } from '@cornerstonejs/tools';

const { state: annotationState, locking } = annotation;
import { metaData } from '@cornerstonejs/core';
import { adaptersSR } from '@cornerstonejs/adapters';

import getRenderableData from './getRenderableData';
import getLabelForSRMeasurement from './getLabelForSRMeasurement';
import toolNames from '../tools/toolNames';

const { MeasurementReport } = adaptersSR.Cornerstone3D;

/**
 * Adds a DICOM SR annotation to the annotation manager for preview before hydration.
 */
export default function addSRAnnotation({ measurement, imageId = null, frameNumber = null, displaySet }) {
  const toolName = toolNames.DICOMSRDisplay;
  const renderableData = measurement.coords.reduce((acc, coordProps) => {
    acc[coordProps.GraphicType] = acc[coordProps.GraphicType] || [];
    acc[coordProps.GraphicType].push(getRenderableData({ ...coordProps, imageId }));
    return acc;
  }, {});

  const { TrackingUniqueIdentifier } = measurement;
  const { ValueType: valueType, GraphicType: graphicType } = measurement.coords[0];
  const graphicTypePoints = renderableData[graphicType];

  let frameOfReferenceUID = null;
  let planeRestriction = null;

  if (imageId) {
    const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
    frameOfReferenceUID = imagePlaneModule?.frameOfReferenceUID;
  }

  if (valueType === 'SCOORD3D') {
    frameOfReferenceUID = measurement.coords[0].ReferencedFrameOfReferenceSequence;
    planeRestriction = {
      FrameOfReferenceUID: frameOfReferenceUID,
      point: graphicTypePoints[0][0],
    };
  }

  measurement.viewReference = {
    planeRestriction,
    FrameOfReferenceUID: frameOfReferenceUID,
    referencedImageId: imageId,
  };

  const SRAnnotation: Types.Annotation = {
    annotationUID: TrackingUniqueIdentifier,
    highlighted: false,
    isLocked: true,
    isPreview: toolName === toolNames.DICOMSRDisplay,
    invalidated: false,
    metadata: {
      toolName,
      planeRestriction,
      valueType,
      graphicType,
      FrameOfReferenceUID: frameOfReferenceUID,
      referencedImageId: imageId,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
    },
    data: {
      label: getLabelForSRMeasurement(measurement) ?? measurement.labels?.[0]?.value,
      displayText: measurement.displayText || undefined,
      handles: {
        textBox: measurement.textBox ?? {},
        points: graphicTypePoints[0],
      },
      cachedStats: {},
      frameNumber,
      renderableData,
      TrackingUniqueIdentifier,
      labels: measurement.labels,
    },
  };

  annotationState.addAnnotation(SRAnnotation);
  locking.setAnnotationLocked(TrackingUniqueIdentifier, true);
}
