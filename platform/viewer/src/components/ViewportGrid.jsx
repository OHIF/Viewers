/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ViewportGrid, ViewportPane } from '@ohif/ui';
// import DefaultViewport from './DefaultViewport.js';
// import EmptyViewport from './EmptyViewport.js';

function ViewerViewportGrid(props) {
  const { activeViewportIndex, displaySets, children } = props;

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
      const someId = viewport.displaySetId;
      // const displaySet = displaySets[someId];

      // if (!displaySet) {
      //   // TODO: Empty Viewport
      //   return null;
      // }

      // const pluginName =
      //   !layout.plugin && displaySet && displaySet.plugin
      //     ? displaySet.plugin
      //     : layout.plugin;

      // const ViewportComponent = _getViewportComponent(
      //   data, // Why do we pass this as `ViewportData`, when that's not really what it is?
      //   viewportIndex,
      //   children,

      //   pluginName,
      //   defaultPluginName
      // );

      return (
        <ViewportPane
          key={viewportIndex}
          className="m-1"
          onDrop={() => {
            /* setDisplaySet for Viewport */
          }}
          isActive={activeViewportIndex === viewportIndex}
        >
          {/* {ViewportComponent} */}
        </ViewportPane>
      );
    });

  const ViewportPanes = React.useMemo(getViewportPanes, [
    children,
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
  children: PropTypes.node,
  // numRows: PropTypes.number.isRequired,
  // numColumns: PropTypes.number.isRequired,
};

ViewerViewportGrid.defaultProps = {
  // viewports: [],
  // numRows: 1,
  // numColumns: 1,
  activeViewportIndex: 0,
};

export default ViewerViewportGrid;
