import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import throttle from 'lodash.throttle';
import { setEnabledElement, getEnabledElement } from './state';
import cornerstone from 'cornerstone-core';

const { setViewportActive, setViewportSpecificData } = OHIF.redux.actions;
const {
  onAdded,
  onRemoved,
  onModified,
} = OHIF.measurements.MeasurementHandlers;

// TODO: Transition to enums for the action names so that we can ensure they stay up to date
// everywhere they're used.
const MEASUREMENT_ACTION_MAP = {
  added: onAdded,
  removed: onRemoved,
  modified: throttle(event => {
    return onModified(event);
  }, 300),
};

const mapStateToProps = (state, ownProps) => {
  let dataFromStore;

  // TODO: This may not be updated anymore :thinking:
  if (state.extensions && state.extensions.cornerstone) {
    dataFromStore = state.extensions.cornerstone;
  }

  // If this is the active viewport, enable prefetching.
  const { viewportIndex } = ownProps; //.viewportData;
  const isActive = viewportIndex === state.viewports.activeViewportIndex;
  const viewportSpecificData =
    state.viewports.viewportSpecificData[viewportIndex] || {};

  // CINE
  let isPlaying = false;
  let frameRate = 24;

  if (viewportSpecificData && viewportSpecificData.cine) {
    const cine = viewportSpecificData.cine;

    isPlaying = cine.isPlaying === true;
    frameRate = cine.cineFrameRate || frameRate;
  }

  return {
    // layout: state.viewports.layout,
    isActive,
    // TODO: Need a cleaner and more versatile way.
    // Currently justing using escape hatch + commands
    // activeTool: activeButton && activeButton.command,
    ...dataFromStore,
    isStackPrefetchEnabled: isActive,
    isPlaying,
    frameRate,
    //stack: viewportSpecificData.stack,
    viewport: viewportSpecificData.viewport,
    // viewport: viewportSpecificData.viewport,
    SOPInstanceUID: viewportSpecificData.SOPInstanceUID,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { viewportIndex } = ownProps;

  return {
    onNewImage: newImageData => {
      ownProps.onNewImage && ownProps.onNewImage(newImageData);
      dispatch(
        setViewportSpecificData(viewportIndex, { SOPInstanceUID: null })
      );
    },

    setViewportActive: () => {
      dispatch(setViewportActive(viewportIndex));
    },

    setViewportSpecificData: data => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },

    /**
     * Our component "enables" the underlying dom element on "componentDidMount"
     * It listens for that event, and then emits the enabledElement. We can grab
     * a reference to it here, to make playing with cornerstone's native methods
     * easier.
     */
    onElementEnabled: event => {
      const enabledElement = event.detail.element;
      setEnabledElement(viewportIndex, enabledElement);
      dispatch(
        setViewportSpecificData(viewportIndex, {
          // TODO: Hack to make sure our plugin info is available from the outset
          plugin: 'cornerstone',
        })
      );
    },

    onMeasurementsChanged: (event, action) => {
      return MEASUREMENT_ACTION_MAP[action](event);
    },
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  let eventListeners = [];

  if (propsFromState.viewport) {
    const onImageRendered = () => {
      const { viewportIndex } = ownProps;
      const ee = getEnabledElement(viewportIndex);
      if (!ee) return;
      cornerstone.setViewport(ee, propsFromState.viewport);
      propsFromDispatch.setViewportSpecificData({ viewport: null });
    };

    eventListeners = [
      {
        target: 'element',
        eventName: cornerstone.EVENTS.IMAGE_RENDERED,
        handler: onImageRendered,
      },
    ];
  }

  return {
    ...ownProps,
    ...propsFromState,
    ...propsFromDispatch,
    setViewportActive: propsFromState.isActive
      ? undefined
      : propsFromDispatch.setViewportActive,
    onNewImage: !propsFromState.SOPInstanceUID
      ? ownProps.onNewImage
      : propsFromDispatch.onNewImage,
    eventListeners,
  };
};

const ConnectedCornerstoneViewport = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(CornerstoneViewport);

export default ConnectedCornerstoneViewport;
