/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane, useViewportGrid } from '@ohif/ui';
import EmptyViewport from './EmptyViewport';
import classNames from 'classnames';

function ViewerViewportGrid(props) {
  const { servicesManager, viewportComponents, dataSource } = props;
  const [viewportGrid, viewportGridService] = useViewportGrid();

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

  // This is a placeholder for applying hanging protocols
  // It probably shouldn't be done here
  // For now it just hangs the first display set in the study in 1x1
  // as sorted by SeriesNumber
  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      eventData => {
        const { displaySetsAdded } = eventData;

        const data = HangingProtocolService.getState();

        // TODO: Sometimes this is undefined?
        const { hpAlreadyApplied } = data;

        // Match each viewport individually
        const numViewports = numRows * numCols;
        for (let i = 0; i < numViewports; i++) {
          if (hpAlreadyApplied[i] === true) {
            return;
          }

          // Temporary until matching is ported back over from the Meteor version.
          const reqSeriesInstanceUID =
            data.hangingProtocol.stages[0].viewports[0].seriesMatchingRules[0]
              .constraint.equals.value;
          const matchingDisplaySet = displaySetsAdded.find(ds => {
            return ds.SeriesInstanceUID === reqSeriesInstanceUID;
          });

          if (!matchingDisplaySet) {
            return;
          }

          viewportGridService.setDisplaysetForViewport({
            viewportIndex: i,
            displaySetInstanceUID: matchingDisplaySet.displaySetInstanceUID,
          });

          HangingProtocolService.setHangingProtocolAppliedForViewport(i);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const { unsubscribe } = MeasurementService.subscribe(
      MeasurementService.EVENTS.JUMP_TO_MEASUREMENT,
      ({ viewportIndex, measurement }) => {
        const referencedDisplaySetInstanceUID =
          measurement.displaySetInstanceUID;

        // If the viewport does not contain the displaySet, then hang that displaySet.
        if (
          viewports[viewportIndex].displaySetInstanceUID !==
          referencedDisplaySetInstanceUID
        ) {
          viewportGridService.setDisplaysetForViewport({
            viewportIndex,
            displaySetInstanceUID: referencedDisplaySetInstanceUID,
          });
        }
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

  // const ViewportPanes = React.useMemo(getViewportPanes, [
  //   viewportComponents,
  //   activeViewportIndex,
  //   viewportGrid,
  // ]);

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
