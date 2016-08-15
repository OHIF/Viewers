var metaDataLookup = {};

/**
 * Cornerstone MetaData provider to store image meta data
 * Data from instances, series, and studies are associated with
 * imageIds to facilitate usage of this information by Cornerstone's Tools
 *
 * e.g. the imagePlane metaData object contains instance information about
 * row/column pixel spacing, patient position, and patient orientation. It
 * is used in CornerstoneTools to position reference lines and orientation markers.
 *
 * @param {String} imageId The Cornerstone ImageId
 * @param {Object} data An object containing instance, series, and study metaData
 */
addMetaData = function(imageId, data) {
    var instanceMetaData = data.instance;
    var seriesMetaData = data.series;
    var studyMetaData = data.study;
    var imageIndex = data.imageIndex;
    var numImages = data.numImages;

    var metaData = {};

    metaData.study = {
        patientId: studyMetaData.patientId,
        studyInstanceUid: studyMetaData.studyInstanceUid,
        studyDate: studyMetaData.studyDate,
        studyTime: studyMetaData.studyTime,
        studyDescription: studyMetaData.studyDescription,
        institutionName: studyMetaData.institutionName
    };

    metaData.series = {
        seriesDescription: seriesMetaData.seriesDescription,
        seriesNumber: seriesMetaData.seriesNumber,
        modality: seriesMetaData.modality,
        seriesInstanceUid: seriesMetaData.seriesInstanceUid,
        numImages: numImages
    };

    metaData.instance = instanceMetaData;

    metaData.patient = {
        name: studyMetaData.patientName,
        id: studyMetaData.patientId,
        birthDate: studyMetaData.patientBirthDate,
        sex: studyMetaData.patientSex
    };

    // If there is sufficient information, populate
    // the imagePlane object for easier use in the Viewer
    if (instanceMetaData.frameOfReferenceUID &&
        instanceMetaData.imageOrientationPatient &&
        instanceMetaData.imagePositionPatient) {

        var imageOrientation = instanceMetaData.imageOrientationPatient.split('\\');
        var imagePosition = instanceMetaData.imagePositionPatient.split('\\');

        var columnPixelSpacing = 1.0;
        var rowPixelSpacing = 1.0;
        if (instanceMetaData.pixelSpacing) {
            var split = instanceMetaData.pixelSpacing.split('\\');
            rowPixelSpacing = parseFloat(split[0]);
            columnPixelSpacing = parseFloat(split[1]);
        }
        
        metaData.imagePlane = {
            frameOfReferenceUID: instanceMetaData.frameOfReferenceUID,
            rows: instanceMetaData.rows,
            columns: instanceMetaData.columns,
            rowCosines: new cornerstoneMath.Vector3(parseFloat(imageOrientation[0]), parseFloat(imageOrientation[1]), parseFloat(imageOrientation[2])),
            columnCosines: new cornerstoneMath.Vector3(parseFloat(imageOrientation[3]), parseFloat(imageOrientation[4]), parseFloat(imageOrientation[5])),
            imagePositionPatient: new cornerstoneMath.Vector3(parseFloat(imagePosition[0]), parseFloat(imagePosition[1]), parseFloat(imagePosition[2])),
            rowPixelSpacing: rowPixelSpacing,
            columnPixelSpacing: columnPixelSpacing,
        };
    }

    // Add the metaData to the imageId lookup object
    metaDataLookup[imageId] = metaData;
};

/**
 * Adds a set of metaData to the Cornerstone metaData provider given a specific
 * imageId, type, and dataset
 *
 * @param imageId
 * @param type (e.g. series, instance, tagDisplay)
 * @param data
 */
addSpecificMetadata = function(imageId, type, data) {
    var metaData = {};
    metaData[type] = data;

    metaDataLookup[imageId] = $.extend(metaDataLookup[imageId], metaData);
};

/**
 * Looks up metaData for Cornerstone Tools given a specified type and imageId
 * A type may be, e.g. 'study', or 'patient', or 'imagePlane'. These types
 * are keys in the stored metaData objects.
 *
 * @param type
 * @param imageId
 * @returns {Object} Relevant metaData of the specified type
 */
function provider(type, imageId) {
    var imageMetaData = metaDataLookup[imageId];
    if (!imageMetaData) {
        return;
    }

    if (imageMetaData.hasOwnProperty(type)) {
        return imageMetaData[type];
    }
}

Meteor.startup(function() {
    cornerstoneTools.metaData.addProvider(provider);
});
