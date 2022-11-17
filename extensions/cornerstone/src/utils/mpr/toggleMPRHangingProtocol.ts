import { Enums } from '@cornerstonejs/tools';
import getProtocolViewportStructureFromGridViewports from './getProtocolViewportStructureFromGridViewports';
import removeToolGroupSegmentationRepresentations from '../removeToolGroupSegmentationRepresentations';

const MPR_TOOLGROUP_ID = 'mpr';

export default function toggleMPRHangingProtocol({
  toggledState,
  getToolGroup,
  servicesManager,
}) {
  const {
    ViewportGridService,
    UINotificationService,
    HangingProtocolService,
    ToolBarService,
  } = servicesManager.services;
  const { activeViewportIndex, viewports } = ViewportGridService.getState();
  const viewportDisplaySetInstanceUIDs =
    viewports[activeViewportIndex].displaySetInstanceUIDs;

  const errorCallback = error => {
    UINotificationService.show({
      title: 'Multiplanar reconstruction (MPR) ',
      message:
        'Cannot create MPR for this DisplaySet since it is not reconstructable.',
      type: 'info',
      duration: 3000,
    });
  };

  const cacheId = 'beforeMPR';
  if (toggledState) {
    ViewportGridService.setCachedLayout({
      cacheId,
      cachedLayout: ViewportGridService.getState(),
    });

    const matchDetails = {
      displaySetInstanceUIDs: viewportDisplaySetInstanceUIDs,
    };

    HangingProtocolService.setProtocol(
      MPR_TOOLGROUP_ID,
      matchDetails,
      errorCallback
    );
    return;
  }

  const { cachedLayout } = ViewportGridService.getState();

  if (!cachedLayout || !cachedLayout[cacheId]) {
    return;
  }

  const { viewports: cachedViewports, numRows, numCols } = cachedLayout[
    cacheId
  ];

  // Todo: The following assumes that when turning off MPR we are applying the default
  //  protocol which might not be the one that was used before MPR was turned on
  // In order to properly implement this logic, we should modify the hanging protocol
  // upon layout change with layout selector, and cache and restore it when turning
  // MPR on and off
  const viewportStructure = getProtocolViewportStructureFromGridViewports({
    viewports: cachedViewports,
    numRows,
    numCols,
  });

  const viewportSpecificMatch = cachedViewports.reduce(
    (acc, viewport, index) => {
      const {
        displaySetInstanceUIDs,
        viewportOptions,
        displaySetOptions,
      } = viewport;

      acc[index] = {
        displaySetInstanceUIDs,
        viewportOptions,
        displaySetOptions,
      };

      return acc;
    },
    {}
  );

  const defaultProtocol = HangingProtocolService.getProtocolById('default');

  // Todo: this assumes there is only one stage in the default protocol
  const defaultProtocolStage = defaultProtocol.stages[0];
  defaultProtocolStage.viewportStructure = viewportStructure;

  const { primaryToolId } = ToolBarService.state;
  const mprToolGroup = getToolGroup(MPR_TOOLGROUP_ID);
  // turn off crosshairs if it is on
  if (
    primaryToolId === 'Crosshairs' ||
    mprToolGroup.getToolInstance('Crosshairs')?.mode === Enums.ToolModes.Active
  ) {
    const toolGroup = getToolGroup(MPR_TOOLGROUP_ID);
    toolGroup.setToolDisabled('Crosshairs');
    ToolBarService.recordInteraction({
      groupId: 'WindowLevel',
      itemId: 'WindowLevel',
      interactionType: 'tool',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName: 'WindowLevel',
          },
          context: 'CORNERSTONE',
        },
      ],
    });
  }

  // clear segmentations if they exist
  removeToolGroupSegmentationRepresentations(MPR_TOOLGROUP_ID);

  HangingProtocolService.setProtocol(
    'default',
    viewportSpecificMatch,
    error => {
      UINotificationService.show({
        title: 'Multiplanar reconstruction (MPR) ',
        message:
          'Something went wrong while trying to restore the previous layout.',
        type: 'info',
        duration: 3000,
      });
    }
  );
}
