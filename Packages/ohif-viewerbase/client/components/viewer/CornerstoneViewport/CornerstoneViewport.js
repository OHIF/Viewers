import {
    Component,
} from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import { OHIF } from 'meteor/ohif:core';
import debounce from 'lodash.debounce';
// import * as cornerstone from 'cornerstone-core';
// import * as cornerstoneTools from 'cornerstone-tools';

import {
    cornerstone,
    cornerstoneTools,
} from 'meteor/ohif:cornerstone';
import './CornerstoneViewport.styl';
// import './lib/initCornerstone.js';
import ImageScrollbar from '../ImageScrollbar/ImageScrollbar.js';
import ViewportOverlay from '../ViewportOverlay/ViewportOverlay.js';
import ToolContextMenu from '../ToolContextMenu/ToolContextMenu.js';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator.js';
import ViewportOrientationMarkers from '../ViewportOrientationMarkers/ViewportOrientationMarkers.js';
import {
    StackManager,
} from '../../../lib/StackManager';
import './CornerstoneViewport.styl';

const EVENT_RESIZE = 'resize';
const loadIndicatorDelay = 45;
const {
    loadHandlerManager,
} = cornerstoneTools;

function setToolsPassive(tools) {
    tools.forEach((tool) => {
        cornerstoneTools.setToolPassive(tool);
    });
}

function initializeTools(tools) {
    Array.from(tools).forEach((tool) => {
        const apiTool = cornerstoneTools[`${tool.name}Tool`];
        if (apiTool) {
            cornerstoneTools.addTool(apiTool, tool.configuration);
        } else {
            throw new Error(`Tool not found: ${tool.name}Tool`);
        }
    });
}

