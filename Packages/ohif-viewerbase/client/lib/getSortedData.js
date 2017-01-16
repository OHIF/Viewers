import { ImageSet } from './classes/ImageSet';

const sortBySeriesNumberAndAcquisition = (a, b) => {
    if (a.seriesNumber && b.seriesNumber) {
        if (a.seriesNumber !== b.seriesNumber) {
            return a.seriesNumber - b.seriesNumber;
        }
    }

    if (a.acquisitionDateTime && b.acquisitionDateTime) {
        return a.acquisitionDateTime.localeCompare(b.acquisitionDateTime);
    }
};

const makeImageSet = sopInstances => {
    const imageSet = new ImageSet(sopInstances);
    const sopInstance = sopInstances[0];

    // list of attributes to be appended to ImageSet instance...
    const attributes = {
        seriesInstanceUid: sopInstance.getRawValue('x0020000e'),
        seriesNumber: sopInstance.getIntValue('x00200011'),
        seriesDescription: sopInstance.getRawValue('x0008103e', ''),
        acquisitionDateTime: sopInstance.getRawValue('x00080022', '') + sopInstance.getRawValue('x00080032', ''),
        numImageFrames: sopInstances.length,
        frameRate: sopInstance.getFloatValue('x00181063', 0, 0),
        studyInstanceUid: sopInstance.getRawValue('x0020000d'),
        displaySetInstanceUid: imageSet.uid // create an alias for the imageSet UID
    };

    const frameTime = sopInstance.getFloatValue('x00181063', 0, 0);
    const recommendedDisplayFrameRate = sopInstance.getFloatValue('x00082144', 0, 0);
    if (frameTime) {
        // FrameTime is in milliseconds, so we use 1000/frameTime to calculate
        // the number of frames per second.
        attributes.frameRate = 1000 / frameTime;
        attributes.isClip = true;
    } else if (recommendedDisplayFrameRate) {
        // Recommended Display FrameRate is specified in frames per second as an integer
        attributes.frameRate = recommendedDisplayFrameRate;
        attributes.isClip = true;
    }

    imageSet.setAttributes(attributes);

    // Sort the images in this series
    imageSet.sortBy( (a, b) => {
        const aInstanceNumber = a.getFloatValue('x00200013');
        const bInstanceNumber = b.getFloatValue('x00200013');

        if (aInstanceNumber && bInstanceNumber) {
            if (aInstanceNumber !== bInstanceNumber) {
                return aInstanceNumber - bInstanceNumber;
            }
        }

        const aAcquisitionNumber = a.getFloatValue('x00200012');
        const bAcquisitionNumber = b.getFloatValue('x00200012');

        if (aAcquisitionNumber && bAcquisitionNumber) {
            if (aAcquisitionNumber !== bAcquisitionNumber) {
                return aAcquisitionNumber - bAcquisitionNumber;
            }
        }

        const aAcquisitionDateTime = a.getRawValue('x00080022', '') + a.getRawValue('x00080032', '');
        const bAcquisitionDateTime = b.getRawValue('x00080022', '') + b.getRawValue('x00080032', '');

        if (aAcquisitionDateTime && bAcquisitionDateTime) {
            return aAcquisitionDateTime.localeCompare(bAcquisitionDateTime);
        }
    });

    return imageSet;
};

const isMultiFrame = instanceView => {
    const numFrames = instanceView.getIntValue('x00280008');
    return (numFrames > 1);
};

const isSingleImageModality = modality => {
    const singleImageModalities = ['CR', 'MG', 'DX', 'RG', 'PX', 'XA', 'XR']
    return singleImageModalities.indexOf(modality) > -1;
};

const seriesSplittingRules = [
{
    tag: 'x00180010', // ContrastBolusAgent
},
{
    tag: 'x00180086', // Echo Number
},

// --- Some other potential examples of tags to split on --- //
/*{
    tag: 'x00180020', // Scanning Sequence
},
{
    tag: 'x00180050', // Slice Thickness
},*/
/*{
    tag: 'x00180081', // Echo Time
},
{
    tag: 'x00181210', // Convolution Kernel
},*/
/*{
    tag: 'x00200012', // Acquisition Number
}*/
];

