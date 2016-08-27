// Displays Series in Viewports given a Protocol and list of Studies
LayoutManager = class LayoutManager {
    constructor(parentNode, studies) {
        log.info('LayoutManager');

        this.parentNode = parentNode;
        this.studies = studies;
        this.viewportData = [];
        this.layoutTemplateName = 'gridLayout';
        this.layoutProps = {
            rows: 1,
            columns: 1
        };

        this.viewportData = [];

        this.isZoomed = false;
    }

    getNumberOfViewports() {
        return this.layoutProps.rows * this.layoutProps.columns;
    }

    updateSession() {
        Tracker.afterFlush(() => Session.set('LayoutManagerUpdated', Random.id()));
    }

    setDefaultViewportData() {
        var numViewports = this.getNumberOfViewports();

        var viewportIndex = 0;
        var self = this;
        this.studies.forEach(function(study) {
            study.displaySets.forEach(function(displaySet) {
                if (!displaySet.images.length) {
                    return;
                }

                var currentViewportData;
                var existingViewportData = self.viewportData[viewportIndex];
                if (self.viewportData[viewportIndex]) {
                    currentViewportData = {
                        viewportIndex: existingViewportData.viewportIndex,
                        studyInstanceUid: existingViewportData.studyInstanceUid,
                        seriesInstanceUid: existingViewportData.seriesInstanceUid,
                        displaySetInstanceUid: existingViewportData.displaySetInstanceUid,
                        sopInstanceUid: existingViewportData.sopInstanceUid,
                        viewport: existingViewportData.viewport,
                        imageId: existingViewportData.imageId,
                        currentImageIdIndex: existingViewportData.currentImageIdIndex // TODO Remove this once currentImageIdIndex is removed from imageViewerViewports
                    };

                    self.viewportData[viewportIndex] = currentViewportData;
                } else {
                    // This tests to make sure there is actually image data in this instance
                    // TODO: Change this when we add PDF and MPEG support
                    // See https://ohiforg.atlassian.net/browse/LT-227
                    var firstInstance = displaySet.images[0];

                    // All imaging modalities must have a valid value for sopClassUid or rows
                    if (!firstInstance || (!isImage(firstInstance.sopClassUid) && !firstInstance.rows)) {
                        currentViewportData = {};
                    } else {
                        currentViewportData = {
                            viewportIndex: viewportIndex,
                            studyInstanceUid: study.studyInstanceUid,
                            seriesInstanceUid: displaySet.seriesInstanceUid,
                            displaySetInstanceUid: displaySet.displaySetInstanceUid,
                            sopInstanceUid: firstInstance.sopInstanceUid,
                            currentImageIdIndex: 0 // TODO Remove this once currentImageIdIndex is removed from imageViewerViewports
                        };
                    }

                    self.viewportData.push(currentViewportData);
                }

                viewportIndex++;

                if (viewportIndex === numViewports) {
                    return false;
                }
            });

            if (viewportIndex === numViewports) {
                return false;
            }
        });
    }

    updateViewports() {
        log.info('updateViewports');

        if (!this.viewportData ||
            !this.viewportData.length ||
            this.viewportData.length !== this.getNumberOfViewports()) {
            this.setDefaultViewportData();
        }

        // imageViewerViewports occasionally needs relevant layout data in order to set
        // the element style of the viewport in question
        var layoutProps = this.layoutProps;
        var data = $.extend({
            viewportData: []
        }, layoutProps);

        this.viewportData.forEach(function(viewportData) {
            var viewportDataAndLayoutProps = $.extend(viewportData, layoutProps);
            data.viewportData.push(viewportDataAndLayoutProps);
        });

        var layoutTemplate = Template[this.layoutTemplateName];

        $(this.parentNode).html('');
        Blaze.renderWithData(layoutTemplate, data, this.parentNode);

        this.updateSession();

        this.isZoomed = false;
    }

    /**
     * This function destroys and re-renders the imageViewerViewport template.
     * It uses the data provided to load a new display set into the produced viewport.
     *
     * @param viewportIndex
     * @param data
     */
    rerenderViewportWithNewDisplaySet(viewportIndex, data) {
        // The parent container is identified because it is later removed from the DOM
        var element = $('.imageViewerViewport').eq(viewportIndex);
        var container = element.parents('.viewportContainer').get(0);

        // Record the current viewportIndex so this can be passed into the re-rendering call
        data.viewportIndex = viewportIndex;

        // Update the dictionary of loaded displaySet for the specified viewport
        this.viewportData[viewportIndex] = {
            viewportIndex: viewportIndex,
            displaySetInstanceUid: data.displaySetInstanceUid,
            seriesInstanceUid: data.seriesInstanceUid,
            studyInstanceUid: data.studyInstanceUid,
            renderedCallback: data.renderedCallback,
            currentImageIdIndex: 0
        };

        // Remove the hover styling
        element.find('canvas').not('.magnifyTool').removeClass('faded');

        // Remove the whole template, add in the new one
        var viewportContainer = element.parents('.removable');

        var newViewportContainer = document.createElement('div');
        newViewportContainer.className = 'removable';

        // Remove the parent element of the template
        // This is a workaround since otherwise Blaze UI onDestroyed doesn't fire
        viewportContainer.remove();

        container.appendChild(newViewportContainer);

        // Render and insert the template
        Blaze.renderWithData(Template.imageViewerViewport, data, newViewportContainer);

        this.updateSession();
    }

    enlargeViewport(viewportIndex) {
        log.info('Zooming Into Viewport: ' + viewportIndex);

        if (!this.viewportData ||
            !this.viewportData.length) {
            return;
        }

        // Clone the array for later
        this.previousViewportData = this.viewportData.slice(0);

        var singleViewportData = $.extend({}, this.viewportData[viewportIndex]);
        singleViewportData.rows = 1;
        singleViewportData.columns = 1;
        singleViewportData.viewportIndex = 0;

        var data = {
            viewportData: [singleViewportData],
            rows: 1,
            columns: 1
        };

        var layoutTemplate = Template['gridLayout'];

        $(this.parentNode).html('');
        Blaze.renderWithData(layoutTemplate, data, this.parentNode);

        this.isZoomed = true;
        this.zoomedViewportIndex = viewportIndex;
        this.viewportData = data.viewportData;

        this.updateSession();
    }

    resetPreviousLayout() {
        if (!this.isZoomed) {
            return;
        }

        this.previousViewportData[this.zoomedViewportIndex] = $.extend({}, this.viewportData[0]);
        this.previousViewportData[this.zoomedViewportIndex].viewportIndex = this.zoomedViewportIndex;
        this.viewportData = this.previousViewportData;
        this.updateViewports();
    }

    toggleEnlargement(viewportIndex) {
        if (this.isZoomed) {
            this.resetPreviousLayout();
        } else {
            // Don't enlarge the viewport if we only have one Viewport
            // to begin with
            if (this.getNumberOfViewports() > 1) {
                this.enlargeViewport(viewportIndex);    
            }
        }
    }
};
