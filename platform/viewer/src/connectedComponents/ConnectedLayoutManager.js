import { LayoutManager } from '@ohif/ui';
import { MODULE_TYPES } from '@ohif/core';
import { connect } from 'react-redux';
import { extensionManager } from './../App.js';

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

  return {
    layout: state.viewports.layout,
    activeViewportIndex: state.viewports.activeViewportIndex,
    // TODO: rename `availableViewportModules`
    availablePlugins: availableViewportModules,
    // TODO: rename `defaultViewportModule`
    defaultPlugin,
  };
};

const ConnectedLayoutManager = connect(
  mapStateToProps,
  null
)(LayoutManager);

export default ConnectedLayoutManager;
