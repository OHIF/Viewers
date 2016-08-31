/**
 * Creates a set of series to be placed in the Study Browser
 * The series that appear in the Study Browser must represent
 * imaging modalities.
 *
 * Furthermore, for drag/drop functionality,
 * it is easiest if the stack objects also contain information about
 * which study they are linked to.
 *
 * @param study The study instance to be used
 * @returns {Array} An array of series to be placed in the Study Browser
 */
createStacks = function(study) {
    // Define an empty array of display sets
    var displaySets = [];

    if (!study || !study.seriesList) {
    	return displaySets;
    }

    study.seriesList.forEach(series => {
        // If the series has no instances, skip it
        if (!series.instances) {
            return;
        }

        // Search through the instances of this series
        // Split Multi-frame instances and Single-image modalities
        // into their own specific display sets. Place the rest of each
        // series into another display set.
        let stackableInstances = [];
        series.instances.forEach(instance => {
            // All imaging modalities must have a valid value for sopClassUid or rows
            if (!isImage(instance.sopClassUid) && !instance.rows) {
                return;
            }

            let displaySet;
            if (isMultiFrame(instance)) {
                displaySet = makeDisplaySet(series, [ instance ]);
                displaySet.isClip = true;
                
                // Include the study instance Uid for drag/drop purposes
                displaySet.studyInstanceUid = study.studyInstanceUid;

                // Override the default value of instances.length
                displaySet.numImageFrames = instance.numFrames;
                
                displaySets.push(displaySet);
            } else if (isSingleImageModality(instance.modality)) {
                displaySet = makeDisplaySet(series, [ instance ]);
                displaySet.studyInstanceUid = study.studyInstanceUid;
                displaySets.push(displaySet);
            } else {
                stackableInstances.push(instance);
            }
        });

        if (stackableInstances.length) {
            let displaySet = makeDisplaySet(series, stackableInstances);
            displaySet.studyInstanceUid = study.studyInstanceUid;
            displaySets.push(displaySet);
        }
    });

    return displaySets;
};

function makeDisplaySet(series, instances) {
    const instance = instances[0];

    let displaySet = {
        seriesInstanceUid: series.seriesInstanceUid,
        seriesNumber: series.seriesNumber,
        seriesDescription: series.seriesDescription,
        numImageFrames: instances.length,
        frameRate: instance.frameTime,
        images: instances
    };

    // Sort the images in this series
    displaySet.images.sort(function(a, b) {
        if (a.instanceNumber && b.instanceNumber && 
            a.instanceNumber !== b.instanceNumber) {
            return a.instanceNumber - b.instanceNumber;
        }
    });

    // Create a unique ID for this stack so we can reference it
    displaySet.displaySetInstanceUid = Random.id();

    return displaySet;
}

function isSingleImageModality(modality) {
    return (modality === 'CR' ||
            modality === 'MG' ||
            modality === 'DX');
}

function isMultiFrame(instance) {
    return instance.numFrames > 1;
}