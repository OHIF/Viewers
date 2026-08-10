import React, { useEffect, useCallback, useMemo } from 'react';
import { Types } from '@ohif/core';
import { ViewportGrid, ViewportPane, useViewportGrid, gridSelectors } from '@ohif/ui-next';
import ViewportHost from './ViewportHost';
import { useAppConfig } from '@state';

const { selectLayout, selectIsActive } = gridSelectors;

function ViewerViewportGrid(props: withAppTypes) {
  const { servicesManager, viewportComponents = [], dataSource, commandsManager } = props;
  const layout = useViewportGrid(selectLayout);
  const [appConfig] = useAppConfig();

  const { numCols, numRows } = layout;

  const {
    displaySetService,
    hangingProtocolService,
    uiNotificationService,
    customizationService,
    viewportGridService,
  } = servicesManager.services;

  // Parity with the pre-store grid, which rendered one pane per unique
  // viewport entry (a Map keyed by viewportId) capped at the grid slot count:
  // duplicate viewportIds across positions collapse into one pane (last
  // geometry wins, so the keys below stay unique), and legacy set()-restored
  // states with more viewports than slots do not overflow the grid.
  const panes = useMemo(() => {
    const byViewportId = new Map();
    layout.panes.forEach(pane => byViewportId.set(pane.viewportId, pane));
    return Array.from(byViewportId.values()).slice(0, numRows * numCols);
  }, [layout, numRows, numCols]);

  /**
   * This callback runs after the viewports structure has changed in any way.
   * On initial display, that means if it has changed by applying a HangingProtocol,
   * while subsequently it may mean by changing the stage or by manually adjusting
   * the layout.

   */
  const updateDisplaySetsFromProtocol = (
    _protocol: Types.HangingProtocol.Protocol,
    stage,
    _activeStudyUID,
    viewportMatchDetails
  ) => {
    const availableDisplaySets = displaySetService.getActiveDisplaySets();

    if (!availableDisplaySets.length) {
      console.log('No available display sets', availableDisplaySets);
      return;
    }

    // Match each viewport individually
    const { layoutType } = stage.viewportStructure;
    const stageProps = stage.viewportStructure.properties;
    const { columns: numCols, rows: numRows, layoutOptions = [] } = stageProps;

    /**
     * This find or create viewport uses the hanging protocol results to
     * specify the viewport match details, which specifies the size and
     * setup of the various viewports.
     */
    const findOrCreateViewport = pos => {
      const viewportId = Array.from(viewportMatchDetails.keys())[pos];
      const details = viewportMatchDetails.get(viewportId);
      if (!details) {
        console.log('No match details for viewport', viewportId);
        return;
      }

      const { displaySetsInfo, viewportOptions } = details;
      const displaySetUIDsToHang = [];
      const displaySetUIDsToHangOptions = [];

      displaySetsInfo.forEach(({ displaySetInstanceUID, displaySetOptions }) => {
        if (displaySetInstanceUID) {
          displaySetUIDsToHang.push(displaySetInstanceUID);
        }

        displaySetUIDsToHangOptions.push(displaySetOptions);
      });

      const computedViewportOptions = hangingProtocolService.getComputedOptions(
        viewportOptions,
        displaySetUIDsToHang
      );

      const computedDisplaySetOptions = hangingProtocolService.getComputedOptions(
        displaySetUIDsToHangOptions,
        displaySetUIDsToHang
      );

      return {
        displaySetInstanceUIDs: displaySetUIDsToHang,
        displaySetOptions: computedDisplaySetOptions,
        viewportOptions: computedViewportOptions,
      };
    };

    viewportGridService.setLayout({
      numRows,
      numCols,
      layoutType,
      layoutOptions,
      findOrCreateViewport,
      isHangingProtocolLayout: true,
    });
  };

  const _getUpdatedViewports = useCallback(
    (viewportId, displaySetInstanceUID) => {
      if (!displaySetInstanceUID) {
        return [];
      }

      // Read at event time: this callback must see the grid state of the
      // moment the drop happens, not the state of the render that bound it.
      const { isHangingProtocolLayout } = viewportGridService.getState(); // event-time read

      let updatedViewports = [];
      try {
        updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
          viewportId,
          displaySetInstanceUID,
          isHangingProtocolLayout
        );
      } catch (error) {
        console.warn(error);
        uiNotificationService.show({
          title: 'Drag and Drop',
          message:
            'The selected display sets could not be added to the viewport due to a mismatch in the Hanging Protocol rules.',
          type: 'error',
          duration: 3000,
        });
      }

      return updatedViewports;
    },
    [hangingProtocolService, uiNotificationService, viewportGridService]
  );

  // Using Hanging protocol engine to match the displaySets
  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      hangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      ({ protocol, stage, activeStudyUID, viewportMatchDetails }) => {
        updateDisplaySetsFromProtocol(protocol, stage, activeStudyUID, viewportMatchDetails);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const onDropHandler = (viewportId, { displaySetInstanceUID }) => {
    const { viewportGridService } = servicesManager.services;
    const customOnDropHandler = customizationService.getCustomization('customOnDropHandler');
    const dropHandlerPromise = customOnDropHandler({
      ...props,
      viewportId,
      displaySetInstanceUID,
      appConfig,
    });
    dropHandlerPromise.then(({ handled }) => {
      if (!handled) {
        const updatedViewports = _getUpdatedViewports(viewportId, displaySetInstanceUID);

        commandsManager.run('setDisplaySetsForViewports', { viewportsToUpdate: updatedViewports });
      }
    });
    viewportGridService.publishViewportOnDropHandled({ displaySetInstanceUID });
  };

  /**
   * Loading indicator until numCols and numRows are gotten from the HangingProtocolService
   */
  if (!numRows || !numCols) {
    return null;
  }

  return (
    <div className="border-input h-[calc(100%-0.25rem)] w-full border">
      <ViewportGrid
        numRows={numRows}
        numCols={numCols}
      >
        {panes.map(pane => (
          <GridPane
            // Note: It is highly important that the key is the viewportId here,
            // since it is used to determine if the component should be re-rendered
            // by React, and also in the hanging protocol and stage changes if the
            // same viewportId is used, React, by default, will only move (not re-render)
            // those components. For instance, if we have a 2x3 layout, and we move
            // from 2x3 to 1x1 (second viewport), if the key is the viewportIndex,
            // React will RE-RENDER the resulting viewport as the key will be different.
            // however, if the key is the viewportId, React will only move the component
            // and not re-render it.
            key={pane.viewportId}
            pane={pane}
            servicesManager={servicesManager}
            dataSource={dataSource}
            commandsManager={commandsManager}
            viewportComponents={viewportComponents}
            onDropHandler={onDropHandler}
            activateViewportBeforeInteraction={
              appConfig?.activateViewportBeforeInteraction ?? true
            }
          />
        ))}
      </ViewportGrid>
    </div>
  );
}

