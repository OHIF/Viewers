/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane } from '@ohif/ui';
// import DefaultViewport from './DefaultViewport.js';
// import EmptyViewport from './EmptyViewport.js';

function ViewerViewportGrid(props) {
  const {
    activeViewportIndex,
    viewportData,
    viewportComponents,
    dataSource,
  } = props;

  // From ViewportGridService and/or ContextProvider
  const [viewportGrid, setViewportGrid] = useState({
    numRows: 2,
    numCols: 2,
    activeViewportIndex: 0,
    viewports: [
      {
        displaySetUid: undefined,
      },
      {
        displaySetUid: undefined,
      },
      {
        displaySetUid: undefined,
      },
      {
        displaySetUid: undefined,
      },
    ],
  });

  // viewportData --> displaySets

  const getViewportPanes = () =>
    viewportGrid.viewports.map((viewport, viewportIndex) => {
      const displaySet = viewportData[viewportIndex];

      if (!displaySet) {
        return (
          <ViewportPane
            key={viewportIndex}
            className="m-1"
            onDrop={() => {
              /* setDisplaySet for Viewport */
            }}
            isActive={activeViewportIndex === viewportIndex}
          ></ViewportPane>
        );
      }

      // if (!displaySet) {
      //   // TODO: Empty Viewport
      //   return null;
      // }

      // const pluginName =
      //   !layout.plugin && displaySet && displaySet.plugin
      //     ? displaySet.plugin
      //     : layout.plugin;

      // TODO -> Need way for other viewport e.g. vtk to be used.

      const ViewportComponent = _getViewportComponent(
        displaySet,
        viewportComponents
      );

      return (
        <ViewportPane
          key={viewportIndex}
          className="m-1"
          onDrop={() => {
            /* setDisplaySet for Viewport */
          }}
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

  const ViewportPanes = React.useMemo(getViewportPanes, [
    viewportComponents,
    activeViewportIndex,
  ]);

  return (
    <ViewportGrid numRows={viewportGrid.numRows} numCols={viewportGrid.numCols}>
      {ViewportPanes}
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
