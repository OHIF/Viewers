import { vec3 } from 'gl-matrix';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownloadForm';

import { Enums, annotation } from '@cornerstonejs/tools';
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
    ViewportService,
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
    // createNewLabelmapForPT: async () => {
    //   const renderingEngine = ViewportService.getRenderingEngine();

    //   const viewports = renderingEngine.getViewports();

    //   // Find the viewport that has a volume loaded of PT
    //   const viewport = viewports.find(viewport => {
    //     const { uid } = viewport.getDefaultActor();
    //     const volume = cache.getVolume(uid);
    //     return volume?.metadata?.Modality === 'PT';
    //   });

    //   if (!viewport) {
    //     console.warn('No viewport found with PT loaded yet');
    //   }

    //   const { element } = viewport;
    //   const labelmapIndex = activeLabelmapController.getNextLabelmapIndex(
    //     element
    //   );
    //   await activeLabelmapController.setActiveLabelmapIndex(
    //     element,
    //     labelmapIndex
    //   );
    // },
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
    // createNewLabelmapForPT: {
    //   commandFn: actions.createNewLabelmapForPT,
    //   storeContexts: [],
    //   options: {},
    // },
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
