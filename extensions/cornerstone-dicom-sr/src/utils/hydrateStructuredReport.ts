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
 * For 3D: chooses a volume display set. For 2D: chooses the first display set containing the referenced image.
 */
export default function hydrateStructuredReport(
  { servicesManager, extensionManager, commandsManager }: withAppTypes,
  displaySetInstanceUID
) {
  const dataSource = extensionManager.getActiveDataSource()[0];
  const { measurementService, displaySetService, customizationService } = servicesManager.services;

  const codingValues = customizationService.getCustomization('codingValues');

  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  const {
    StudyInstanceUID: studyUID,
    SeriesInstanceUID: seriesUID,
    instance: { SOPInstanceUID: sopUID },
  } = displaySet;

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

  const instance = DicomMetadataStore.getInstance(studyUID, seriesUID, sopUID);

  const sopInstanceUIDToImageId = {};

  displaySet.measurements.forEach(measurement => {
    const { ReferencedSOPInstanceUID, imageId, frameNumber = 1 } = measurement;
    const key = `${ReferencedSOPInstanceUID}:${frameNumber}`;

    if (!sopInstanceUIDToImageId[key]) {
      sopInstanceUIDToImageId[key] = imageId;
    }
  });

  const datasetToUse = instance;
  let storedMeasurementByAnnotationType = MeasurementReport.generateToolState(
    datasetToUse,
    /** dcmjs needs imageIds for imageToWorld; assumes displaySet.measurements order matches instance measurementGroups */
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

  const mappingDefinitions = mappings.map(m => m.annotationType);
  const hydratableMeasurementsInSR = {};

  Object.keys(storedMeasurementByAnnotationType).forEach(key => {
    if (mappingDefinitions.includes(key)) {
      hydratableMeasurementsInSR[key] = storedMeasurementByAnnotationType[key];
    }
  });

  const imageIds = [];

  // TODO: notification if no hydratable?
  Object.keys(hydratableMeasurementsInSR).forEach(annotationType => {
    const toolDataForAnnotationType = hydratableMeasurementsInSR[annotationType];

    toolDataForAnnotationType.forEach(toolData => {
      const frameNumber = toolData.annotation.data?.frameNumber || 1;
      const imageId = sopInstanceUIDToImageId[`${toolData.sopInstanceUid}:${frameNumber}`];

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

  function getReferenceData(toolData): ToolTypes.AnnotationMetadata {
    const frameNumber = (toolData.annotation.data && toolData.annotation.data.frameNumber) || 1;
    const imageId = sopInstanceUIDToImageId[`${toolData.sopInstanceUid}:${frameNumber}`];

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

      /** Use SR subtypes for Probe and RectangleROI - they show label (e.g. Lesion) instead of intensity/stats */
      const toolNameForRendering =
        annotationType === 'Probe'
          ? 'SRProbe'
          : annotationType === 'RectangleROI'
            ? 'SRRectangleROI'
            : annotationType;

      const annotation = {
        annotationUID: toolData.annotation.annotationUID,
        data: toolData.annotation.data,
        predecessorImageId: toolData.predecessorImageId,
        metadata: {
          ...referenceData,
          toolName: toolNameForRendering,
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

      /** Always lock DICOM SR annotations to prevent accidental modification (medical device safety) */
      locking.setAnnotationLocked(newAnnotationUID, true);

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
