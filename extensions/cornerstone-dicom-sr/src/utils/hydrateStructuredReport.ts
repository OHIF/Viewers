import { utilities, metaData } from '@cornerstonejs/core';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import getLabelFromDCMJSImportedToolData from './getLabelFromDCMJSImportedToolData';
import { adaptersSR } from '@cornerstonejs/adapters';
import { annotation as CsAnnotation } from '@cornerstonejs/tools';
import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';

const { locking } = CsAnnotation;
const { guid } = OHIF.utils;
const { MeasurementReport, CORNERSTONE_3D_TAG } = adaptersSR.Cornerstone3D;
const { CORNERSTONE_3D_TOOLS_SOURCE_NAME, CORNERSTONE_3D_TOOLS_SOURCE_VERSION } = CSExtensionEnums;
const supportedLegacyCornerstoneTags = ['cornerstoneTools@^4.0.0'];

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

const toArray = x => (Array.isArray(x) ? x : x ? [x] : []);

const getToolClass = (
  measurementGroup,
  dataset,
  measurementAdapterByToolType
) => {
  const contentSequence = toArray(measurementGroup.ContentSequence);
  const trackingIdentifierGroup = contentSequence.find(
    ci => ci.ConceptNameCodeSequence?.CodeMeaning === 'Tracking Identifier'
  );
  const trackingIdentifierValue = trackingIdentifierGroup?.TextValue;

  if (!trackingIdentifierValue) {
    return;
  }

  const toolAdapter = MeasurementReport.getAdapterForTrackingIdentifier(
    trackingIdentifierValue
  );

  if (toolAdapter?.toolType === 'Probe') {
    const numGroup = contentSequence.find(ci => ci.ValueType === 'NUM');
    const numContent = toArray(numGroup?.ContentSequence);
    const hasSCOORD3D = numContent.some(ci => ci.ValueType === 'SCOORD3D');
    const hasSCOORD = numContent.some(ci => ci.ValueType === 'SCOORD');

    if (hasSCOORD3D && hasSCOORD) {
      return {
        toolType: toolAdapter.toolType,
        getMeasurementData: (
          group,
          sopInstanceUIDToImageIdMap,
          imageToWorldCoords,
          metadata,
          trackingIdentifier
        ) => {
          const clonedGroup = JSON.parse(JSON.stringify(group));
          const clonedNumGroup = toArray(clonedGroup.ContentSequence).find(
            ci => ci.ValueType === 'NUM'
          );
          if (clonedNumGroup && clonedNumGroup.ContentSequence) {
            let seq = toArray(clonedNumGroup.ContentSequence);
            seq = seq.filter(ci => ci.ValueType !== 'SCOORD');
            clonedNumGroup.ContentSequence = seq;
          }
          return toolAdapter.getMeasurementData(
            clonedGroup,
            sopInstanceUIDToImageIdMap,
            imageToWorldCoords,
            metadata,
            trackingIdentifier
          );
        },
      };
    }
  }

  return toolAdapter;
};

/**
 * Hydrates a structured report, for default viewports.
 *
 */
