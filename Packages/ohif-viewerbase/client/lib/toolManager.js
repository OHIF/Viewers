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
    left: 'wwwcTool',
    right: 'zoom',
    middle: 'pan'
};
let activeTool;

let tools = [];

let initialized = false;

/**
 * Exported "toolManager" Singleton
 */
export const toolManager = {
    init() {
        // if a default tool is globally defined, make it the default tool...
        if (OHIF.viewer.defaultTool) {
            this.setDefaultTool(OHIF.viewer.defaultTool);
        }

        tools = [
            'length',
			'angle',
			'wwwc',
			'zoom',
			'zoomTouchPinch',
			'zoomMouseWheel',
			'ellipticalRoi',
			'rectangleRoi',
			'wwwcRegion'
        ];

        initialized = true;
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

    getTools() {
        return tools;
    },

    setActiveToolForElement(toolId, element) {
        this.setAllToolsPassive(element);
        cornerstoneTools.setToolActive(element, toolId, { mouseButtonMask: 1 });
    },

    setAllToolsPassive(element) {
		cornerstoneTools.store.state.tools.forEach((tool) => {
			cornerstoneTools.setToolPassive(element, tool.name)
		})
    },
    
    instantiateTools(element) {
        Array.from(tools).forEach(toolName => {
            // Add the tool
            const apiTool = cornerstoneTools[`${toolName}Tool`];
            if (apiTool) {
                const tool = new apiTool();
                cornerstoneTools.addTool(element, tool);
            }
        });
    },

    setActiveTool(toolId, elements, button) {
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


        // Otherwise, set the active tool for all viewport elements
        $elements.each((index, element) => {
            if (checkElementEnabled(element) === false) {
                return;
            }

            toolManager.setActiveToolForElement(toolId, element);
        });

        activeTool['left'] = toolId;

        // Enable reactivity
        Session.set('ToolManagerActiveToolUpdated', Random.id());
    },

    getNearbyToolData(element, coords, toolTypes) {
        return undefined;
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

    activateCommandButton(button) {
        // 
    },

    deactivateCommandButton(button) {
        // 
    }
};
