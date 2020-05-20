/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane } from '@ohif/ui';
// import DefaultViewport from './DefaultViewport.js';
// import EmptyViewport from './EmptyViewport.js';

function ViewerViewportGrid(props) {
  const {
    activeViewportIndex,
    servicesManager,
    viewportComponents,
    dataSource,
  } = props;

  // TODO -> Need some way of selecting which displaySets hit the viewports.
  const { DisplaySetService } = servicesManager.services;

  // TODO -> Make a HangingProtocolService
  const HangingProtocolService = displaySets => {
    let displaySetInstanceUID;

    // Fallback
    if(!displaySets || !displaySets.length) {
      const displaySet = DisplaySetService.activeDisplaySets[0]
      displaySetInstanceUID = displaySet.displaySetInstanceUID;
    } else {
      const displaySet = displaySets[0];
      displaySetInstanceUID = displaySet.displaySetInstanceUID;
    }

    return {
      numRows: 1,
      numCols: 1,
      activeViewportIndex: 0,
      viewports: [
        {
          displaySetInstanceUID,
        },
      ],
    };
  };

  // From ViewportGridService and/or ContextProvider
  const [viewportGrid, setViewportGrid] = useState({
    numCols: 1,
    numRows: 1,
    viewports: []
  });


  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      displaySets => {
        setViewportGrid(HangingProtocolService(displaySets));
      },
    );

    return unsubscribe;
  }, []);

  // TODO: either need hover to change "active viewport"
  // so we can use it as our target for setting the displaySet,
  // or the dropHandler needs to know which viewport was dropped on
  // in event data
  const onDropHandler = ({displaySetInstanceUID}) => {
    const droppedDisplaySet = DisplaySetService.getDisplaySetByUID(displaySetInstanceUID);
    const updatedViewportGridState = HangingProtocolService([droppedDisplaySet]);

    console.warn('DROPPED: ', displaySetInstanceUID, droppedDisplaySet, updatedViewportGridState);

    // This is not updating the displayed DisplaySet
    setViewportGrid(updatedViewportGridState);
  }

  // viewportData --> displaySets
  const getViewportPanes = () =>
    viewportGrid.viewports.map((viewport, viewportIndex) => {
      const displaySetInstanceUID = viewport.displaySetInstanceUID;
      if (!displaySetInstanceUID) {
        return null;
      }

      const displaySet = DisplaySetService.getDisplaySetByUID(displaySetInstanceUID);

      // TODO: Better Empty Viewport
      if (!displaySet) {
        return (
          <ViewportPane
            key={viewportIndex}
            className="m-1"
            // Pass in as prop?
            acceptDropsFor="displayset"
            onDrop={onDropHandler}
            isActive={activeViewportIndex === viewportIndex}
          />
        );
      }

      // TODO -> Need way for other viewport e.g. vtk to be used.

      const ViewportComponent = _getViewportComponent(
        displaySet,
        viewportComponents
      );

      return (
        <ViewportPane
          key={viewportIndex}
          className="m-1"
          acceptDropsFor="displayset"
          onDrop={onDropHandler}
          isActive={activeViewportIndex === viewportIndex}
        >
          <ViewportComponent
            displaySet={displaySet}
            viewportIndex={viewportIndex}
            dataSource={dataSource}
          />
        </ViewportPane>
      );
    });

  // const ViewportPanes = React.useMemo(getViewportPanes, [
  //   viewportComp'onents,
  //   activeViewportIndex,
  //   viewportGrid,
  // ]);

  return (
    <ViewportGrid numRows={viewportGrid.numRows} numCols={viewportGrid.numCols}>
      {/* {ViewportPanes} */}
      {getViewportPanes()}
    </ViewportGrid>
  );
}

ViewerViewportGrid.propTypes = {
  // viewports: PropTypes.array.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  viewportComponents: PropTypes.array.isRequired,
  // numRows: PropTypes.number.isRequired,
  // numColumns: PropTypes.number.isRequired,
};

ViewerViewportGrid.defaultProps = {
  // numRows: 1,
  // numColumns: 1,
  viewportData: [],
  viewportComponents: [],
  activeViewportIndex: 0,
};

function _getViewportComponent(displaySet, viewportComponents) {
  const { SOPClassHandlerId } = displaySet;

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
