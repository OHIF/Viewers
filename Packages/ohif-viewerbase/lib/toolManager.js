import { OHIF } from 'meteor/ohif:core';

var activeTool = 'wwwc';
var defaultTool = 'wwwc';

var tools = {};

var toolDefaultStates = {
    activate: [],
    deactivate: ['length', 'angle', 'annotate', 'ellipticalRoi', 'rectangleRoi'],
    enable: [],
    disable: [],
    disabledToolButtons: []
};

var initialized = false;

function configureTools() {
    // Set the configuration for the multitouch pan tool
    var multiTouchPanConfig = {
        testPointers: function(eventData) {
            return (eventData.numPointers >= 3);
        }
    };
    cornerstoneTools.panMultiTouch.setConfiguration(multiTouchPanConfig);

    // Set the text box background color
    cornerstoneTools.textStyle.setBackgroundColor('rgba(0, 0, 0, 0.95)');

    // Set the tool width
    cornerstoneTools.toolStyle.setToolWidth(2);

    // Set color for inactive tools
    cornerstoneTools.toolColors.setToolColor('#ff00ff'); //rgb(255, 255, 0)');

    // Set color for active tools
    cornerstoneTools.toolColors.setActiveColor('#00ffff'); //rgb(0, 255, 0)'

    // Set the configuration values for the text annotation (Arrow) tool
    const annotateConfig = {
        getTextCallback: getAnnotationTextCallback,
        changeTextCallback: changeAnnotationTextCallback,
        drawHandles: false,
        arrowFirst: true
    };
    cornerstoneTools.arrowAnnotate.setConfiguration(annotateConfig);

    const zoomConfig = {
        minScale: 0.05,
        maxScale: 10
    };
    cornerstoneTools.zoom.setConfiguration(zoomConfig);
}

toolManager = {
    init: function() {
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

        if (OHIF.viewer.defaultTool) {
            activeTool = OHIF.viewer.defaultTool;
        }

        configureTools();
        initialized = true;
    },
    addTool: function(name, base) {
        tools[name] = base;
    },
    getTools: function() {
        return tools;
    },
    setToolDefaultStates: function(states) {
        toolDefaultStates = states;
    },
    getToolDefaultStates: function() {
        return toolDefaultStates;
    },
    setActiveToolForElement: function(tool, element) {
        var canvases = $(element).find('canvas');
        if (element.classList.contains('empty') || !canvases.length) {
            return;
        }

        // First, deactivate the current active tool
        tools[activeTool].mouse.deactivate(element, 1);

        if (tools[activeTool].touch) {
            tools[activeTool].touch.deactivate(element);
        }

        // Enable tools based on their default states
        Object.keys(toolDefaultStates).forEach(function(action) {
            var relevantTools = toolDefaultStates[action];
            if (!relevantTools || !relevantTools.length || action === 'disabledToolButtons') {
                return;
            }

            relevantTools.forEach(function(toolType) {
                if ((action === 'activate') ||
                    (action === 'deactivate')) {
                    tools[toolType].mouse[action](element, 1);
                } else {
                    tools[toolType].mouse[action](element);
                }

                tools[toolType].touch[action](element);
            });
        });

        // Get the stack toolData
        var toolData = cornerstoneTools.getToolState(element, 'stack');
        if (!toolData || !toolData.data || !toolData.data.length) {
            return;
        }

        // Get the imageIds for this element
        var imageIds = toolData.data[0].imageIds;

        // Deactivate all the middle mouse, right click, and scroll wheel tools
        cornerstoneTools.pan.deactivate(element);
        cornerstoneTools.zoom.deactivate(element);
        cornerstoneTools.zoomWheel.deactivate(element);
        cornerstoneTools.stackScrollWheel.deactivate(element);

        // Reactivate the relevant scrollwheel tool for this element
        if (imageIds.length > 1) {
            // scroll is the default tool for middle mouse wheel for stacks
            cornerstoneTools.stackScrollWheel.activate(element);
        } else {
            // zoom is the default tool for middle mouse wheel for single images (non stacks)
            cornerstoneTools.zoomWheel.activate(element);
        }

        // This block ensures that the middle mouse and scroll tools keep working
        if (tool === 'pan') {
            cornerstoneTools.pan.activate(element, 3); // 3 means left mouse button and middle mouse button
            cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
        } else if (tool === 'zoom') {
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            cornerstoneTools.zoom.activate(element, 5); // 5 means left mouse button and right mouse button
        } else {
            // Reactivate the middle mouse and right click tools
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button

            // Activate the chosen tool
            tools[tool].mouse.activate(element, 1);
        }

        if (tools[tool].touch) {
            tools[tool].touch.activate(element);
        }

        cornerstoneTools.zoomTouchPinch.activate(element);
        cornerstoneTools.panMultiTouch.activate(element);
    },
    setActiveTool: function(tool, elements) {
        if (!initialized) {
            toolManager.init();
        }

        if (!tool) {
            tool = defaultTool;
        }

        if (!elements || !elements.length) {
            elements = $('.imageViewerViewport');
        }

        // Otherwise, set the active tool for all viewport elements
        $(elements).each(function(index, element) {
            toolManager.setActiveToolForElement(tool, element);
        });
        activeTool = tool;

        // Store the active tool in the session in order to enable reactivity
        Session.set('ToolManagerActiveTool', tool);
    },
    getActiveTool: function() {
        if (!activeTool) {
            activeTool = defaultTool;
        }

        return activeTool;
    },
    setDefaultTool: function(tool) {
        defaultTool = tool;
    },
    getDefaultTool: function() {
        return defaultTool;
    }

};
