import { OHIF } from 'meteor/ohif:core';

OHIF.viewer = {};

// Move display sets forward or backward in the selected viewport
OHIF.viewer.moveDisplaySet = isNext => {
    // Get the selected viewport index
    const viewportIndex = Session.get('activeViewport');

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
            newIndex = 0;
        }
    } else {
        newIndex--;
        if (newIndex < 0) {
            newIndex = displaySets.length - 1;
        }
    }

    // Get the display set data for the new index
    const newDisplaySetData = displaySets[newIndex];

    // Rerender the viewport using the new display set data
    window.layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, newDisplaySetData);
};
