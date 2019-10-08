import OHIF from '@ohif/core';
import PluginSwitch from './PluginSwitch.js';
import { commandsManager } from './../App.js';
import { connect } from 'react-redux';

const { setLayout } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { activeViewportIndex, viewportPanes } = state.viewports;

  return {
    activeViewportIndex,
    viewportPanes,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLayout: ({ numRows, numColumns }) => {
      console.log('SET_LAYOUT');
      dispatch(setLayout({ numRows, numColumns }));
    },
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const buttons = [
    {
      label: '2D MPR',
      icon: 'cube',
      onClick: () => {
        commandsManager.runCommand('mpr2d');
      },
    },
  ];

  return {
    buttons,
  };
};

const ConnectedPluginSwitch = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(PluginSwitch);

export default ConnectedPluginSwitch;
