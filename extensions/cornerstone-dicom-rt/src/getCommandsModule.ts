import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

const commandsModule = ({ commandsManager, servicesManager }: withAppTypes) => {
  const services = servicesManager.services;
  const { displaySetService, viewportGridService } = services;

  const actions = {
    hydrateRTSDisplaySet: ({ displaySet, viewportId }) => {
      if (displaySet.Modality !== 'RTSTRUCT') {
        throw new Error('Display set is not an RTSTRUCT');
      }

      const referencedDisplaySet = displaySetService.getDisplaySetByUID(
        displaySet.referencedDisplaySetInstanceUID
      );

      // update the previously stored segmentationPresentation with the new viewportId
      // presentation so that when we put the referencedDisplaySet back in the viewport
      // it will have the correct segmentation representation hydrated
      commandsManager.runCommand('updateStoredSegmentationPresentation', {
        displaySet: displaySet,
        type: SegmentationRepresentations.Contour,
      });

      // update the previously stored positionPresentation with the new viewportId
      // presentation so that when we put the referencedDisplaySet back in the viewport
      // it will be in the correct position zoom and pan
      commandsManager.runCommand('updateStoredPositionPresentation', {
        viewportId,
        displaySetInstanceUIDs: [referencedDisplaySet.displaySetInstanceUID],
      });

      viewportGridService.setDisplaySetsForViewport({
        viewportId,
        displaySetInstanceUIDs: [referencedDisplaySet.displaySetInstanceUID],
      });
    },
  };

  const definitions = {
    hydrateRTSDisplaySet: {
      commandFn: actions.hydrateRTSDisplaySet,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'cornerstone-dicom-rt',
  };
};

export default commandsModule;
