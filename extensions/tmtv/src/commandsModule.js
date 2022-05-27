import { vec3 } from 'gl-matrix';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { classes, DicomMetadataStore } from '@ohif/core';

import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownloadForm';

import { Enums, annotation } from '@cornerstonejs/tools';

const metadataProvider = classes.MetadataProvider;
const RECTANGLE_ROI_THRESHOLD_MANUAL = 'RectangleROIStartEndThreshold';

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}) => {
  const {
    ViewportGridService,
    UINotificationService,
    SegmentationService,
    DisplaySetService,
    Cornerstone3DViewportService,
    HangingProtocolService,
  } = servicesManager.services;

  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone-3d.utilityModule.common'
  );

  const { getEnabledElement } = utilityModule.exports;

  function _getActiveViewportsEnabledElement() {
    const { activeViewportIndex } = ViewportGridService.getState();
    const { element } = getEnabledElement(activeViewportIndex) || {};
    const enabledElement = cornerstone.getEnabledElement(element);
    return enabledElement;
  }

  const actions = {
    getMatchingPTDisplaySet: () => {
      // Todo: this is assuming that the hanging protocol has successfully matched
      // the correct PT. For future, we should have a way to filter out the PTs
      // that are in the viewer layout (but then we have the problem of the attenuation
      // corrected PT vs the non-attenuation correct PT)
      const matches = HangingProtocolService.getDisplaySetsMatchDetails();

      const matchedSeriesInstanceUIDs = Array.from(matches.values()).map(
        ({ SeriesInstanceUID }) => SeriesInstanceUID
      );

      let ptDisplaySet = null;
      for (const SeriesInstanceUID of matchedSeriesInstanceUIDs) {
        const displaySets = DisplaySetService.getDisplaySetsForSeries(
          SeriesInstanceUID
        );

        if (!displaySets || displaySets.length === 0) {
          continue;
        }

        const displaySet = displaySets[0];
        if (displaySet.Modality !== 'PT') {
          continue;
        }

        ptDisplaySet = displaySet;
      }

      return ptDisplaySet;
    },
    getPTMetadata: ({ ptDisplaySet }) => {
      const dataSource = extensionManager.getDataSources()[0];
      const imageIds = dataSource.getImageIdsForDisplaySet(ptDisplaySet);

      const firstImageId = imageIds[0];
      const SeriesTime = metadataProvider.get('SeriesTime', firstImageId);
      const metadata = {};

      if (SeriesTime) {
        metadata.SeriesTime = SeriesTime;
      }

      // get metadata from the first image
      const seriesModule = metadataProvider.get(
        'generalSeriesModule',
        firstImageId
      );

      if (seriesModule && seriesModule.modality !== 'PT') {
        return;
      }

      // get metadata from the first image
      const demographic = metadataProvider.get(
        'patientDemographicModule',
        firstImageId
      );

      if (demographic) {
        // naturalized dcmjs version
        metadata.PatientSex = demographic.patientSex;
      }

      // patientStudyModule
      const studyModule = metadataProvider.get(
        'patientStudyModule',
        firstImageId
      );

      if (studyModule) {
        // naturalized dcmjs version
        metadata.PatientWeight = studyModule.patientWeight;
      }

      // total dose
      const petSequenceModule = metadataProvider.get(
        'petIsotopeModule',
        firstImageId
      );
      const { radiopharmaceuticalInfo } = petSequenceModule;

      const {
        radionuclideHalfLife,
        radionuclideTotalDose,
        radiopharmaceuticalStartTime,
      } = radiopharmaceuticalInfo;

      const {
        hours,
        minutes,
        seconds,
        fractionalSeconds,
      } = radiopharmaceuticalStartTime;

      // pad number with leading zero if less than 10
      const hoursString = hours < 10 ? `0${hours}` : hours;
      const minutesString = minutes < 10 ? `0${minutes}` : minutes;
      const secondsString = seconds < 10 ? `0${seconds}` : seconds;

      if (radiopharmaceuticalInfo) {
        metadata.RadiopharmaceuticalInformationSequence = {
          RadionuclideTotalDose: radionuclideTotalDose,
          RadionuclideHalfLife: radionuclideHalfLife,
          RadiopharmaceuticalStartTime: `${hoursString}${minutesString}${secondsString}.${fractionalSeconds}`,
        };
      }

      return metadata;
    },
    createNewLabelmapForPT: async () => {
      // Create a segmentation of the same resolution as the source data
      // using volumeLoader.createAndCacheDerivedVolume.
      const ptDisplaySet = actions.getMatchingPTDisplaySet();

      if (!ptDisplaySet) {
        UINotificationService.error('No matching PT display set found');
        return;
      }

      const segmentationId = await commandsManager.runCommand(
        'createSegmentationForDisplaySet',
        {
          displaySetInstanceUID: ptDisplaySet.displaySetInstanceUID,
        }
      );

      const ptVolumeId = ptDisplaySet.displaySetInstanceUID;
      // find the viewport that is displaying the PT Volume
      const { viewports } = ViewportGridService.getState();

      const ptViewportIndex = viewports.findIndex(
        viewport =>
          viewport.displaySetInstanceUIDs.length === 1 &&
          viewport.displaySetInstanceUIDs[0] === ptVolumeId
      );

      const ptViewport = Cornerstone3DViewportService.getCornerstone3DViewportByIndex(
        ptViewportIndex
      );

      if (!ptViewport) {
        return;
      }

      const renderingEngineId = ptViewport.getRenderingEngine().id;
      const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroupForViewport(
        ptViewport.id,
        renderingEngineId
      );

      const options = {
        representationType:
          cornerstoneTools.Enums.SegmentationRepresentations.Labelmap,
      };

      await commandsManager.runCommand(
        'addSegmentationRepresentationToToolGroup',
        { segmentationId, toolGroupId: toolGroup.id, options }
      );
    },

    // setPTColormap: ({ toolGroupUID, colormap }) => {
    //   const toolGroup = ToolGroupManager.getToolGroupById(toolGroupUID);

    //   if (!toolGroup) {
    //     return;
    //   }

    //   const { viewports } = toolGroup;

    //   const renderingEngine = ViewportService.getRenderingEngine();

    //   const { viewportUID } = viewports[0];

    //   const viewport = renderingEngine.getViewport(viewportUID);
    //   const actors = viewport.getActors();

    //   const displaySetUIDs = ViewportService.getDisplaySetUIDsForViewportUID(
    //     viewportUID
    //   );

    //   let ptDisplaySetUID;
    //   displaySetUIDs.forEach(displaySetUID => {
    //     const displaySet = DisplaySetService.getDisplaySetByUID(displaySetUID);
    //     if (displaySet.Modality === 'PT') {
    //       ptDisplaySetUID = displaySetUID;
    //     }
    //   });

    //   if (!ptDisplaySetUID) {
    //     return;
    //   }

    //   const ptActor = actors.find(a => a.uid.includes(ptDisplaySetUID));

    //   if (!ptActor) {
    //     return;
    //   }

    //   const { volumeActor } = ptActor;
    //   setColormap(volumeActor, colormap);

    //   viewport.getScene().render();
    // },
    // getActiveViewportsEnabledElement: () => {
    //   return _getActiveViewportsEnabledElement();
    // },
    // thresholdVolume: ({ labelmapUID, config }) => {
    //   const labelmap = cornerstone.cache.getVolume(labelmapUID);
    //   const volume = cornerstone.cache.getVolume(labelmap.referenceVolumeUID);

    //   if (!volume) {
    //     throw new Error('No Reference volume found');
    //   }

    //   if (!labelmap) {
    //     throw new Error('No Reference labelmap found');
    //   }

    //   // const RoiThresholdToolDataList = toolDataSelection.getSelectedToolDataByToolName(
    //   //   RECTANGLE_ROI_THRESHOLD
    //   // );
    //   const RoiThresholdManualToolDataList = toolDataSelection.getSelectedToolDataByToolName(
    //     RECTANGLE_ROI_THRESHOLD_MANUAL
    //   );

    //   const selectedToolDataList = [
    //     // ...RoiThresholdToolDataList,
    //     ...RoiThresholdManualToolDataList,
    //   ];

    //   if (selectedToolDataList.length === 0) {
    //     UINotificationService.show({
    //       title: 'Commands Module',
    //       message: 'No RoiThreshold Tool is Selected',
    //       type: 'error',
    //     });
    //     return;
    //   }

    //   const configToUse = {
    //     lowerThreshold: config.minValue,
    //     higherThreshold: config.maxValue,
    //     overwrite: true,
    //     statistic: 'max',
    //     weight: config.weight,
    //   };

    //   const thresholdVolumeMethod =
    //     config.strategy === 'range'
    //       ? csToolsUtils.segmentation.thresholdVolumeByRange
    //       : csToolsUtils.segmentation.thresholdVolumeByRoiStats;

    //   return thresholdVolumeMethod(
    //     selectedToolDataList,
    //     [volume],
    //     labelmap,
    //     configToUse
    //   );
    // },
    // calculateSuvPeak: ({ labelmap }) => {
    //   const { viewport } = _getActiveViewportsEnabledElement();

    //   if (viewport instanceof cornerstone.StackViewport) {
    //     throw new Error('Cannot create a labelmap from a stack viewport');
    //   }

    //   const { uid } = viewport.getDefaultActor();
    //   const volume = cornerstone.getVolume(uid);

    //   const toolData = toolDataSelection.getSelectedToolDataByToolName(
    //     RECTANGLE_ROI_THRESHOLD_MANUAL
    //   );

    //   const suvPeak = csToolsUtils.segmentation.calculateSuvPeak(
    //     viewport,
    //     labelmap,
    //     volume,
    //     toolData
    //   );

    //   return {
    //     suvPeak: suvPeak.mean,
    //     suvMax: suvPeak.max,
    //     suvMaxIJK: suvPeak.maxIJK,
    //     suvMaxLPS: suvPeak.maxLPS,
    //   };
    // },
    // getLesionStats: ({ labelmap, segmentIndex = 1 }) => {
    //   const { scalarData, spacing } = cornerstone.getVolume(labelmap.uid);

    //   const { scalarData: referencedScalarData } = cornerstone.getVolume(
    //     labelmap.referenceVolumeUID
    //   );

    //   let segmentationMax = -Infinity;
    //   let segmentationMin = Infinity;
    //   let segmentationValues = [];

    //   let voxelCount = 0;
    //   for (let i = 0; i < scalarData.length; i++) {
    //     if (scalarData[i] === segmentIndex) {
    //       const value = referencedScalarData[i];
    //       segmentationValues.push(value);
    //       if (value > segmentationMax) {
    //         segmentationMax = value;
    //       }
    //       if (value < segmentationMin) {
    //         segmentationMin = value;
    //       }
    //       voxelCount++;
    //     }
    //   }

    //   const stats = {
    //     minValue: segmentationMin,
    //     maxValue: segmentationMax,
    //     meanValue: segmentationValues.reduce((a, b) => a + b, 0) / voxelCount,
    //     stdValue: Math.sqrt(
    //       segmentationValues.reduce((a, b) => a + b * b, 0) / voxelCount -
    //         segmentationValues.reduce((a, b) => a + b, 0) / voxelCount ** 2
    //     ),
    //     volume: voxelCount * spacing[0] * spacing[1] * spacing[2] * 1e-3,
    //   };

    //   return stats;
    // },
    // calculateLesionGlycolysis: ({ lesionStats }) => {
    //   const { meanValue, volume } = lesionStats;

    //   return {
    //     lesionGlyoclysisStats: volume * meanValue,
    //   };
    // },
    // getTotalLesionGlycolysis: ({ segmentations }) => {
    //   const labelmapVolumes = segmentations.map(segmentation => {
    //     return cornerstone.cache.getVolume(segmentation.id);
    //   });

    //   // merge labelmap will through an error if labels maps are not the same size
    //   // or same direction or ....
    //   const mergedLabelmap = csToolsUtils.segmentation.createMergedLabelmap(
    //     labelmapVolumes
    //   );

    //   // grabbing the first labelmap referenceVolume since it will be the same for all
    //   const { referenceVolumeUID, spacing } = labelmapVolumes[0];

    //   if (!referenceVolumeUID) {
    //     throw new Error('No Reference volume found');
    //   }

    //   const ptVolume = cornerstone.getVolume(referenceVolumeUID);

    //   const mergedLabelData = mergedLabelmap.scalarData;

    //   let Suvs = 0;
    //   let totalLesionVoxelCount = 0;
    //   for (let i = 0; i < mergedLabelData.length; i++) {
    //     // if not backgournd
    //     if (mergedLabelData[i] !== 0) {
    //       const ptSuv = ptVolume.scalarData[i];
    //       Suvs += ptSuv;
    //       totalLesionVoxelCount += 1;
    //     }
    //   }

    //   // Average SUV for the merged labelmap
    //   const averageSuv = Suvs / totalLesionVoxelCount;

    //   // total Lesion Glycolysis [suv * ml]
    //   return (
    //     averageSuv *
    //     totalLesionVoxelCount *
    //     spacing[0] *
    //     spacing[1] *
    //     spacing[2] *
    //     1e-3
    //   );
    // },
    // getLabelmapVolumes: () => {
    //   const segmentations = SegmentationService.getSegmentations();
    //   const labelmapVolumes = segmentations.map(segmentation => {
    //     return cornerstone.cache.getVolume(segmentation.id);
    //   });

    //   return labelmapVolumes;
    // },
    setStartSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();
      const { focalPoint, viewPlaneNormal } = viewport.getCamera();

      const selectedAnnotationUIDs = cornerstoneTools.annotation.selection.getAnnotationsSelectedByToolName(
        RECTANGLE_ROI_THRESHOLD_MANUAL
      );

      const annotationUID = selectedAnnotationUIDs[0];

      const annotation = cornerstoneTools.annotation.state.getAnnotation(
        annotationUID
      );

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
      annotation.data.invalidated = true; // IMPORTANT: invalidate the toolData for the cached stat to get updated
      viewport.render();
    },
    setEndSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();

      const selectedAnnotationUIDs = cornerstoneTools.annotation.selection.getAnnotationsSelectedByToolName(
        RECTANGLE_ROI_THRESHOLD_MANUAL
      );

      const annotationUID = selectedAnnotationUIDs[0];

      const annotation = cornerstoneTools.annotation.state.getAnnotation(
        annotationUID
      );

      // get the current slice Index
      const sliceIndex = viewport.getCurrentImageIdIndex();
      annotation.data.endSlice = sliceIndex;
      annotation.data.invalidated = true; // IMPORTANT: invalidate the toolData for the cached stat to get updated

      viewport.render();
    },
  };

  const definitions = {
    setEndSliceForROIThresholdTool: {
      commandFn: actions.setEndSliceForROIThresholdTool,
      storeContexts: [],
      options: {},
    },
    setStartSliceForROIThresholdTool: {
      commandFn: actions.setStartSliceForROIThresholdTool,
      storeContexts: [],
      options: {},
    },
    getMatchingPTDisplaySet: {
      commandFn: actions.getMatchingPTDisplaySet,
      storeContexts: [],
      options: {},
    },
    getPTMetadata: {
      commandFn: actions.getPTMetadata,
      storeContexts: [],
      options: {},
    },
    createNewLabelmapForPT: {
      commandFn: actions.createNewLabelmapForPT,
      storeContexts: [],
      options: {},
    },
    // setPTColormap: {
    //   commandFn: actions.setPTColormap,
    //   storeContexts: [],
    //   options: {},
    // },
    // getActiveViewportsEnabledElement: {
    //   commandFn: actions.getActiveViewportsEnabledElement,
    //   storeContexts: [],
    //   options: {},
    // },
    // thresholdVolume: {
    //   commandFn: actions.thresholdVolume,
    //   storeContexts: [],
    //   options: {},
    // },
    // getLabelmapVolumes: {
    //   commandFn: actions.getLabelmapVolumes,
    //   storeContexts: [],
    //   options: {},
    // },
    // getTotalLesionGlycolysis: {
    //   commandFn: actions.getTotalLesionGlycolysis,
    //   storeContexts: [],
    //   options: {},
    // },
    // calculateSuvPeak: {
    //   commandFn: actions.calculateSuvPeak,
    //   storeContexts: [],
    //   options: {},
    // },
    // getLesionStats: {
    //   commandFn: actions.getLesionStats,
    //   storeContexts: [],
    //   options: {},
    // },
    // calculateLesionGlycolysis: {
    //   commandFn: actions.calculateLesionGlycolysis,
    //   storeContexts: [],
    //   options: {},
    // },
  };

  return {
    actions,
    definitions,
    defaultContext: 'TMTV:CORNERSTONE3D',
  };
};

export default commandsModule;
