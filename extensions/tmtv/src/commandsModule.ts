import { vec3 } from 'gl-matrix';
import OHIF from '@ohif/core';
import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import { classes } from '@ohif/core';
import getThresholdValues from './utils/getThresholdValue';
import calculateTMTV from './utils/calculateTMTV';
import createAndDownloadTMTVReport from './utils/createAndDownloadTMTVReport';

import dicomRTAnnotationExport from './utils/dicomRTAnnotationExport/RTStructureSet';

import { getWebWorkerManager } from '@cornerstonejs/core';

const metadataProvider = classes.MetadataProvider;
const RECTANGLE_ROI_THRESHOLD_MANUAL_TOOL_IDS = [
  'RectangleROIStartEndThreshold',
  'RectangleROIThreshold',
];
const LABELMAP = csTools.Enums.SegmentationRepresentations.Labelmap;

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

  function _getMatchedViewportsToolGroupIds() {
    const { viewportMatchDetails } = hangingProtocolService.getMatchDetails();
    const toolGroupIds = [];
    viewportMatchDetails.forEach(viewport => {
      const { viewportOptions } = viewport;
      const { toolGroupId } = viewportOptions;
      if (toolGroupIds.indexOf(toolGroupId) === -1) {
        toolGroupIds.push(toolGroupId);
      }
    });

    return toolGroupIds;
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

      if (!ptDisplaySet) {
        uiNotificationService.error('No matching PT display set found');
        return;
      }

      const currentSegmentations = segmentationService.getSegmentations();

      const segmentationId = await segmentationService.createSegmentationForDisplaySet(
        ptDisplaySet.displaySetInstanceUID,
        { label: `Segmentation ${currentSegmentations.length + 1}` }
      );

      // Add Segmentation to all toolGroupIds in the viewer
      const toolGroupIds = _getMatchedViewportsToolGroupIds();
      const representationType = LABELMAP;

      for (const toolGroupId of toolGroupIds) {
        const hydrateSegmentation = true;
        await segmentationService.addSegmentationRepresentationToToolGroup(
          toolGroupId,
          segmentationId,
          hydrateSegmentation,
          representationType
        );

        segmentationService.setActiveSegmentationForToolGroup(segmentationId, toolGroupId);
      }

      segmentationService.addSegment(segmentationId, {
        segmentIndex: 1,
        properties: {
          label: 'Segment 1',
        },
      });
      return segmentationId;
    },
    setSegmentationActiveForToolGroups: ({ segmentationId }) => {
      const toolGroupIds = _getMatchedViewportsToolGroupIds();

      toolGroupIds.forEach(toolGroupId => {
        segmentationService.setActiveSegmentationForToolGroup(segmentationId, toolGroupId);
      });
    },
    thresholdSegmentationByRectangleROITool: ({ segmentationId, config, segmentIndex }) => {
      const segmentation = csTools.segmentation.state.getSegmentation(segmentationId);

      const { representationData } = segmentation;
      const { displaySetMatchDetails: matchDetails } = hangingProtocolService.getMatchDetails();
      const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use

      const ctDisplaySet = matchDetails.get('ctDisplaySet');
      const ctVolumeId = `${volumeLoaderScheme}:${ctDisplaySet.displaySetInstanceUID}`; // VolumeId with loader id + volume id

      const { volumeId: segVolumeId } = representationData[LABELMAP];
      const { referencedVolumeId } = cs.cache.getVolume(segVolumeId);

      const annotationUIDs = _getAnnotationsSelectedByToolNames(
        RECTANGLE_ROI_THRESHOLD_MANUAL_TOOL_IDS
      );

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
    calculateSuvPeak: async ({ labelmap, segmentIndex }) => {
      // if we put it in the top, it will appear in other modes
      workerManager.registerWorker('suv-peak-worker', workerFn, options);

      const { referencedVolumeId } = labelmap;
      const referencedVolume = cs.cache.getVolume(referencedVolumeId);

      const annotationUIDs = _getAnnotationsSelectedByToolNames(
        RECTANGLE_ROI_THRESHOLD_MANUAL_TOOL_IDS
      );

      const annotations = annotationUIDs.map(annotationUID =>
        csTools.annotation.state.getAnnotation(annotationUID)
      );

      const labelmapProps = {
        dimensions: labelmap.dimensions,
        origin: labelmap.origin,
        direction: labelmap.direction,
        spacing: labelmap.spacing,
        scalarData: labelmap.scalarData,
        metadata: labelmap.metadata,
      };

      const referenceVolumeProps = {
        dimensions: referencedVolume.dimensions,
        origin: referencedVolume.origin,
        direction: referencedVolume.direction,
        spacing: referencedVolume.spacing,
        scalarData: referencedVolume.scalarData,
        metadata: referencedVolume.metadata,
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

      const suvPeak = await workerManager.executeTask('suv-peak-worker', 'calculateSuvPeak', {
        labelmapProps,
        referenceVolumeProps,
        annotations: annotationsToSend,
        segmentIndex,
      });

      return {
        suvPeak: suvPeak.mean,
        suvMax: suvPeak.max,
        suvMaxIJK: suvPeak.maxIJK,
        suvMaxLPS: suvPeak.maxLPS,
      };
    },
    getLesionStats: ({ labelmap, segmentIndex = 1 }) => {
      const { scalarData, spacing } = labelmap;
      const referencedScalarData = cs.cache.getVolume(labelmap.referencedVolumeId).getScalarData();

      let segmentationMax = -Infinity;
      let segmentationMin = Infinity;
      const segmentationValues = [];

      let voxelCount = 0;
      for (let i = 0; i < scalarData.length; i++) {
        if (scalarData[i] === segmentIndex) {
          const value = referencedScalarData[i];
          segmentationValues.push(value);
          if (value > segmentationMax) {
            segmentationMax = value;
          }
          if (value < segmentationMin) {
            segmentationMin = value;
          }
          voxelCount++;
        }
      }

      const stats = {
        minValue: segmentationMin,
        maxValue: segmentationMax,
        meanValue: segmentationValues.reduce((a, b) => a + b, 0) / voxelCount,
        stdValue: Math.sqrt(
          segmentationValues.reduce((a, b) => a + b * b, 0) / voxelCount -
            segmentationValues.reduce((a, b) => a + b, 0) / voxelCount ** 2
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
    calculateTMTV: ({ segmentations }) => {
      const labelmaps = segmentations.map(s => segmentationService.getLabelmapVolume(s.id));

      if (!labelmaps.length) {
        return;
      }

      return calculateTMTV(labelmaps);
    },
    exportTMTVReportCSV: ({ segmentations, tmtv, config, options }) => {
      const segReport = commandsManager.runCommand('getSegmentationCSVReport', {
        segmentations,
      });

      const tlg = actions.getTotalLesionGlycolysis({ segmentations });
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
    getTotalLesionGlycolysis: ({ segmentations }) => {
      const labelmapVolumes = segmentations.map(s => segmentationService.getLabelmapVolume(s.id));

      let mergedLabelmap;
      // merge labelmap will through an error if labels maps are not the same size
      // or same direction or ....
      try {
        mergedLabelmap =
          csTools.utilities.segmentation.createMergedLabelmapForIndex(labelmapVolumes);
      } catch (e) {
        console.error('commandsModule::getTotalLesionGlycolysis', e);
        return;
      }

      // grabbing the first labelmap referenceVolume since it will be the same for all
      const { referencedVolumeId, spacing } = labelmapVolumes[0];

      if (!referencedVolumeId) {
        console.error('commandsModule::getTotalLesionGlycolysis:No referencedVolumeId found');
      }

      const ptVolume = cs.cache.getVolume(referencedVolumeId);
      const mergedLabelData = mergedLabelmap.getScalarData();

      if (mergedLabelData.length !== ptVolume.getScalarData().length) {
        console.error(
          'commandsModule::getTotalLesionGlycolysis:Labelmap and ptVolume are not the same size'
        );
      }

      let suv = 0;
      let totalLesionVoxelCount = 0;
      for (let i = 0; i < mergedLabelData.length; i++) {
        // if not background
        if (mergedLabelData[i] !== 0) {
          suv += ptVolume.getScalarData()[i];
          totalLesionVoxelCount += 1;
        }
      }

      // Average SUV for the merged labelmap
      const averageSuv = suv / totalLesionVoxelCount;

      // total Lesion Glycolysis [suv * ml]
      return averageSuv * totalLesionVoxelCount * spacing[0] * spacing[1] * spacing[2] * 1e-3;
    },
    setStartSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();
      const { focalPoint, viewPlaneNormal } = viewport.getCamera();

      const selectedAnnotationUIDs = _getAnnotationsSelectedByToolNames(
        RECTANGLE_ROI_THRESHOLD_MANUAL_TOOL_IDS
      );

      const annotationUID = selectedAnnotationUIDs[0];

      const annotation = csTools.annotation.state.getAnnotation(annotationUID);

      const { handles } = annotation.data;
      const { points } = handles;

      // get the current slice Index
      const sliceIndex = viewport.getCurrentImageIdIndex();
      annotation.data.startSlice = sliceIndex;

      // distance between camera focal point and each point on the rectangle
      const newPoints = points.map(point => {
        const distance = vec3.create();
        vec3.subtract(distance, focalPoint, point);
        // distance in the direction of the viewPlaneNormal
        const distanceInViewPlane = vec3.dot(distance, viewPlaneNormal);
        // new point is current point minus distanceInViewPlane
        const newPoint = vec3.create();
        vec3.scaleAndAdd(newPoint, point, viewPlaneNormal, distanceInViewPlane);

        return newPoint;
        //
      });

      handles.points = newPoints;
      // IMPORTANT: invalidate the toolData for the cached stat to get updated
      // and re-calculate the projection points
      annotation.invalidated = true;
      viewport.render();
    },
    setEndSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();

      const selectedAnnotationUIDs = _getAnnotationsSelectedByToolNames(
        RECTANGLE_ROI_THRESHOLD_MANUAL_TOOL_IDS
      );

      const annotationUID = selectedAnnotationUIDs[0];

      const annotation = csTools.annotation.state.getAnnotation(annotationUID);

      // get the current slice Index
      const sliceIndex = viewport.getCurrentImageIdIndex();
      annotation.data.endSlice = sliceIndex;

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
        const ROIAnnotations = RECTANGLE_ROI_THRESHOLD_MANUAL_TOOL_IDS.reduce(
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
        const { id, label, cachedStats: data } = segmentation;

        const segReport = { id, label };

        if (!data) {
          report[id] = segReport;
          continue;
        }

        Object.keys(data).forEach(key => {
          if (typeof data[key] !== 'object') {
            segReport[key] = data[key];
          } else {
            Object.keys(data[key]).forEach(subKey => {
              const newKey = `${key}_${subKey}`;
              segReport[newKey] = data[key][subKey];
            });
          }
        });

        const labelmapVolume = segmentationService.getLabelmapVolume(id);

        if (!labelmapVolume) {
          report[id] = segReport;
          continue;
        }

        const referencedVolumeId = labelmapVolume.referencedVolumeId;
        segReport.referencedVolumeId = referencedVolumeId;

        const referencedVolume = segmentationService.getLabelmapVolume(referencedVolumeId);

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
    setSegmentationActiveForToolGroups: {
      commandFn: actions.setSegmentationActiveForToolGroups,
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
