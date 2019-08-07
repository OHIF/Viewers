import OHIF from "@ohif/core";
import PluginSwitch from "./PluginSwitch.js";
import { commandsManager } from "./../App.js";
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

/*function setSingleLayoutData(originalArray, viewportIndex, data) {
  const viewports = originalArray.slice();
  const layoutData = Object.assign({}, viewports[viewportIndex], data);

  viewports[viewportIndex] = layoutData;

  return viewports;
}*/

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  //const { activeViewportIndex, layout } = propsFromState;
  //const { setLayout } = propsFromDispatch;

  // TODO: Do not display certain options if the current display set
  // cannot be displayed using these view types
  const buttons = [
    /*{
      text: 'Acquired',
      type: 'command',
      icon: 'bars',
      active: false,
      onClick: () => {
        console.warn('Original Acquisition');

        const layoutData = setSingleLayoutData(
          layout.viewports,
          activeViewportIndex,
          { plugin: 'cornerstone' }
        );

        setLayout({ viewports: layoutData });
      },
    },
    {
      text: 'Axial',
      icon: 'cube',
      active: false,
      onClick: () => {
        commandsManager.runCommand('axial');
      },
    },
    {
      text: 'Sagittal',
      icon: 'cube',
      active: false,
      onClick: () => {
        commandsManager.runCommand('sagittal');
      },
    },
    {
      text: 'Coronal',
      icon: 'cube',
      active: false,
      onClick: () => {
        commandsManager.runCommand('coronal');
      },
    },*/
    {
      label: "2D MPR",
      icon: "cube",
      onClick: () => {
        commandsManager.runCommand("mpr2d");
      }
    }
  ];

  return {
    buttons
  };
};

const ConnectedPluginSwitch = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(PluginSwitch);

export default ConnectedPluginSwitch;
