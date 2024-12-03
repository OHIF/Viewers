import React, { useEffect, useCallback, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { Types, MeasurementService } from '@ohif/core';
import { ViewportGrid, ViewportPane, useViewportGrid } from '@ohif/ui';
import EmptyViewport from './EmptyViewport';
import classNames from 'classnames';
import { useAppConfig } from '@state';

function ViewerViewportGrid(props: withAppTypes) {
  const { servicesManager, viewportComponents = [], dataSource } = props;
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [appConfig] = useAppConfig();

  const { layout, activeViewportId, viewports, isHangingProtocolLayout } = viewportGrid;
  const { numCols, numRows } = layout;
  const { ref: resizeRef } = useResizeDetector({
    refreshMode: 'debounce',
    refreshRate: 7,
    refreshOptions: { leading: true },
    onResize: () => {
      viewportGridService.setViewportGridSizeChanged();
    },
  });
  const layoutHash = useRef(null);

  const { displaySetService, measurementService, hangingProtocolService, uiNotificationService } =
    servicesManager.services;

  const generateLayoutHash = () => `${numCols}-${numRows}`;

  /**
   * This callback runs after the viewports structure has changed in any way.
   * On initial display, that means if it has changed by applying a HangingProtocol,
   * while subsequently it may mean by changing the stage or by manually adjusting
   * the layout.

   */
  const updateDisplaySetsFromProtocol = (
    protocol: Types.HangingProtocol.Protocol,
    stage,
    activeStudyUID,
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
    [hangingProtocolService, uiNotificationService, isHangingProtocolLayout]
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

  // Check viewport readiness in useEffect
  useEffect(() => {
    const allReady = viewportGridService.getGridViewportsReady();
    const sameLayoutHash = layoutHash.current === generateLayoutHash();
    if (allReady && !sameLayoutHash) {
      layoutHash.current = generateLayoutHash();
      viewportGridService.publishViewportsReady();
    }
  }, [viewportGridService, generateLayoutHash]);

  useEffect(() => {
    const { unsubscribe } = measurementService.subscribe(
      MeasurementService.EVENTS.JUMP_TO_MEASUREMENT_LAYOUT,
      ({ viewportId, measurement, isConsumed }) => {
        if (isConsumed) {
          return;
        }
        // This occurs when no viewport has elected to consume the event
        // so we need to change layouts into a layout which can consume
        // the event.
        const { displaySetInstanceUID: referencedDisplaySetInstanceUID } = measurement;

        const updatedViewports = _getUpdatedViewports(viewportId, referencedDisplaySetInstanceUID);
        if (!updatedViewports[0]) {
          console.warn(
            'ViewportGrid::Unable to navigate to viewport containing',
            referencedDisplaySetInstanceUID
          );
          return;
        }

        // Arbitrarily assign the viewport to element 0
        // TODO - this should perform a search to find the most suitable viewport.
        updatedViewports[0] = { ...updatedViewports[0] };
        const [viewport] = updatedViewports;

        // Copy the viewport options to prevent modifying the internal data
        viewport.viewportOptions = {
          ...viewport.viewportOptions,
          orientation: 'acquisition',
          // The preferred way to jump to the measurement view is to set the
          // view reference, as this can hold information such as the orientation
          // or zoom level required to display an annotation.  The metadata attribute
          // of the measurement is a viewReference, so use it to show the measurement.
          // Longer term this should clear the view reference data
          viewReference: measurement.metadata,
          viewportType: measurement.metadata.volumeId ? 'volume' : null,
        };

        viewportGridService.setDisplaySetsForViewports(updatedViewports);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewports]);

  const onDropHandler = (viewportId, { displaySetInstanceUID }) => {
    const updatedViewports = _getUpdatedViewports(viewportId, displaySetInstanceUID);
    viewportGridService.setDisplaySetsForViewports(updatedViewports);
  };

  const getViewportPanes = useCallback(() => {
    const viewportPanes = [];

    const numViewportPanes = viewportGridService.getNumViewportPanes();
    for (let i = 0; i < numViewportPanes; i++) {
      const paneMetadata = Array.from(viewports.values())[i] || {};
      const {
        displaySetInstanceUIDs,
        viewportOptions,
        displaySetOptions, // array of options for each display set in the viewport
        x: viewportX,
        y: viewportY,
        width: viewportWidth,
        height: viewportHeight,
        viewportLabel,
      } = paneMetadata;

      const viewportId = viewportOptions.viewportId;
      const isActive = activeViewportId === viewportId;

      const displaySetInstanceUIDsToUse = displaySetInstanceUIDs || [];

      // This is causing the viewport components re-render when the activeViewportId changes
      const displaySets = displaySetInstanceUIDsToUse
        .map(displaySetInstanceUID => {
          return displaySetService.getDisplaySetByUID(displaySetInstanceUID) || {};
        })
        .filter(displaySet => {
          return !displaySet?.unsupported;
        });

      const ViewportComponent = _getViewportComponent(
        displaySets,
        viewportComponents,
        uiNotificationService
      );

      // look inside displaySets to see if they need reRendering
      const displaySetsNeedsRerendering = displaySets.some(displaySet => {
        return displaySet.needsRerendering;
      });

      const onInteractionHandler = event => {
        if (isActive) {
          return;
        }

        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        viewportGridService.setActiveViewportId(viewportId);
      };

      viewportPanes[i] = (
        <ViewportPane
          // Note: It is highly important that the key is the viewportId here,
          // since it is used to determine if the component should be re-rendered
          // by React, and also in the hanging protocol and stage changes if the
          // same viewportId is used, React, by default, will only move (not re-render)
          // those components. For instance, if we have a 2x3 layout, and we move
          // from 2x3 to 1x1 (second viewport), if the key is the viewportIndex,
          // React will RE-RENDER the resulting viewport as the key will be different.
          // however, if the key is the viewportId, React will only move the component
          // and not re-render it.
          key={viewportId}
          acceptDropsFor="displayset"
          onDrop={onDropHandler.bind(null, viewportId)}
          onInteraction={onInteractionHandler}
          customStyle={{
            position: 'absolute',
            top: viewportY * 100 + 0.2 + '%',
            left: viewportX * 100 + 0.2 + '%',
            width: viewportWidth * 100 - 0.3 + '%',
            height: viewportHeight * 100 - 0.3 + '%',
          }}
          isActive={isActive}
        >
          <div
            data-cy="viewport-pane"
            className={classNames('flex h-full w-full min-w-[5px] flex-col', {
              'pointer-events-none':
                !isActive && (appConfig?.activateViewportBeforeInteraction ?? true),
            })}
          >
            <ViewportComponent
              displaySets={displaySets}
              viewportLabel={viewports.size > 1 ? viewportLabel : ''}
              viewportId={viewportId}
              dataSource={dataSource}
              viewportOptions={viewportOptions}
              displaySetOptions={displaySetOptions}
              needsRerendering={displaySetsNeedsRerendering}
              isHangingProtocolLayout={isHangingProtocolLayout}
              onElementEnabled={() => {
                viewportGridService.setViewportIsReady(viewportId, true);
              }}
            />
          </div>
        </ViewportPane>
      );
    }

    return viewportPanes;
  }, [viewports, activeViewportId, viewportComponents, dataSource]);

  /**
   * Loading indicator until numCols and numRows are gotten from the HangingProtocolService
   */
  if (!numRows || !numCols) {
    return null;
  }

  return (
    <div
      ref={resizeRef}
      className="h-full w-full"
    >
      <ViewportGrid
        numRows={numRows}
        numCols={numCols}
      >
        {getViewportPanes()}
      </ViewportGrid>
    </div>
  );
}

function _getViewportComponent(displaySets, viewportComponents, uiNotificationService) {
  if (!displaySets || !displaySets.length) {
    return EmptyViewport;
  }

  // Todo: Do we have a viewport that has two different SOPClassHandlerIds?
  const SOPClassHandlerId = displaySets[0].SOPClassHandlerId;

  for (let i = 0; i < viewportComponents.length; i++) {
    if (!viewportComponents[i]) {
      throw new Error('viewport components not defined');
    }
    if (!viewportComponents[i].displaySetsToDisplay) {
      throw new Error('displaySetsToDisplay is null');
    }
    if (viewportComponents[i].displaySetsToDisplay.includes(SOPClassHandlerId)) {
      const { component } = viewportComponents[i];
      return component;
    }
  }

  console.log("Can't show displaySet", SOPClassHandlerId, displaySets[0]);
  uiNotificationService.show({
    title: 'Viewport Not Supported Yet',
    message: `Cannot display SOPClassUID of ${displaySets[0].SOPClassUID} yet`,
    type: 'error',
  });

  return EmptyViewport;
}

export default ViewerViewportGrid;
