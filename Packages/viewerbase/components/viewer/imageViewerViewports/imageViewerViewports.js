Template.imageViewerViewports.helpers({
    height: function() {
        var viewportRows;
        if (!Template.parentData(1).viewportRows) {
            viewportRows = 1;
        } else {
            viewportRows = Template.parentData(1).viewportRows.curValue; //Having issues with .get(), not sure why?
        }
        return 100 / viewportRows;
    },
    width: function() {
        var viewportColumns;
        if (!Template.parentData(1).viewportColumns) {
            viewportColumns = 1;
        } else {
            viewportColumns = Template.parentData(1).viewportColumns.curValue;  //Having issues with .get(), not sure why?
        }
        return 100 / viewportColumns;
    },
    viewportArray: function() {
        // This is a really annoying thing to have to do, but Meteor
        // doesn't want to let me use another type of helper.
        var viewportRows;
        if (!this.viewportRows) {
            viewportRows = 1;
        } else {
            viewportRows = this.viewportRows.curValue; //Having issues with .get(), not sure why?
        }

        var viewportColumns;
        if (!this.viewportColumns) {
            viewportColumns = 1;
        } else {
            viewportColumns = this.viewportColumns.curValue; //Having issues with .get(), not sure why?
        }
        
        var viewportData;
        if (OHIF && OHIF.viewer && !$.isEmptyObject(OHIF.viewer.imageViewerLoadedSeriesDictionary)) {
            viewportData = OHIF.viewer.imageViewerLoadedSeriesDictionary;
        }

        var hangingProtocol = getHangingProtocol();
        var inputData = {
            viewportColumns: viewportColumns,
            viewportRows: viewportRows,
            studies: this.studies
        };
        var hangingProtocolViewportData = hangingProtocol(inputData);
        
        var array = [];
        var numViewports = viewportRows * viewportColumns;
        for (var i=0; i < numViewports; ++i) {
            var data = {
                viewportIndex: i,
                studies: this.studies,
                activeViewport: this.activeViewport
            };
            if (viewportData && viewportData[i]) {
                data.seriesInstanceUid = viewportData[i].seriesInstanceUid;
                data.studyInstanceUid = viewportData[i].studyInstanceUid;
                data.currentImageIdIndex = viewportData[i].currentImageIdIndex;
                data.viewport = viewportData[i].viewport;
            } else if (hangingProtocolViewportData && hangingProtocolViewportData[i]) {
                data.seriesInstanceUid = hangingProtocolViewportData[i].seriesInstanceUid;
                data.studyInstanceUid = hangingProtocolViewportData[i].studyInstanceUid;
                data.currentImageIdIndex = hangingProtocolViewportData[i].currentImageIdIndex;
                data.viewport = hangingProtocolViewportData[i].viewport;
            }
            array.push(data);
        }
        return array;
    },
});