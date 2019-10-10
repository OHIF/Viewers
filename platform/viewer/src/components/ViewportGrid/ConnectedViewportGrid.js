import ViewportGrid from './ViewportGrid.js';
import { MODULE_TYPES } from '@ohif/core';
import { connect } from 'react-redux';
import { extensionManager } from './../../App.js';

const mapStateToProps = state => {
  const availableViewportModules = {};
  const viewportModules = extensionManager.modules[MODULE_TYPES.VIEWPORT];

  viewportModules.forEach(moduleDefinition => {
    availableViewportModules[moduleDefinition.extensionId] =
      moduleDefinition.module;
  });

  // TODO: Use something like state.plugins.defaultPlugin[MODULE_TYPES.VIEWPORT]
  let defaultPlugin;
  if (viewportModules.length) {
    defaultPlugin = viewportModules[0].extensionId;
  }

  const { numRows, numColumns, layout, activeViewportIndex } = state.viewports;

  return {
    numRows,
    numColumns,
    layout,
    activeViewportIndex,
    // TODO: rename `availableViewportModules`
    availablePlugins: availableViewportModules,
    // TODO: rename `defaultViewportModule`
    defaultPlugin,
  };
};

const ConnectedViewportGrid = connect(
  mapStateToProps,
  null
)(ViewportGrid);

export default ConnectedViewportGrid;
