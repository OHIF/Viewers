import { utilities, metaData, type Types } from '@cornerstonejs/core';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import { vec3 } from 'gl-matrix';

import getLabelFromDCMJSImportedToolData from './getLabelFromDCMJSImportedToolData';
import { adaptersSR } from '@cornerstonejs/adapters';
import { annotation as CsAnnotation, type Types as ToolTypes } from '@cornerstonejs/tools';
import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';

const { locking } = CsAnnotation;
const { guid } = OHIF.utils;
const { MeasurementReport } = adaptersSR.Cornerstone3D;
const { CORNERSTONE_3D_TOOLS_SOURCE_NAME, CORNERSTONE_3D_TOOLS_SOURCE_VERSION } = CSExtensionEnums;

const convertCode = (codingValues, code) => {
  if (!code || code.CodingSchemeDesignator === 'CORNERSTONEJS') {
    return;
  }
  const ref = `${code.CodingSchemeDesignator}:${code.CodeValue}`;
  const ret = { ...codingValues[ref], ref, ...code, text: code.CodeMeaning };
  return ret;
};

const convertSites = (codingValues, sites) => {
  if (!sites || !sites.length) {
    return;
  }
  const ret = [];
  // Do as a loop to convert away from Proxy instances
  for (let i = 0; i < sites.length; i++) {
    // Deal with irregular conversion from dcmjs
    const site = convertCode(codingValues, sites[i][0] || sites[i]);
    if (site) {
      ret.push(site);
    }
  }
  return (ret.length && ret) || undefined;
};

/**
 * Hydrates a structured report
 * Handles 2d and 3d hydration from SCOORD and SCOORD3D points
 * For 3D hydration, chooses a volume display set to display with
 * FOr 2D hydration, chooses the (first) display set containing the referenced image.
 */
