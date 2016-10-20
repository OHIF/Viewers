import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.imageViewerViewport.events({
    CornerstoneToolsMouseClick(event, instance, data) {
        const toolState = cornerstoneTools.getToolState(instance.element, 'bidirectional');

        // Stop here if no tool state was found
        if (!toolState) {
            return;
        }

        setTimeout(() => {
            for (let i = 0; i < toolState.data.length; i++) {
                const toolData = toolState.data[i];
                if (toolData.active) {
                    OHIF.measurements.toggleLabelButton({
                        instance,
                        toolData,
                        position: data.currentPoints.page
                    });
                    break;
                }
            }
        });
    }
});
