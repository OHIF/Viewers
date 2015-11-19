ViewerWindows = new Meteor.Collection(null);

Template.imageViewerViewports.helpers({
    height: function() {
        var viewportRows = this.viewportRows || 1;
        return 100 / viewportRows;
    },
    width: function() {
        var viewportColumns = this.viewportColumns || 1;
        return 100 / viewportColumns;
    },
    viewerWindow: function() {
        ViewerWindows = new Meteor.Collection(null);

        log.info("imageViewerViewports viewportArray");

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

        var inputData = {
            viewportColumns: viewportColumns,
            viewportRows: viewportRows
        };

        var hangingProtocolViewportData = WindowManager.getHangingProtocol(inputData);

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

            ViewerWindows.insert(data);
        }
        return ViewerWindows.find();
    }
});

var savedSeriesData,
    savedViewportRows,
    savedViewportColumns;

Template.imageViewerViewports.events({
    'dblclick .imageViewerViewport': function(e) {
        var container = $(".viewerMain").get(0);
        var data;
        var contentId = this.contentId || $("#viewer").parents(".tab-pane.active").attr('id');

        // If there is more than one viewport on screen
        // And one of them is double-clicked, it should be rendered alone
        // If it is double-clicked again, the viewer should revert to the previous layout
        if ($(e.currentTarget).hasClass('zoomed')) {
            // Revert to saved settings
            ViewerData[contentId].loadedSeriesData = $.extend(true, {}, savedSeriesData);
            ViewerData[contentId].viewportRows = savedViewportRows;
            ViewerData[contentId].viewportColumns = savedViewportColumns;

            savedViewportRows = 0;
            savedViewportColumns = 0;

            data = {
                viewportRows: ViewerData[contentId].viewportRows,
                viewportColumns: ViewerData[contentId].viewportColumns,
            };

            // Render the imageViewerViewports template with these settings
            $('#imageViewerViewports').remove();
            UI.renderWithData(Template.imageViewerViewports, data, container);

            // Remove the 'zoomed' class from any viewports
            $('.imageViewerViewport').removeClass('zoomed');
        } else {
            // Zoom to single viewport

            // If only one viewport is on-screen, stop here
            if (ViewerData[contentId].viewportRows === 1 &&
                ViewerData[contentId].viewportColumns === 1) {
                return;
            }

            // Save the current settings
            savedSeriesData = $.extend(true, {}, ViewerData[contentId].loadedSeriesData);
            savedViewportRows = ViewerData[contentId].viewportRows;
            savedViewportColumns = ViewerData[contentId].viewportColumns;
            
            // Get the clicked-on viewport's index
            var viewportIndex = this.viewportIndex;

            // Set the first viewport's data to be the same as the currently clicked-on viewport
            ViewerData[contentId].loadedSeriesData[0] = ViewerData[contentId].loadedSeriesData[viewportIndex];

            // Set the basic template data
            data = {
                viewportRows: 1,
                viewportColumns: 1
            };

            // Render the imageViewerViewports template with these settings
            $('#imageViewerViewports').remove();
            UI.renderWithData(Template.imageViewerViewports, data, container);

            // Add the 'zoomed' class to the lone remaining viewport
            $('.imageViewerViewport').eq(0).addClass('zoomed');

        }
    }
});