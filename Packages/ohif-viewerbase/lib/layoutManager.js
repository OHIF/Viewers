import { OHIF } from 'meteor/ohif:core';

// Displays Series in Viewports given a Protocol and list of Studies
LayoutManager = class LayoutManager {
    constructor(parentNode, studies) {
        OHIF.log.info('LayoutManager');

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

        const updateSessionFn = () => Tracker.afterFlush(() => Session.set('LayoutManagerUpdated', Random.id()));
        this.updateSession = _.throttle(updateSessionFn, 300);
    }

    getNumberOfViewports() {
        return this.layoutProps.rows * this.layoutProps.columns;
    }

    setDefaultViewportData() {
        const self = this;

        // Get the number of vieports to be rendered
        const viewportsAmount = this.getNumberOfViewports();

        // Store the old viewport data and reset the current
        const oldViewportData = self.viewportData;

        // Get the studies and display sets sequence map
        const sequenceMap = OHIF.viewer.getDisplaySetSequenceMap();

        // Check if the display sets are sequenced
        const isSequenced = OHIF.viewer.isDisplaySetsSequenced(sequenceMap);

        // Define the current viewport index and the viewport data array
        let currentViewportIndex = 0;
        if (viewportsAmount > oldViewportData.length && oldViewportData.length && isSequenced) {
            // Keep the displayed display sets
            self.viewportData = oldViewportData;
            currentViewportIndex = oldViewportData.length - 1;
        } else if (viewportsAmount <= oldViewportData.length) {
            // Reduce the original displayed display sets
            self.viewportData = oldViewportData.slice(0, viewportsAmount);
            return;
        } else {
            // Reset all display sets
            self.viewportData = [];
        }

        // Get all the display sets for the viewer studies
        let displaySets = [];
        this.studies.forEach(study => {
            study.displaySets.forEach(displaySet => {
                displaySet.images.length && displaySets.push(displaySet);
            });
        });

        // Get the display sets that will be appended to the current ones
        let appendix;
        const currentLength = self.viewportData.length;
        if (currentLength) {
            // TODO: isolate displaySets array by study (maybe a map?)
            const beginIndex = sequenceMap.values().next().value[0].displaySetIndex + currentLength;
            const endIndex = beginIndex + (viewportsAmount - currentLength);
            appendix = displaySets.slice(beginIndex, endIndex);
        } else {
            // Get available display sets from the first to the grid size
            appendix = displaySets.slice(0, viewportsAmount);
        }

        // Generate the additional data based on the appendix
        const additionalData = [];
        appendix.forEach((displaySet, index) => {
            additionalData.push({
                viewportIndex: currentViewportIndex + index,
                studyInstanceUid: displaySet.studyInstanceUid,
                seriesInstanceUid: displaySet.seriesInstanceUid,
                displaySetInstanceUid: displaySet.displaySetInstanceUid,
                sopInstanceUid: displaySet.images[0].sopInstanceUid
            });
        });

        // Append the additional data with the viewport data
        self.viewportData = self.viewportData.concat(additionalData);

        // Push empty objects if the amount is lesser than the grid size
        while (self.viewportData.length < viewportsAmount) {
            self.viewportData.push({});
        }
    }

    updateViewports() {
        OHIF.log.info('updateViewports');

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
        OHIF.log.info('Zooming Into Viewport: ' + viewportIndex);

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
