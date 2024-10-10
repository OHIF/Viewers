import { Types, annotation } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';

import getRenderableData from './getRenderableData';
import toolNames from '../tools/toolNames';

export default function addSRAnnotation(measurement, imageId, frameNumber) {
  let toolName = toolNames.DICOMSRDisplay;
  const renderableData = measurement.coords.reduce((acc, coordProps) => {
    acc[coordProps.GraphicType] = acc[coordProps.GraphicType] || [];
    acc[coordProps.GraphicType].push(getRenderableData({ ...coordProps, imageId }));
    return acc;
  }, {});

  const { TrackingUniqueIdentifier } = measurement;
  const { ValueType: valueType, GraphicType: graphicType } = measurement.coords[0];
  const graphicTypePoints = renderableData[graphicType];

  /** TODO: Read the tool name from the DICOM SR identification type in the future. */
  let frameOfReferenceUID = null;

  if (imageId) {
    const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
    frameOfReferenceUID = imagePlaneModule?.frameOfReferenceUID;
  }

  if (valueType === 'SCOORD3D') {
    toolName = toolNames.SRSCOORD3DPoint;

    // get the ReferencedFrameOfReferenceUID from the measurement
    frameOfReferenceUID = measurement.coords[0].ReferencedFrameOfReferenceSequence;
  }

  const SRAnnotation: Types.Annotation = {
    annotationUID: TrackingUniqueIdentifier,
    highlighted: false,
    isLocked: false,
    invalidated: false,
    metadata: {
      toolName,
      valueType,
      graphicType,
      FrameOfReferenceUID: frameOfReferenceUID,
      referencedImageId: imageId,
    },
    data: {
      label: measurement.labels?.[0]?.value || undefined,
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

  /**
   * const annotationManager = annotation.annotationState.getAnnotationManager();
   * was not triggering annotation_added events.
   */
  annotation.state.addAnnotation(SRAnnotation);
  console.debug('Adding SR annotation:', SRAnnotation);
}
