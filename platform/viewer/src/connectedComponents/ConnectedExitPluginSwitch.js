import OHIF from "@ohif/core";
import ExitPluginSwitch from "./ExitPluginSwitch.js";
import { connect } from "react-redux";

const { setLayout } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { activeViewportIndex, layout, viewportSpecificData } = state.viewports;

  return {
    activeViewportIndex,
    viewportSpecificData,
    layout
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLayout: data => {
      dispatch(setLayout(data));
    }
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const { layout: currentLayout } = propsFromState;
  const { setLayout } = propsFromDispatch;
  const { togglePlugSwitchStatus } = ownProps;
  const exitMpr = () => {
    let viewports = [];
    const rows = 1;
    const columns = 1;

    const viewport = currentLayout.viewports[0];
    let plugin = viewport && viewport.plugin;
    if (viewport && viewport.vtk) {
      plugin = 'cornerstone';
    }
    viewports.push({
      height: `${100 / rows}%`,
      width: `${100 / columns}%`,
      plugin,
    });

    const layout = {
      viewports,
    };

    setLayout(layout);
    togglePlugSwitchStatus()
  };

  return {
    exitMpr
  };
};

const ConnectedExitPluginSwitch = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ExitPluginSwitch);

export default ConnectedExitPluginSwitch;