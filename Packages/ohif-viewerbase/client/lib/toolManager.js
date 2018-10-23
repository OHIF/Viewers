import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';

let activeTool;
let tools = [];
let initialized = false;
let defaultTool = {
    left: 'Wwwc',
    right: 'Zoom',
    middle: 'Pan'
};
const buttonNum = {
    'left': 1,
    'right': 4,
    'middle': 2
};

/**
 * Exported "toolManager" Singleton
 */
export const toolManager = {
    init() {
        // if a default tool is globally defined, make it the default tool...
        if (OHIF.viewer.defaultTool) {
            toolManager.setDefaultTool(OHIF.viewer.defaultTool);
        }

        cornerstoneTools.init();

        tools = [
          'Length',
          'Angle',
          'ArrowAnnotate',
    			'Wwwc',
          'Zoom',
          'Pan',
          'DragProbe',
          'Magnify',
          'Crosshairs',
          'StackScroll',
          'StackScrollMouseWheel',
    			'ZoomTouchPinch',
    			'ZoomMouseWheel',
    			'EllipticalRoi',
    			'RectangleRoi',
    			'WwwcRegion'
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

    getMouseButtonMask(button) {
        return buttonNum[button] || undefined;
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

    setActiveTool(toolName, button = 'left') {
        let options = {};
        const mouseButtonMask = toolManager.getMouseButtonMask(button);
        if (mouseButtonMask) {
            options = {
                mouseButtonMask
            }
        }

        toolManager.setAllToolsPassive();
        cornerstoneTools.setToolActive(toolName, options);

        // TODO: add the active tool with the correct button
        activeTool[button] = toolName;

        // Enable reactivity
        Session.set('ToolManagerActiveToolUpdated', Random.id());
    },

    setAllToolsPassive() {
  		cornerstoneTools.store.state.tools.forEach((tool) => {
  			cornerstoneTools.setToolPassive(tool.name)
  		});
    },

    instantiateTools() {
        Array.from(tools).forEach(toolName => {
            const apiTool = cornerstoneTools[`${toolName}Tool`];
            if (apiTool) {
                cornerstoneTools.addTool(apiTool);
            }
        });
        toolManager.setAllToolsPassive();
    },

    getNearbyToolData() {
        return undefined;
    },

    getActiveTool(button = 'left') {
        if (!initialized) {
            toolManager.init();
        }

        // If activeTool is not defined, we should set as defaultTool
        if (!activeTool) {
            activeTool = defaultTool;
        }

        return activeTool[button];
    },

    setDefaultTool(tool, button = 'left') {
        defaultTool[button] = tool;
    },

    getDefaultTool(button = 'left') {
        return defaultTool[button];
    },

    activateCommandButton(button) {
        //
    },

    deactivateCommandButton(button) {
        //
    }
};

toolManager.init();
