import { Enums } from '@cornerstonejs/tools';
import removeToolGroupSegmentationRepresentations from '../removeToolGroupSegmentationRepresentations';

const MPR_TOOLGROUP_ID = 'mpr';

const cachedState = {
  protocol: null,
  stage: null,
  viewportMatchDetails: null,
  viewportStructure: null,
  toolOptions: null,
};

const setCachedState = (
  protocol,
  stage,
  viewportMatchDetails,
  viewportStructure,
  toolOptions
) => {
  cachedState.protocol = protocol;
  cachedState.stage = stage;
  cachedState.viewportMatchDetails = viewportMatchDetails;
  cachedState.viewportStructure = viewportStructure;
  cachedState.toolOptions = JSON.parse(JSON.stringify(toolOptions));
};

const resetCachedState = () => {
  cachedState.protocol = null;
  cachedState.stage = null;
  cachedState.viewportMatchDetails = null;
  cachedState.viewportStructure = null;
  cachedState.toolOptions = null;
};

export default function toggleMPRHangingProtocol({
  toggledState,
  servicesManager,
  getToolGroup,
}) {
  const {
    uiNotificationService,
    hangingProtocolService,
    viewportGridService,
    toolbarService,
  } = servicesManager.services;

  // TODO Introduce a service to persist the state of the current hanging protocol/app.
  // So all of the code to persist the state here will no longer be needed. Perhaps
  // just the id of the current hanging protocol to toggle MPR off is needed.

  const {
    activeViewportIndex,
    viewports,
    numRows,
    numCols,
  } = viewportGridService.getState();
  const viewportDisplaySetInstanceUIDs =
    viewports[activeViewportIndex].displaySetInstanceUIDs;

  // What is the current active protocol and stage number to restore later
  const { protocol, stageIndex } = hangingProtocolService.getActiveProtocol();

  const restoreErrorCallback = error => {
    console.error(error);
    uiNotificationService.show({
      title: 'Multiplanar reconstruction (MPR) ',
      message:
        'Something went wrong while trying to restore the previous layout.',
      type: 'info',
      duration: 3000,
    });
  };

  if (toggledState) {
    resetCachedState();

    const {
      viewportMatchDetails,
      viewportStructure,
      toolOptions,
    } = _getViewportsInfo({
      protocol,
      stageIndex,
      viewports,
      servicesManager,
    });

    setCachedState(
      protocol,
      stageIndex,
      viewportMatchDetails,
      viewportStructure,
      toolOptions
    );

    const matchDetails = {
      displaySetInstanceUIDs: viewportDisplaySetInstanceUIDs,
    };

    _disableCrosshairs(
      toolOptions.map(({ toolGroupId }) => toolGroupId),
      getToolGroup
    );

    const errorCallback = error => {
      // Unable to create MPR, so be sure to return to the cached/original protocol.
      hangingProtocolService.setProtocol(
        cachedState.protocol.id,
        viewportMatchDetails,
        restoreErrorCallback
      );

      uiNotificationService.show({
        title: 'Multiplanar reconstruction (MPR) ',
        message:
          'Cannot create MPR for this DisplaySet since it is not reconstructable.',
        type: 'info',
        duration: 3000,
      });
    };

    hangingProtocolService.setProtocol(
      MPR_TOOLGROUP_ID,
      matchDetails,
      errorCallback
    );
    return;
  }

  _disableCrosshairs([MPR_TOOLGROUP_ID], getToolGroup);

  const { layoutType, properties } = cachedState.viewportStructure;
  const { viewportMatchDetails } = cachedState;

  // The reason we split the flow here is that we don't allow viewport grid
  // change in the non default hanging protocol, so we can just apply the
  // cached protocol and stage. However, for the default protocol, we need
  // to also apply the layout type and properties.
  if (cachedState.protocol.id !== 'default') {
    hangingProtocolService.setProtocol(
      cachedState.protocol.id,
      viewportMatchDetails,
      restoreErrorCallback
    );

    return;
  }

  hangingProtocolService.setProtocol(
    'default',
    viewportMatchDetails,
    restoreErrorCallback
  );

  if (numRows !== properties.rows || numCols !== properties.columns) {
    viewportGridService.setLayout({
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
      viewportGridService.setDisplaySetsForViewport({
        viewportIndex,
        displaySetInstanceUIDs: displaySetsInfo.map(
          displaySetInfo => displaySetInfo.displaySetInstanceUID
        ),
        viewportOptions,
      });
    } else {
      viewportGridService.setDisplaySetsForViewport({
        viewportIndex,
        displaySetInstanceUIDs: [],
        viewportOptions: {},
      });
    }
  });

  toolbarService.recordInteraction({
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

  //clear segmentations if they exist
  removeToolGroupSegmentationRepresentations(MPR_TOOLGROUP_ID);
}

function _disableCrosshairs(toolGroupIds, getToolGroup) {
  toolGroupIds.forEach(toolGroupId => {
    const toolGroup = getToolGroup(toolGroupId);
    if (
      toolGroup.getToolInstance('Crosshairs')?.mode === Enums.ToolModes.Active
    ) {
      toolGroup.setToolDisabled('Crosshairs');
    }
  });
}

function _getViewportsInfo({ protocol, stage, viewports, servicesManager }) {
  // here we need to use the viewports and try to map it into the
  // viewportMatchDetails and displaySetMatch that hangingProtocolService
  // expects
  const {
    viewportGridService,
    hangingProtocolService,
    toolGroupService,
  } = servicesManager.services;

  const { numRows, numCols } = viewportGridService.getState();

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
    ({ viewportMatchDetails } = hangingProtocolService.getMatchDetails());
  }

  // get the toolGroup state for viewports
  let toolOptions = [];
  const viewportIds = viewports
    .map(
      viewport =>
        viewport.displaySetInstanceUIDs &&
        viewport.displaySetInstanceUIDs.length > 0 &&
        viewport.viewportOptions?.viewportId
    )
    .filter(Boolean);

  if (viewportIds.length) {
    toolOptions = viewportIds
      .map(viewportId => {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
        return toolGroup
          ? {
              toolGroupId: toolGroup.id,
              toolOptions: toolGroup.toolOptions,
            }
          : null;
      })
      .filter(Boolean);
  }

  return { viewportMatchDetails, viewportStructure, toolOptions };
}
