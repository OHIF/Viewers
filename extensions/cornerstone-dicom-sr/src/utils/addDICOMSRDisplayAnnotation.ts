import { Types, annotation } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';

import getRenderableData from './getRenderableData';
import toolNames from '../tools/toolNames';

export default function addDICOMSRDisplayAnnotation(measurement, imageId, frameNumber) {
  let toolName = toolNames.DICOMSRDisplay;

  const measurementData = {
    TrackingUniqueIdentifier: measurement.TrackingUniqueIdentifier,
    renderableData: {},
    labels: measurement.labels,
    imageId,
  };

  measurement.coords.forEach(coord => {
    const { GraphicType, GraphicData, ValueType } = coord;

    if (measurementData.renderableData[GraphicType] === undefined) {
      measurementData.renderableData[GraphicType] = [];
    }

    measurementData.renderableData[GraphicType].push(
      getRenderableData(GraphicType, GraphicData, ValueType, imageId)
    );
  });

  const { ValueType, GraphicType } = measurement.coords[0];

  /** TODO: Add support for other SCOORD3D graphic types */
  if (ValueType === 'SCOORD3D') {
    toolName = 'Probe';
  }

  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

  /**
   * This annotation (DICOMSRDisplay) is only used by the SR viewport.
   * This is used before the annotation is hydrated. If hydrated the measurement will be added
   * to the measurement service and will be available for the other viewports.
   */
  const SRAnnotation: Types.Annotation = {
    annotationUID: measurement.TrackingUniqueIdentifier,
    // highlighted: false,
    // isLocked: false,
    // invalidated: false,
    metadata: {
      toolName: toolName,
      valueType: ValueType,
      graphicType: GraphicType,
      FrameOfReferenceUID: imagePlaneModule.frameOfReferenceUID,
      referencedImageId: imageId,
      /**
       * Used to jump to measurement using currently
       * selected viewport if it shares frame of reference
       */
      coords: measurement.coords,
    },
    data: {
      label: measurement.labels,
      handles: {
        textBox: measurement.textBox ?? {},
        points: measurementData.renderableData[GraphicType],
      },
      cachedStats: {},
      TrackingUniqueIdentifier: measurementData.TrackingUniqueIdentifier,
      frameNumber,
      /** Used by DICOMSRDisplayTool */
      renderableData: measurementData.renderableData,
    },
  };

  /**
   * const annotationManager = annotation.annotationState.getAnnotationManager();
   * was not triggering annotation_added events.
   */
  annotation.state.addAnnotation(SRAnnotation);
  console.debug('Adding annotation:', SRAnnotation);
}
