import { OHIF } from 'meteor/ohif:core';

OHIF.viewer = {};

// Move display sets forward or backward in the given viewport index
OHIF.viewer.moveSingleViewportDisplaySets = (viewportIndex, isNext) => {
    // Get the selected viewport data
    const viewportData = window.layoutManager.viewportData[viewportIndex];

    // Get the current study
    const currentStudy = _.findWhere(window.layoutManager.studies, {
        studyInstanceUid: viewportData.studyInstanceUid
    }) || window.layoutManager.studies[0];

    // Get the display sets
    const displaySets = currentStudy.displaySets;

    // Get the current display set
    const currentDisplaySet = _.findWhere(displaySets, {
        displaySetInstanceUid: viewportData.displaySetInstanceUid
    });

    // Get the new index and ensure that it will exists in display sets
    let newIndex = _.indexOf(displaySets, currentDisplaySet);
    if (isNext) {
        newIndex++;
        if (newIndex >= displaySets.length) {
            // Stop here if looping is now allowing
            if (!OHIF.uiSettings.displaySetNavigationLoopOverSeries) {
                return;
            }

            newIndex = 0;
        }
    } else {
        newIndex--;
        if (newIndex < 0) {
            // Stop here if looping is now allowing
            if (!OHIF.uiSettings.displaySetNavigationLoopOverSeries) {
                return;
            }

            newIndex = displaySets.length - 1;
        }
    }

    // Get the display set data for the new index
    const newDisplaySetData = displaySets[newIndex];

    // Rerender the viewport using the new display set data
    window.layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, newDisplaySetData);
};

// Move multiple display sets forward or backward in all viewports
OHIF.viewer.moveMultipleViewportDisplaySets = isNext => {
    // TODO: implement
};

// Move display sets forward or backward
OHIF.viewer.moveDisplaySets = isNext => {
    //Check if navigation is on a single or multiple viewports
    if (OHIF.uiSettings.displaySetNavigationMultipleViewports) {
        // Move display sets on multiple viewports
        OHIF.viewer.moveMultipleViewportDisplaySets(isNext);
    } else {
        // Get the selected viewport index
        const viewportIndex = Session.get('activeViewport');

        // Move display sets on a single viewport
        OHIF.viewer.moveSingleViewportDisplaySets(viewportIndex, isNext);
    }
};
