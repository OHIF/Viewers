import { useViewportsByPositionStore } from './stores/useViewportsByPositionStore';

/**
 * This find or create viewport is paired with the reduce results from
 * below, and the action of this viewport is to look for previously filled
 * viewports, and to reuse by position id.  If there is no filled viewport,
 * then one can be re-used from the display set if it isn't going to be displayed.
 * @param hangingProtocolService - bound parameter supplied before using this
 * @param viewportsByPosition - bound parameter supplied before using this
 * @param position - the position in the grid to retrieve
 * @param positionId - the current position on screen to retrieve
 * @param options - the set of options used, so that subsequent calls can
 *                  store state that is reset by the setLayout.
 *                  This class uses the options to store the already viewed
 *                  display sets, filling it initially with the pre-existing viewports.
 */
export const findOrCreateViewport = (
  hangingProtocolService,
  isHangingProtocolLayout,
  viewportsByPosition,
  position: number,
  positionId: string,
  options: Record<string, unknown>
) => {
  const byPositionViewport = viewportsByPosition?.[positionId];
  if (byPositionViewport) {
    return { ...byPositionViewport };
  }
  const { protocolId, stageIndex } = hangingProtocolService.getState();

  // Setup the initial in display correctly for initial view/select
  if (!options.inDisplay) {
    options.inDisplay = [...viewportsByPosition.initialInDisplay];
  }

  // See if there is a default viewport for new views
  const missing = hangingProtocolService.getMissingViewport(
    isHangingProtocolLayout ? protocolId : 'default',
    stageIndex,
    options
  );
  if (missing) {
    const displaySetInstanceUIDs = missing.displaySetsInfo.map(it => it.displaySetInstanceUID);
    options.inDisplay.push(...displaySetInstanceUIDs);
    return {
      displaySetInstanceUIDs,
      displaySetOptions: missing.displaySetsInfo.map(it => it.displaySetOptions),
      viewportOptions: {
        ...missing.viewportOptions,
      },
    };
  }

  // and lastly if there is no default viewport, then we see if we can grab the
  // viewportsByPosition at the position index and use that
  // const candidate = Object.values(viewportsByPosition)[position];

  // // if it has something to display, then we can use it
  // return candidate?.displaySetInstanceUIDs ? candidate : {};
  return {};
};

/**
 * Records the information on what viewports are displayed in which position.
 * Also records what instances from the existing positions are going to be in
 * view initially.
 * @param state is the viewport grid state
 * @param syncService is the state sync service to use for getting existing state
 * @returns Set of states that can be applied to the state sync to remember
 *   the current view state.
 */
const findViewportsByPosition = (state, { numRows, numCols }) => {
  const { viewports } = state;
  const { setViewportsByPosition, addInitialInDisplay } = useViewportsByPositionStore.getState();
  const initialInDisplay = [];

  const viewportsByPosition = {};
  viewports.forEach(viewport => {
    if (viewport.positionId) {
      const storedViewport = {
        ...viewport,
        viewportOptions: { ...viewport.viewportOptions },
      };
      viewportsByPosition[viewport.positionId] = storedViewport;
      setViewportsByPosition(viewport.positionId, storedViewport);
    }
  });

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const positionId = `${col}-${row}`;
      const viewport = viewportsByPosition[positionId];
      if (viewport?.displaySetInstanceUIDs) {
        initialInDisplay.push(...viewport.displaySetInstanceUIDs);
      }
    }
  }

  initialInDisplay.forEach(displaySetInstanceUID => addInitialInDisplay(displaySetInstanceUID));
};

export default findViewportsByPosition;