export default function hydrateStructuredReport(
  { servicesManager, extensionManager, commandsManager }: withAppTypes,
  displaySetInstanceUID
) {
  console.log('hydrateStructuredReport', displaySetInstanceUID);
  const dataSource = extensionManager.getActiveDataSource()[0];
  const { measurementService, displaySetService, customizationService } = servicesManager.services;

  const codingValues = customizationService.getCustomization('codingValues');
  const disableEditing = customizationService.getCustomization('panelMeasurement.disableEditing');

  const displaySet: any = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

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

  // Use dcmjs to generate toolState.
  let storedMeasurementByAnnotationType = MeasurementReport.generateToolState(
    datasetToUse,
    // NOTE: we need to pass in the imageIds to dcmjs since the we use them
    // for the imageToWorld transformation. The following assumes that the order
    // that measurements were added to the display set are the same order as
    // the measurementGroups in the instance.
    sopInstanceUIDToImageId,
    utilities.imageToWorldCoords,
    metaData,
    { getToolClass }
  );

  const onBeforeSRHydrationCustomization = customizationService.getCustomization('onBeforeSRHydration');
  const onBeforeSRHydration = (onBeforeSRHydrationCustomization as any)?.value ?? onBeforeSRHydrationCustomization;

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
      const frameNumber =
        (toolData.annotation.data && toolData.annotation.data.frameNumber) || 1;
      let imageId;

      if (toolData.sopInstanceUid) {
        imageId =
          imageIdsForToolState[toolData.sopInstanceUid]?.[frameNumber] ||
          sopInstanceUIDToImageId[toolData.sopInstanceUid];
      }

      if (imageId && !imageIds.includes(imageId)) {
        imageIds.push(imageId);
      }
    });
  });

  let targetStudyInstanceUID;
  const SeriesInstanceUIDs = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
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

  Object.keys(hydratableMeasurementsInSR).forEach(annotationType => {
    const toolDataForAnnotationType = hydratableMeasurementsInSR[annotationType];

    toolDataForAnnotationType.forEach(toolData => {
      // Add the measurement to toolState
      // dcmjs and Cornerstone3D has structural defect in supporting multi-frame
      // files, and looking up the imageId from sopInstanceUIDToImageId results
      // in the wrong value.
      const frameNumber =
        (toolData.annotation.data && toolData.annotation.data.frameNumber) || 1;
      let imageId;

      if (toolData.sopInstanceUid) {
        imageId =
          imageIdsForToolState[toolData.sopInstanceUid]?.[frameNumber] ||
          sopInstanceUIDToImageId[toolData.sopInstanceUid];
      }

      toolData.uid = guid();

      let instance;
      let FrameOfReferenceUID;

      if (imageId) {
        instance = metaData.get('instance', imageId);
        FrameOfReferenceUID = instance.FrameOfReferenceUID;
      } else {
        FrameOfReferenceUID = toolData.annotation.metadata.FrameOfReferenceUID;
      }

      // Allow remapping adapter tool types back to custom app tools on hydration
      let effectiveAnnotationType = annotationType;
      const points = toolData?.annotation?.data?.handles?.points;
      const is3DPoints = Array.isArray(points) && points.length > 0 && Array.isArray(points[0]) && points[0].length === 3;
      if (
        annotationType === 'Probe' &&
        (toolData?.annotation?.metadata?.valueType === 'SCOORD3D' || is3DPoints)
      ) {
        effectiveAnnotationType = 'CustomProbe';
      }

      const annotation = {
        annotationUID: toolData.annotation.annotationUID,
        data: toolData.annotation.data,
        metadata: {
          toolName: effectiveAnnotationType,
          referencedImageId:
            effectiveAnnotationType === 'CustomProbe' ? undefined : imageId,
          FrameOfReferenceUID,
        },
      };

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

      const matchingMapping = mappings.find(m => m.annotationType === effectiveAnnotationType);

      const newAnnotationUID = measurementService.addRawMeasurement(
        source,
        effectiveAnnotationType,
        { annotation },
        matchingMapping.toMeasurementSchema,
        dataSource
      );


      commandsManager.runCommand('updateMeasurement', {
        uid: newAnnotationUID,
        code: annotation.data.finding,
      });
      // Jump to CustomProbe in MPR so it becomes visible and recomputes
      try {
        if (effectiveAnnotationType === 'CustomProbe') {
          commandsManager.runCommand('jumpToCustomProbe', { uid: newAnnotationUID });
        }
      } catch (e) {
        console.warn('[SR Hydrate] jumpToCustomProbe failed', e);
      }
      console.log('force recompute of text/HU in tool render');
      // Force recompute of text/HU in tool render so the panel sees displayText immediately
      try {
        const am = CsAnnotation.state.getAnnotationManager();
        const hydratedAnnotation = am.getAnnotation(newAnnotationUID);
        if (hydratedAnnotation) {
          hydratedAnnotation.invalidated = true;
        }
        const re = servicesManager.services.cornerstoneViewportService.getRenderingEngine();
        re && re.render();
      } catch (e) {
        console.warn('[SR Hydrate] failed to trigger recompute/render', e);
      }

      if (disableEditing) {
        locking.setAnnotationLocked(newAnnotationUID, true);
      }

      if (!imageIds.includes(imageId)) {
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
