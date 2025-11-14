import { Types, annotation } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';
import { adaptersSR } from '@cornerstonejs/adapters';

import getRenderableData from './getRenderableData';
import toolNames from '../tools/toolNames';

const { MeasurementReport } = adaptersSR.Cornerstone3D;

/**
 * Adds a DICOM SR (Structured Report) annotation to the annotation manager.
 * This function processes measurement data from DICOM SR and converts it into
 * a format suitable for display in the Cornerstone3D viewer.
 *
 * @param {Object} params - The parameters object
 * @param {Object} params.measurement - The DICOM SR measurement data containing coordinates, labels, and metadata
 * @param {Array} params.measurement.coords - Array of coordinate objects with GraphicType, ValueType, and other properties
 * @param {string} params.measurement.TrackingUniqueIdentifier - Unique identifier for the measurement
 * @param {string} params.measurement.TrackingIdentifier - Tracking identifier for adapter lookup
 * @param {Array} [params.measurement.labels] - Optional array of label objects
 * @param {string} [params.measurement.displayText] - Optional display text for the annotation
 * @param {Object} [params.measurement.textBox] - Optional text box configuration
 * @param {string|null} [params.imageId] - Optional image ID for the referenced image (defaults to null)
 * @param {number|null} [params.frameNumber] - Optional frame number for multi-frame images (defaults to null)
 * @param {Object} params.displaySet - The display set containing the image
 * @param {string} params.displaySet.displaySetInstanceUID - Unique identifier for the display set
 * @returns {void}
 *
 * @example
 * ```typescript
 * addSRAnnotation({
 *   measurement: {
 *     TrackingUniqueIdentifier: '1.2.3.4.5',
 *     TrackingIdentifier: 'POINT',
 *     coords: [{
 *       GraphicType: 'POINT',
 *       ValueType: 'SCOORD',
 *       // ... other coordinate properties
 *     }],
 *     labels: [{ value: 'Measurement Point' }],
 *     displayText: 'Point measurement'
 *   },
 *   imageId: 'wadouri:file://path/to/image.dcm', // Optional
 *   frameNumber: 0, // Optional
 *   displaySet: { displaySetInstanceUID: '1.2.3.4' }
 * });
 * ```
 */
export default function addSRAnnotation({ measurement, imageId = null, frameNumber = null, displaySet }) {
  /** @type {string} The tool name to use for the annotation, defaults to DICOMSRDisplay */
  let toolName = toolNames.DICOMSRDisplay;
  
  /** 
   * @type {Object} Renderable data organized by graphic type
   * Groups coordinate data by GraphicType for efficient rendering
   */
  const renderableData = measurement.coords.reduce((acc, coordProps) => {
    acc[coordProps.GraphicType] = acc[coordProps.GraphicType] || [];
    acc[coordProps.GraphicType].push(getRenderableData({ ...coordProps, imageId }));
    return acc;
  }, {});

  const { TrackingUniqueIdentifier } = measurement;
  const { ValueType: valueType, GraphicType: graphicType } = measurement.coords[0];
  const graphicTypePoints = renderableData[graphicType];

  /**
   * TODO: Read the tool name from the DICOM SR identification type in the future.
   */
  let frameOfReferenceUID = null;
  let planeRestriction = null;

  /**
   * Store the view reference for use in initial navigation
   */
  if (imageId) {
    const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
    frameOfReferenceUID = imagePlaneModule?.frameOfReferenceUID;
  }

  /**
   * Store the view reference for use in initial navigation
   */
  if (valueType === 'SCOORD3D') {
    frameOfReferenceUID = measurement.coords[0].ReferencedFrameOfReferenceSequence;
    planeRestriction = {
      FrameOfReferenceUID: frameOfReferenceUID,
      point: graphicTypePoints[0][0],
    };
  }

  /**
   * Store the view reference for use in initial navigation
   */
  measurement.viewReference = {
    planeRestriction,
    FrameOfReferenceUID: frameOfReferenceUID,
    referencedImageId: imageId,
  };

  /**
   * @type {Types.Annotation} The annotation object to be added to the annotation manager
   * Contains all necessary metadata and data for rendering the DICOM SR measurement
   */
  const SRAnnotation: Types.Annotation = {
    annotationUID: TrackingUniqueIdentifier,
    highlighted: false,
    isLocked: false,
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
   * Add the annotation to the annotation state manager.
   * Note: Using annotation.state.addAnnotation() instead of annotationManager.addAnnotation()
   * because the latter was not triggering annotation_added events properly.
   * 
   * @param {Types.Annotation} SRAnnotation - The annotation to add
   */
  annotation.state.addAnnotation(SRAnnotation);
}
