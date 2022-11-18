import { Enums } from '@cornerstonejs/tools';

const MPR_TOOLGROUP_ID = 'mpr';

const cachedState = {
  protocol: null,
  stage: null,
  viewportMatchDetails: null,
  viewportStructure: null,
};

window.cachedState = cachedState;

const setCachedState = (
  protocol,
  stage,
  viewportMatchDetails,
  viewportStructure
) => {
  cachedState.protocol = protocol;
  cachedState.stage = stage;
  cachedState.viewportMatchDetails = viewportMatchDetails;
  cachedState.viewportStructure = viewportStructure;
};

const resetCachedState = () => {
  cachedState.protocol = null;
  cachedState.stage = null;
  cachedState.viewportMatchDetails = null;
  cachedState.viewportStructure = null;
};

export default function toggleMPRHangingProtocol({
  toggledState,
  getToolGroup,
  servicesManager,
}) {
  const {
    UINotificationService,
    HangingProtocolService,
    ViewportGridService,
  } = servicesManager.services;

  const {
    activeViewportIndex,
    viewports,
    numRows,
    numCols,
  } = ViewportGridService.getState();
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

  // What is the current active protocol and stage number to restore later
  const { protocol, stage } = HangingProtocolService.getActiveProtocol();

  if (toggledState) {
    resetCachedState();

    const { viewportMatchDetails, viewportStructure } = getGoodStuff({
      protocol,
      stage,
      viewports,
      servicesManager,
    });

    setCachedState(protocol, stage, viewportMatchDetails, viewportStructure);

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

  const restoreErrorCallback = error => {
    UINotificationService.show({
      title: 'Multiplanar reconstruction (MPR) ',
      message:
        'Something went wrong while trying to restore the previous layout.',
      type: 'info',
      duration: 3000,
    });
  };

  const { layoutType, properties } = cachedState.viewportStructure;
  const { viewportMatchDetails } = cachedState;

  if (cachedState.protocol.id !== 'default') {
    HangingProtocolService.setProtocol(
      cachedState.protocol.id,
      viewportMatchDetails,
      restoreErrorCallback
    );

    return;
  }

  HangingProtocolService.setProtocol(
    'default',
    viewportMatchDetails,
    restoreErrorCallback
  );

  if (numRows !== properties.rows || numCols !== properties.columns) {
    ViewportGridService.setLayout({
      numRows: properties.rows,
      numCols: properties.columns,
      layoutType,
      layoutOptions: properties.layoutOptions,
    });
  }

  const numViewports =
    properties.layoutOptions.length || properties.rows * properties.columns;

  // loop inside viewportMatchDetails map
  // and set the viewportOptions for each viewport
  [...Array(numViewports).keys()].forEach(viewportIndex => {
    const viewportMatchDetailsForViewport = viewportMatchDetails.get(
      viewportIndex
    );

    if (viewportMatchDetailsForViewport) {
      const {
        viewportOptions,
        displaySetsInfo,
      } = viewportMatchDetailsForViewport;
      ViewportGridService.setDisplaySetsForViewport({
        viewportIndex,
        displaySetInstanceUIDs: displaySetsInfo.map(
          displaySetInfo => displaySetInfo.displaySetInstanceUID
        ),
        viewportOptions,
      });
    } else {
      ViewportGridService.setDisplaySetsForViewport({
        viewportIndex,
        displaySetInstanceUIDs: [],
        viewportOptions: {},
      });
    }
  });

  // const { primaryToolId } = ToolBarService.state;
  // const mprToolGroup = getToolGroup(MPR_TOOLGROUP_ID);
  // // turn off crosshairs if it is on
  // if (
  //   primaryToolId === 'Crosshairs' ||
  //   mprToolGroup.getToolInstance('Crosshairs')?.mode === Enums.ToolModes.Active
  // ) {
  //   const toolGroup = getToolGroup(MPR_TOOLGROUP_ID);
  //   toolGroup.setToolDisabled('Crosshairs');
  //   ToolBarService.recordInteraction({
  //     groupId: 'WindowLevel',
  //     itemId: 'WindowLevel',
  //     interactionType: 'tool',
  //     commands: [
  //       {
  //         commandName: 'setToolActive',
  //         commandOptions: {
  //           toolName: 'WindowLevel',
  //         },
  //         context: 'CORNERSTONE',
  //       },
  //     ],
  //   });
  // }

  // // clear segmentations if they exist
  // removeToolGroupSegmentationRepresentations(MPR_TOOLGROUP_ID);
}

function getGoodStuff({ protocol, stage, viewports, servicesManager }) {
  // here we need to use the viewports and try to map it into the
  // viewportMatchDetails and displaySetMatch that HangingProtocolService
  // expects
  const {
    ViewportGridService,
    HangingProtocolService,
  } = servicesManager.services;

  const { numRows, numCols } = ViewportGridService.getState();

  let viewportMatchDetails = new Map();

  const viewportStructure = {
    layoutType: 'grid',
    properties: {
      rows: numRows,
      columns: numCols,
      layoutOptions: [],
    },
  };

  viewports.forEach((viewport, viewportIndex) => {
    viewportStructure.properties.layoutOptions.push({
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height,
    });
  });

  if (protocol.id === 'default') {
    viewports.forEach((viewport, viewportIndex) => {
      if (viewport.displaySetInstanceUIDs) {
        viewportMatchDetails.set(viewportIndex, {
          displaySetsInfo: viewport.displaySetInstanceUIDs.map(
            displaySetInstanceUID => {
              return { displaySetInstanceUID };
            }
          ),
          viewportOptions: viewport.viewportOptions,
        });
      }
    });
  } else {
    ({ viewportMatchDetails } = HangingProtocolService.getMatchDetails());
  }

  return { viewportMatchDetails, viewportStructure };
}
