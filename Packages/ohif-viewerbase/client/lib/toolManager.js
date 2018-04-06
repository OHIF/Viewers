import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { getFrameOfReferenceUID } from './getFrameOfReferenceUID';
import { updateCrosshairsSynchronizer } from './updateCrosshairsSynchronizer';
import { crosshairsSynchronizers } from './crosshairsSynchronizers';
import { annotateTextUtils } from './annotateTextUtils';
import { textMarkerUtils } from './textMarkerUtils';
import { isTouchDevice } from './helpers/isTouchDevice';

let defaultTool = {
    left: 'wwwc',
    right: 'zoom',
    middle: 'pan'
};
let activeTool;
let defaultMouseButtonTools;

let tools = {};

let gestures = {
    zoomTouchPinch: {
        enabled: true
    },
    panMultiTouch: {
        enabled: true,
        numPointers: 2
    },
    stackScrollMultiTouch: {
        enabled: true,
        numPointers: 3
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
            touch: cornerstoneTools.panTouchDrag,
            multiTouch: cornerstoneTools.panMultiTouch
        });
        toolManager.addTool('stackScroll', {
            mouse: cornerstoneTools.stackScroll,
            touch: cornerstoneTools.stackScrollTouchDrag,
            multiTouch: cornerstoneTools.stackScrollMultiTouch
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

        toolManager.addTool('scaleOverlayTool', {
          mouse: cornerstoneTools.scaleOverlayTool,
        });

        // if a default tool is globally defined, make it the default tool...
        if (OHIF.viewer.defaultTool) {
            this.setDefaultTool(OHIF.viewer.defaultTool);
        }

        defaultMouseButtonTools = Meteor.settings && Meteor.settings.public && Meteor.settings.public.defaultMouseButtonTools;

        // Override default tool if defined in settings
        if (defaultMouseButtonTools) {
            if (defaultMouseButtonTools.left) {
                this.setDefaultTool(defaultMouseButtonTools.left);
            }
            if (defaultMouseButtonTools.right) {
                this.setDefaultTool(defaultMouseButtonTools.right, 'right');
            }
            if (defaultMouseButtonTools.middle) {
                this.setDefaultTool(defaultMouseButtonTools.middle, 'middle');
            }
        }

        this.configureTools();
        initialized = true;
    },

    configureTools() {
        // Get Cornerstone Tools
        const { textStyle, toolStyle, toolColors,
            length, arrowAnnotate, zoom, ellipticalRoi,
            textMarker, magnify } = cornerstoneTools;

        // Set text box background color
        textStyle.setBackgroundColor('transparent');

        // Set the tool font and font size
        // context.font = "[style] [variant] [weight] [size]/[line height] [font family]";
        const fontFamily = 'Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';
        textStyle.setFont('15px ' + fontFamily);

        // Set the tool width
        toolStyle.setToolWidth(2);

        // Set color for inactive tools
        toolColors.setToolColor('rgb(255, 255, 0)'); // yellow

        // Set color for active tools
        toolColors.setActiveColor('rgb(50, 205, 50)'); // limegreen

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

        if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.defaultGestures) {
            gestures.zoomTouchPinch = Meteor.settings.public.defaultGestures.zoomTouchPinch || gestures.zoomTouchPinch;
            gestures.stackScrollMultiTouch = Meteor.settings.public.defaultGestures.stackScrollMultiTouch || gestures.stackScrollMultiTouch;
            gestures.panMultiTouch = Meteor.settings.public.defaultGestures.panMultiTouch || gestures.panMultiTouch;
            gestures.doubleTapZoom = Meteor.settings.public.defaultGestures.doubleTapZoom || gestures.doubleTapZoom;
        }

        //  Set number of fingers to stack scroll
        if (gestures.stackScrollMultiTouch.enabled === true && gestures.stackScrollMultiTouch.numPointers) {
            const stackScrollMultiTouchConfig = {
                testPointers(eventData) {
                    return (eventData.numPointers === gestures.stackScrollMultiTouch.numPointers);
                }
            };
            cornerstoneTools.stackScrollMultiTouch.setConfiguration(stackScrollMultiTouchConfig);
        }

        //  Set number of fingers to pan
        if (gestures.panMultiTouch.enabled === true && gestures.panMultiTouch.numPointers) {
            const panMultiTouchConfig = {
                testPointers(eventData) {
                    return (eventData.numPointers === gestures.panMultiTouch.numPointers);
                }
            };
            cornerstoneTools.panMultiTouch.setConfiguration(panMultiTouchConfig);
        }
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
        // Whenever CornerstoneImageLoadProgress is fired, identify which viewports
        // the "in-progress" image is to be displayed in. Then pass the percent complete
        // via the Meteor Session to the other templates to be displayed in the relevant viewports.

        function handleLoadProgress (e) {
            const eventData = e.detail;
            const viewportIndices = toolManager.getKeysByValue(window.ViewportLoading, eventData.imageId);
            viewportIndices.forEach(viewportIndex => {
                Session.set('CornerstoneLoadProgress' + viewportIndex, eventData.percentComplete);
            });

            const encodedId = OHIF.string.encodeId(eventData.imageId);
            Session.set('CornerstoneThumbnailLoadProgress' + encodedId, eventData.percentComplete);
        }

        cornerstone.events.removeEventListener('cornerstoneimageloadprogress', handleLoadProgress);
        cornerstone.events.addEventListener('cornerstoneimageloadprogress', handleLoadProgress);
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

    setActiveToolForElement(toolId, element, button) {
        const canvases = $(element).find('canvas');
        if (element.classList.contains('empty') || !canvases.length) {
            return;
        }

        // If button is not defined, we should consider it left
        if (!button) {
            button = 'left';
        }

        // First, deactivate the current active tool
        tools[activeTool.left].mouse.deactivate(element, 1); // 1 means left mouse button
        tools[activeTool.middle].mouse.deactivate(element, 2); // 2 means middle mouse button
        tools[activeTool.right].mouse.deactivate(element, 4); // 3 means right mouse button

        if (tools[activeTool.left].touch) {
            tools[activeTool.left].touch.deactivate(element);
        }

        if (tools[activeTool.right].multiTouch) {
            tools[activeTool.right].multiTouch.disable(element);
        }

        // Enable tools based on their default states
        Object.keys(toolDefaultStates).forEach(action => {
            const relevantTools = toolDefaultStates[action];
            if (!relevantTools || !relevantTools.length || action === 'disabledToolButtons') return;
            relevantTools.forEach(toolType => {
                // the currently active tool has already been deactivated and can be skipped
                if (action === 'deactivate' &&
                    (toolType === activeTool.left ||
                        toolType === activeTool.middle ||
                        toolType === activeTool.right)) {
                    return;
                }

                tools[toolType].mouse[action](
                    element,
                    (action === 'activate' || action === 'deactivate' ? 1 : void 0)
                );

                if (tools[toolType].touch) {
                    tools[toolType].touch[action](element);
                }

                if (tools[toolType].multiTouch) {
                    tools[toolType].multiTouch[action](element);
                }
            });
        });

        // Get the stack toolData
        const toolData = cornerstoneTools.getToolState(element, 'stack');
        if (!toolData || !toolData.data || !toolData.data.length) {
            return;
        }

        // Get the imageIds for this element
        const imageIds = toolData.data[0].imageIds;

        // Get the mouse button tools
        let newToolIdLeft = activeTool.left;
        if (button === 'left') {
            newToolIdLeft = toolId;
        }

        const newCornerstoneToolLeft = tools[newToolIdLeft]; // left mouse tool is used for touch as well

        let newToolIdMiddle = activeTool.middle;
        if (button === 'middle') {
            newToolIdMiddle = toolId;
        }

        const newCornerstoneToolMiddle = cornerstoneTools[newToolIdMiddle];

        let newToolIdRight = activeTool.right;
        if (button === 'right') {
            newToolIdRight = toolId;
        }

        const newCornerstoneToolRight = tools[newToolIdRight]; // right mouse tool is used for multi-touch as well

        // Deactivate scroll wheel tools
        cornerstoneTools.zoomWheel.deactivate(element);
        cornerstoneTools.stackScrollWheel.deactivate(element);
        cornerstoneTools.panMultiTouch.disable(element);
        cornerstoneTools.zoomTouchPinch.disable(element);
        cornerstoneTools.stackScrollMultiTouch.disable(element);
        cornerstoneTools.doubleTapZoom.disable(element);

        // Reactivate the relevant scrollwheel tool for this element
        if (imageIds.length > 1) {
            // scroll is the default tool for middle mouse wheel for stacks
            cornerstoneTools.stackScrollWheel.activate(element);

            // 3 or more finger stack scroll
            if (gestures.stackScrollMultiTouch.enabled === true && gestures.stackScrollMultiTouch.numPointers >= 3) {
                const stackScrollMultiTouchConfig = {
                    testPointers(eventData) {
                        return (eventData.numPointers === gestures.stackScrollMultiTouch.numPointers);
                    }
                };
                cornerstoneTools.stackScrollMultiTouch.setConfiguration(stackScrollMultiTouchConfig);
                cornerstoneTools.stackScrollMultiTouch.activate(element);
            }
        } else {
            // zoom is the default tool for middle mouse wheel for single images (non stacks)
            cornerstoneTools.zoomWheel.activate(element);
        }

        // 3 or more finger pan
        if (gestures.panMultiTouch.enabled === true && gestures.panMultiTouch.numPointers >= 3) {
            const panMultiTouchConfig = {
                testPointers(eventData) {
                    return (eventData.numPointers === gestures.panMultiTouch.numPointers);
                }
            };
            cornerstoneTools.panMultiTouch.setConfiguration(panMultiTouchConfig);
            cornerstoneTools.panMultiTouch.activate(element);
        }

        // TODO: Remove this messy approach for adding synchronizer when necessary.
        let leftToolSynchronizer;
        if (newToolIdLeft === 'crosshairs') {
            const currentFrameOfReferenceUID = getFrameOfReferenceUID(element);
            if (currentFrameOfReferenceUID) {
                updateCrosshairsSynchronizer(currentFrameOfReferenceUID);
                leftToolSynchronizer = crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID];
            }

            if (newToolIdLeft === newToolIdMiddle && newToolIdMiddle === newToolIdRight) {
                newCornerstoneToolRight.mouse.activate(element, 7); // 7 means left mouse button, right mouse button and middle mouse button
            } else if (newToolIdLeft === newToolIdMiddle) {
                newCornerstoneToolMiddle.activate(element, 3); // 3 means left mouse button and middle mouse button
                newCornerstoneToolRight.mouse.activate(element, 4); // 4 means right mouse button
            } else if (newToolIdMiddle === newToolIdRight) {
                newCornerstoneToolRight.mouse.activate(element, 6); // 6 means right mouse button and middle mouse button
                newCornerstoneToolLeft.mouse.activate(element, 1, leftToolSynchronizer); // 1 means left mouse button
            } else if (newToolIdLeft === newToolIdRight) {
                newCornerstoneToolMiddle.activate(element, 2); // 2 means middle mouse button
                newCornerstoneToolRight.mouse.activate(element, 5); // 5 means left mouse button and right mouse button
            } else {
                newCornerstoneToolLeft.mouse.activate(element, 1, leftToolSynchronizer); // 1 means left mouse button
                newCornerstoneToolMiddle.activate(element, 2); // 2 means middle mouse button
                newCornerstoneToolRight.mouse.activate(element, 4); // 4 means right mouse button
            }
        } else {
            // This block ensures that all mouse button tools keep working
            if (newToolIdLeft === newToolIdMiddle && newToolIdMiddle === newToolIdRight) {
                newCornerstoneToolRight.mouse.activate(element, 7); // 7 means left mouse button, right mouse button and middle mouse button
            } else if (newToolIdLeft === newToolIdMiddle) {
                newCornerstoneToolMiddle.activate(element, 3); // 3 means left mouse button and middle mouse button
                newCornerstoneToolRight.mouse.activate(element, 4); // 4 means right mouse button
            } else if (newToolIdMiddle === newToolIdRight) {
                newCornerstoneToolRight.mouse.activate(element, 6); // 6 means right mouse button and middle mouse button
                newCornerstoneToolLeft.mouse.activate(element, 1); // 1 means left mouse button
            } else if (newToolIdLeft === newToolIdRight) {
                newCornerstoneToolMiddle.activate(element, 2); // 2 means middle mouse button
                newCornerstoneToolRight.mouse.activate(element, 5); // 5 means left mouse button and right mouse button
            } else {
                setTimeout(() => newCornerstoneToolLeft.mouse.activate(element, 1));
                // >>>> TODO Find out why it's working only with a timeout
                // newCornerstoneToolLeft.mouse.activate(element, 1); // 1 means left mouse button
                newCornerstoneToolMiddle.activate(element, 2); // 2 means middle mouse button
                newCornerstoneToolRight.mouse.activate(element, 4); // 4 means right mouse button
            }
        }

        // One finger touch
        if (newCornerstoneToolLeft.touch) {
            if (leftToolSynchronizer) {
                newCornerstoneToolLeft.touch.activate(element, leftToolSynchronizer);
            } else {
                newCornerstoneToolLeft.touch.activate(element);
            }
        }

        // Two finger swipe
        const twoFingerMultiTouchConfig = {
            testPointers(eventData) {
                return (eventData.numPointers === 2);
            }
        };
        if (newCornerstoneToolRight.multiTouch) {
            newCornerstoneToolRight.multiTouch.setConfiguration(twoFingerMultiTouchConfig);
            newCornerstoneToolRight.multiTouch.activate(element);
        } else if (gestures.panMultiTouch.enabled === true && gestures.panMultiTouch.numPointers === 2) {
            cornerstoneTools.panMultiTouch.setConfiguration(twoFingerMultiTouchConfig);
            cornerstoneTools.panMultiTouch.activate(element);
        } else if (gestures.stackScrollMultiTouch.enabled === true && gestures.stackScrollMultiTouch.numPointers === 2) {
            cornerstoneTools.stackScrollMultiTouch.setConfiguration(twoFingerMultiTouchConfig);
            cornerstoneTools.stackScrollMultiTouch.activate(element);
        }

        // Two finger pinch
        if (gestures.zoomTouchPinch.enabled === true) {
            cornerstoneTools.zoomTouchPinch.activate(element);
        }

        // Double Tap
        if (gestures.doubleTapZoom.enabled === true) {
            cornerstoneTools.doubleTapZoom.activate(element);
        }
    },

    setActiveTool(toolId, elements, button) {
        if (!initialized) {
            toolManager.init();
        }

        let $elements;
        if (!elements || !elements.length) {
            $elements = $('.imageViewerViewport');
        } else {
            $elements = $(elements);
        }

        const checkElementEnabled = function(allElementsEnabled, element) {
            try {
                cornerstone.getEnabledElement(element);

                return allElementsEnabled;
            } catch (error) {
                return true;
            }
        };

        if (!activeTool) {
            activeTool = defaultTool;
        }

        // If button is not defined, we should consider it left
        if (!button) {
            button = 'left';
        }

        const activeToolId = activeTool[button];

        /**
         * TODO: Add textMarkerDialogs template to OHIF's
         */
        const dialog = document.getElementById('textMarkerOptionsDialog');
        if (dialog) {
            if (toolId === 'spine' && activeToolId !== 'spine' && dialog.getAttribute('open') !== 'open') {
                dialog.show();
            } else if (activeToolId !== 'spine' && dialog.getAttribute('open') === 'open') {
                dialog.close();
            }
        }

        if (!toolId) {
            toolId = this.getDefaultTool(button);
        }

        // Otherwise, set the active tool for all viewport elements
        $elements.each((index, element) => {
            if (checkElementEnabled(element) === false) {
                return;
            }

            toolManager.setActiveToolForElement(toolId, element, button);
        });

        activeTool[button] = toolId;

        // Enable reactivity
        Session.set('ToolManagerActiveToolUpdated', Random.id());
    },

    getNearbyToolData(element, coords, toolTypes) {
        const allTools = this.getTools();
        const touchDevice = isTouchDevice();
        const nearbyTool = {};
        let pointNearTool = false;

        toolTypes.forEach(function(toolType) {
            const toolData = cornerstoneTools.getToolState(element, toolType);
            if (!toolData) {
                return;
            }

            toolData.data.forEach(function(data, index) {
                let toolInterfaceName = toolType;
                let toolInterface;

                // Edge cases where the tool is not the same as the typeName
                if (toolType === 'simpleAngle') {
                    toolInterfaceName = 'angle';
                } else if (toolType === 'arrowAnnotate') {
                    toolInterfaceName = 'annotate';
                }

                if (touchDevice) {
                    toolInterface = allTools[toolInterfaceName].touch;
                } else {
                    toolInterface = allTools[toolInterfaceName].mouse;
                }

                if (toolInterface.pointNearTool(element, data, coords)) {
                    pointNearTool = true;
                    nearbyTool.tool = data;
                    nearbyTool.index = index;
                    nearbyTool.toolType = toolType;
                }
            });

            if (pointNearTool) {
                return false;
            }
        });

        return pointNearTool ? nearbyTool : undefined;
    },

    getActiveTool(button) {
        if (!initialized) {
            toolManager.init();
        }

        // If activeTool is not defined, we should set as defaultTool
        if (!activeTool) {
            activeTool = defaultTool;
        }

        // If button is not defined, we should consider it left
        if (!button) {
            button = 'left';
        }

        return activeTool[button];
    },

    setDefaultTool(tool, button) {
        // If button is not defined, we should consider it left
        if (!button) {
            button = 'left';
        }

        defaultTool[button] = tool;
    },

    getDefaultTool(button) {
        // If button is not defined, we should consider it left
        if (!button) {
            button = 'left';
        }

        return defaultTool[button];
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
