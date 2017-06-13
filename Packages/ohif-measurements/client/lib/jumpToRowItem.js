import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

function findAndRenderDisplaySet(displaySets, viewportIndex, studyInstanceUid, seriesInstanceUid, sopInstanceUid, renderedCallback) {
        // Find the proper stack to display
    const stacksFromSeries = displaySets.filter(stack => stack.seriesInstanceUid === seriesInstanceUid);
    const stack = stacksFromSeries.find(stack => {
        const imageIndex = stack.images.findIndex(image => image.getSOPInstanceUID() === sopInstanceUid);
        return imageIndex > -1;
    });

    // TODO: make this work for multi-frame instances
    const specificImageIndex = stack.images.findIndex(image => image.getSOPInstanceUID() === sopInstanceUid);

    const displaySetData = {
        studyInstanceUid: studyInstanceUid,
        seriesInstanceUid: seriesInstanceUid,
        sopInstanceUid: sopInstanceUid,
        displaySetInstanceUid: stack.displaySetInstanceUid,
        currentImageIdIndex: specificImageIndex
    };

    // Add a renderedCallback to activate the measurements once it's
    if (renderedCallback) {
        displaySetData.renderedCallback = renderedCallback;
    }

    OHIF.viewerbase.layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, displaySetData);
}

function renderIntoViewport(viewportIndex, studyInstanceUid, seriesInstanceUid, sopInstanceUid, renderedCallback) {

    // @TypeSafeStudies
    // First, check if we already have this study loaded
    const alreadyLoadedStudy = OHIF.viewer.Studies.findBy({ studyInstanceUid });

    if (alreadyLoadedStudy) {
        // If the Study is already loaded, find the display set and render it
        findAndRenderDisplaySet(alreadyLoadedStudy.displaySets, viewportIndex, studyInstanceUid, seriesInstanceUid, sopInstanceUid, renderedCallback)
    } else {
        // If not, retrieve the study metadata and then find the relevant display set and
        // render it.
        const $viewports = $('.imageViewerViewport');
        const element = $viewports.get(viewportIndex);
        const startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
        startLoadingHandler(element);
        OHIF.studylist.retrieveStudyMetadata(studyInstanceUid).then(study => {
            OHIF.log.warn('renderIntoViewport');

            // Double check to make sure this study wasn't already inserted
            // into OHIF.viewer.Studies, so we don't cause duplicate entry errors
            const loaded = OHIF.viewer.Studies.findBy({
                studyInstanceUid: study.studyInstanceUid
            });
            if (!loaded) {
                OHIF.viewer.Studies.insert(study);
            }

            findAndRenderDisplaySet(study.displaySets, viewportIndex, studyInstanceUid, seriesInstanceUid, sopInstanceUid, renderedCallback);
        });
    }
}

function syncViewports(viewportsIndexes) {
    OHIF.viewer.stackImagePositionOffsetSynchronizer.activateByViewportIndexes(viewportsIndexes);
}

/**
 * Activates a set of lesions when lesion table row is clicked
 *
 * @param measurementId The unique key for a specific Measurement
 */
OHIF.measurements.jumpToRowItem = (rowItem, timepoints) => {
    OHIF.measurements.deactivateAllToolData();

    const activateMeasurements = OHIF.measurements.activateMeasurements;
    const activatedViewportIndexes = [];
    let syncViewportsCaller = syncViewports;
    let renderCount = 0;

    // Deactivate stack synchronizer because it will be re-activated later
    OHIF.viewer.stackImagePositionOffsetSynchronizer.deactivate();

    // Retrieve the timepoints that are currently being displayed in the
    // Measurement Table
    const numTimepoints = Math.max(timepoints.length, 1);

    // Retrieve the list of available viewports
    const $viewports = $('.imageViewerViewport');
    const numViewports = Math.max($viewports.length, 0);

    /*
    Two Timepoints, Two measurements, load Followup (FU and BA), display FU in left and BA in right
    Two Timepoints, One measurement (BA), on 2x1 view: Display BA in right
    Two Timepoints, One measurement (FU), on 2x1 view: Display FU in left

    Two Timepoints, Two measurements, load Baseline (FU and BA) on 1x1 view: Display whichever is clicked on?
    One Timepoint, One measurement: Display clicked on in 1x1
    */
    const numViewportsToUpdate = Math.min(numTimepoints, numViewports);

    for (var i=0; i < numViewportsToUpdate; i++) {
        const timepoint = timepoints[i];
        const timepointId = timepoint.timepointId;

        const dataAtThisTimepoint = _.where(rowItem.entries, {timepointId: timepointId});
        if (!dataAtThisTimepoint || !dataAtThisTimepoint.length) {
            continue;
        }

        const measurementData = dataAtThisTimepoint[0];

        // Check if the study / series we need is already the one in the viewport
        const element = $viewports.get(i);

        activatedViewportIndexes.push(i);

        // TODO: Implement isEnabledElement in Cornerstone
        // or maybe just remove the 'error' this throws?
        let enabledElement;
        try {
            enabledElement = cornerstone.getEnabledElement(element)
        } catch(error) {
            continue;
        }

        if (enabledElement && enabledElement.image) {
            const imageId = enabledElement.image.imageId;
            const series = cornerstoneTools.metaData.get('series', imageId);
            const study = cornerstoneTools.metaData.get('study', imageId);

            if (series.seriesInstanceUid === measurementData.seriesInstanceUid &&
                study.studyInstanceUid === measurementData.studyInstanceUid) {

                // If it is, activate the measurements in this viewport and stop here
                activateMeasurements(element, measurementData);
                continue;
            }
        }

        // The sync will be called only after loading all series on viewports
        syncViewportsCaller = _.after(++renderCount, syncViewports);

        // Otherwise, re-render the viewport with the required study/series, then
        // add an onRendered callback to activate the measurements
        const renderedCallback = element => {
            activateMeasurements(element, measurementData);
            syncViewportsCaller(activatedViewportIndexes);
        };

        // TODO: Support frames? e.g. for measurements on multi-frame instances
        renderIntoViewport(i,
                           measurementData.studyInstanceUid,
                           measurementData.seriesInstanceUid,
                           measurementData.sopInstanceUid,
                           renderedCallback);
    }

    // If all viewports are already rendered then sync them
    if (!renderCount) {
        syncViewportsCaller(activatedViewportIndexes);
    }
};
