import { Types, annotation } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';
import { adaptersSR } from '@cornerstonejs/adapters';

import getRenderableData from './getRenderableData';
import toolNames from '../tools/toolNames';

const { MeasurementReport } = adaptersSR.Cornerstone3D;

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
  let planeRestriction = null;

  if (imageId) {
    const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
    frameOfReferenceUID = imagePlaneModule?.frameOfReferenceUID;
  }

  if (valueType === 'SCOORD3D') {
    const adapter = MeasurementReport.getAdapterForTrackingIdentifier(
      measurement.TrackingIdentifier
    );
    if (!adapter) {
      toolName = toolNames.SRSCOORD3DPoint;
    }

    // get the ReferencedFrameOfReferenceUID from the measurement
    frameOfReferenceUID = measurement.coords[0].ReferencedFrameOfReferenceSequence;

    planeRestriction = {
      FrameOfReferenceUID: frameOfReferenceUID,
      point: graphicTypePoints[0][0],
    };
  }

  // Store the view reference for use in initial navigation
  measurement.viewReference = {
    planeRestriction,
    FrameOfReferenceUID: frameOfReferenceUID,
    referencedImageId: imageId,
  };

  const SRAnnotation: Types.Annotation = {
    annotationUID: TrackingUniqueIdentifier,
    highlighted: false,
    isLocked: false,
    invalidated: false,
    metadata: {
      toolName,
      planeRestriction,
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
}
