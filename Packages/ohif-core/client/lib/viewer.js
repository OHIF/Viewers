import { OHIF } from 'meteor/ohif:core';

OHIF.viewer = {};

OHIF.viewer.getDisplaySetSequenceMap = () => {
    // Get the viewport data list
    const viewportDataList = window.layoutManager.viewportData;

    // Create a map to control the display set sequence
    const sequenceMap = new Map();

    // Iterate over each viewport and register its details on the sequence map
    viewportDataList.forEach((viewportData, viewportIndex) => {
        // Get the current study
        const currentStudy = _.findWhere(window.layoutManager.studies, {
            studyInstanceUid: viewportData.studyInstanceUid
        }) || window.layoutManager.studies[0];

        // Get the display sets
        const displaySets = currentStudy.displaySets;

        // Get the current display set
        const displaySet = _.findWhere(displaySets, {
            displaySetInstanceUid: viewportData.displaySetInstanceUid
        });

        // Get the current instance index
        let displaySetIndex = _.indexOf(displaySets, displaySet);
        displaySetIndex = displaySetIndex < 0 ? 9999 : displaySetIndex;

        // Try to get a map entry for current study or create it if not present
        let studyViewports = sequenceMap.get(currentStudy);
        if (!studyViewports) {
            studyViewports = [];
            sequenceMap.set(currentStudy, studyViewports);
        }

        // Register the viewport index and the display set index on the map
        studyViewports.push({
            viewportIndex,
            displaySetIndex
        });
    });

    // Return the generated sequence map
    return sequenceMap;
};

OHIF.viewer.isDisplaySetsSequenced = definedSequenceMap => {
    let isSequenced = true;

    // Get the studies and display sets sequence map
    const sequenceMap = definedSequenceMap || OHIF.viewer.getDisplaySetSequenceMap();

    sequenceMap.forEach((studyViewports, study) => {
        let lastDisplaySetIndex = null;
        let lastViewportIndex = null;
        studyViewports.forEach(({ viewportIndex, displaySetIndex }, index) => {
            // Check if the sequence is wrong
            if (
                displaySetIndex !== 9999 &&
                lastViewportIndex !== null &&
                lastDisplaySetIndex !== null &&
                displaySetIndex !== null &&
                (viewportIndex - 1) !== lastViewportIndex &&
                (displaySetIndex - 1) !== lastDisplaySetIndex
            ) {
                // Set the sequenced flag as false;
                isSequenced = false;
            }

            // Update the last viewport index
            lastViewportIndex = viewportIndex;

            // Update the last display set index
            lastDisplaySetIndex = displaySetIndex;
        });
    });

    return isSequenced;
};

OHIF.viewer.canMoveDisplaySets = isNext => {
    // Get the setting that defines if the display set navigation is multiple
    const isMultiple = OHIF.uiSettings.displaySetNavigationMultipleViewports;

    // Get the setting that allow display set navigation looping over series
    const allowLooping = OHIF.uiSettings.displaySetNavigationLoopOverSeries;

    // Return false if no layout manager is not defined yet
    if (!window.layoutManager) {
        return false;
    }

    // Get the studies and display sets sequence map
    const sequenceMap = OHIF.viewer.getDisplaySetSequenceMap();

    // Return false for moving backward if display sets are not sequenced
    if (isMultiple && !isNext && !OHIF.viewer.isDisplaySetsSequenced(sequenceMap)) {
        return false;
    }

    return true;
};

// Move display sets forward or backward in the given viewport index
OHIF.viewer.moveSingleViewportDisplaySets = (viewportIndex, isNext) => {
    // Get the setting that allow display set navigation looping over series
    const allowLooping = OHIF.uiSettings.displaySetNavigationLoopOverSeries;

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
            // Stop here if looping is not allowed
            if (!allowLooping) {
                return;
            }

            newIndex = 0;
        }
    } else {
        newIndex--;
        if (newIndex < 0) {
            // Stop here if looping is not allowed
            if (!allowLooping) {
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
    // Get the setting that allow display set navigation looping over series
    const allowLooping = OHIF.uiSettings.displaySetNavigationLoopOverSeries;

    // Create a map to control the display set sequence
    const sequenceMap = new OHIF.viewer.getDisplaySetSequenceMap();

    // Check if the display sets are sequenced
    const isSequenced = OHIF.viewer.isDisplaySetsSequenced(sequenceMap);

    // Iterate over the studies map and move its display sets
    sequenceMap.forEach((studyViewports, study) => {
        // Sort the viewports on the study by the display set index
        studyViewports.sort((a, b) => a.displaySetIndex > b.displaySetIndex);

        // Get the study display sets
        const displaySets = study.displaySets;

        // Calculate the base index
        const firstIndex = studyViewports[0].displaySetIndex;
        const amount = studyViewports.length;
        const rest = firstIndex % amount;
        let baseIndex = rest ? firstIndex - rest : firstIndex;
        const direction = isNext ? 1 : -1;
        baseIndex += amount * direction;

        // Check if the indexes are sequenced or will overflow the array bounds
        if (!isSequenced) {
            // Reset the sequence if indexes are not sequenced
            baseIndex = 0;
        } else if (baseIndex >= displaySets.length) {
            // Stop here if looping is not allowed
            if (!allowLooping) {
                return;
            }

            // Start over the series if looping is allowed
            baseIndex = 0;
        } else if (baseIndex < 0) {
            // Stop here if looping is not allowed
            if (!allowLooping) {
                return;
            }

            // Go to the series' end if looping is allowed
            baseIndex = (displaySets.length - 1) - ((displaySets.length - 1) % amount);
        }

        // Iterate over the current study viewports
        studyViewports.forEach(({ viewportIndex }, index) => {
            // Get the new displaySet index to be rendered in viewport
            const newIndex = baseIndex + index;

            // Get the display set data for the new index
            const displaySetData = displaySets[newIndex] || {};

            // Rerender the viewport using the new display set data
            window.layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, displaySetData);
        });
    });
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
