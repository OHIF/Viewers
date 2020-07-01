/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane, useViewportGrid } from '@ohif/ui';
import EmptyViewport from './EmptyViewport';
import { classes } from '@ohif/core';
const { ImageSet } = classes;

function ViewerViewportGrid(props) {
  const { servicesManager, viewportComponents, dataSource } = props;
  const [
    { numCols, numRows, activeViewportIndex, viewports },
    viewportGridService,
  ] = useViewportGrid();

  const setActiveViewportIndex = index => {
    viewportGridService.setActiveViewportIndex(index);
  };

  // TODO -> Need some way of selecting which displaySets hit the viewports.
  const { DisplaySetService } = servicesManager.services;

  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      displaySets => {
        displaySets.sort((a, b) => {
          const isImageSet = x => x instanceof ImageSet;
          return isImageSet(a) === isImageSet(b) ? 0 : isImageSet(a) ? -1 : 1;
        });
        viewportGridService.setDisplaysetForViewport({
          viewportIndex: 0,
          displaySetInstanceUID: displaySets[0].displaySetInstanceUID,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

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

  // const droppedDisplaySet = DisplaySetService.getDisplaySetByUID(
  //   displaySetInstanceUID
  // );
  // const updatedViewportGridState = HangingProtocolService([
  //   droppedDisplaySet,
  // ]);
  const onDropHandler = (viewportIndex, { displaySetInstanceUID }) => {
    console.warn(`DROPPED: ${displaySetInstanceUID}`);
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
      const paneMetadata = viewports[i] || {};
      const { displaySetInstanceUID } = paneMetadata;

      const displaySet =
        DisplaySetService.getDisplaySetByUID(displaySetInstanceUID) || {};
      const ViewportComponent = _getViewportComponent(
        displaySet.SOPClassHandlerId,
        viewportComponents
      );

      const onInterationHandler = () => {
        setActiveViewportIndex(viewportIndex);
      };

      viewportPanes[i] = (
        <ViewportPane
          key={viewportIndex}
          className="m-1"
          acceptDropsFor="displayset"
          onDrop={onDropHandler.bind(null, viewportIndex)}
          onInteraction={onInterationHandler}
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
