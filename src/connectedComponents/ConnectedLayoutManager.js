import { LayoutManager } from 'react-viewerbase';
import { MODULE_TYPES } from 'ohif-core';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  const viewportPluginIds = state.plugins.availablePlugins
    .filter(plugin => plugin.type === MODULE_TYPES.VIEWPORT)
    .map(plugin => plugin.id);

  const availablePlugins = {};
  viewportPluginIds.forEach(id => {
    const plugin = OHIF.plugins.availablePlugins.find(
      plugin => plugin.id === id
    );
    if (plugin) {
      availablePlugins[id] = plugin.component;
    }
  });

  // TODO Use something like state.plugins.defaultPlugin[MODULE_TYPES.VIEWPORT]
  let defaultPlugin;
  if (viewportPluginIds && viewportPluginIds.length) {
    defaultPlugin = viewportPluginIds[0];
  }

  return {
    layout: state.viewports.layout,
    activeViewportIndex: state.viewports.activeViewportIndex,
    availablePlugins,
    defaultPlugin,
  };
};

const ConnectedLayoutManager = connect(
  mapStateToProps,
  null
)(LayoutManager);

export default ConnectedLayoutManager;
