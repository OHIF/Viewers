import csTools from 'cornerstone-tools';
import cs from 'cornerstone-core';
import OHIF from '@ohif/core';

import DICOMSegTempCrosshairsTool from './tools/DICOMSegTempCrosshairsTool';
import refreshViewports from './utils/refreshViewports';

const { studyMetadataManager } = OHIF.utils;

const commandsModule = ({ commandsManager }) => {
  const actions = {
    jumpToFirstSegment: ({ viewports }) => {
      try {
        const { activeViewportIndex, viewportSpecificData } = viewports;
        const viewport = viewportSpecificData[activeViewportIndex];
        const { StudyInstanceUID, displaySetInstanceUID } = viewport;
        const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
        const firstImageId = studyMetadata.getFirstImageId(
          displaySetInstanceUID
        );

        const module = csTools.getModule('segmentation');
        const brushStackState = module.state.series[firstImageId];
        const { labelmaps3D, activeLabelmapIndex } = brushStackState;
        const { labelmaps2D } = labelmaps3D[activeLabelmapIndex];

        const firstLabelMap2D = labelmaps2D.find(value => !!value);
        const firstSegment = firstLabelMap2D.segmentsOnLabelmap[0];
        const segmentNumber = firstSegment;

        const validIndexList = [];
        labelmaps2D.forEach((labelMap2D, index) => {
          if (labelMap2D.segmentsOnLabelmap.includes(segmentNumber)) {
            validIndexList.push(index);
          }
        });

        const avg = array => array.reduce((a, b) => a + b) / array.length;
        const average = avg(validIndexList);
        const closest = validIndexList.reduce((prev, curr) => {
          return Math.abs(curr - average) < Math.abs(prev - average)
            ? curr
            : prev;
        });

        const enabledElements = cs.getEnabledElements();
        const element = enabledElements[activeViewportIndex].element;

        const toolState = csTools.getToolState(element, 'stack');
        if (!toolState) return;

        const imageIds = toolState.data[0].imageIds;
        const imageId = imageIds[closest];
        const frameIndex = imageIds.indexOf(imageId);
        const SOPInstanceUID = cs.metaData.get('SOPInstanceUID', imageId);

        cs.getEnabledElements().forEach(enabledElement => {
          cs.updateImage(enabledElement.element);
        });

        DICOMSegTempCrosshairsTool.addCrosshair(
          element,
          imageId,
          segmentNumber
        );

        cs.getEnabledElements().forEach(enabledElement => {
          cs.updateImage(enabledElement.element);
        });

        const refreshViewports = false;

        commandsManager.runCommand('jumpToImage', {
          StudyInstanceUID,
          SOPInstanceUID,
          frameIndex,
          activeViewportIndex,
          refreshViewports,
        });
      } catch (error) {
        console.log('Error in moving to the first segment slice');
      }
    },
  };

  const definitions = {
    jumpToFirstSegment: {
      commandFn: actions.jumpToFirstSegment,
      storeContexts: ['viewports'],
      options: {},
    },
  };

  return {
    definitions,
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
