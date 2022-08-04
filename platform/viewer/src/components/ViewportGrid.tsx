import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane, useViewportGrid } from '@ohif/ui';
import EmptyViewport from './EmptyViewport';
import classNames from 'classnames';

function ViewerViewportGrid(props) {
  const { servicesManager, viewportComponents, dataSource } = props;
  const [viewportGrid, viewportGridService] = useViewportGrid();

  const { numCols, numRows, activeViewportIndex, viewports } = viewportGrid;

  // TODO -> Need some way of selecting which displaySets hit the viewports.
  const {
    DisplaySetService,
    MeasurementService,
    HangingProtocolService,
  } = servicesManager.services;

  /**
   * This callback runs only after displaySets have changed (created and added or modified)
   */
  const updateDisplaySetsForViewports = useCallback(
    availableDisplaySets => {
      if (!availableDisplaySets.length) {
        return;
      }

      const [
        matchDetails,
        hpAlreadyApplied,
      ] = HangingProtocolService.getState();

      if (!matchDetails.length) {
        return;
      }

      // Match each viewport individually
      const numViewports = viewportGrid.numRows * viewportGrid.numCols;
      for (let i = 0; i < numViewports; i++) {
        if (hpAlreadyApplied[i] === true) {
          continue;
        }

        // if current viewport doesn't have a match
        if (matchDetails[i] === undefined) {
          return;
        }

        const { displaySetsInfo, viewportOptions } = matchDetails[i];

        const displaySetUIDsToHang = [];
        const displaySetUIDsToHangOptions = [];
        displaySetsInfo.forEach(
          ({ displaySetInstanceUID, displaySetOptions }) => {
            if (!displaySetInstanceUID) {
              return;
            }

            displaySetUIDsToHang.push(displaySetInstanceUID);
            displaySetUIDsToHangOptions.push(displaySetOptions);
          }
        );

        if (!displaySetUIDsToHang.length) {
          continue;
        }

        viewportGridService.setDisplaySetsForViewport({
          viewportIndex: i,
          displaySetInstanceUIDs: displaySetUIDsToHang,
          viewportOptions,
          displaySetOptions: displaySetUIDsToHangOptions,
        });

        // During setting displaySets for viewport, we need to update the hanging protocol
        // but some viewports contain more than one display set (fusion), and their displaySet
        // will not be available at the time of setting displaySets for viewport. So we need to
        // update the hanging protocol after making sure all the matched display sets are available
        // and set on the viewport
        if (displaySetUIDsToHang.length === displaySetsInfo.length) {
          // The following will set the hpAlreadyApplied state
          HangingProtocolService.setHangingProtocolAppliedForViewport(i);
        }
      }
    },
    [viewportGrid, numRows, numCols]
  );

  useEffect(() => {
    const displaySets = DisplaySetService.getActiveDisplaySets();
    updateDisplaySetsForViewports(displaySets);
  }, [numRows, numCols]);

  // Layout change based on hanging protocols
  useEffect(() => {
    const { unsubscribe } = HangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.NEW_LAYOUT,
      ({ layoutType, numRows, numCols, layoutOptions }) => {
        viewportGridService.setLayout({
          numRows,
          numCols,
          layoutType,
          layoutOptions,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewports]);

  // Using Hanging protocol engine to match the displaySets
  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      activeDisplaySets => {
        updateDisplaySetsForViewports(activeDisplaySets);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewports]);

  useEffect(() => {
    const { unsubscribe } = MeasurementService.subscribe(
      MeasurementService.EVENTS.JUMP_TO_MEASUREMENT,
      ({ viewportIndex, measurement }) => {
        const referencedDisplaySetInstanceUID =
          measurement.displaySetInstanceUID;

        // if we already have the displaySet in one of the viewports
        // Todo: handle fusion display sets?
        for (const viewport of viewports) {
          const isMatch = viewport.displaySetInstanceUIDs.includes(
            referencedDisplaySetInstanceUID
          );
          if (isMatch) {
            return;
          }
        }

        const displaySet = DisplaySetService.getDisplaySetByUID(
          referencedDisplaySetInstanceUID
        );

        let imageIndex;
        // jump straight to the initial image index if we can
        if (displaySet.images && measurement.SOPInstanceUID) {
          imageIndex = displaySet.images.findIndex(
            image => image.SOPInstanceUID === measurement.SOPInstanceUID
          );
        }

        // If not in any of the viewports, hang it inside the active viewport
        viewportGridService.setDisplaySetsForViewport({
          viewportIndex,
          displaySetInstanceUIDs: [referencedDisplaySetInstanceUID],
          viewportOptions: {
            initialImageOptions: {
              index: imageIndex,
            },
          },
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewports]);

  /**
  //Changing the Hanging protocol while viewing
  useEffect(() => {
    const displaySets = DisplaySetService.getActiveDisplaySets();
    updateDisplaySetsForViewports(displaySets);
  }, [viewports]);


  // subscribe to displayset metadata changes
  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_METADATA_UPDATED,
      displaySets => {
        // Todo: properly refresh the viewportGrid to use the new displaySet
        // with the new metadata.
        setState({});
      }
    );
    return () => {
      unsubscribe();
    };
  }, [viewports]);

  const onDoubleClick = viewportIndex => {
    // TODO -> Disabled for now.
    // onNewImage on a cornerstone viewport is firing setDisplaySetsForViewport.
    // Which it really really shouldn't. We need a larger fix for jump to
    // measurements and all cornerstone "imageIndex" state to fix this.
    if (cachedLayout) {
      viewportGridService.set({
        numCols: cachedLayout.numCols,
        numRows: cachedLayout.numRows,
        activeViewportIndex: cachedLayout.activeViewportIndex,
        viewports: cachedLayout.viewports,
        cachedLayout: null,
      });

      return;
    }

    const cachedViewports = viewports.map(viewport => {
      return {
        displaySetInstanceUID: viewport.displaySetInstanceUID,
      };
    });

    viewportGridService.set({
      numCols: 1,
      numRows: 1,
      activeViewportIndex: 0,
      viewports: [
        {
          displaySetInstanceUID: viewports[viewportIndex].displaySetInstanceUID,
          imageIndex: undefined,
        },
      ],
      cachedLayout: {
        numCols,
        numRows,
        viewports: cachedViewports,
        activeViewportIndex: viewportIndex,
      },
    });
  };

  */

  const onDropHandler = (viewportIndex, { displaySetInstanceUID }) => {
    viewportGridService.setDisplaySetsForViewport({
      viewportIndex,
      displaySetInstanceUIDs: [displaySetInstanceUID],
    });
  };

  const getViewportPanes = useCallback(() => {
    const viewportPanes = [];

    for (let i = 0; i < viewports.length; i++) {
      const viewportIndex = i;
      const isActive = activeViewportIndex === viewportIndex;
      const paneMetadata = viewports[i] || {};
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

      const displaySetInstanceUIDsToUse = displaySetInstanceUIDs || [];

      // This is causing the viewport components re-render when the activeViewportIndex changes
      const displaySets = displaySetInstanceUIDsToUse.map(
        displaySetInstanceUID => {
          return (
            DisplaySetService.getDisplaySetByUID(displaySetInstanceUID) || {}
          );
        }
      );

      const ViewportComponent = _getViewportComponent(
        displaySets,
        viewportComponents
      );

      // look inside displaySets to see if they need reRendering
      const displaySetsNeedsRerendering = displaySets.some(displaySet => {
        return displaySet.needsRerendering;
      });

      const onInteractionHandler = event => {
        if (isActive) return;

        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        viewportGridService.setActiveViewportIndex(viewportIndex);
      };

      // TEMP -> Double click disabled for now
      // onDoubleClick={() => onDoubleClick(viewportIndex)}

      viewportPanes[i] = (
        <ViewportPane
          key={viewportIndex}
          acceptDropsFor="displayset"
          onDrop={onDropHandler.bind(null, viewportIndex)}
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
            className={classNames('h-full w-full flex flex-col', {
              'pointer-events-none': !isActive,
            })}
          >
            <ViewportComponent
              displaySets={displaySets}
              viewportIndex={viewportIndex}
              viewportLabel={viewports.length > 1 ? viewportLabel : ''}
              dataSource={dataSource}
              viewportOptions={viewportOptions}
              displaySetOptions={displaySetOptions}
              needsRerendering={displaySetsNeedsRerendering}
            />
          </div>
        </ViewportPane>
      );
    }

    return viewportPanes;
  }, [viewports, activeViewportIndex, viewportComponents, dataSource]);

  /**
   * Loading indicator until numCols and numRows are gotten from the HangingProtocolService
   */
  if (!numRows || !numCols) {
    return null;
  }

  return (
    <ViewportGrid numRows={numRows} numCols={numCols}>
      {/* {ViewportPanes} */}
      {getViewportPanes()}
    </ViewportGrid>
  );
}

ViewerViewportGrid.propTypes = {
  viewportComponents: PropTypes.array.isRequired,
};

ViewerViewportGrid.defaultProps = {
  viewportComponents: [],
};

function _getViewportComponent(displaySets, viewportComponents) {
  if (!displaySets || !displaySets.length) {
    return EmptyViewport;
  }

  // Todo: Do we have a viewport that has two different SOPClassHandlerIds?
  const SOPClassHandlerId = displaySets[0].SOPClassHandlerId;

  for (let i = 0; i < viewportComponents.length; i++) {
    if (!viewportComponents[i])
      throw new Error('viewport components not defined');
    if (!viewportComponents[i].displaySetsToDisplay) {
      throw new Error('displaySetsToDisplay is null');
    }
    if (
      viewportComponents[i].displaySetsToDisplay.includes(SOPClassHandlerId)
    ) {
      const { component } = viewportComponents[i];
      return component;
    }
  }
  throw new Error(`No display set handler for ${SOPClassHandlerId}`);
}

export default ViewerViewportGrid;
