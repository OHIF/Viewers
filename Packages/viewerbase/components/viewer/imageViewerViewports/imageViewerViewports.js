Template.imageViewerViewports.helpers({
    height: function() {
        var viewportRows = this.viewportRows || 1;
        return 100 / viewportRows;
    },
    width: function() {
        var viewportColumns = this.viewportColumns || 1;
        return 100 / viewportColumns;
    },
    viewportArray: function() {
        log.info("imageViewerViewports viewportArray");

        var studies = Session.get('studies');

        var viewportRows = this.viewportRows || 1;
        var viewportColumns = this.viewportColumns || 1;

        var contentId = this.contentId || $("#viewer").parents(".tab-pane.active").attr('id');
        if (this.viewportRows && this.viewportColumns) {
            viewportRows = this.viewportRows || 1;
            viewportColumns = this.viewportColumns || 1;
        } else if (ViewerData[contentId].viewportRows && ViewerData[contentId].viewportColumns) {
            viewportRows = ViewerData[contentId].viewportRows;
            viewportColumns = ViewerData[contentId].viewportColumns;
        }

        // Update viewerData
        ViewerData[contentId].viewportRows = viewportRows;
        ViewerData[contentId].viewportColumns = viewportColumns;
        Session.set("ViewerData", ViewerData);

        var viewportData;
        if (!$.isEmptyObject(ViewerData[contentId].loadedSeriesData)) {
            viewportData = ViewerData[contentId].loadedSeriesData;
        }

        var hangingProtocol = getHangingProtocol();
        var inputData = {
            viewportColumns: viewportColumns,
            viewportRows: viewportRows,
            studies: studies
        };
        var hangingProtocolViewportData = hangingProtocol(inputData);
        
        var array = [];
        var numViewports = viewportRows * viewportColumns;
        for (var i=0; i < numViewports; ++i) {
            var data = {
                viewportIndex: i,
                // These two are necessary because otherwise the width and height helpers
                // don't get the right data context. Seems to be related to the "each" loop.
                viewportColumns: viewportColumns,
                viewportRows: viewportRows
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