/**
 * One grid pane: subscribes only to its own active-ness, so activating a
 * viewport re-renders exactly the affected pane chromes, never the hosts.
 */
function GridPane({
  pane,
  servicesManager,
  dataSource,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  commandsManager,
  viewportComponents,
  onDropHandler,
  activateViewportBeforeInteraction,
}) {
  const { viewportId } = pane;
  const isActive = useViewportGrid(selectIsActive(viewportId));
  const { viewportGridService } = servicesManager.services;

  const onInteractionHandler = event => {
    if (isActive) {
      return;
    }

    if (event && activateViewportBeforeInteraction) {
      event.preventDefault();
      event.stopPropagation();
    }

    viewportGridService.setActiveViewportId(viewportId);
  };

  const { x, y, width, height } = pane;
  const tolerance = 0.01;
  const customStyle: React.CSSProperties = {
    position: 'absolute',
    top: y * 100 + '%',
    left: x * 100 + '%',
    width: width * 100 + '%',
    height: height * 100 + '%',
  };

  if (x + width < 1 - tolerance) {
    customStyle.borderRight = '1px solid hsl(var(--input))';
  }

  if (y + height < 1 - tolerance) {
    customStyle.borderBottom = '1px solid hsl(var(--input))';
  }

  return (
    <ViewportPane
      acceptDropsFor="displayset"
      onDrop={onDropHandler.bind(null, viewportId)}
      onInteraction={onInteractionHandler}
      customStyle={customStyle}
      isActive={isActive}
    >
      <div
        data-cy="viewport-pane"
        data-is-active={isActive}
        className="flex h-full w-full min-w-[5px] flex-col"
      >
        <ViewportHost
          viewportId={viewportId}
          servicesManager={servicesManager}
          dataSource={dataSource}
          viewportComponents={viewportComponents}
        />
      </div>
    </ViewportPane>
  );
}

export default ViewerViewportGrid;
