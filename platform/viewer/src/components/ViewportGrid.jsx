/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane, useViewportGrid } from '@ohif/ui';
import EmptyViewport from './EmptyViewport';

function ViewerViewportGrid(props) {
  const { servicesManager, viewportComponents, dataSource } = props;
  const [
    { numCols, numRows, activeViewportIndex, viewports },
    dispatch,
  ] = useViewportGrid();
  const setActiveViewportIndex = index => {
    dispatch({ type: 'SET_ACTIVE_VIEWPORT_INDEX', payload: index });
  }

  // TODO -> Need some way of selecting which displaySets hit the viewports.
  const { DisplaySetService } = servicesManager.services;

  // TODO -> Make a HangingProtocolService
  const HangingProtocolService = displaySets => {
    let displaySetInstanceUID;

    // Fallback
    if (!displaySets || !displaySets.length) {
      const displaySet = DisplaySetService.activeDisplaySets[0];
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

  // TODO:
  // Hmm... Should a "displaySet" being added update the viewport based on HP?
  // I guess it might.
  // This is where you would likely "fill" emptyViewports if none had content
  // Or to recheck best placement/priority based on all activeDisplaySets
  // useEffect(() => {
  //   const { unsubscribe } = DisplaySetService.subscribe(
  //     DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
  //     displaySets => {
  //       displaySets.forEach(ds => console.log(`VPG:ADD::${ds.StudyInstanceUID}`));
  //       const hp = HangingProtocolService(displaySets);
  //       viewportGrid.setViewportGrid(hp);
  //     },
  //   );

  //   return unsubscribe;
  // }, []);

  // TODO: either need hover to change "active viewport"
  // so we can use it as our target for setting the displaySet,
  // or the dropHandler needs to know which viewport was dropped on
  // in event data
  const onDropHandler = ({ displaySetInstanceUID }) => {
    const droppedDisplaySet = DisplaySetService.getDisplaySetByUID(
      displaySetInstanceUID
    );
    const updatedViewportGridState = HangingProtocolService([
      droppedDisplaySet,
    ]);

    console.warn(
      'DROPPED: ',
      displaySetInstanceUID,
      droppedDisplaySet,
      updatedViewportGridState
    );

    dispatch({ type: 'action-name', payload: updatedViewportGridState });
  };

  const getViewportPanes = () => {
    const viewportPanes = [];
    const numViewportPanes = numCols * numRows;

    for (let i = 0; i < numViewportPanes; i++) {
      const viewportIndex = i;
      const paneMeta = viewports[i];
      const isEmpty = !paneMeta || !paneMeta.displaySetInstanceUID;

      if (isEmpty) {
        viewportPanes[i] = (
          <ViewportPane
            key={viewportIndex}
            className="m-1"
            acceptDropsFor="displayset"
            onDrop={onDropHandler}
            onInteraction={() => { setActiveViewportIndex(viewportIndex); }}
            isActive={activeViewportIndex === viewportIndex}
          >
            <EmptyViewport />
          </ViewportPane>
        );
      } else {
        const displaySet = DisplaySetService.getDisplaySetByUID(
          paneMeta.displaySetInstanceUID
        );

        const ViewportComponent = _getViewportComponent(
          displaySet,
          viewportComponents
        );

        viewportPanes[i] = (
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
      }
    }

    return viewportPanes;
  };

  // const ViewportPanes = React.useMemo(getViewportPanes, [
  //   viewportComp'onents,
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
