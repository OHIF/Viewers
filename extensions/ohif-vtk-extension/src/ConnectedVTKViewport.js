import { connect } from 'react-redux';
import { View2D } from 'react-vtkjs-viewport';
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
  const { viewportIndex } = ownProps;
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
    enableStackPrefetch: isActive
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
    }
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const { afterCreation } = propsFromState;
  const { setViewportSpecificData } = propsFromDispatch;

  const props = {
    ...propsFromState,
    ...propsFromDispatch,
    ...ownProps,
    /**
     * Our component sets up the underlying dom element on "componentDidMount"
     * for use with VTK.
     *
     * The onCreated prop passes back an Object containing many of the internal
     * components of the VTK scene. We can grab a reference to these here, to
     * make playing with VTK's native methods easier.
     *
     * A similar approach is taken with the Cornerstone extension.
     */
    onCreated: api => {
      // Store the API details for later
      //setViewportSpecificData({ vtkApi: api });

      if (afterCreation && typeof afterCreation === 'function') {
        afterCreation(api);
      }
    }
  };
  return props;
};

const ConnectedVTKViewport = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(View2D);

export default ConnectedVTKViewport;
