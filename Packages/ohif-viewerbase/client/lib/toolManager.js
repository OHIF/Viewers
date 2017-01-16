import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { getFrameOfReferenceUID } from './getFrameOfReferenceUID';
import { updateCrosshairsSynchronizer } from './updateCrosshairsSynchronizer';
import { crosshairsSynchronizers } from './crosshairsSynchronizers';

let activeTool = 'wwwc';
let defaultTool = 'wwwc';

let tools = {};

let gestures = {
    zoomTouchPinch: {
        enabled: true
    },
    panMultiTouch: {
        enabled: true
    },
    stackScrollMultiTouch: {
        enabled: true
    },
    doubleTapZoom: {
        enabled: true
    }
};

let toolDefaultStates = {
    activate: [],
    deactivate: ['length', 'angle', 'annotate', 'ellipticalRoi', 'rectangleRoi', 'spine'],
    enable: [],
    disable: [],
    disabledToolButtons: [],
    shadowConfig: {
        shadow: false,
        shadowColor: '#000000',
        shadowOffsetX: 0,
        shadowOffsetY: 0
    }
};

let initialized = false;

/**
 * Exported "toolManager" Singleton
 */
export const toolManager = {
    init() {
        toolManager.addTool('wwwc', {
            mouse: cornerstoneTools.wwwc,
            touch: cornerstoneTools.wwwcTouchDrag
        });
        toolManager.addTool('zoom', {
            mouse: cornerstoneTools.zoom,
            touch: cornerstoneTools.zoomTouchDrag
        });
        toolManager.addTool('wwwcRegion', {
            mouse: cornerstoneTools.wwwcRegion,
            touch: cornerstoneTools.wwwcRegionTouch
        });
        toolManager.addTool('dragProbe', {
            mouse: cornerstoneTools.dragProbe,
            touch: cornerstoneTools.dragProbeTouch
        });
        toolManager.addTool('pan', {
            mouse: cornerstoneTools.pan,
            touch: cornerstoneTools.panTouchDrag
        });
        toolManager.addTool('stackScroll', {
            mouse: cornerstoneTools.stackScroll,
            touch: cornerstoneTools.stackScrollTouchDrag
        });
        toolManager.addTool('length', {
            mouse: cornerstoneTools.length,
            touch: cornerstoneTools.lengthTouch
        });
        toolManager.addTool('angle', {
            mouse: cornerstoneTools.simpleAngle,
            touch: cornerstoneTools.simpleAngleTouch
        });
        toolManager.addTool('magnify', {
            mouse: cornerstoneTools.magnify,
            touch: cornerstoneTools.magnifyTouchDrag
        });
        toolManager.addTool('ellipticalRoi', {
            mouse: cornerstoneTools.ellipticalRoi,
            touch: cornerstoneTools.ellipticalRoiTouch
        });
        toolManager.addTool('rectangleRoi', {
            mouse: cornerstoneTools.rectangleRoi,
            touch: cornerstoneTools.rectangleRoiTouch
        });
        toolManager.addTool('annotate', {
            mouse: cornerstoneTools.arrowAnnotate,
            touch: cornerstoneTools.arrowAnnotateTouch
        });

        toolManager.addTool('rotate', {
            mouse: cornerstoneTools.rotate,
            touch: cornerstoneTools.rotateTouchDrag
        });

        toolManager.addTool('spine', {
            mouse: cornerstoneTools.textMarker,
            touch: cornerstoneTools.textMarkerTouch
        });

        toolManager.addTool('crosshairs', {
            mouse: cornerstoneTools.crosshairs,
            touch: cornerstoneTools.crosshairsTouch
        });

        if (OHIF.viewer.defaultTool) {
            activeTool = OHIF.viewer.defaultTool;
        }

        this.configureTools();
        initialized = true;
    },
    configureTools() {
        // Get Cornerstone Tools
        const { panMultiTouch, textStyle, toolStyle, toolColors,
                length, arrowAnnotate, zoom, ellipticalRoi } = cornerstoneTools;

        // Set the configuration for the multitouch pan tool
        const multiTouchPanConfig = {
            testPointers: eventData => {
                return (eventData.numPointers >= 3);
            }
        };
        panMultiTouch.setConfiguration(multiTouchPanConfig);

        // Set text box background color
        textStyle.setBackgroundColor('transparent');

        // Set the tool font and font size
        // context.font = "[style] [variant] [weight] [size]/[line height] [font family]";
        const fontFamily = 'Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';
        textStyle.setFont('15px ' + fontFamily);

        // Set the tool width
        toolStyle.setToolWidth(2);

        // Set color for inactive tools
        toolColors.setToolColor('rgb(255, 255, 0)');

        // Set color for active tools
        toolColors.setActiveColor('rgb(0, 255, 0)');

        // Set shadow configuration
        const shadowConfig = toolManager.getToolDefaultStates().shadowConfig;

        // Get some tools config to not override them
        const lengthConfig = length.getConfiguration();
        const ellipticalRoiConfig = ellipticalRoi.getConfiguration();

        // Add shadow to length tool
        length.setConfiguration({
            ...lengthConfig,
            ...shadowConfig,
            drawHandlesOnHover: true
        });

        // Add shadow to length tool
        ellipticalRoi.setConfiguration({
            ...ellipticalRoiConfig,
            ...shadowConfig
        });

        // Set the configuration values for the text annotation (Arrow) tool

        // @TODO: Fix this, needs to import them from somewhere
        /*const annotateConfig = {
            getTextCallback: getAnnotationTextCallback,
            changeTextCallback: changeAnnotationTextCallback,
            drawHandles: false,
            arrowFirst: true
        };
        arrowAnnotate.setConfiguration(annotateConfig);*/

        const zoomConfig = {
            minScale: 0.05,
            maxScale: 10
        };
        zoom.setConfiguration(zoomConfig);
    },
    setGestures(newGestures) {
        gestures = newGestures;
    },
    getGestures() {
        return gestures;
    },
    addTool(name, base) {
        tools[name] = base;
    },
    getTools() {
        return tools;
    },
    setToolDefaultStates(states) {
        toolDefaultStates = states;
    },
    getToolDefaultStates() {
        return toolDefaultStates;
    },
    setActiveToolForElement(tool, element) {
        const canvases = $(element).find('canvas');
        if (element.classList.contains('empty') || !canvases.length) {
            return;
        }

        // First, deactivate the current active tool
        tools[activeTool].mouse.deactivate(element, 1);
 
        if (tools[activeTool].touch) {
            tools[activeTool].touch.deactivate(element);
        }

        // Enable tools based on their default states
        Object.keys(toolDefaultStates).forEach( action => {
            const relevantTools = toolDefaultStates[action];
            if (!relevantTools || !relevantTools.length || action === 'disabledToolButtons') {
                return;
            }
            relevantTools.forEach( toolType => {
                // the currently active tool has already been deactivated and can be skipped
                if (action === 'deactivate' && toolType === activeTool) {
                    return;
                }
                tools[toolType].mouse[action](
                    element,
                    (action === 'activate' || action === 'deactivate' ? 1 : void 0)
                );
                tools[toolType].touch[action](element);
            });
        });

        // Get the stack toolData
        const toolData = cornerstoneTools.getToolState(element, 'stack');
        if (!toolData || !toolData.data || !toolData.data.length) {
            return;
        }

        // Get the imageIds for this element
        const imageIds = toolData.data[0].imageIds;

        // Deactivate all the middle mouse, right click, and scroll wheel tools
        cornerstoneTools.pan.deactivate(element);
        cornerstoneTools.zoom.deactivate(element);
        cornerstoneTools.zoomWheel.deactivate(element);
        cornerstoneTools.stackScrollWheel.deactivate(element);
        cornerstoneTools.panMultiTouch.disable(element);
        cornerstoneTools.zoomTouchPinch.disable(element);
        cornerstoneTools.stackScrollMultiTouch.disable(element);
        cornerstoneTools.doubleTapZoom.disable(element);

        // Reactivate the middle mouse and right click tools
        cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button

        // Reactivate the relevant scrollwheel tool for this element
        let multiTouchPanConfig;
        if (imageIds.length > 1) {
            // scroll is the default tool for middle mouse wheel for stacks
            cornerstoneTools.stackScrollWheel.activate(element);

            if (gestures['stackScrollMultiTouch'].enabled === true) {
                cornerstoneTools.stackScrollMultiTouch.activate(element); // Three finger scroll
            }

            multiTouchPanConfig = {
                testPointers(eventData) {
                    return (eventData.numPointers === 2);
                }
            };

            cornerstoneTools.panMultiTouch.setConfiguration(multiTouchPanConfig);
        } else {
            // zoom is the default tool for middle mouse wheel for single images (non stacks)
            cornerstoneTools.zoomWheel.activate(element);

            multiTouchPanConfig = {
                testPointers(eventData) {
                    return (eventData.numPointers >= 2);
                }
            };
            cornerstoneTools.panMultiTouch.setConfiguration(multiTouchPanConfig);
        }

        // This block ensures that the middle mouse and scroll tools keep working
        if (tool === 'pan') {
            cornerstoneTools.pan.activate(element, 3); // 3 means left mouse button and middle mouse button
        } else if (tool === 'crosshairs') {
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            const currentFrameOfReferenceUID = getFrameOfReferenceUID(element);
            if (currentFrameOfReferenceUID) {
                updateCrosshairsSynchronizer(currentFrameOfReferenceUID);
                const synchronizer = crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID];

                // Activate the chosen tool
                tools[tool].mouse.activate(element, 1, synchronizer);
            }
        } else if (tool === 'zoom') {
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            cornerstoneTools.zoom.activate(element, 5); // 5 means left mouse button and right mouse button
        } else {
            // Reactivate the middle mouse and right click tools
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button

            // Activate the chosen tool
            tools[tool].mouse.activate(element, 1);
        }

        if (tools[tool].touch) {
            tools[tool].touch.activate(element);
        }

        if (gestures['zoomTouchPinch'].enabled === true) {
            cornerstoneTools.zoomTouchPinch.activate(element); // Two finger pinch
        }

        if (gestures['panMultiTouch'].enabled === true) {
            cornerstoneTools.panMultiTouch.activate(element); // Two or >= Two finger pan
        }

        if (gestures['doubleTapZoom'].enabled === true) {
            cornerstoneTools.doubleTapZoom.activate(element);
        }
    },
    setActiveTool(tool, elements) {
        if (!initialized) {
            toolManager.init();
        }

        /**
         * TODO: Add textMarkerDialogs template to OHIF's
         */
        const dialog = document.getElementById('textMarkerOptionsDialog');
        if(dialog) {
            if (tool === 'spine' && activeTool !== 'spine' && dialog.getAttribute('open') !== 'open') {
                dialog.show();
            } else if(activeTool !== 'spine' && dialog.getAttribute("open") === "open") {
                dialog.close();
            }
        }
        
        /** 
         * TODO: Use Session variables to activate a button and use Helpers like in toolbarSectionButton.js from OHIF’s. 
         */
        // Set the div to active for the tool
        $('.imageViewerButton').removeClass('active');
        const toolButton = document.getElementById(tool);
        if (toolButton) {
            toolButton.classList.add('active');
        }

        if (!tool) {
            tool = defaultTool;
        }

        if (!elements || !elements.length) {
            elements = $('.imageViewerViewport');
        }

        // Otherwise, set the active tool for all viewport elements
        $(elements).each((index, element) => {
            toolManager.setActiveToolForElement(tool, element);
        });
        activeTool = tool;

        // Store the active tool in the session in order to enable reactivity
        Session.set('ToolManagerActiveTool', tool);
    },
    getActiveTool() {
        if (!activeTool) {
            activeTool = defaultTool;
        }

        return activeTool;
    },
    setDefaultTool(tool) {
        defaultTool = tool;
    },
    getDefaultTool() {
        return defaultTool;
    },
    setConfigureTools(configureTools) {
        if(typeof configureTools === 'function') {
            this.configureTools = configureTools;
        }
    },
    activateCommandButton(button) {
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];

        if(activeCommandButtons.indexOf(button) === -1) {
            activeCommandButtons.push('link');
            Session.set('ToolManagerActiveCommandButtons', activeCommandButtons);
        }
    },
    deactivateCommandButton(button) {
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];
        const index = activeCommandButtons.indexOf(button);

        if(index !== -1) {
            activeCommandButtons.splice(index, 1);
            Session.set('ToolManagerActiveCommandButtons', activeCommandButtons);
        }
    }
};