function getCornerstoneStack(viewportData) {
    const {
        displaySetInstanceUid,
        studyInstanceUid,
    } = viewportData;

    // Create shortcut to displaySet
    const study = OHIF.viewer.Studies.findBy({
        studyInstanceUid,
    });

    const displaySet = study.displaySets.find((set) => {
        return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    // Get stack from Stack Manager
    const stack = StackManager.findOrCreateStack(study, displaySet);
    stack.currentImageIdIndex = 0;

    return stack;
}


const scrollToIndex = cornerstoneTools.import('util/scrollToIndex');

class CornerstoneViewport extends Component {
    constructor(props) {
        super(props);

        const stack = getCornerstoneStack(this.props.viewportData);

        // TODO: Allow viewport as a prop
        this.state = {
            stack,
            displaySetInstanceUid: this.props.viewportData.displaySetInstanceUid,
            imageId: stack.imageIds[0],
            viewportHeight: '100%',
            isLoading: false, // true,
            imageScrollbarValue: 0,
            numImagesLoaded: 0,
        };

        this.displayScrollbar = stack.imageIds.length > 1;
        this.state.viewport = cornerstone.getDefaultViewport(null, undefined);

        this.onImageRendered = this.onImageRendered.bind(this);
        this.onNewImage = this.onNewImage.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onImageLoaded = this.onImageLoaded.bind(this);
        this.onStackScroll = this.onStackScroll.bind(this);
        this.startLoadingHandler = this.startLoadingHandler.bind(this);
        this.doneLoadingHandler = this.doneLoadingHandler.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);
        this.onTouchPress = this.onTouchPress.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onMeasurementAddedOrRemoved = this.onMeasurementAddedOrRemoved.bind(
            this,
        );

        this.setViewportActive = this.setViewportActive.bind(this);

        this.onCloseToolContextMenu = this.onCloseToolContextMenu.bind(this);
        this.imageSliderOnInputCallback = this.imageSliderOnInputCallback.bind(
            this,
        );

        this.loadHandlerTimeout = 25;
        // loadHandlerManager.setStartLoadHandler(this.startLoadingHandler);
        // loadHandlerManager.setEndLoadHandler(this.doneLoadingHandler);

        this.debouncedResize = debounce(() => {
            try {
                cornerstone.getEnabledElement(this.element);
            } catch (error) {
                console.error(error);
                return;
            }

            cornerstone.resize(this.element, true);

            this.setState({
                viewportHeight: `${this.element.clientHeight - 20}px`,
            });
        }, 300);

        this.slideTimeoutTime = 25;
        this.slideTimeout = null;
    }

    static defaultProps = {
      activeTool: 'Wwwc',
    }

    render() {
      const isLoading = this.state.isLoading || this.state.numImagesLoaded / this.state.stack.imageIds.length < 0.1;

        return (<div className="CornerstoneViewport" >
          <ToolContextMenu
                toolContextMenuData={
                    this.state.toolContextMenuData
                }
              onClose={
                    this.onCloseToolContextMenu
                }
            /> <div
                className="viewport-element"
            onContextMenu={
                    this.onContextMenu
                }
                ref={
                    (input) => {
                        this.element = input;
                    }
                }
          >
            {
                    isLoading ? <LoadingIndicator /> : ''
                } <canvas className="cornerstone-canvas" />
            <ViewportOverlay
                    stack={
                        this.state.stack
                    }
                    viewport={
                        this.state.viewport
                    }
                  imageId={
                        this.state.imageId
                    }
                  numImagesLoaded={
                        this.state.numImagesLoaded
                    }
                /> <ViewportOrientationMarkers
                    imageId={
                        this.state.imageId
                    }
              viewport={
                        this.state.viewport
                    }
            /> </div > <div className="viewportInstructions" >
      Please drag a stack here to view images. </div> {
                this.displayScrollbar && (<ImageScrollbar
                  onInputCallback={
                        this.imageSliderOnInputCallback
                    }
                    max={
                        this.state.stack.imageIds.length - 1
                    }
                    value={
                        this.state.imageScrollbarValue
                    }
                    height={
                        this.state.viewportHeight
                    }
                />
                )
            } {
                /* this.state.bidirectionalAddLabelShow && (
        <Labelling
          measurementData={this.bidirectional.measurementData}
          eventData={this.bidirectional.eventData}
          labellingDoneCallback={this.bidirectional.labellingDoneCallback}
          skipButton={this.bidirectional.skipButton}
          editDescription={this.bidirectional.editDescription}
        />
      )*/
            } </div>
        );
    }

bidirectionalToolLabellingCallback = (
    measurementData,
    eventData,
    doneCallback,
    options = {},
) => {
    const labellingDoneCallback = () => {
        this.hideExtraButtons();
        return doneCallback();
    };

    this.bidirectional = {
        measurementData,
        eventData,
        labellingDoneCallback,
        skipButton: options.skipButton,
        editDescription: options.editDescription,
    };

    this.setState({
        bidirectionalAddLabelShow: true,
    });
};

onContextMenu(event) {
    // Preventing the default behaviour for right-click is essential to
    // allow right-click tools to work.
    event.preventDefault();
}

onWindowResize() {
    this.debouncedResize();
}

onImageRendered() {
    const viewport = cornerstone.getViewport(this.element);

    this.setState({
        viewport,
    });
}

onNewImage() {
    const image = cornerstone.getImage(this.element);

    this.setState({
        imageId: image.imageId,
    });
}

componentDidMount() {
    const element = this.element;

    // Enable the DOM Element for use with Cornerstone
    cornerstone.enable(element);

    cornerstone.events.addEventListener(
        cornerstone.EVENTS.IMAGE_LOADED,
        this.onImageLoaded,
    );

    // Load the first image in the stack
    cornerstone.loadAndCacheImage(this.state.imageId).then((image) => {
        try {
            cornerstone.getEnabledElement(element);
        } catch (error) {
            // Handle cases where the user ends the session before the image is displayed.
            console.error(error);
            return;
        }

        // Set Soft Tissue preset for all images by default
        const viewport = cornerstone.getDefaultViewportForImage(element, image);
        viewport.voi = {
            windowWidth: 400,
            windowCenter: 40,
        };

        // Display the first image
        cornerstone.displayImage(element, image, viewport);

        // Clear any previous tool state
        cornerstoneTools.clearToolState(this.element, 'stack');

        // Disable stack prefetch in case there are still queued requests
        cornerstoneTools.stackPrefetch.disable(this.element);

        // Add the stack tool state to the enabled element
        const stack = this.state.stack;
        cornerstoneTools.addStackStateManager(element, ['stack']);
        cornerstoneTools.addToolState(element, 'stack', stack);
        cornerstoneTools.stackPrefetch.enable(this.element);

        const tools = [{
            name: 'Bidirectional',
            configuration: {
                getMeasurementLocationCallback: this
                    .bidirectionalToolLabellingCallback,
                shadow: true,
                drawHandlesOnHover: true,
            },
        },
        {
            name: 'Wwwc',
        },
        {
            name: 'Zoom',
            configuration: {
                minScale: 0.3,
                maxScale: 25,
                preventZoomOutsideImage: true,
            },
        },
        {
            name: 'Pan',
        },
        {
            name: 'StackScroll',
        },
        {
            name: 'PanMultiTouch',
        },
        {
            name: 'ZoomTouchPinch',
        },
        {
            name: 'StackScrollMouseWheel',
        },
        {
            name: 'StackScrollMultiTouch',
        },
        ];

        initializeTools(tools);

        this.setActiveTool(this.props.activeTool);

        /* For touch devices, by default we activate:
      - Pinch to zoom
      - Two-finger Pan
      - Three (or more) finger Stack Scroll
      */
        cornerstoneTools.setToolActive('PanMultiTouch', {
            mouseButtonMask: 0,
            isTouchActive: true,
        });
        cornerstoneTools.setToolActive('ZoomTouchPinch', {
            mouseButtonMask: 0,
            isTouchActive: true,
        });

        cornerstoneTools.setToolActive('StackScrollMultiTouch', {
            mouseButtonMask: 0,
            isTouchActive: true,
        });

        cornerstoneTools.stackPrefetch.setConfiguration({
            maxImagesToPrefetch: Infinity,
            preserveExistingPool: false,
            maxSimultaneousRequests: 6,
        });

        /* For mouse devices, by default we turn on:
      - Stack scrolling by mouse wheel
      - Stack scrolling by keyboard up / down arrow keys
      - Pan with middle click
      - Zoom with right click
      */

        cornerstoneTools.setToolActive('StackScrollMouseWheel', {
            mouseButtonMask: 0,
            isTouchActive: true,
        });

        element.addEventListener(
            cornerstone.EVENTS.IMAGE_RENDERED,
            this.onImageRendered,
        );

        element.addEventListener(cornerstone.EVENTS.NEW_IMAGE, this.onNewImage);

        element.addEventListener(
            cornerstoneTools.EVENTS.STACK_SCROLL,
            this.onStackScroll,
        );

        element.addEventListener(
            cornerstoneTools.EVENTS.MEASUREMENT_ADDED,
            this.onMeasurementAddedOrRemoved,
        );

        element.addEventListener(
            cornerstoneTools.EVENTS.MEASUREMENT_REMOVED,
            this.onMeasurementAddedOrRemoved,
        );

        element.addEventListener(
            cornerstoneTools.EVENTS.MOUSE_CLICK,
            this.onMouseClick,
        );

        element.addEventListener(
            cornerstoneTools.EVENTS.TOUCH_PRESS,
            this.onTouchPress,
        );

        element.addEventListener(
            cornerstoneTools.EVENTS.TOUCH_START,
            this.onTouchStart,
        );

        window.addEventListener(EVENT_RESIZE, this.onWindowResize);

        this.setState({
            viewportHeight: `${this.element.clientHeight - 20}px`,
        });
    });
}

componentWillUnmount() {
    const element = this.element;
    element.removeEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        this.onImageRendered,
    );

    element.removeEventListener(cornerstone.EVENTS.NEW_IMAGE, this.onNewImage);

    element.removeEventListener(
        cornerstoneTools.EVENTS.STACK_SCROLL,
        this.onStackScroll,
    );

    element.removeEventListener(
        cornerstoneTools.EVENTS.MEASUREMENT_ADDED,
        this.onMeasurementAddedOrRemoved,
    );

    element.removeEventListener(
        cornerstoneTools.EVENTS.MEASUREMENT_REMOVED,
        this.onMeasurementAddedOrRemoved,
    );

    element.removeEventListener(
        cornerstoneTools.EVENTS.MOUSE_CLICK,
        this.onMouseClick,
    );

    element.removeEventListener(
        cornerstoneTools.EVENTS.TOUCH_PRESS,
        this.onTouchPress,
    );

    element.removeEventListener(
        cornerstoneTools.EVENTS.TOUCH_START,
        this.onTouchStart,
    );

    window.removeEventListener(EVENT_RESIZE, this.onWindowResize);

    cornerstone.disable(element);

    cornerstone.events.removeEventListener(
        cornerstone.EVENTS.IMAGE_LOADED,
        this.onImageLoaded,
    );
}

componentDidUpdate(prevProps) {
    // TODO: Add a real object shallow comparison here?
    if (
        this.state.displaySetInstanceUid !== this.props.viewportData.displaySetInstanceUid
    ) {
        const {
            displaySetInstanceUid,
            studyInstanceUid,
            currentImageIdIndex,
        } = this.props.viewportData;

        // Create shortcut to displaySet
        const study = OHIF.viewer.Studies.findBy({
            studyInstanceUid,
        });

        const displaySet = study.displaySets.find((set) => {
            return set.displaySetInstanceUid === displaySetInstanceUid;
        });

        // Get stack from Stack Manager
        const stack = StackManager.findOrCreateStack(study, displaySet);
        const stackData = cornerstoneTools.getToolState(this.element, 'stack');
        let currentStack = stackData && stackData.data[0];

        if (!currentStack) {
            currentStack = {
                currentImageIdIndex,
                imageIds: stack.imageIds,
            };

            cornerstoneTools.addStackStateManager(this.element, ['stack']);
            cornerstoneTools.addToolState(this.element, 'stack', currentStack);
        } else {
            // TODO: we should make something like setToolState by an ID
            currentStack.currentImageIdIndex = currentImageIdIndex;
            currentStack.imageIds = stack.imageIds;
        }

        const imageId = currentStack.imageIds[currentImageIdIndex];

        this.setState({
            displaySetInstanceUid,
            studyInstanceUid,
            stack,
            imageId,
        });

        cornerstoneTools.stackPrefetch.disable(this.element);
        cornerstone.loadAndCacheImage(imageId).then((image) => {
            try {
                cornerstone.getEnabledElement(this.element);
            } catch (error) {
                // Handle cases where the user ends the session before the image is displayed.
                console.error(error);
                return;
            }

            const viewport = cornerstone.getDefaultViewportForImage(this.element, image);

            // Workaround for Cornerstone issue #304
            viewport.displayedArea.brhc = {
                x: image.width,
                y: image.height,
            };

            cornerstone.displayImage(this.element, image, viewport);

            cornerstoneTools.stackPrefetch.enable(this.element);
        });
    }

    if (this.props.activeTool !== prevProps.activeTool) {
        this.setActiveTool(this.props.activeTool);

        // TODO: Why do we need to do this in v3?
        cornerstoneTools.setToolActive('StackScrollMouseWheel', {
            mouseButtonMask: 0,
            isTouchActive: true,
        });
    }

    // TODO: Check this, causes infinite loop
    // this.debouncedResize();
}

setActiveTool = (activeTool) => {
    const leftMouseTools = ['Bidirectional', 'Wwwc', 'StackScroll'];

    setToolsPassive(leftMouseTools);

    // pan is the default tool for middle mouse button
    const isPanToolActive = activeTool === 'Pan';
    const panOptions = {
        mouseButtonMask: isPanToolActive ? [1, 4] : [4],
        isTouchActive: isPanToolActive,
    };
    cornerstoneTools.setToolActive('Pan', panOptions);

    // zoom is the default tool for right mouse button
    const isZoomToolActive = activeTool === 'Zoom';
    const zoomOptions = {
        mouseButtonMask: isZoomToolActive ? [1, 2] : [2],
        isTouchActive: isZoomToolActive,
    };
    cornerstoneTools.setToolActive('Zoom', zoomOptions);

    cornerstoneTools.setToolActive(activeTool, {
        mouseButtonMask: 1,
        isTouchActive: true,
    });
};

onStackScroll(event) {
    this.setViewportActive();

    const element = event.currentTarget;
    const stackData = cornerstoneTools.getToolState(element, 'stack');
    const stack = stackData.data[0];

    this.hideExtraButtons();

    this.setState({
        stack,
        imageScrollbarValue: stack.currentImageIdIndex,
    });
}

onImageLoaded() {
    this.setState({
        numImagesLoaded: this.state.numImagesLoaded + 1,
    });
}

startLoadingHandler() {
    // console.log('startLoadingHandler');
    clearTimeout(this.loadHandlerTimeout);
    this.loadHandlerTimeout = setTimeout(() => {
        this.setState({
            isLoading: true,
        });
    }, loadIndicatorDelay);
}

doneLoadingHandler() {
    clearTimeout(this.loadHandlerTimeout);
    this.setState({
        isLoading: false,
    });
}

onMeasurementAddedOrRemoved() {
    console.log('onMeasurementAddedOrRemoved');
    /* const { toolType, measurementData } = event.detail;

    // TODO: Pass in as prop?
    const toolsOfInterest = ['Bidirectional'];

    this.hideExtraButtons();

    if (toolsOfInterest.includes(toolType)) {
      const image = cornerstone.getImage(this.element);
      const viewport = cornerstone.getViewport(this.element);

      const type = {
        cornerstonetoolsmeasurementadded: 'added',
        cornerstonetoolsmeasurementremoved: 'removed'
      };
      const action = type[event.type];

      if (action === 'added') {
        measurementData._id = guid();
        measurementData.viewport = cloneDeep(viewport);
      }

      this.props.measurementsAddedOrRemoved(
        action,
        image.imageId,
        toolType,
        measurementData
      );
    }*/
}

setViewportActive() {
    const {
        viewportIndex,
    } = this.props.viewportData;
    const activeViewportIndex = window.store.getState().viewports.activeViewport;
    if (viewportIndex !== activeViewportIndex) {
        window.store.dispatch({
            type: 'SET_VIEWPORT_ACTIVE',
            viewportIndex,
        });
    }
}

onMouseClick(event) {
    this.setViewportActive();

    if (event.detail.event.which === 3) {
        this.setState({
            toolContextMenuData: {
                eventData: event.detail,
                isTouchEvent: false,
            },
        });
    }
}

onTouchPress(event) {
    this.setViewportActive();

    this.setState({
        toolContextMenuData: {
            eventData: event.detail,
            isTouchEvent: true,
        },
    });
}

onTouchStart() {
    this.setViewportActive();
}

onCloseToolContextMenu() {
    this.setState({
        toolContextMenuData: null,
    });
}

imageSliderOnInputCallback(value) {
    this.setViewportActive();

    this.setState({
        imageScrollbarValue: value,
    });

    // Note that we throttle requests to prevent the
    // user's ultrafast scrolling from firing requests too quickly.
    // clearTimeout(this.slideTimeout);
    // this.slideTimeout = setTimeout(() => {
    scrollToIndex(this.element, value);
    // }, this.slideTimeoutTime);
}

hideExtraButtons = () => {
    if (this.state.bidirectionalAddLabelShow === true) {
        this.setState({
            bidirectionalAddLabelShow: false,
        });
    }
    this.setState({
        toolContextMenuData: null,
    });
};
}

CornerstoneViewport.propTypes = {
    measurementsAddedOrRemoved: PropTypes.func,
    measurementsChanged: PropTypes.func,
    activeTool: PropTypes.string,
    viewportData: PropTypes.object.isRequired,
};

export default CornerstoneViewport;
