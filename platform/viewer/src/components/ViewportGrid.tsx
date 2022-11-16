import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane, useViewportGrid } from '@ohif/ui';
import { utils } from '@ohif/core';
import EmptyViewport from './EmptyViewport';
import classNames from 'classnames';

const { isEqualWithin } = utils;

const ORIENTATION_MAP = {
  axial: {
    viewPlaneNormal: [0, 0, -1],
    viewUp: [0, -1, 0],
  },
  sagittal: {
    viewPlaneNormal: [1, 0, 0],
    viewUp: [0, 0, 1],
  },
  coronal: {
    viewPlaneNormal: [0, 1, 0],
    viewUp: [0, 0, 1],
  },
};

function ViewerViewportGrid(props) {
  const { servicesManager, viewportComponents, dataSource } = props;
  const [viewportGrid, viewportGridService] = useViewportGrid();

  const { numCols, numRows, activeViewportIndex, viewports } = viewportGrid;

  // TODO -> Need some way of selecting which displaySets hit the viewports.
  const {
    DisplaySetService,
    MeasurementService,
    HangingProtocolService,
    UINotificationService,
  } = servicesManager.services;

  /**
   * This callback runs only after displaySets have changed (created and added or modified)
   */
  const updateDisplaySetsForViewports = useCallback(
    availableDisplaySets => {
      if (!availableDisplaySets.length) {
        return;
      }

      const {
        viewportMatchDetails,
        hpAlreadyApplied,
      } = HangingProtocolService.getMatchDetails();

      if (!viewportMatchDetails.size) {
        return;
      }

      // Match each viewport individually
      const numViewports = viewportGrid.numRows * viewportGrid.numCols;
      for (
        let viewportIndex = 0;
        viewportIndex < numViewports;
        viewportIndex++
      ) {
        if (hpAlreadyApplied.get(viewportIndex)) {
          continue;
        }

        // if current viewport doesn't have a match
        if (viewportMatchDetails.get(viewportIndex) === undefined) {
          return;
        }

        const { displaySetsInfo, viewportOptions } = viewportMatchDetails.get(
          viewportIndex
        );

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

        viewportGridService.setDisplaySetsForViewport({
          viewportIndex: viewportIndex,
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
          // The following will set the viewportsDisplaySetsMatched state

          const suppressEvent = true;
          const applied = true;
          HangingProtocolService.setHangingProtocolAppliedForViewport(
            viewportIndex,
            applied,
            suppressEvent
          );
        }
      }
    },
    [viewportGrid, numRows, numCols]
  );

  const _getUpdatedViewports = useCallback(
    (viewportIndex, displaySetInstanceUID) => {
      let updatedViewports = [];
      try {
        updatedViewports = HangingProtocolService.getViewportsRequireUpdate(
          viewportIndex,
          displaySetInstanceUID
        );
      } catch (error) {
        console.warn(error);
        UINotificationService.show({
          title: 'Drag and Drop',
          message:
            'The selected display sets could not be added to the viewport due to a mismatch in the Hanging Protocol rules.',
          type: 'info',
          duration: 3000,
        });
      }

      return updatedViewports;
    },
    [HangingProtocolService, UINotificationService]
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
  }, []);

  // Using Hanging protocol engine to match the displaySets
  useEffect(() => {
    const { unsubscribe } = HangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      () => {
        const displaySets = DisplaySetService.getActiveDisplaySets();
        updateDisplaySetsForViewports(displaySets);
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
        const {
          displaySetInstanceUID: referencedDisplaySetInstanceUID,
          metadata: { viewPlaneNormal },
        } = measurement;

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

        const updatedViewports = _getUpdatedViewports(
          viewportIndex,
          referencedDisplaySetInstanceUID
        );

        if (!updatedViewports || !updatedViewports.length) {
          return;
        }

        updatedViewports.forEach(vp => {
          const { orientation, viewportType } = vp.viewportOptions;
          let initialImageOptions;

          // For initial imageIndex to hang be careful for the volume viewport
          if (viewportType === 'stack') {
            initialImageOptions = {
              index: imageIndex,
            };
          } else if (viewportType === 'volume') {
            // For the volume viewports, be careful to not jump in the viewports
            // that are not in the same orientation.
            // Todo: this doesn't work for viewports that have custom orientation
            // vectors specified
            if (
              orientation &&
              viewPlaneNormal &&
              isEqualWithin(
                ORIENTATION_MAP[orientation]?.viewPlaneNormal,
                viewPlaneNormal
              )
            ) {
              initialImageOptions = {
                index: imageIndex,
              };
            }
          }

          vp.viewportOptions['initialImageOptions'] = initialImageOptions;
        });

        viewportGridService.setDisplaySetsForViewports(updatedViewports);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewports]);

  /**
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
    const updatedViewports = _getUpdatedViewports(
      viewportIndex,
      displaySetInstanceUID
    );
    viewportGridService.setDisplaySetsForViewports(updatedViewports);
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
        viewportComponents,
        UINotificationService
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

function _getViewportComponent(
  displaySets,
  viewportComponents,
  UINotificationService
) {
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
    if (
      viewportComponents[i].displaySetsToDisplay.includes(SOPClassHandlerId)
    ) {
      const { component } = viewportComponents[i];
      return component;
    }
  }

  UINotificationService.show({
    title: 'Viewport Not Supported Yet',
    message: `Cannot display SOPClassId of ${displaySets[0].SOPClassUID} yet`,
    type: 'error',
  });

  return EmptyViewport;
}

export default ViewerViewportGrid;
