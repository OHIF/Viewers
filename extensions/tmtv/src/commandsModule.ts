import OHIF from '@ohif/core';
import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import { classes } from '@ohif/core';
import i18n from '@ohif/i18n';
import getThresholdValues from './utils/getThresholdValue';
import createAndDownloadTMTVReport from './utils/createAndDownloadTMTVReport';

import dicomRTAnnotationExport from './utils/dicomRTAnnotationExport/RTStructureSet';

import { Enums } from '@cornerstonejs/tools';
import { utils } from '@ohif/core';

const { SegmentationRepresentations } = Enums;
const { formatPN } = utils;

const metadataProvider = classes.MetadataProvider;
const ROI_THRESHOLD_MANUAL_TOOL_IDS = [
  'RectangleROIStartEndThreshold',
  'RectangleROIThreshold',
  'CircleROIStartEndThreshold',
];

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
      for (const [, viewportDetails] of viewportMatchDetails) {
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
        segments: { 1: { label: `${i18n.t('Segment')} 1`, active: true } },
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
      const ctDisplaySetMatch = matchDetails.get('ctDisplaySet');
      const ptDisplaySetMatch = matchDetails.get('ptDisplaySet');

      const ctDisplaySet = displaySetService.getDisplaySetByUID(
        ctDisplaySetMatch.displaySetInstanceUID
      );
      const ptDisplaySet = displaySetService.getDisplaySetByUID(
        ptDisplaySetMatch.displaySetInstanceUID
      );

      const { volumeId: segVolumeId } = representationData[
        SegmentationRepresentations.Labelmap
      ] as csTools.Types.LabelmapToolOperationDataVolume;

      const labelmapVolume = cs.cache.getVolume(segVolumeId);

      const annotationUIDs = _getAnnotationsSelectedByToolNames(ROI_THRESHOLD_MANUAL_TOOL_IDS);

      if (annotationUIDs.length === 0) {
        uiNotificationService.show({
          title: 'Commands Module',
          message: 'No ROIThreshold Tool is Selected',
          type: 'error',
        });
        return;
      }

      const { ptLower, ptUpper, ctLower, ctUpper } = getThresholdValues(
        annotationUIDs,
        ptDisplaySet,
        config
      );

      const { imageIds: ptImageIds } = ptDisplaySet;

      const ptVolumeInfo = cs.cache.getVolumeContainingImageId(ptImageIds[0]);

      if (!ptVolumeInfo) {
        uiNotificationService.error('No PT volume found');
        return;
      }

      const { imageIds: ctImageIds } = ctDisplaySet;
      const ctVolumeInfo = cs.cache.getVolumeContainingImageId(ctImageIds[0]);

      if (!ctVolumeInfo) {
        uiNotificationService.error('No CT volume found');
        return;
      }

      const ptVolume = ptVolumeInfo.volume;
      const ctVolume = ctVolumeInfo.volume;

      return csTools.utilities.segmentation.rectangleROIThresholdVolumeByRange(
        annotationUIDs,
        labelmapVolume,
        [
          { volume: ptVolume, lower: ptLower, upper: ptUpper },
          { volume: ctVolume, lower: ctLower, upper: ctUpper },
        ],
        { overwrite: true, segmentIndex, segmentationId }
      );
    },
    calculateTMTV: async ({ segmentations }) => {
      const segmentationIds = segmentations.map(segmentation => segmentation.segmentationId);

      const stats = await csTools.utilities.segmentation.computeMetabolicStats({
        segmentationIds,
        segmentIndex: 1,
      });

      segmentationService.setSegmentationGroupStats(segmentationIds, stats);
      return stats;
    },
    exportTMTVReportCSV: async ({ segmentations, tmtv, config, options }) => {
      const segReport = commandsManager.runCommand('getSegmentationCSVReport', {
        segmentations,
      });

      let total_tlg = 0;
      for (const segmentationId in segReport) {
        const report = segReport[segmentationId];
        const tlg = report['namedStats_lesionGlycolysis'];
        total_tlg += tlg.value;
      }
      const additionalReportRows = [
        { key: 'Total Lesion Glycolysis', value: { tlg: total_tlg.toFixed(4) } },
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

        const referencedVolume =
          csTools.utilities.segmentation.getReferenceVolumeForSegmentationVolume(
            labelmapVolume.volumeId
          );

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
          PatientName: formatPN(instance.PatientName),
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
