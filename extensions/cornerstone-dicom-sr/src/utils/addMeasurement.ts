import { Types, annotation } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';

import getRenderableData from './getRenderableData';
import toolNames from '../tools/toolNames';

export default function addMeasurement(measurement, imageId, displaySetInstanceUID) {
  // TODO -> Render rotated ellipse .
  const toolName = toolNames.DICOMSRDisplay;

  const measurementData = {
    TrackingUniqueIdentifier: measurement.TrackingUniqueIdentifier,
    renderableData: {},
    labels: measurement.labels,
    imageId,
  };

  measurement.coords.forEach(coord => {
    const { GraphicType, GraphicData } = coord;

    if (measurementData.renderableData[GraphicType] === undefined) {
      measurementData.renderableData[GraphicType] = [];
    }

    measurementData.renderableData[GraphicType].push(
      getRenderableData(GraphicType, GraphicData, imageId)
    );
  });

  // Use the metadata provider to grab its imagePlaneModule metadata
  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

  const annotationManager = annotation.state.getAnnotationManager();

  // Create Cornerstone3D Annotation from measurement
  const frameNumber =
    (measurement.coords[0].ReferencedSOPSequence &&
      measurement.coords[0].ReferencedSOPSequence[0]?.ReferencedFrameNumber) ||
    1;

  const SRAnnotation: Types.Annotation = {
    annotationUID: measurement.TrackingUniqueIdentifier,
    metadata: {
      FrameOfReferenceUID: imagePlaneModule.frameOfReferenceUID,
      toolName: toolName,
      referencedImageId: imageId,
      /** Use to properly jump to different viewports based on frame of reference */
      coords: measurement.coords,
    },
    data: {
      label: measurement.labels,
      handles: {
        textBox: {},
      },
      cachedStats: {
        TrackingUniqueIdentifier: measurementData.TrackingUniqueIdentifier,
        renderableData: measurementData.renderableData,
      },
      frameNumber: frameNumber,
    },
  };

  annotationManager.addAnnotation(SRAnnotation);
  console.debug('Adding annotation:', SRAnnotation);

  measurement.loaded = true;
  measurement.imageId = imageId;
  measurement.displaySetInstanceUID = displaySetInstanceUID;

  // Remove the unneeded coord now its processed, but keep the SOPInstanceUID.
  // NOTE: We assume that each SCOORD in the MeasurementGroup maps onto one frame,
  // It'd be super weird if it didn't anyway as a SCOORD.
  measurement.ReferencedSOPInstanceUID =
    measurement.coords[0].ReferencedSOPSequence.ReferencedSOPInstanceUID;
  measurement.frameNumber = frameNumber;
  delete measurement.coords;
}
