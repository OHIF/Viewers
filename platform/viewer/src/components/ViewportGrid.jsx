/**
 * CSS Grid Reference: http://grid.malven.co/
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
//
import ViewportPane from './ViewportPane.jsx';
// import DefaultViewport from './DefaultViewport.js';
// import EmptyViewport from './EmptyViewport.js';

function ViewportGrid(props) {
  const {
    activeViewportIndex,
    displaySets,
    numRows,
    numColumns,
    children,
  } = props;

  // From ViewportGridService and/or ContextProvider
  const [viewportGrid, setViewportGrid] = useState({
    viewports: [
      {
        displaySetUid: undefined,
      },
    ],
  });

  const rowSize = 100 / numRows;
  const colSize = 100 / numColumns;

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
          onDrop={() => {
            /* setDisplaySet for Viewport */
          }}
          viewportIndex={viewportIndex}
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
    <div
      data-cy="viewport-grid"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${numRows}, ${rowSize}%)`,
        gridTemplateColumns: `repeat(${numColumns}, ${colSize}%)`,
        height: '100%',
        width: '100%',
      }}
    >
      {ViewportPanes}
    </div>
  );
}

ViewportGrid.propTypes = {
  // viewports: PropTypes.array.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  children: PropTypes.node,
  numRows: PropTypes.number.isRequired,
  numColumns: PropTypes.number.isRequired,
};

ViewportGrid.defaultProps = {
  // viewports: [],
  numRows: 1,
  numColumns: 1,
  activeViewportIndex: 0,
};

export default ViewportGrid;
