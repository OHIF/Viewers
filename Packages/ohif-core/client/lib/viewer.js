import { OHIF } from 'meteor/ohif:core';

OHIF.viewer = {};

// Return the display sets map sequence of display sets and viewports
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

        // Get the current instance index (using 9999 to sort greater than -1)
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

// Check if all the display sets and viewports are sequenced
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
                (viewportIndex - 1 !== lastViewportIndex ||
                displaySetIndex - 1 !== lastDisplaySetIndex)
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

// Check if is possible to move display sets on a specific direction
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

    // Check if the display sets are sequenced
    const isSequenced = OHIF.viewer.isDisplaySetsSequenced(sequenceMap);

    // Get Active Viewport Index if isMultiple is false
    const activeViewportIndex = !isMultiple ? Session.get('activeViewport') : null;

    // Check if is next and looping is blocked
    if (isNext && !allowLooping) {
        // Check if the end was reached
        let endReached = true;

        sequenceMap.forEach((studyViewports, study) => {
            // Get active viewport index if isMultiple is false ortherwise get last
            const studyViewport = studyViewports[activeViewportIndex !== null ? activeViewportIndex : studyViewports.length - 1];
            if (!studyViewport) {
                return;
            }

            const viewportIndex = studyViewport.displaySetIndex;
            const layoutViewports = studyViewports.length;
            const amount = study.displaySets.length;
            const move = !isMultiple ? 1 : ((amount % layoutViewports) || layoutViewports);
            const lastStepIndex = amount - move;
            
            // 9999 for index means empty viewport, see getDisplaySetSequenceMap function
            if (viewportIndex !== 9999 && viewportIndex !== lastStepIndex) {
                endReached = false;
            }
        });

        // Return false if end is not reached yet
        if ((!isMultiple || isSequenced) && endReached) {
            return false;
        }
    }

    // Check if is previous and looping is blocked
    if (!isNext && !allowLooping) {
        // Check if the begin was reached
        let beginReached = true;

        if(activeViewportIndex >= 0) {
            sequenceMap.forEach((studyViewports, study) => {
                // Get active viewport index if isMultiple is false ortherwise get first
                const studyViewport = studyViewports[activeViewportIndex !== null ? activeViewportIndex : 0];
                if (!studyViewport) {
                    return;
                }

                const viewportIndex = studyViewport.displaySetIndex;
                const layoutViewports = studyViewports.length;

                // 9999 for index means empty viewport, see getDisplaySetSequenceMap function
                if (viewportIndex !== 9999 && viewportIndex - layoutViewports !== -layoutViewports) {
                    beginReached = false;
                }
            });
        }

        // Return false if begin is not reached yet
        if ((!isMultiple || isSequenced) && beginReached) {
            return false;
        }
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

    const displaySetsToRender = [];

    // Iterate over the studies map and move its display sets
    sequenceMap.forEach((studyViewports, study) => {
        // Sort the viewports on the study by the display set index
        studyViewports.sort((a, b) => a.displaySetIndex > b.displaySetIndex);

        // Get the study display sets
        const displaySets = study.displaySets;

        // Calculate the base index
        const firstIndex = studyViewports[0].displaySetIndex;
        const steps = studyViewports.length;
        const rest = firstIndex % steps;
        let baseIndex = rest ? firstIndex - rest : firstIndex;
        const direction = isNext ? 1 : -1;
        baseIndex += steps * direction;

        const amount = displaySets.length;

        // Check if the indexes are sequenced or will overflow the array bounds
        if (baseIndex >= amount) {
            const move = (amount % steps) || steps;
            const lastStepIndex = amount - move;
            if (firstIndex + steps !== lastStepIndex + steps) {
                // Reset the index if the display sets are sequenced but shifted
                baseIndex = lastStepIndex;
            } else if (!allowLooping) {
                // Stop here if looping is not allowed
                return;
            } else {
                // Start over the series if looping is allowed
                baseIndex = 0;
            }
        } else if (baseIndex < 0) {
            if (firstIndex > 0) {
                // Reset the index if the display sets are sequenced but shifted
                baseIndex = 0;
            } else if (!allowLooping) {
                // Stop here if looping is not allowed
                return;
            } else {
                // Go to the series' end if looping is allowed
                baseIndex = (amount - 1) - ((amount - 1) % steps);
            }
        } else if (!isSequenced) {
            // Reset the sequence if indexes are not sequenced
            baseIndex = 0;
        }

        // Iterate over the current study viewports
        studyViewports.forEach(({ viewportIndex }, index) => {
            // Get the new displaySet index to be rendered in viewport
            const newIndex = baseIndex + index;

            // Get the display set data for the new index
            const displaySetData = displaySets[newIndex] || {};

            // Add the current display set that on the render list
            displaySetsToRender.push(displaySetData);
        });
    });

    // Sort the display sets
    const sortingFunction = OHIF.utils.sortBy({
        name: 'studyInstanceUid'
    }, {
        name: 'instanceNumber'
    }, {
        name: 'seriesNumber'
    });
    displaySetsToRender.sort((a, b) => sortingFunction(a, b));

    // Iterate over each display set data and render on its respective viewport
    displaySetsToRender.forEach((data, index) => {
        window.layoutManager.rerenderViewportWithNewDisplaySet(index, data);
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
