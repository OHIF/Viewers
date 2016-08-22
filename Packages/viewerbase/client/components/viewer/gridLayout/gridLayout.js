import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

Template.gridLayout.helpers({
    // Get the height percentage for each viewport
    height() {
        const instance = Template.instance();
        const rows = instance.data.rows || 1;
        return 100 / rows;
    },

    // Get the width percentage for each viewport
    width() {
        const instance = Template.instance();
        const columns = instance.data.columns || 1;
        return 100 / columns;
    },

    // Return the viewports list
    viewports() {
        const instance = Template.instance();
        const rows = instance.data.rows;
        const columns = instance.data.columns;
        const numViewports = rows * columns;
        const viewportData = instance.data.viewportData;
        const numViewportsWithData = viewportData.length;

        // Check if the viewportData length is different from the given
        if (numViewportsWithData < numViewports) {
            // Add the missing viewports
            var difference = numViewports - numViewportsWithData;
            for (var i = 0; i < difference; i++) {
                viewportData.push({
                    viewportIndex: numViewportsWithData + i + 1,
                    rows,
                    columns
                });
            }
        } else if (numViewportsWithData > numViewports) {
            // Remove the additional viewports
            return viewportData.slice(0, numViewports);
        }

        // Return the viewports
        return viewportData;
    }
});
