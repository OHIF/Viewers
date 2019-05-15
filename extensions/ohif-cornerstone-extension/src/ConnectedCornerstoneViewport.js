import { connect } from 'react-redux';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from 'ohif-core';
import throttle from 'lodash.throttle';

const {
  setViewportActive,
  setViewportSpecificData,
  clearViewportSpecificData
} = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const activeButton = state.tools.buttons.find(tool => tool.active === true);
  let dataFromStore;

  if (state.extensions && state.extensions.cornerstone) {
    dataFromStore = state.extensions.cornerstone;
  }

  // If this is the active viewport, enable prefetching.
  const { viewportIndex } = ownProps; //.viewportData;
  const isActive = viewportIndex === state.viewports.activeViewportIndex;
  const viewportSpecificData =
    state.viewports.viewportSpecificData[viewportIndex] || {};

  return {
    layout: state.viewports.layout,
    isActive,
    activeTool: activeButton && activeButton.command,
    ...dataFromStore,
    enableStackPrefetch: isActive,
    //stack: viewportSpecificData.stack,
    cineToolData: viewportSpecificData.cine,
    viewport: viewportSpecificData.viewport
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
    },

    /**
     * Our component "enables" the underlying dom element on "componentDidMount"
     * It listens for that event, and then emits the enabledElement. We can grab
     * a reference to it here, to make playing with cornerstone's native methods
     * easier.
     */
    onElementEnabled: event => {
      const enabledElement = event.detail.element;
      dispatch(
        setViewportSpecificData(viewportIndex, {
          dom: enabledElement
        })
      );
    },

    onMeasurementsChanged: (event, action) => {
      const {
        onAdded,
        onRemoved,
        onModified
      } = OHIF.measurements.MeasurementHandlers;
      const actions = {
        added: onAdded,
        removed: onRemoved,
        modified: throttle(event => {
          return onModified(event);
        }, 300)
      };

      return actions[action](event);
    }
  };
};

const ConnectedCornerstoneViewport = connect(
  mapStateToProps,
  mapDispatchToProps
)(CornerstoneViewport);

export default ConnectedCornerstoneViewport;