export default function hydrateStructuredReport(
  { servicesManager, extensionManager, commandsManager }: withAppTypes,
  displaySetInstanceUID
) {
  const dataSource = extensionManager.getActiveDataSource()[0];
  const { measurementService, displaySetService, customizationService } = servicesManager.services;

  const codingValues = customizationService.getCustomization('codingValues');
  const disableEditing = customizationService.getCustomization('panelMeasurement.disableEditing');

  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  // TODO -> We should define a strict versioning somewhere.
  const mappings = measurementService.getSourceMappings(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  if (!mappings || !mappings.length) {
    throw new Error(
      `Attempting to hydrate measurements service when no mappings present. This shouldn't be reached.`
    );
  }

  const instance = DicomMetadataStore.getInstance(
    displaySet.StudyInstanceUID,
    displaySet.SeriesInstanceUID,
    displaySet.SOPInstanceUID
  );

  const sopInstanceUIDToImageId = {};
  const imageIdsForToolState = {};

  displaySet.measurements.forEach(measurement => {
    const { ReferencedSOPInstanceUID, imageId, frameNumber } = measurement;

    if (!sopInstanceUIDToImageId[ReferencedSOPInstanceUID]) {
      sopInstanceUIDToImageId[ReferencedSOPInstanceUID] = imageId;
      imageIdsForToolState[ReferencedSOPInstanceUID] = [];
    }
    if (!imageIdsForToolState[ReferencedSOPInstanceUID][frameNumber]) {
      imageIdsForToolState[ReferencedSOPInstanceUID][frameNumber] = imageId;
    }
  });

  // Mapping of legacy datasets is now directly handled by adapters module
  const datasetToUse = instance;

  // Use CS3D adapters to generate toolState.
  let storedMeasurementByAnnotationType = MeasurementReport.generateToolState(
    datasetToUse,
    // NOTE: we need to pass in the imageIds to dcmjs since the we use them
    // for the imageToWorld transformation. The following assumes that the order
    // that measurements were added to the display set are the same order as
    // the measurementGroups in the instance.
    sopInstanceUIDToImageId,
    metaData
  );

  const onBeforeSRHydration = customizationService.getCustomization('onBeforeSRHydration')?.value;

  if (typeof onBeforeSRHydration === 'function') {
    storedMeasurementByAnnotationType = onBeforeSRHydration({
      storedMeasurementByAnnotationType,
      displaySet,
    });
  }

  // Filter what is found by DICOM SR to measurements we support.
  const mappingDefinitions = mappings.map(m => m.annotationType);
  const hydratableMeasurementsInSR = {};

  Object.keys(storedMeasurementByAnnotationType).forEach(key => {
    if (mappingDefinitions.includes(key)) {
      hydratableMeasurementsInSR[key] = storedMeasurementByAnnotationType[key];
    }
  });

  // Set the series touched as tracked.
  const imageIds = [];

  // TODO: notification if no hydratable?
  Object.keys(hydratableMeasurementsInSR).forEach(annotationType => {
    const toolDataForAnnotationType = hydratableMeasurementsInSR[annotationType];

    toolDataForAnnotationType.forEach(toolData => {
      // Add the measurement to toolState
      // dcmjs and Cornerstone3D has structural defect in supporting multi-frame
      // files, and looking up the imageId from sopInstanceUIDToImageId results
      // in the wrong value.
      const frameNumber = (toolData.annotation.data && toolData.annotation.data.frameNumber) || 1;
      const imageId =
        imageIdsForToolState[toolData.sopInstanceUid][frameNumber] ||
        sopInstanceUIDToImageId[toolData.sopInstanceUid];

      if (!imageIds.includes(imageId)) {
        imageIds.push(imageId);
      }
    });
  });

  let targetStudyInstanceUID;
  const SeriesInstanceUIDs = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    if (!imageId) {
      continue;
    }
    const { SeriesInstanceUID, StudyInstanceUID } = metaData.get('instance', imageId);

    if (!SeriesInstanceUIDs.includes(SeriesInstanceUID)) {
      SeriesInstanceUIDs.push(SeriesInstanceUID);
    }

    if (!targetStudyInstanceUID) {
      targetStudyInstanceUID = StudyInstanceUID;
    } else if (targetStudyInstanceUID !== StudyInstanceUID) {
      console.warn('NO SUPPORT FOR SRs THAT HAVE MEASUREMENTS FROM MULTIPLE STUDIES.');
    }
  }

  /**
   * Gets reference data for what frame of reference and the referenced
   * image id, or for 3d measurements, the volumeId to apply this annotation to.
   */
  function getReferenceData(toolData): ToolTypes.AnnotationMetadata {
    // Add the measurement to toolState
    // dcmjs and Cornerstone3D has structural defect in supporting multi-frame
    // files, and looking up the imageId from sopInstanceUIDToImageId results
    // in the wrong value.
    const frameNumber = (toolData.annotation.data && toolData.annotation.data.frameNumber) || 1;
    const imageId =
      imageIdsForToolState[toolData.sopInstanceUid][frameNumber] ||
      sopInstanceUIDToImageId[toolData.sopInstanceUid];

    if (!imageId) {
      return getReferenceData3D(toolData, servicesManager);
    }

    const instance = metaData.get('instance', imageId);
    const {
      FrameOfReferenceUID,
      // SOPInstanceUID,
      // SeriesInstanceUID,
      // StudyInstanceUID,
    } = instance;

    return {
      referencedImageId: imageId,
      FrameOfReferenceUID,
    };
  }

  Object.keys(hydratableMeasurementsInSR).forEach(annotationType => {
    const toolDataForAnnotationType = hydratableMeasurementsInSR[annotationType];

    toolDataForAnnotationType.forEach(toolData => {
      toolData.uid = guid();
      const referenceData = getReferenceData(toolData);
      const { imageId } = referenceData;

      const annotation = {
        annotationUID: toolData.annotation.annotationUID,
        data: toolData.annotation.data,
        metadata: {
          ...referenceData,
          toolName: annotationType,
        },
      };
      utilities.updatePlaneRestriction(annotation.data.handles.points, annotation.metadata);

      const source = measurementService.getSource(
        CORNERSTONE_3D_TOOLS_SOURCE_NAME,
        CORNERSTONE_3D_TOOLS_SOURCE_VERSION
      );
      annotation.data.label = getLabelFromDCMJSImportedToolData(toolData);
      annotation.data.finding = convertCode(codingValues, toolData.finding?.[0]);
      annotation.data.findingSites = convertSites(codingValues, toolData.findingSites);
      annotation.data.findingSites?.forEach(site => {
        if (site.type) {
          annotation.data[site.type] = site;
        }
      });

      const matchingMapping = mappings.find(m => m.annotationType === annotationType);

      const newAnnotationUID = measurementService.addRawMeasurement(
        source,
        annotationType,
        { annotation },
        matchingMapping.toMeasurementSchema,
        dataSource
      );

      commandsManager.runCommand('updateMeasurement', {
        uid: newAnnotationUID,
        code: annotation.data.finding,
      });

      if (disableEditing) {
        locking.setAnnotationLocked(newAnnotationUID, true);
      }

      if (imageId && !imageIds.includes(imageId)) {
        imageIds.push(imageId);
      }
    });
  });

  displaySet.isHydrated = true;

  return {
    StudyInstanceUID: targetStudyInstanceUID,
    SeriesInstanceUIDs,
  };
}

