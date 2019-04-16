import { connect } from 'react-redux';
import { VTKMPRViewport } from 'react-vtkjs-viewport';
import OHIF from 'ohif-core';

const {
  setViewportActive,
  setViewportSpecificData,
  clearViewportSpecificData
} = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const activeButton = state.tools.buttons.find(tool => tool.active === true);
  let dataFromStore;

  if (state.extensions && state.extensions.vtk) {
    dataFromStore = state.extensions.vtk;
  }

  // If this is the active viewport, enable prefetching.
  const { viewportIndex } = ownProps; //.viewportData;
  const isActive = viewportIndex === state.viewports.activeViewportIndex;
  const viewportSpecificData =
    state.viewports.viewportSpecificData[viewportIndex] || {};

  const viewportLayout = state.viewports.layout.viewports[viewportIndex];
  const pluginDetails = viewportLayout.vtk || {};

  return {
    layout: state.viewports.layout,
    isActive,
    ...pluginDetails,
    activeTool: activeButton && activeButton.command,
    ...dataFromStore,
    enableStackPrefetch: isActive,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { viewportIndex } = ownProps;

  return {
    setViewportActive: () => {
      dispatch(setViewportActive(viewportIndex));
    },

    setViewportSpecificData: data => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },

    clearViewportSpecificData: () => {
      dispatch(clearViewportSpecificData(viewportIndex));
    }
  };
};

const ConnectedVTKViewport = connect(
  mapStateToProps,
  //mapDispatchToProps
)(VTKMPRViewport);

export default ConnectedVTKViewport;
