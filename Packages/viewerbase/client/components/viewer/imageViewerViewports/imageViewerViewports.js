ViewerWindows = new Meteor.Collection(null);
ViewerWindows._debugName = 'ViewerWindows';

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
        log.info('ViewerWindows');
        //log.info(ViewerWindows.find().fetch());
        ViewerWindows.remove({});

        log.info('imageViewerViewports viewportArray');

        var viewportRows = this.viewportRows || 1;
        var viewportColumns = this.viewportColumns || 1;

        var contentId = this.contentId || $('#viewer').parents('.tab-pane.active').attr('id');
        if (this.viewportRows && this.viewportColumns) {
            viewportRows = this.viewportRows || 1;
            viewportColumns = this.viewportColumns || 1;
        } else if (ViewerData[contentId].viewportRows && ViewerData[contentId].viewportColumns) {
            viewportRows = ViewerData[contentId].viewportRows;
            viewportColumns = ViewerData[contentId].viewportColumns;
        }

        var viewportData;
        if (!$.isEmptyObject(ViewerData[contentId].loadedSeriesData)) {
            viewportData = ViewerData[contentId].loadedSeriesData;
        }

        var inputData = {
            viewportColumns: viewportColumns,
            viewportRows: viewportRows
        };

        inputData.DisplaySetPresentationGroup = Session.get('WindowManagerPresentationGroup');
        var hangingProtocolViewportData = WindowManager.getHangingProtocol(inputData);
        if (Session.get('UseHangingProtocol')) {
            viewportData = hangingProtocolViewportData.viewports;
            viewportRows = hangingProtocolViewportData.viewportRows || viewportRows;
            viewportColumns = hangingProtocolViewportData.viewportColumns || viewportColumns;
        }

        // Update viewerData
        ViewerData[contentId].viewportRows = viewportRows;
        ViewerData[contentId].viewportColumns = viewportColumns;
        Session.set('ViewerData', ViewerData);

        this.viewportRows = viewportRows;
        this.viewportColumns = viewportColumns;

        var numViewports = viewportRows * viewportColumns;
        for (var i = 0; i < numViewports; ++i) {
            var data = {
                viewportIndex: i,
                // These two are necessary because otherwise the width and height helpers
                // don't get the right data context. Seems to be related to the "each" loop.
                viewportColumns: viewportColumns,
                viewportRows: viewportRows
            };

            if (viewportData && !$.isEmptyObject(viewportData[i])) {
                data.seriesInstanceUid = viewportData[i].seriesInstanceUid;
                data.studyInstanceUid = viewportData[i].studyInstanceUid;
                data.currentImageIdIndex = viewportData[i].currentImageIdIndex;
                data.viewport = viewportData[i].viewport;
            } else if (hangingProtocolViewportData && !$.isEmptyObject(hangingProtocolViewportData.viewports[i])) {
                data.seriesInstanceUid = hangingProtocolViewportData.viewports[i].seriesInstanceUid;
                data.studyInstanceUid = hangingProtocolViewportData.viewports[i].studyInstanceUid;
                data.currentImageIdIndex = hangingProtocolViewportData.viewports[i].currentImageIdIndex;
                data.viewport = hangingProtocolViewportData.viewports[i].viewport;
            }

            ViewerWindows.insert(data);
        }

        // Here we will find out if we need to load any other studies into the viewer

        // We will make a list of unique studyInstanceUids
        var uniqueStudyInstanceUids = [];

        // Meteor doesn't support Mongo's 'distinct' function, so we have to do this in a loop
        var windows = ViewerWindows.find({}, {
            reactive: false
        }).fetch();

        windows.forEach(function(window) {
            var studyInstanceUid = window.studyInstanceUid;
            if (!studyInstanceUid) {
                return;
            }

            // If this studyInstanceUid is already in the list, stop here
            if (uniqueStudyInstanceUids.indexOf(studyInstanceUid) > -1) {
                return;
            }

            // Otherwise, add it to the list
            uniqueStudyInstanceUids.push(studyInstanceUid);

            // If any of the associated studies is not already loaded, load it now
            var loadedStudy = ViewerStudies.findOne({
                studyInstanceUid: studyInstanceUid
            }, {
                reactive: false
            });

            if (!loadedStudy) {
                // Load the study
                getStudyMetadata(studyInstanceUid, function(study) {
                    log.info("imageViewerViewports GetStudyMetadata: " + studyInstanceUid);

                    // Sort the study's series and instances by series and instance number
                    sortStudy(study);

                    // Insert it into the ViewerStudies Collection
                    ViewerStudies.insert(study);
                });
            }
        });

        return ViewerWindows.find({}, {
            reactive: false
        }).fetch();
    }
});

var savedSeriesData,
    savedViewportRows,
    savedViewportColumns;

Template.imageViewerViewports.events({
    'CornerstoneMouseDoubleClick .imageViewerViewport': function(e) {
        var container = $('.viewerMain').get(0);
        var data;
        var contentId = this.contentId || $('#viewer').parents('.tab-pane.active').attr('id');

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
                viewportColumns: ViewerData[contentId].viewportColumns
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
