import OHIF from '@ohif/core';
import React from 'react';
import PluginSwitch from './PluginSwitch.js';
import { commandsManager } from './../App.js';
import { connect } from 'react-redux';

const { setLayout } = OHIF.redux.actions;

const ConnectedPluginSwitch = props => {
  return <PluginSwitch {...props} />;
};

const mapStateToProps = state => {
  const { activeViewportIndex, layout, viewportSpecificData } = state.viewports;

  return {
    activeViewportIndex,
    viewportSpecificData,
    layout,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLayout: data => {
      dispatch(setLayout(data));
    },
  };
};

/*function setSingleLayoutData(originalArray, viewportIndex, data) {
  const viewports = originalArray.slice();
  const layoutData = Object.assign({}, viewports[viewportIndex], data);

  viewports[viewportIndex] = layoutData;

  return viewports;
}*/

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const { activeViewportIndex, viewportSpecificData } = propsFromState;
  const { studies } = ownProps;
  const { setLayout } = propsFromDispatch;

  const mpr = () => {
    commandsManager.runCommand('mpr2d');
  };

  const exitMpr = () => {
    const layout = {
      numRows: 1,
      numColumns: 1,
      viewports: [{ plugin: 'cornerstone' }],
    };

    setLayout(layout);
  };

  return {
    mpr,
    exitMpr,
    activeViewportIndex,
    viewportSpecificData,
    studies,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ConnectedPluginSwitch);
