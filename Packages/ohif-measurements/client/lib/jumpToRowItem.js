import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

function renderIntoViewport(measurementData, enabledElement, viewportIndex) {
    const { activateMeasurements, findAndRenderDisplaySet } = OHIF.measurements;
    const { studyInstanceUid, seriesInstanceUid, sopInstanceUid } = measurementData;
    const { element } = enabledElement;

    return new Promise((resolve, reject) => {
        const renderedCallback = element => {
            activateMeasurements(element, measurementData);
            $(element).one('CornerstoneImageRendered', () => resolve());
        };

        // Check if the study / series we need is already the one in the viewport
        if (enabledElement && enabledElement.image) {
            const imageId = enabledElement.image.imageId;
            const series = cornerstone.metaData.get('series', imageId);
            const study = cornerstone.metaData.get('study', imageId);

            const isSameStudy = study.studyInstanceUid === measurementData.studyInstanceUid;
            const isSameSeries = series.seriesInstanceUid === measurementData.seriesInstanceUid;
            if (isSameStudy && isSameSeries) {
                // If it is, activate the measurements in this viewport and stop here
                renderedCallback(element);
            }
        }

        // Otherwise, re-render the viewport with the required study/series, then add an rendered
        // callback to activate the measurements

        // @TypeSafeStudies
        const study = OHIF.viewer.Studies.findBy({ studyInstanceUid });

        // TODO: Support frames? e.g. for measurements on multi-frame instances
        findAndRenderDisplaySet(study.displaySets, viewportIndex, studyInstanceUid, seriesInstanceUid, sopInstanceUid, renderedCallback);
    });
}

function syncViewports(viewportsIndexes) {
    const synchronizer = OHIF.viewer.stackImagePositionOffsetSynchronizer;
    const linkableViewports = synchronizer.getLinkableViewports();
    if (linkableViewports.length) {
        const linkableViewportsIndexes = _.pluck(linkableViewports, 'index');
        const indexes = _.intersection(linkableViewportsIndexes, viewportsIndexes);
        if (indexes.length) {
            OHIF.viewer.stackImagePositionOffsetSynchronizer.activateByViewportIndexes(indexes);
        }
    }
}

// Store the lastActivatedRowItem to cancel jumping if another rowItem was triggered during loading
let lastActivatedRowItem;

/**
 * Activates a set of lesions when lesion table row is clicked
 *
 * @param measurementId The unique key for a specific Measurement
 */
OHIF.measurements.jumpToRowItem = (rowItem, timepoints) => {
    lastActivatedRowItem = rowItem;

    // Retrieve the list of available viewports
    const $viewports = $('.imageViewerViewport');
    const numViewports = Math.max($viewports.length, 0);

    // Retrieve the timepoints that are currently being displayed in the  Measurement Table
    const numTimepoints = Math.max(timepoints.length, 1);

    const numViewportsToUpdate = Math.min(numTimepoints, numViewports);

    // Retrieve the measurements data
    const measurementsData = [];
    const promises = new Set();
    for (let i = 0; i < numViewportsToUpdate; i++) {
        const { timepointId } = timepoints[i];

        const dataAtThisTimepoint = _.where(rowItem.entries, { timepointId });
        if (!dataAtThisTimepoint || !dataAtThisTimepoint.length) continue;

        const measurementData = dataAtThisTimepoint[0];
        measurementsData.push(measurementData);
        const promise = OHIF.studies.loadStudy(measurementData.studyInstanceUid);
        promise.then(() => OHIF.measurements.syncMeasurementAndToolData(measurementData));
        promises.add(promise);
    }

    // Wait for studies metadata to be retrieved before jumpint to the given row item
    Promise.all(promises).then(() => {
        // Stop here if another rowItem was activated during loading process
        if (rowItem !== lastActivatedRowItem) return;

        OHIF.measurements.deactivateAllToolData();

        const activatedViewportIndexes = [];

        // Deactivate stack synchronizer because it will be re-activated later
        OHIF.viewer.stackImagePositionOffsetSynchronizer.deactivate();

        //  Display timepoints in the order of viewports which is set by the hanging protocol
        //  Reverse the array if the first timepoint does not match with the first viewport data
        const layoutManager = OHIF.viewerbase.layoutManager;
        const viewportData = layoutManager.viewportData[0];
        if (timepoints[0].studyInstanceUids.indexOf(viewportData.studyInstanceUid) < 0) {
            timepoints.reverse();
        }

        const renderPromises = [];
        for (let viewportIndex = 0; viewportIndex < numViewportsToUpdate; viewportIndex++) {
            const measurementData = measurementsData[viewportIndex];
            if (!measurementData) continue;

            activatedViewportIndexes.push(viewportIndex);

            const element = $viewports.get(viewportIndex);

            // TODO: Implement isEnabledElement in Cornerstone
            // or maybe just remove the 'error' this throws?
            let enabledElement;
            try {
                enabledElement = cornerstone.getEnabledElement(element);
            } catch(error) {
                continue;
            }

            const promise = renderIntoViewport(measurementData, enabledElement, viewportIndex);
            renderPromises.push(promise);
        }

        // Wait for all viewports to be rendered then sync them
        Promise.all(renderPromises).then(() => syncViewports(activatedViewportIndexes));
    });
};
