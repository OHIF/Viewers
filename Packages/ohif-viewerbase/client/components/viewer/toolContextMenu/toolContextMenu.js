import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolManager } from '../../../lib/toolManager';

const toolTypes = ['length', 'simpleAngle', 'probe', 'ellipticalRoi', 'rectangleRoi', 'arrowAnnotate'];
const TypeToLabelMap = {
    length: 'Length',
    simpleAngle: 'Angle',
    probe: 'Probe',
    ellipticalRoi: 'Elliptical ROI',
    rectangleRoi: 'Rectangle ROI',
    arrowAnnotate: 'Annotation'
};
let dropdownItems = [{
    actionType: 'Delete',
    action: ({ nearbyToolData, eventData }) => {
        const element = eventData.element;

        cornerstoneTools.removeToolState(element, nearbyToolData.toolType, nearbyToolData.tool);
        cornerstone.updateImage(element);
    }
}];

const getTypeText = function(toolData, actionType) {
    const toolType = toolData.toolType;
    let message = `${TypeToLabelMap[toolType]}`;

    if (toolType === 'arrowAnnotate') {
        message = `${message} "${toolData.tool.text}"`;
    }

    return `${actionType} ${message}`;
};

const createDropdown = function(eventData, isTouchEvent = false) {
    const nearbyToolData = toolManager.getNearbyToolData(eventData.element, eventData.currentPoints.canvas, toolTypes);

    // Annotate tools for touch events already have a press handle to edit it, has a better UX for deleting it
    if (isTouchEvent && nearbyToolData.toolType === 'arrowAnnotate') return;

    if (nearbyToolData) {
        dropdownItems.forEach(function(item) {
            item.params = {
                eventData,
                nearbyToolData
            };
            item.text = getTypeText(nearbyToolData, item.actionType);
        });

        OHIF.ui.showDropdown(dropdownItems, {
            menuClasses: 'dropdown-menu-left',
            event: eventData.event
        });
    }
};

Template.viewerMain.events({
    'cornerstonetoolsmouseclick .imageViewerViewport'(event) {
        const { originalEvent } = event;
        const eventData = originalEvent.detail;
        if (eventData.which === 3) {
            createDropdown(eventData);
        }
    },

    'cornerstonetoolstouchpress .imageViewerViewport'(event) {
        const { originalEvent } = event;
        const eventData = originalEvent.detail;
        createDropdown(eventData, true);
    }
});
