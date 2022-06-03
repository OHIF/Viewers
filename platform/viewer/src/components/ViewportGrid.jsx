/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane, useViewportGrid } from '@ohif/ui';
import EmptyViewport from './EmptyViewport';
import classNames from 'classnames';

const getQueryParam = key => {
  const urlParams = new URLSearchParams(window.location.search);
  return Number(urlParams.get(key)) || 0;
};

function ViewerViewportGrid(props) {
  const { servicesManager, viewportComponents, dataSource } = props;
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [isParamViewLoaded, setIsParamViewLoaded] = useState(false);

  const {
    numCols,
    numRows,
    activeViewportIndex,
    viewports,
    cachedLayout,
  } = viewportGrid;

  // TODO -> Need some way of selecting which displaySets hit the viewports.
  const {
    DisplaySetService,
    MeasurementService,
    HangingProtocolService,
  } = servicesManager.services;

  const updateDisplaysetForViewports = useCallback(
    displaySets => {
      const [
        matchDetails,
        hpAlreadyApplied,
      ] = HangingProtocolService.getState();
      const numViewports = viewportGrid.numRows * viewportGrid.numCols;
      const seriesNumberParam = getQueryParam('series_number');

      if (!isParamViewLoaded && seriesNumberParam) {
        const initialDisplaySet = displaySets.find(ds => {
          return ds.SeriesNumber === seriesNumberParam;
        });

        initialDisplaySet &&
          viewportGridService.setDisplaysetForViewport({
            viewportIndex: 0,
            displaySetInstanceUID: initialDisplaySet.displaySetInstanceUID,
          });

        initialDisplaySet && setIsParamViewLoaded(true);
      } else {
        if (!matchDetails.length) return;

        // Match each viewport individually
        for (let i = 0; i < numViewports; i++) {
          if (hpAlreadyApplied[i] === true) {
            continue;
          }

          // if current viewport doesn't have a match
          if (matchDetails[i] === undefined) return;

          const { SeriesInstanceUID } = matchDetails[i];
          const matchingDisplaySet = displaySets.find(ds => {
            return ds.SeriesInstanceUID === SeriesInstanceUID;
          });

          if (!matchingDisplaySet) {
            continue;
          }

          viewportGridService.setDisplaysetForViewport({
            viewportIndex: i,
            displaySetInstanceUID: matchingDisplaySet.displaySetInstanceUID,
          });

          HangingProtocolService.setHangingProtocolAppliedForViewport(i);
        }
      }
    },
    [viewportGrid, numRows, numCols]
  );

  useEffect(() => {
    let displaySets = DisplaySetService.getActiveDisplaySets();
    displaySets = displaySets.filter(
      displaySet => displaySet.Modality !== 'SR'
    );

    if (!displaySets.length) return;

    let uidIndex = 0;
    const uids = displaySets.map(ds => ds.displaySetInstanceUID);

    viewportGrid.viewports.forEach((viewport, i) => {
      if (!viewport.displaySetInstanceUID) {
        viewportGridService.setDisplaysetForViewport({
          viewportIndex: i,
          displaySetInstanceUID: uids[uidIndex],
        });
        HangingProtocolService.setHangingProtocolAppliedForViewport(i);
        uidIndex = (uidIndex + 1) % uids.length;
      }
    });
  }, [numRows, numCols]);

  // Using Hanging protocol engine to match the displaySets
  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      eventData => {
        const { displaySetsAdded } = eventData;
        updateDisplaysetForViewports(displaySetsAdded);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportGrid]);

  // Layout change based on hanging protocols
  useEffect(() => {
    const { unsubscribe } = HangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.NEW_LAYOUT,
      ({ numRows, numCols }) => {
        viewportGridService.setLayout({ numRows, numCols });
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

        const viewportsDisplaySetInstanceUIDs = viewports.map(
          vp => vp.displaySetInstanceUID
        );

        // if we already have the displayset in one of the viewports
        if (
          viewportsDisplaySetInstanceUIDs.indexOf(
            referencedDisplaySetInstanceUID
          ) > -1
        ) {
          return;
        }

        // If not in any of the viewports, hang it inside the active viewport
        viewportGridService.setDisplaysetForViewport({
          viewportIndex,
          displaySetInstanceUID: referencedDisplaySetInstanceUID,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewports]);

  const onDoubleClick = viewportIndex => {
    // TODO -> Disabled for now.
    // onNewImage on a cornerstone viewport is firing setDisplaySetForViewport.
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

  const onDropHandler = (viewportIndex, { displaySetInstanceUID }) => {
    viewportGridService.setDisplaysetForViewport({
      viewportIndex,
      displaySetInstanceUID,
    });
  };

  const getViewportPanes = () => {
    const viewportPanes = [];
    const numViewportPanes = numCols * numRows;

    for (let i = 0; i < numViewportPanes; i++) {
      const viewportIndex = i;
      const isActive = activeViewportIndex === viewportIndex;
      const paneMetadata = viewports[i] || {};
      const { displaySetInstanceUID } = paneMetadata;

      const displaySet =
        DisplaySetService.getDisplaySetByUID(displaySetInstanceUID) || {};

      const ViewportComponent = _getViewportComponent(
        displaySet.SOPClassHandlerId,
        viewportComponents
      );

      const onInterationHandler = event => {
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
          className="m-1"
          acceptDropsFor="displayset"
          onDrop={onDropHandler.bind(null, viewportIndex)}
          onInteraction={onInterationHandler}
          isActive={isActive}
        >
          <div
            className={classNames('h-full w-full flex flex-col', {
              'pointer-events-none': !isActive,
            })}
          >
            <ViewportComponent
              displaySet={displaySet}
              viewportIndex={viewportIndex}
              dataSource={dataSource}
            />
          </div>
        </ViewportPane>
      );
    }

    return viewportPanes;
  };

  if (!numCols || !numCols) {
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

function _getViewportComponent(SOPClassHandlerId, viewportComponents) {
  if (!SOPClassHandlerId) {
    return EmptyViewport;
  }

  for (let i = 0; i < viewportComponents.length; i++) {
    if (
      viewportComponents[i].displaySetsToDisplay.includes(SOPClassHandlerId)
    ) {
      const { component } = viewportComponents[i];
      return component;
    }
  }
}

export default ViewerViewportGrid;
