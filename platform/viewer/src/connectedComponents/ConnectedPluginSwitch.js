import OHIF from '@ohif/core';
import PluginSwitch from './PluginSwitch.js';
import { commandsManager } from './../App.js';
import { connect } from 'react-redux';
import { getActiveContexts } from './../store/layout/selectors.js';

const { setLayout } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { activeViewportIndex, layout, viewportSpecificData } = state.viewports;

  return {
    activeViewportIndex,
    viewportSpecificData,
    layout,
    activeContexts: getActiveContexts(state),
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
  //const { setLayout } = propsFromDispatch;

  const mpr = () => {
    commandsManager.runCommand('mpr2d');
  };
  return {
    mpr,
    activeViewportIndex,
    viewportSpecificData,
    studies,
  };
};

const ConnectedPluginSwitch = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(PluginSwitch);

export default ConnectedPluginSwitch;