const stackOfInstancesToDisplaySets = (sopInstances, seriesView) => {
    // If no instances are provided, return an empty array
    if (!sopInstances.length) {
        return [];
    }

    // Create an empty array to store our display sets in
    const displaySets = [];

    // Use Underscore's groupBy function to group our sopInstances
    // by a key. In our case, the key is a combined string which represents
    // the value of the DICOM tags listed in the seriesSplittingRules array.
    // Currently this uses tags for EchoNumber and ContrastBolusAgent.
    const groups = _.groupBy(sopInstances, sopInstance => {
        // Create an empty string to store our key
        let result = '';

        // For each rule, find out if the tag exists
        seriesSplittingRules.forEach(rule => {
            // Include a delimitation character between each tag value
            result += ';'

            // If the tag exists, concatenate its value to our key
            if (sopInstance.tagExists(rule.tag)) {
                result += sopInstance.getRawValue(rule.tag);
            }
        });
        
        // Return the key to be used for grouping.
        return result;
    })

    const seriesInstanceCount = seriesView.getInstanceCount();

    Object.keys(groups).forEach(groupKey => {
        // For each group, obtain the instances in the stack
        const stackInstances = groups[groupKey];

        // Create a new display set from the images in this stack
        const displaySet = makeImageSet(stackInstances);
        displaySet.setAttribute('seriesInstanceCount', seriesInstanceCount);

        displaySets.push(displaySet);
    });
    
    return displaySets;
};

/**
 * This function extracts and produces sorted lists of image sets and non-viewable instance
 * sets from a studyMetadata {StudyMetadata instance}.
 *
 * If an optional series number is specified, only the image set with this series number 
 * will be returned (as the sole element in an array).
 *
 * The function returns an object with two fields, imageSets and nonViewable, both of which
 * are arrays. imageSets is an array of sorted image sets and nonViewable is an array of
 * non-viewable sopInstances.
 * 
 * @param studyMetadata
 * @param {number} [seriesNumber] One series number.  If specified, the function only returns the imageSet with this seriesNumber
 *
 * @returns {{imageSets: Array, nonViewable: Array}}
 */
getSortedData = function(studyMetadata, seriesNumber) {
    let imageSets = [];
    let nonViewable = [];

    studyMetadata.forEachSeries((series, seriesNum) => {
        const firstInstance = series.getInstanceByIndex(0);
        
        // If a specific series number is given, skip all series except this one
        if (seriesNumber !== undefined && firstInstance.getIntValue('x00200011', '') !== seriesNumber) {
            return;
        }

        let sopInstances = [];
        let imageSet;

        const seriesInstanceCount = series.getInstanceCount();

        series.forEachInstance(instanceMetadata => {
            // Skip non image types (an image must have the 'rows' tag)
            const rows = instanceMetadata.tagExists('x00280010');

            if (!rows) {
                nonViewable.push(instanceMetadata);
                return;
            }

            const modality = firstInstance.getRawValue('x00080060', '');
            const singleImageModality = isSingleImageModality(modality);

            // If we detect a multi-frame instance
            if (isMultiFrame(instanceMetadata)) {
                // First, sort all sopInstances currently in our stack into display sets using
                // our series splitting rules
                const displaySets = stackOfInstancesToDisplaySets(sopInstances, series);
                imageSets = imageSets.concat(displaySets);

                // Next, make another display set for the multi-frame instance
                imageSet = makeImageSet([ instanceMetadata ]);
                imageSet.setAttributes({
                    seriesInstanceCount: seriesInstanceCount,
                    numImageFrames: instanceMetadata.getIntValue('x00280008', 0)
                });

                imageSets.push(imageSet);

                // Reset our stack of sopInstances
                sopInstances = [];
            } else if (singleImageModality) {
                imageSet = makeImageSet([ instanceMetadata ]);
                imageSet.setAttribute('seriesInstanceCount', seriesInstanceCount);
                imageSets.push(imageSet);
              } else {
                // If no multi-frame instances have been discovered
                sopInstances.push(instanceMetadata);
            }

        });

        // Create display sets from any remaining sopInstances in the series
        const displaySets = stackOfInstancesToDisplaySets(sopInstances, series);
        imageSets = imageSets.concat(displaySets);
    });

    // sort imageSets
    imageSets.sort(sortBySeriesNumberAndAcquisition);
    nonViewable.sort(sortBySeriesNumberAndAcquisition);

    return {
        imageSets,
        nonViewable
    };
};

export { getSortedData };