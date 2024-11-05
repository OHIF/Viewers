import OHIF from '@ohif/core';
import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import { classes } from '@ohif/core';
import getThresholdValues from './utils/getThresholdValue';
import createAndDownloadTMTVReport from './utils/createAndDownloadTMTVReport';

import dicomRTAnnotationExport from './utils/dicomRTAnnotationExport/RTStructureSet';

import { getWebWorkerManager } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';

const { SegmentationRepresentations } = Enums;

const metadataProvider = classes.MetadataProvider;
const ROI_THRESHOLD_MANUAL_TOOL_IDS = [
  'RectangleROIStartEndThreshold',
  'RectangleROIThreshold',
  'CircleROIStartEndThreshold',
];

const workerManager = getWebWorkerManager();

const options = {
  maxWorkerInstances: 1,
  autoTerminateOnIdle: {
    enabled: true,
    idleTimeThreshold: 3000,
  },
};

// Register the task
const workerFn = () => {
  return new Worker(new URL('./utils/calculateSUVPeakWorker.js', import.meta.url), {
    name: 'suv-peak-worker', // name used by the browser to name the worker
  });
};

function getVolumesFromSegmentation(segmentationId) {
  const csSegmentation = csTools.segmentation.state.getSegmentation(segmentationId);
  const labelmapData = csSegmentation.representationData[
    SegmentationRepresentations.Labelmap
  ] as csTools.Types.LabelmapToolOperationDataVolume;

  const { volumeId, referencedVolumeId } = labelmapData;
  const labelmapVolume = cs.cache.getVolume(volumeId);
  const referencedVolume = cs.cache.getVolume(referencedVolumeId);

  return { labelmapVolume, referencedVolume };
}

function getLabelmapVolumeFromSegmentation(segmentation) {
  const { representationData } = segmentation;
  const { volumeId } = representationData[
    SegmentationRepresentations.Labelmap
  ] as csTools.Types.LabelmapToolOperationDataVolume;

  return cs.cache.getVolume(volumeId);
}