/**
 * For 3d annotations, there are often several display sets which could
 * be used to display the annotation.  Choose the first annotation with the
 * same frame of reference that is reconstructable, or the first display set
 * otherwise.
 */
function chooseDisplaySet(displaySets, annotation) {
  if (!displaySets?.length) {
    console.warn('No display set found for', annotation);
    return;
  }
  if (displaySets.length === 1) {
    return displaySets[0];
  }
  const volumeDs = displaySets.find(ds => ds.isReconstructable);
  if (volumeDs) {
    return volumeDs;
  }
  return displaySets[0];
}

/**
 * Gets the additional reference data appropriate for a 3d reference.
 * This will choose a volume id, frame of reference and a plane restriction.
 */
function getReferenceData3D(toolData, servicesManager: Types.ServicesManager) {
  const { FrameOfReferenceUID } = toolData.annotation.metadata;
  const { points } = toolData.annotation.data.handles;
  const { displaySetService } = servicesManager.services;
  const displaySetsFOR = displaySetService.getDisplaySetsBy(
    ds => ds.FrameOfReferenceUID === FrameOfReferenceUID
  );
  if (!displaySetsFOR.length || !points?.length) {
    return {
      FrameOfReferenceUID,
    };
  }
  const ds = chooseDisplaySet(displaySetsFOR, toolData.annotation);
  const cameraView = chooseCameraView(ds, points);

  const viewReference = {
    ...cameraView,
    volumeId: ds.displaySetInstanceUID,
    FrameOfReferenceUID,
  };
  utilities.updatePlaneRestriction(points, viewReference);
  return viewReference;
}

/**
 * Chooses a possible camera view - right now this is fairly basic,
 * just setting the unknowns to null.
 */
function chooseCameraView(_ds, points) {
  const selectedPoints = choosePoints(points);
  const cameraFocalPoint = <Point3>centerOf(selectedPoints);
  // These are sufficient to be null for now and can be set on first view
  let viewPlaneNormal: Types.Point3 = null;
  let viewUp: Types.Point3 = null;

  return {
    cameraFocalPoint,
    viewPlaneNormal,
    viewUp,
  };
}

function centerOf(points) {
  const scale = 1 / points.length;
  const center = vec3.create();
  for (const point of points) {
    vec3.scaleAndAdd(center, center, point, scale);
  }
  return center;
}

function choosePoints(points) {
  if (points.length === 1 || points.length === 2) {
    return points;
  }
  const firstIndex = 0;
  const secondIndex = Math.ceil(points.length / 4);
  const thirdIndex = Math.ceil(points.length / 2);
  // TODO - check if colinear, if so try to find another 3 points.

  const newPoints = [points[firstIndex], points[secondIndex], points[thirdIndex]];
  return newPoints;
}
