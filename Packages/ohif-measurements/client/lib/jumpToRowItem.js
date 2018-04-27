import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

// Flag that can be changed to disable automatic stack scroll linking when jumping over lesions
OHIF.measurements.automaticStackScrollLinkingEnabled = true;

function renderIntoViewport(measurementData, enabledElement, viewportIndex) {
    const { activateMeasurements, findAndRenderDisplaySet } = OHIF.measurements;
    const { element } = enabledElement;
    const { studyInstanceUid, seriesInstanceUid, sopInstanceUid } = measurementData;

    return new Promise((resolve, reject) => {
        const renderedCallback = element => {
            activateMeasurements(element, measurementData);
            $(element).one('cornerstoneimagerendered', () => resolve());
        };

        // Find the study by studyInstanceUid and render the display set
        const findAndRender = () => {
            // @TypeSafeStudies
            const study = OHIF.viewer.Studies.findBy({ studyInstanceUid });

            // TODO: Support frames? e.g. for measurements on multi-frame instances
            findAndRenderDisplaySet(
                study.displaySets,
                viewportIndex,
                studyInstanceUid,
                seriesInstanceUid,
                sopInstanceUid,
                renderedCallback
            );
        };

        // Check if the study / series we need is already the one in the viewport.
        // Otherwise, re-render the viewport with the required study/series, then add a rendered
        // callback to activate the measurements
        if (enabledElement && enabledElement.image) {
            const imageId = enabledElement.image.imageId;
            const series = cornerstone.metaData.get('series', imageId);
            const study = cornerstone.metaData.get('study', imageId);

            const isSameStudy = study.studyInstanceUid === measurementData.studyInstanceUid;
            const isSameSeries = series.seriesInstanceUid === measurementData.seriesInstanceUid;
            if (isSameStudy && isSameSeries) {
                // If it is, activate the measurements in this viewport and stop here
                OHIF.viewerbase.viewportUtils.resetViewport(viewportIndex);
                renderedCallback(element);
            } else {
                findAndRender();
            }
        } else {
            findAndRender();
        }
    });
}

function syncViewports(viewportsIndexes) {
    // Prevent stack scrolling from being linked if it's disabled
    if (!OHIF.measurements.automaticStackScrollLinkingEnabled) {
        return;
    }

    const synchronizer = OHIF.viewer.stackImagePositionOffsetSynchronizer;

    if(!synchronizer) { return; }

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
OHIF.measurements.jumpToRowItem = (rowItem, timepoints, childToolKey) => {
    const { isZoomed, zoomedViewportIndex } = OHIF.viewerbase.layoutManager;

    lastActivatedRowItem = rowItem;

    // Retrieve the list of available viewports
    const $viewports = $('.imageViewerViewport');
    const numViewports = Math.max($viewports.length, 0);

    // Clone the timepoint list to prevent modifying the original object
    let timepointList;
    if (isZoomed) {
        timepointList = [timepoints[zoomedViewportIndex]];
    } else {
        timepointList = _.clone(timepoints);
    }

    // Reverse the timepointList array if the flag is set
    if (OHIF.viewer.invertViewportTimepointsOrder) {
        timepointList.reverse();
    }

    // Retrieve the timepoints that are currently being displayed in the  Measurement Table
    const numTimepoints = Math.max(timepointList.length, 1);

    const numViewportsToUpdate = Math.min(numTimepoints, numViewports);

    // Retrieve the measurements data
    const measurementsData = [];
    const promises = new Set();
    for (let i = 0; i < numViewportsToUpdate; i++) {
        const { timepointId } = timepointList[i];

        const dataAtThisTimepoint = _.where(rowItem.entries, { timepointId });
        if (!dataAtThisTimepoint || !dataAtThisTimepoint.length) {
            measurementsData.push(null);
            continue;
        }

        const measurement = dataAtThisTimepoint[0];
        let measurementData = measurement;
        const { toolType } = measurementData;
        const { tool } = OHIF.measurements.getToolConfiguration(toolType);
        if (childToolKey) {
            measurementData = measurementData[childToolKey];
        } else if (Array.isArray(tool.childTools)) {
            tool.childTools.every(key => {
                measurementData = measurementData[key];
                return !measurementData;
            });
        }

        measurementsData.push(measurementData);
        const promise = OHIF.studies.loadStudy(measurementData.studyInstanceUid);
        promise.then(() => OHIF.measurements.syncMeasurementAndToolData(measurement));
        promises.add(promise);
    }

    // Wait for studies metadata to be retrieved before jumpint to the given row item
    Promise.all(promises).then(() => {
        // Stop here if another rowItem was activated during loading process
        if (rowItem !== lastActivatedRowItem) return;

        OHIF.measurements.deactivateAllToolData();

        const activatedViewportIndexes = [];

        // Deactivate stack synchronizer because it will be re-activated later
        const synchronizer = OHIF.viewer.stackImagePositionOffsetSynchronizer;
        if(synchronizer) {
            synchronizer.deactivate();
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
