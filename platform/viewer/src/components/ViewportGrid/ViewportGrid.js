import './ViewportGrid.css';

import React from 'react';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import classNames from 'classnames';
//
import ViewportPane from './ViewportPane.js';
import EmptyViewport from './EmptyViewport.js';
import DefaultViewport from './DefaultViewport.js';

const { StackManager } = OHIF.utils;

const ViewportGrid = function(props) {
  const {
    setViewportData,
    setViewportActive,
    defaultPlugin,
    availablePlugins,
    studies,
    numRows,
    numColumns,
    viewportPanes,
    children,
    activeViewportIndex,
  } = props;

  const getViewportComponent = function(viewportName = defaultPlugin) {
    const ViewportComponent = availablePlugins[viewportName];

    if (!ViewportComponent) {
      throw new Error(
        `No Viewport available with name: ${viewportName}. Available viewport's: ${JSON.stringify(
          availablePlugins
        )}`
      );
    }

    return ViewportComponent;
  };

  if (!viewportPanes.length) {
    return '';
  }

  const magic = viewportPanes.map((viewportPane, viewportIndex) => {
    // TODO: Change this logic to:
    // - Plugins define how capable they are of displaying a SopClass
    // - When updating a panel, ensure that the currently enabled plugin
    // in the viewport is capable of rendering this display set. If not
    // then use the most capable available plugin
    const { plugin, studyInstanceUid, displaySetInstanceUid } = viewportPane;
    // TODO: Context menu + Others (shift to something ViewportGrid global?)
    // TODO: Probably actually don't need one per element; or to use global state
    const childrenWithProps = React.Children.map(children, (child, index) => {
      return React.cloneElement(child, {
        viewportIndex: viewportIndex,
        key: index,
      });
    });
    const displaySetStack = _getDisplaySetStackFromStudies(
      studies,
      studyInstanceUid,
      displaySetInstanceUid
    );
    const viewportProps = displaySetStack ? { ...displaySetStack } : {};
    const ViewportComponent = displaySetStack
      ? getViewportComponent(plugin)
      : EmptyViewport;

    return (
      <ViewportPane
        onDrop={setViewportData}
        viewportIndex={viewportIndex} // Needed by `setViewportData`
        className={classNames('viewport-container', {
          active: activeViewportIndex === viewportIndex,
        })}
        key={viewportIndex}
      >
        <ViewportComponent
          // Different "Viewport Types"? Feels too rigid to lock all into these props
          {...viewportProps}
          // We shouldn't need this?
          // Used in `ConnectedCornerstoneViewport`
          viewportIndex={viewportIndex}
          setViewportActive={() => {
            if (activeViewportIndex !== viewportIndex) {
              setViewportActive(viewportIndex);
            }
          }}
        />
        {childrenWithProps}
      </ViewportPane>
    );
  });

  const rowSize = 100 / numRows;
  const colSize = 100 / numColumns;

  // http://grid.malven.co/
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${numRows}, ${rowSize}%)`,
        gridTemplateColumns: `repeat(${numColumns}, ${colSize}%)`,
        height: '100%',
        width: '100%',
      }}
    >
      {magic}
    </div>
  );
};

const noop = () => {};

ViewportGrid.propTypes = {
  activeViewportIndex: PropTypes.number.isRequired,
  numRows: PropTypes.number.isRequired,
  numColumns: PropTypes.number.isRequired,
  viewportPanes: PropTypes.arrayOf(
    PropTypes.shape({
      studyInstanceUid: PropTypes.string,
      displaySetInstanceUid: PropTypes.string,
      plugin: PropTypes.string,
    })
  ).isRequired,
  availablePlugins: PropTypes.object.isRequired,
  setViewportData: PropTypes.func,
  setViewportActive: PropTypes.func, // Connected
  studies: PropTypes.array,
  children: PropTypes.node,
};

ViewportGrid.defaultProps = {
  activeViewportIndex: 0,
  availablePlugins: {
    DefaultViewport,
  },
  setViewportActive: noop,
  defaultPlugin: 'DefaultViewport',
};

/**
 *
 *
 * @param {*} studies
 * @param {string} studyInstanceUid
 * @param {string} displaySetInstanceUid
 * @returns
 */
function _getDisplaySetStackFromStudies(
  studies,
  studyInstanceUid,
  displaySetInstanceUid
) {
  if (!studyInstanceUid || !displaySetInstanceUid) {
    return undefined;
  }

  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );
  const studyDisplaySet = study.displaySets.find(set => {
    return set.displaySetInstanceUid === displaySetInstanceUid;
  });

  // Get stack from Stack Manager
  // TODO: Study contains this display set. Why do we need to pass both? Should just take displaySetInstanceUid?
  // TODO: The ergonomics of this are weird -- What is createStacks doing to study.displaySets[displaySetInstanceUid]?
  const storedStack = StackManager.findOrCreateStack(study, studyDisplaySet);

  if (storedStack) {
    return {
      // studyInstanceUid,
      // displaySetInstanceUid,
      imageIds: storedStack.imageIds,
      frameRate: storedStack.frameRate,
    };
  }

  return undefined;
}

export default ViewportGrid;
