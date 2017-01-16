import { ImageSet } from './classes/ImageSet';
import { isImage } from './isImage';

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
function createStacks(study) {
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
                displaySet.setAttributes({
                    isClip: true,
                    studyInstanceUid: study.studyInstanceUid, // Include the study instance Uid for drag/drop purposes
                    numImageFrames: instance.numberOfFrames, // Override the default value of instances.length
                    instanceNumber: instance.instanceNumber, // Include the instance number
                    acquisitionDatetime: instance.acquisitionDatetime // Include the acquisition datetime
                });
                displaySets.push(displaySet);
            } else if (isSingleImageModality(instance.modality)) {
                displaySet = makeDisplaySet(series, [ instance ]);
                displaySet.setAttributes({
                    studyInstanceUid: study.studyInstanceUid, // Include the study instance Uid
                    instanceNumber: instance.instanceNumber, // Include the instance number
                    acquisitionDatetime: instance.acquisitionDatetime // Include the acquisition datetime
                });
                displaySets.push(displaySet);
            } else {
                stackableInstances.push(instance);
            }
        });

        if (stackableInstances.length) {
            let displaySet = makeDisplaySet(series, stackableInstances);
            displaySet.setAttribute('studyInstanceUid', study.studyInstanceUid);
            displaySets.push(displaySet);
        }
    });

    return displaySets;
};

function makeDisplaySet(series, instances) {
    const instance = instances[0];

    const imageSet = new ImageSet(instances);

    // set appropriate attributes to image set...
    imageSet.setAttributes({
        displaySetInstanceUid: imageSet.uid, // create a local alias for the imageSet UID
        seriesInstanceUid: series.seriesInstanceUid,
        seriesNumber: series.seriesNumber,
        seriesDescription: series.seriesDescription,
        numImageFrames: instances.length,
        frameRate: instance.frameTime,
        modality: series.modality,
        isMultiFrame: isMultiFrame(instance)
    });

    // Sort the images in this series
    imageSet.sortBy(function(a, b) {
        if (a.instanceNumber && b.instanceNumber &&
            a.instanceNumber !== b.instanceNumber) {
            return a.instanceNumber - b.instanceNumber;
        }
    });

    // Include the first image instance number (after sorted)
    imageSet.setAttribute('instanceNumber', imageSet.getImage(0).instanceNumber);

    return imageSet;
}

function isSingleImageModality(modality) {
    return (modality === 'CR' ||
            modality === 'MG' ||
            modality === 'DX');
}

function isMultiFrame(instance) {
    return instance.numberOfFrames > 1;
}

/**
 * Expose "createStacks"...
 */

export { createStacks };
