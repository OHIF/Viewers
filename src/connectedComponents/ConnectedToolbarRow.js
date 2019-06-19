import {
  setLeftSidebarOpen,
  setRightSidebarOpen,
} from './../store/layout/actions.js';

import ToolbarRow from './ToolbarRow';
import { connect } from 'react-redux';

const defaultPlugin = 'cornerstone';

const mapStateToProps = state => {
  const { layout, viewportSpecificData, activeViewportIndex } = state.viewports;
  const pluginInLayout =
    layout.viewports[activeViewportIndex] &&
    layout.viewports[activeViewportIndex].plugin;
  const pluginInViewportData =
    viewportSpecificData[activeViewportIndex] &&
    viewportSpecificData[activeViewportIndex].plugin;
  const pluginInActiveViewport =
    pluginInLayout || pluginInViewportData || defaultPlugin;
  //     const extensionData = state.extensions[pluginInActiveViewport];

  return {
    pluginId: pluginInActiveViewport,
    leftSidebarOpen: state.ui.leftSidebarOpen,
    rightSidebarOpen: state.ui.rightSidebarOpen,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLeftSidebarOpen: state => {
      dispatch(setLeftSidebarOpen(state));
    },
    setRightSidebarOpen: state => {
      dispatch(setRightSidebarOpen(state));
    },
  };
};

const ConnectedToolbarRow = connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarRow);

export default ConnectedToolbarRow;
