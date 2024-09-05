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
  if (valueType === 'SCOORD3D') {
    toolName = toolNames.SCOORD3DPoint;
  }

  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

  const SRAnnotation: Types.Annotation = {
    annotationUID: TrackingUniqueIdentifier,
    highlighted: false,
    isLocked: false,
    invalidated: false,
    metadata: {
      toolName,
      valueType,
      graphicType,
      FrameOfReferenceUID: imagePlaneModule.frameOfReferenceUID,
      referencedImageId: imageId,
      /** Used by SCOORD3DPoint */
      cameraFocalPoint: toolName === toolNames.SCOORD3DPoint ? graphicTypePoints[0][0] : undefined,
    },
    data: {
      label: measurement.labels?.[0]?.value || undefined,
      handles: {
        textBox: measurement.textBox ?? {},
        points: graphicTypePoints[0],
      },
      cachedStats: {},
      frameNumber,
      /** Used by DICOMSRDisplayTool */
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