const commandsModule = ({ servicesManager, commandsManager, extensionManager }: withAppTypes) => {
  const {
    viewportGridService,
    uiNotificationService,
    displaySetService,
    hangingProtocolService,
    toolGroupService,
    cornerstoneViewportService,
    segmentationService,
  } = servicesManager.services;

  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );

  const { getEnabledElement } = utilityModule.exports;

  function _getActiveViewportsEnabledElement() {
    const { activeViewportId } = viewportGridService.getState();
    const { element } = getEnabledElement(activeViewportId) || {};
    const enabledElement = cs.getEnabledElement(element);
    return enabledElement;
  }

  function _getAnnotationsSelectedByToolNames(toolNames) {
    return toolNames.reduce((allAnnotationUIDs, toolName) => {
      const annotationUIDs =
        csTools.annotation.selection.getAnnotationsSelectedByToolName(toolName);

      return allAnnotationUIDs.concat(annotationUIDs);
    }, []);
  }

  const actions = {
    getMatchingPTDisplaySet: ({ viewportMatchDetails }) => {
      // Todo: this is assuming that the hanging protocol has successfully matched
      // the correct PT. For future, we should have a way to filter out the PTs
      // that are in the viewer layout (but then we have the problem of the attenuation
      // corrected PT vs the non-attenuation correct PT)

      let ptDisplaySet = null;
      for (const [viewportId, viewportDetails] of viewportMatchDetails) {
        const { displaySetsInfo } = viewportDetails;
        const displaySets = displaySetsInfo.map(({ displaySetInstanceUID }) =>
          displaySetService.getDisplaySetByUID(displaySetInstanceUID)
        );

        if (!displaySets || displaySets.length === 0) {
          continue;
        }

        ptDisplaySet = displaySets.find(displaySet => displaySet.Modality === 'PT');
        if (ptDisplaySet) {
          break;
        }
      }

      return ptDisplaySet;
    },
    getPTMetadata: ({ ptDisplaySet }) => {
      const dataSource = extensionManager.getDataSources()[0];
      const imageIds = dataSource.getImageIdsForDisplaySet(ptDisplaySet);

      const firstImageId = imageIds[0];
      const instance = metadataProvider.get('instance', firstImageId);
      if (instance.Modality !== 'PT') {
        return;
      }

      const metadata = {
        SeriesTime: instance.SeriesTime,
        Modality: instance.Modality,
        PatientSex: instance.PatientSex,
        PatientWeight: instance.PatientWeight,
        RadiopharmaceuticalInformationSequence: {
          RadionuclideTotalDose:
            instance.RadiopharmaceuticalInformationSequence[0].RadionuclideTotalDose,
          RadionuclideHalfLife:
            instance.RadiopharmaceuticalInformationSequence[0].RadionuclideHalfLife,
          RadiopharmaceuticalStartTime:
            instance.RadiopharmaceuticalInformationSequence[0].RadiopharmaceuticalStartTime,
          RadiopharmaceuticalStartDateTime:
            instance.RadiopharmaceuticalInformationSequence[0].RadiopharmaceuticalStartDateTime,
        },
      };

      return metadata;
    },
    createNewLabelmapFromPT: async ({ label }) => {
      // Create a segmentation of the same resolution as the source data
      // using volumeLoader.createAndCacheDerivedVolume.

      const { viewportMatchDetails } = hangingProtocolService.getMatchDetails();

      const ptDisplaySet = actions.getMatchingPTDisplaySet({
        viewportMatchDetails,
      });

      let withPTViewportId = null;

      for (const [viewportId, { displaySetsInfo }] of viewportMatchDetails.entries()) {
        const isPT = displaySetsInfo.some(
          ({ displaySetInstanceUID }) =>
            displaySetInstanceUID === ptDisplaySet.displaySetInstanceUID
        );

        if (isPT) {
          withPTViewportId = viewportId;
          break;
        }
      }

      if (!ptDisplaySet) {
        uiNotificationService.error('No matching PT display set found');
        return;
      }

      const currentSegmentations =
        segmentationService.getSegmentationRepresentations(withPTViewportId);

      const displaySet = displaySetService.getDisplaySetByUID(ptDisplaySet.displaySetInstanceUID);

      const segmentationId = await segmentationService.createLabelmapForDisplaySet(displaySet, {
        label: `Segmentation ${currentSegmentations.length + 1}`,
        segments: { 1: { label: 'Segment 1', active: true } },
      });

      segmentationService.addSegmentationRepresentation(withPTViewportId, {
        segmentationId,
      });

      return segmentationId;
    },
    thresholdSegmentationByRectangleROITool: ({ segmentationId, config, segmentIndex }) => {
      const segmentation = csTools.segmentation.state.getSegmentation(segmentationId);

      const { representationData } = segmentation;
      const { displaySetMatchDetails: matchDetails } = hangingProtocolService.getMatchDetails();
      const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use

      const ctDisplaySet = matchDetails.get('ctDisplaySet');
      const ctVolumeId = `${volumeLoaderScheme}:${ctDisplaySet.displaySetInstanceUID}`; // VolumeId with loader id + volume id

      const { volumeId: segVolumeId } = representationData[
        SegmentationRepresentations.Labelmap
      ] as csTools.Types.LabelmapToolOperationDataVolume;
      const { referencedVolumeId } = cs.cache.getVolume(segVolumeId);

      const annotationUIDs = _getAnnotationsSelectedByToolNames(ROI_THRESHOLD_MANUAL_TOOL_IDS);

      if (annotationUIDs.length === 0) {
        uiNotificationService.show({
          title: 'Commands Module',
          message: 'No ROIThreshold Tool is Selected',
          type: 'error',
        });
        return;
      }

      const labelmapVolume = cs.cache.getVolume(segmentationId);
      let referencedVolume = cs.cache.getVolume(referencedVolumeId);
      const ctReferencedVolume = cs.cache.getVolume(ctVolumeId);

      // check if viewport is

      if (!referencedVolume) {
        throw new Error('No Reference volume found');
      }

      if (!labelmapVolume) {
        throw new Error('No Reference labelmap found');
      }

      const annotation = csTools.annotation.state.getAnnotation(annotationUIDs[0]);

      const {
        metadata: {
          enabledElement: { viewport },
        },
      } = annotation;

      const showingReferenceVolume = viewport.hasVolumeId(referencedVolumeId);

      if (!showingReferenceVolume) {
        // if the reference volume is not being displayed, we can't
        // rely on it for thresholding, we have couple of options here
        // 1. We choose whatever volume is being displayed
        // 2. We check if it is a fusion viewport, we pick the volume
        // that matches the size and dimensions of the labelmap. This might
        // happen if the 4D PT is converted to a computed volume and displayed
        // and wants to threshold the labelmap
        // 3. We throw an error
        const displaySetInstanceUIDs = viewportGridService.getDisplaySetsUIDsForViewport(
          viewport.id
        );

        displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
          const volume = cs.cache
            .getVolumes()
            .find(volume => volume.volumeId.includes(displaySetInstanceUID));

          if (
            cs.utilities.isEqual(volume.dimensions, labelmapVolume.dimensions) &&
            cs.utilities.isEqual(volume.spacing, labelmapVolume.spacing)
          ) {
            referencedVolume = volume;
          }
        });
      }

      const { ptLower, ptUpper, ctLower, ctUpper } = getThresholdValues(
        annotationUIDs,
        [referencedVolume, ctReferencedVolume],
        config
      );

      return csTools.utilities.segmentation.rectangleROIThresholdVolumeByRange(
        annotationUIDs,
        labelmapVolume,
        [
          { volume: referencedVolume, lower: ptLower, upper: ptUpper },
          { volume: ctReferencedVolume, lower: ctLower, upper: ctUpper },
        ],
        { overwrite: true, segmentIndex }
      );
    },
    calculateSuvPeak: async ({ segmentationId, segmentIndex }) => {
      const segmentation = segmentationService.getSegmentation(segmentationId);

      const { representationData } = segmentation;
      const { volumeId, referencedVolumeId } = representationData[
        SegmentationRepresentations.Labelmap
      ] as csTools.Types.LabelmapToolOperationDataVolume;

      const labelmap = cs.cache.getVolume(volumeId);
      const referencedVolume = cs.cache.getVolume(referencedVolumeId);

      // if we put it in the top, it will appear in other modes
      workerManager.registerWorker('suv-peak-worker', workerFn, options);

      const annotationUIDs = _getAnnotationsSelectedByToolNames(ROI_THRESHOLD_MANUAL_TOOL_IDS);

      const annotations = annotationUIDs.map(annotationUID =>
        csTools.annotation.state.getAnnotation(annotationUID)
      );

      const labelmapProps = {
        dimensions: labelmap.dimensions,
        origin: labelmap.origin,
        direction: labelmap.direction,
        spacing: labelmap.spacing,
        metadata: labelmap.metadata,
        scalarData: labelmap.voxelManager.getCompleteScalarDataArray(),
      };

      const referenceVolumeProps = {
        dimensions: referencedVolume.dimensions,
        origin: referencedVolume.origin,
        direction: referencedVolume.direction,
        spacing: referencedVolume.spacing,
        metadata: referencedVolume.metadata,
        scalarData: referencedVolume.voxelManager.getCompleteScalarDataArray(),
      };

      // metadata in annotations has enabledElement which is not serializable
      // we need to remove it
      // Todo: we should probably have a sanitization function for this
      const annotationsToSend = annotations.map(annotation => {
        return {
          ...annotation,
          metadata: {
            ...annotation.metadata,
            enabledElement: {
              ...annotation.metadata.enabledElement,
              viewport: null,
              renderingEngine: null,
              element: null,
            },
          },
        };
      });

      const suvPeak =
        (await workerManager.executeTask('suv-peak-worker', 'calculateSuvPeak', {
          labelmapProps,
          referenceVolumeProps,
          annotations: annotationsToSend,
          segmentIndex,
        })) || {};

      return {
        suvPeak: suvPeak.mean,
        suvMax: suvPeak.max,
        suvMaxIJK: suvPeak.maxIJK,
        suvMaxLPS: suvPeak.maxLPS,
      };
    },
    getLesionStats: ({ segmentationId, segmentIndex = 1 }) => {
      const { labelmapVolume, referencedVolume } = getVolumesFromSegmentation(segmentationId);
      const { voxelManager: segVoxelManager, imageData, spacing } = labelmapVolume;
      const { voxelManager: refVoxelManager } = referencedVolume;

      let segmentationMax = -Infinity;
      let segmentationMin = Infinity;
      const segmentationValues = [];
      let voxelCount = 0;

      const callback = ({ value, index }) => {
        if (value === segmentIndex) {
          const refValue = refVoxelManager.getAtIndex(index) as number;
          segmentationValues.push(refValue);
          if (refValue > segmentationMax) {
            segmentationMax = refValue;
          }
          if (refValue < segmentationMin) {
            segmentationMin = refValue;
          }
          voxelCount++;
        }
      };

      segVoxelManager.forEach(callback, { imageData });
      const mean = segmentationValues.reduce((a, b) => a + b, 0) / voxelCount;
      const stats = {
        minValue: segmentationMin,
        maxValue: segmentationMax,
        meanValue: mean,
        stdValue: Math.sqrt(
          segmentationValues.map(k => (k - mean) ** 2).reduce((acc, curr) => acc + curr, 0) /
            voxelCount
        ),
        volume: voxelCount * spacing[0] * spacing[1] * spacing[2] * 1e-3,
      };

      return stats;
    },
    calculateLesionGlycolysis: ({ lesionStats }) => {
      const { meanValue, volume } = lesionStats;

      return {
        lesionGlyoclysisStats: volume * meanValue,
      };
    },
    calculateTMTV: async ({ segmentations }) => {
      const labelmapProps = segmentations.map(segmentation => {
        const labelmap = getLabelmapVolumeFromSegmentation(segmentation);
        return {
          dimensions: labelmap.dimensions,
          spacing: labelmap.spacing,
          scalarData: labelmap.voxelManager.getCompleteScalarDataArray(),
          origin: labelmap.origin,
          direction: labelmap.direction,
        };
      });

      if (!labelmapProps.length) {
        return;
      }

      return await workerManager.executeTask('suv-peak-worker', 'calculateTMTV', labelmapProps);
    },
    exportTMTVReportCSV: async ({ segmentations, tmtv, config, options }) => {
      const segReport = commandsManager.runCommand('getSegmentationCSVReport', {
        segmentations,
      });

      const tlg = await actions.getTotalLesionGlycolysis({ segmentations });
      const additionalReportRows = [
        { key: 'Total Lesion Glycolysis', value: { tlg: tlg.toFixed(4) } },
        { key: 'Threshold Configuration', value: { ...config } },
      ];

      if (tmtv !== undefined) {
        additionalReportRows.unshift({
          key: 'Total Metabolic Tumor Volume',
          value: { tmtv },
        });
      }

      createAndDownloadTMTVReport(segReport, additionalReportRows, options);
    },
    getTotalLesionGlycolysis: async ({ segmentations }) => {
      const labelmapProps = segmentations.map(segmentation => {
        const labelmap = getLabelmapVolumeFromSegmentation(segmentation);
        return {
          dimensions: labelmap.dimensions,
          spacing: labelmap.spacing,
          scalarData: labelmap.voxelManager.getCompleteScalarDataArray(),
          origin: labelmap.origin,
          direction: labelmap.direction,
        };
      });

      const { referencedVolume: ptVolume } = getVolumesFromSegmentation(
        segmentations[0].segmentationId
      );

      const ptVolumeProps = {
        dimensions: ptVolume.dimensions,
        spacing: ptVolume.spacing,
        scalarData: ptVolume.voxelManager.getCompleteScalarDataArray(),
        origin: ptVolume.origin,
        direction: ptVolume.direction,
      };

      return await workerManager.executeTask('suv-peak-worker', 'getTotalLesionGlycolysis', {
        labelmapProps,
        referenceVolumeProps: ptVolumeProps,
      });
    },
    setStartSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();
      const { focalPoint } = viewport.getCamera();

      const selectedAnnotationUIDs = _getAnnotationsSelectedByToolNames(
        ROI_THRESHOLD_MANUAL_TOOL_IDS
      );

      const annotationUID = selectedAnnotationUIDs[0];

      const annotation = csTools.annotation.state.getAnnotation(annotationUID);

      // set the current focal point
      annotation.data.startCoordinate = focalPoint;
      // IMPORTANT: invalidate the toolData for the cached stat to get updated
      // and re-calculate the projection points
      annotation.invalidated = true;
      viewport.render();
    },
    setEndSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();

      const selectedAnnotationUIDs = _getAnnotationsSelectedByToolNames(
        ROI_THRESHOLD_MANUAL_TOOL_IDS
      );

      const annotationUID = selectedAnnotationUIDs[0];

      const annotation = csTools.annotation.state.getAnnotation(annotationUID);

      // get the current focal point
      const focalPointToEnd = viewport.getCamera().focalPoint;
      annotation.data.endCoordinate = focalPointToEnd;

      // IMPORTANT: invalidate the toolData for the cached stat to get updated
      // and re-calculate the projection points
      annotation.invalidated = true;

      viewport.render();
    },
    createTMTVRTReport: () => {
      // get all Rectangle ROI annotation
      const stateManager = csTools.annotation.state.getAnnotationManager();

      const annotations = [];

      Object.keys(stateManager.annotations).forEach(frameOfReferenceUID => {
        const forAnnotations = stateManager.annotations[frameOfReferenceUID];
        const ROIAnnotations = ROI_THRESHOLD_MANUAL_TOOL_IDS.reduce(
          (annotations, toolName) => [...annotations, ...(forAnnotations[toolName] ?? [])],
          []
        );

        annotations.push(...ROIAnnotations);
      });

      commandsManager.runCommand('exportRTReportForAnnotations', {
        annotations,
      });
    },
    getSegmentationCSVReport: ({ segmentations }) => {
      if (!segmentations || !segmentations.length) {
        segmentations = segmentationService.getSegmentations();
      }

      const report = {};

      for (const segmentation of segmentations) {
        const { label, segmentationId, representationData } =
          segmentation as csTools.Types.Segmentation;
        const id = segmentationId;

        const segReport = { id, label };

        if (!representationData) {
          report[id] = segReport;
          continue;
        }

        const { cachedStats } = segmentation.segments[1] || {}; // Assuming we want stats from the first segment

        if (cachedStats) {
          Object.entries(cachedStats).forEach(([key, value]) => {
            if (typeof value !== 'object') {
              segReport[key] = value;
            } else {
              Object.entries(value).forEach(([subKey, subValue]) => {
                const newKey = `${key}_${subKey}`;
                segReport[newKey] = subValue;
              });
            }
          });
        }

        const labelmapVolume =
          segmentation.representationData[SegmentationRepresentations.Labelmap];

        if (!labelmapVolume) {
          report[id] = segReport;
          continue;
        }

        const referencedVolumeId = labelmapVolume.referencedVolumeId;

        const referencedVolume = cs.cache.getVolume(referencedVolumeId);

        if (!referencedVolume) {
          report[id] = segReport;
          continue;
        }

        if (!referencedVolume.imageIds || !referencedVolume.imageIds.length) {
          report[id] = segReport;
          continue;
        }

        const firstImageId = referencedVolume.imageIds[0];
        const instance = OHIF.classes.MetadataProvider.get('instance', firstImageId);

        if (!instance) {
          report[id] = segReport;
          continue;
        }

        report[id] = {
          ...segReport,
          PatientID: instance.PatientID ?? '000000',
          PatientName: instance.PatientName.Alphabetic,
          StudyInstanceUID: instance.StudyInstanceUID,
          SeriesInstanceUID: instance.SeriesInstanceUID,
          StudyDate: instance.StudyDate,
        };
      }

      return report;
    },
    exportRTReportForAnnotations: ({ annotations }) => {
      dicomRTAnnotationExport(annotations);
    },
    setFusionPTColormap: ({ toolGroupId, colormap }) => {
      const toolGroup = toolGroupService.getToolGroup(toolGroupId);

      if (!toolGroup) {
        return;
      }

      const { viewportMatchDetails } = hangingProtocolService.getMatchDetails();

      const ptDisplaySet = actions.getMatchingPTDisplaySet({
        viewportMatchDetails,
      });

      if (!ptDisplaySet) {
        return;
      }

      const fusionViewportIds = toolGroup.getViewportIds();

      const viewports = [];
      fusionViewportIds.forEach(viewportId => {
        commandsManager.runCommand('setViewportColormap', {
          viewportId,
          displaySetInstanceUID: ptDisplaySet.displaySetInstanceUID,
          colormap: {
            name: colormap,
          },
        });

        viewports.push(cornerstoneViewportService.getCornerstoneViewport(viewportId));
      });

      viewports.forEach(viewport => {
        viewport.render();
      });
    },
  };

  const definitions = {
    setEndSliceForROIThresholdTool: {
      commandFn: actions.setEndSliceForROIThresholdTool,
    },
    setStartSliceForROIThresholdTool: {
      commandFn: actions.setStartSliceForROIThresholdTool,
    },
    getMatchingPTDisplaySet: {
      commandFn: actions.getMatchingPTDisplaySet,
    },
    getPTMetadata: {
      commandFn: actions.getPTMetadata,
    },
    createNewLabelmapFromPT: {
      commandFn: actions.createNewLabelmapFromPT,
    },
    thresholdSegmentationByRectangleROITool: {
      commandFn: actions.thresholdSegmentationByRectangleROITool,
    },
    getTotalLesionGlycolysis: {
      commandFn: actions.getTotalLesionGlycolysis,
    },
    calculateSuvPeak: {
      commandFn: actions.calculateSuvPeak,
    },
    getLesionStats: {
      commandFn: actions.getLesionStats,
    },
    calculateTMTV: {
      commandFn: actions.calculateTMTV,
    },
    exportTMTVReportCSV: {
      commandFn: actions.exportTMTVReportCSV,
    },
    createTMTVRTReport: {
      commandFn: actions.createTMTVRTReport,
    },
    getSegmentationCSVReport: {
      commandFn: actions.getSegmentationCSVReport,
    },
    exportRTReportForAnnotations: {
      commandFn: actions.exportRTReportForAnnotations,
    },
    setFusionPTColormap: {
      commandFn: actions.setFusionPTColormap,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'TMTV:CORNERSTONE',
  };
};

export default commandsModule;
