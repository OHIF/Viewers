import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { getFrameOfReferenceUID } from './getFrameOfReferenceUID';
import { updateCrosshairsSynchronizer } from './updateCrosshairsSynchronizer';
import { crosshairsSynchronizers } from './crosshairsSynchronizers';
import { annotateTextUtils } from './annotateTextUtils';
import { textMarkerUtils } from './textMarkerUtils';

let defaultTool = 'wwwc';
let activeTool;
let defaultMouseButtonTools;

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
    },
    textBoxConfig: {
        centering: {
            x: true,
            y: true
        }
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

        // if a default tool is globally defined, make it the default tool...
        if (OHIF.viewer.defaultTool) {
            defaultTool = OHIF.viewer.defaultTool;
        }

        defaultMouseButtonTools = Meteor.settings && Meteor.settings.public && Meteor.settings.public.defaultMouseButtonTools;

        // Override default tool if defined in settings
        defaultTool = (defaultMouseButtonTools && defaultMouseButtonTools.left) || "wwwc";

        this.configureTools();
        initialized = true;
    },

    configureTools() {
        // Get Cornerstone Tools
        const { panMultiTouch, textStyle, toolStyle, toolColors,
                length, arrowAnnotate, zoom, ellipticalRoi,
                textMarker, magnify } = cornerstoneTools;

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
        length.setConfiguration(Object.assign({}, lengthConfig, shadowConfig, { drawHandlesOnHover: true }));

        // Add shadow to length tool
        ellipticalRoi.setConfiguration(Object.assign({}, ellipticalRoiConfig, shadowConfig));

        // Set the configuration values for the Text Marker (Spine Labelling) tool
        const $startFrom = $('#startFrom');
        const $ascending = $('#ascending');
        const textMarkerConfig = {
            markers: [ 'L5', 'L4', 'L3', 'L2', 'L1', // Lumbar spine
                         'T12', 'T11', 'T10', 'T9', 'T8', 'T7', // Thoracic spine
                         'T6', 'T5', 'T4', 'T3', 'T2', 'T1',
                         'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1', // Cervical spine
            ],
            current: $startFrom.val(),
            ascending: $ascending.is(':checked'),
            loop: true,
            changeTextCallback: textMarkerUtils.changeTextCallback,
            shadow: shadowConfig.shadow,
            shadowColor: shadowConfig.shadowColor,
            shadowOffsetX: shadowConfig.shadowOffsetX,
            shadowOffsetY: shadowConfig.shadowOffsetY
        };
        textMarker.setConfiguration(textMarkerConfig);

        // Set the configuration values for the text annotation (Arrow) tool
        const annotateConfig = {
            getTextCallback: annotateTextUtils.getTextCallback,
            changeTextCallback: annotateTextUtils.changeTextCallback,
            drawHandles: false,
            arrowFirst: true
        };
        arrowAnnotate.setConfiguration(annotateConfig);

        const zoomConfig = {
            minScale: 0.05,
            maxScale: 10
        };
        zoom.setConfiguration(zoomConfig);

        const magnifyConfig = {
            magnifySize: 300,
            magnificationLevel: 3
        };
        magnify.setConfiguration(magnifyConfig);
    },
    /**
     * This function searches an object to return the keys that contain a specific value
     *
     * @param object {object} The object to be searched
     * @param value The value to be found
     *
     * @returns {array} The keys for which the object has the specified value
     */
    getKeysByValue(object, value) {
        // http://stackoverflow.com/questions/9907419/javascript-object-get-key-by-value
        return Object.keys(object).filter(key => object[key] === value);
    },

    configureLoadProcess() {
        // Whenever the CornerstoneImageLoadProgress is fired, identify which viewports
        // the "in-progress" image is to be displayed in. Then pass the percent complete
        // via the Meteor Session to the other templates to be displayed in the relevant viewports.
        $(cornerstone.events).on('CornerstoneImageLoadProgress', (e, eventData) => {
            viewportIndices = this.getKeysByValue(window.ViewportLoading, eventData.imageId);
            viewportIndices.forEach(viewportIndex => {
                Session.set('CornerstoneLoadProgress' + viewportIndex, eventData.percentComplete);
            });

            const encodedId = OHIF.string.encodeId(eventData.imageId);
            Session.set('CornerstoneThumbnailLoadProgress' + encodedId, eventData.percentComplete);
        });
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
        Object.keys(toolDefaultStates).forEach(action => {
            const relevantTools = toolDefaultStates[action];
            if (!relevantTools || !relevantTools.length || action === 'disabledToolButtons') return;
            relevantTools.forEach(toolType => {
                // the currently active tool has already been deactivated and can be skipped
                if (action === 'deactivate' && toolType === activeTool) return;

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

        const defaultMouseButtonToolNameMiddle = (defaultMouseButtonTools && defaultMouseButtonTools.middle) || "pan";
        const defaultMouseButtonToolMiddle = cornerstoneTools[defaultMouseButtonToolNameMiddle];

        const defaultMouseButtonToolNameRight = (defaultMouseButtonTools && defaultMouseButtonTools.right) || "zoom";
        const defaultMouseButtonToolRight = cornerstoneTools[defaultMouseButtonToolNameRight];

        // Deactivate all the middle mouse, right click, and scroll wheel tools
        defaultMouseButtonToolMiddle.deactivate(element);
        defaultMouseButtonToolRight.deactivate(element);
        cornerstoneTools.zoomWheel.deactivate(element);
        cornerstoneTools.stackScrollWheel.deactivate(element);
        cornerstoneTools.panMultiTouch.disable(element);
        cornerstoneTools.zoomTouchPinch.disable(element);
        cornerstoneTools.stackScrollMultiTouch.disable(element);
        cornerstoneTools.doubleTapZoom.disable(element);

        // Reactivate the middle mouse and right click tools
        defaultMouseButtonToolRight.activate(element, 4); // zoom is the default tool for right mouse button

        // Reactivate the relevant scrollwheel tool for this element
        let multiTouchPanConfig;
        if (imageIds.length > 1) {
            // scroll is the default tool for middle mouse wheel for stacks
            cornerstoneTools.stackScrollWheel.activate(element);

            if (gestures.stackScrollMultiTouch.enabled === true) {
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
        if (tool === defaultMouseButtonToolNameMiddle) {
            defaultMouseButtonToolMiddle.activate(element, 3); // 3 means left mouse button and middle mouse button
        } else if (tool === 'crosshairs') {
            defaultMouseButtonToolMiddle.activate(element, 2); // pan is the default tool for middle mouse button
            const currentFrameOfReferenceUID = getFrameOfReferenceUID(element);
            if (currentFrameOfReferenceUID) {
                updateCrosshairsSynchronizer(currentFrameOfReferenceUID);
                const synchronizer = crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID];

                // Activate the chosen tool
                tools[tool].mouse.activate(element, 1, synchronizer);
            }
        } else if (tool === defaultMouseButtonToolNameRight) {
            defaultMouseButtonToolMiddle.activate(element, 2); // pan is the default tool for middle mouse button
            defaultMouseButtonToolRight.activate(element, 5); // 5 means left mouse button and right mouse button
        } else {
            // Reactivate the middle mouse and right click tools
            defaultMouseButtonToolMiddle.activate(element, 2); // pan is the default tool for middle mouse button

            // Activate the chosen tool
            tools[tool].mouse.activate(element, 1);
        }

        if (tools[tool].touch) {
            tools[tool].touch.activate(element);
        }

        if (gestures.zoomTouchPinch.enabled === true) {
            cornerstoneTools.zoomTouchPinch.activate(element); // Two finger pinch
        }

        if (gestures.panMultiTouch.enabled === true) {
            cornerstoneTools.panMultiTouch.activate(element); // Two or >= Two finger pan
        }

        if (gestures.doubleTapZoom.enabled === true) {
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
        if (dialog) {
            if (tool === 'spine' && activeTool !== 'spine' && dialog.getAttribute('open') !== 'open') {
                dialog.show();
            } else if (activeTool !== 'spine' && dialog.getAttribute('open') === 'open') {
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

        let $elements;
        if (!elements || !elements.length) {
            $elements = $('.imageViewerViewport');
        } else {
            $elements = $(elements);
        }

        // Otherwise, set the active tool for all viewport elements
        $elements.each((index, element) => {
            toolManager.setActiveToolForElement(tool, element);
        });

        activeTool = tool;

        // Store the active tool in the session in order to enable reactivity
        Session.set('ToolManagerActiveTool', tool);
    },

    getActiveTool() {
        if (!initialized) {
            toolManager.init();
        }

        // If activeTool is not defined, we should set as defaultTool
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
        if (typeof configureTools === 'function') {
            this.configureTools = configureTools;
        }
    },

    activateCommandButton(button) {
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];

        if (activeCommandButtons.indexOf(button) === -1) {
            activeCommandButtons.push(button);
            Session.set('ToolManagerActiveCommandButtons', activeCommandButtons);
        }
    },

    deactivateCommandButton(button) {
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];
        const index = activeCommandButtons.indexOf(button);

        if (index !== -1) {
            activeCommandButtons.splice(index, 1);
            Session.set('ToolManagerActiveCommandButtons', activeCommandButtons);
        }
    }
};
