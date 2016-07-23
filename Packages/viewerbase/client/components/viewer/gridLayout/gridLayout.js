import { OHIF } from 'meteor/ohif:core';

Template.gridLayout.helpers({
    height: function() {
        var rows = this.rows || 1;
        return 100 / rows;
    },
    width: function() {
        var columns = this.columns || 1;
        return 100 / columns;
    },
    viewports: function() {
        var numViewports = this.rows * this.columns;
        var viewportData = this.viewportData;
        var numViewportsWithData = this.viewportData.length;

        if (numViewportsWithData < numViewports) {
            var difference = numViewports - numViewportsWithData;
            for (var i = 0; i < difference; i++) {
                viewportData.push({
                    viewportIndex: numViewportsWithData + i + 1,
                    rows: this.rows,
                    columns: this.columns
                });
            }
        } else if (numViewportsWithData > numViewports) {
            return viewportData.slice(0, numViewports);
        }

        return viewportData;
    }
});