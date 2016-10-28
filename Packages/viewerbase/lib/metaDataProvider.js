import {parsingUtils} from './parsingUtils'

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
    metaData.imagePlane = getImagePlane(instanceMetaData);

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
 * Updates the related metaData for missing fields given a specified image
 *
 * @param image
 */
updateMetaData = function(image) {
    var imageMetaData = metaDataLookup[image.imageId];
    if (!imageMetaData) {
        return;
    }

    imageMetaData.instance.sopClassUid = imageMetaData.instance.sopClassUid || image.data.string('x00080016');
    imageMetaData.instance.sopInstanceUid = imageMetaData.instance.sopInstanceUid || image.data.string('x00080018');

    imageMetaData.instance.rows = imageMetaData.instance.rows || image.rows;
    imageMetaData.instance.columns = imageMetaData.instance.columns || image.columns;
    imageMetaData.instance.pixelSpacing = imageMetaData.instance.pixelSpacing || image.data.string('x00280030');
    imageMetaData.instance.frameOfReferenceUID = imageMetaData.instance.frameOfReferenceUID || image.data.string('x00200052');
    imageMetaData.instance.imageOrientationPatient = imageMetaData.instance.imageOrientationPatient || image.data.string('x00200037');
    imageMetaData.instance.imagePositionPatient = imageMetaData.instance.imagePositionPatient || image.data.string('x00200032');

    imageMetaData.instance.sliceThickness = imageMetaData.instance.sliceThickness || image.data.string('x00180050');
    imageMetaData.instance.sliceLocation = imageMetaData.instance.sliceLocation || image.data.string('x00201041');
    imageMetaData.instance.tablePosition = imageMetaData.instance.tablePosition || image.data.string('x00189327');
    imageMetaData.instance.spacingBetweenSlices = imageMetaData.instance.spacingBetweenSlices || image.data.string('x00180088');

    imageMetaData.instance.lossyImageCompression = imageMetaData.instance.lossyImageCompression || image.data.string('x00282110');
    imageMetaData.instance.lossyImageCompressionRatio = imageMetaData.instance.lossyImageCompressionRatio || image.data.string('x00282112');

    imageMetaData.instance.frameIncrementPointer = imageMetaData.instance.frameIncrementPointer || image.data.string('x00280009');
    imageMetaData.instance.frameTime = imageMetaData.instance.frameTime || image.data.string('x00181063');
    imageMetaData.instance.frameTimeVector = imageMetaData.instance.frameTimeVector || image.data.string('x00181065');
    imageMetaData.instance.multiframeMetadata = getMultiframeModuleMetaData(image.data);

    imageMetaData.imagePlane = imageMetaData.imagePlane || getImagePlane(imageMetaData.instance);
};

/**
 * Constructs and returns the imagePlane given the instance
 *
 * @param instance The instance containing information to construct imagePlane
 * @returns imagePlane The constructed imagePlane to be used in viewer easily
 */
function getImagePlane(instance) {
    if (!instance.rows || !instance.columns || !instance.pixelSpacing ||
        !instance.frameOfReferenceUID || !instance.imageOrientationPatient ||
        !instance.imagePositionPatient) {
        return;
    }

    var imageOrientation = instance.imageOrientationPatient.split('\\');
    var imagePosition = instance.imagePositionPatient.split('\\');

    var columnPixelSpacing = 1.0;
    var rowPixelSpacing = 1.0;
    if (instance.pixelSpacing) {
        var split = instance.pixelSpacing.split('\\');
        rowPixelSpacing = parseFloat(split[0]);
        columnPixelSpacing = parseFloat(split[1]);
    }

    return {
        frameOfReferenceUID:
            instance.frameOfReferenceUID,
        rows:
            instance.rows,
        columns:
            instance.columns,
        rowCosines:
            new cornerstoneMath.Vector3(parseFloat(imageOrientation[0]), parseFloat(imageOrientation[1]), parseFloat(imageOrientation[2])),
        columnCosines:
            new cornerstoneMath.Vector3(parseFloat(imageOrientation[3]), parseFloat(imageOrientation[4]), parseFloat(imageOrientation[5])),
        imagePositionPatient:
            new cornerstoneMath.Vector3(parseFloat(imagePosition[0]), parseFloat(imagePosition[1]), parseFloat(imagePosition[2])),
        rowPixelSpacing:
            rowPixelSpacing,
        columnPixelSpacing:
            columnPixelSpacing,
    };
}

/**
 * This function extracts miltiframe information from a dicomParser.DataSet object.
 *
 * @param dataSet {Object} An instance of dicomParser.DataSet object where multiframe information can be found.
 * @return {Object} An object containing multiframe image metadata (frameIncrementPointer, frameTime, frameTimeVector, etc).
 */
getMultiframeModuleMetaData = function(dataSet) {

    var numberOfFrames,
        frameIncrementPointer,
        frameTime,
        frameTimeVector,
        imageInfo = {
            isMultiframeImage: false,
            frameIncrementPointer: null,
            numberOfFrames: 0,
            frameTime: 0,
            frameTimeVector: null,
            averageFrameRate: 0 // backwards compatibility only... it might be useless in the future
        };

    if (parsingUtils.isValidDataSet(dataSet)) {

        // (0028,0008) = Number of Frames
        numberOfFrames = dataSet.intString('x00280008', -1);
        if (numberOfFrames > 0) {

            // set multi-frame image indicator
            imageInfo.isMultiframeImage = true;
            imageInfo.numberOfFrames = numberOfFrames;

            // (0028,0009) = Frame Increment Pointer
            frameIncrementPointer = parsingUtils.attributeTag(dataSet, 'x00280009') || '';

            if (frameIncrementPointer === 'x00181065') {
                // Frame Increment Pointer points to Frame Time Vector (0018,1065) field
                frameTimeVector = parsingUtils.floatArray(dataSet, 'x00181065');
                if (frameTimeVector instanceof Array && frameTimeVector.length > 0) {
                    imageInfo.frameIncrementPointer = 'frameTimeVector';
                    imageInfo.frameTimeVector = frameTimeVector;
                    frameTime = frameTimeVector.reduce((a, b) => a + b) / frameTimeVector.length;
                    imageInfo.averageFrameRate = 1000 / frameTime;
                }
            } else if (frameIncrementPointer === 'x00181063' || frameIncrementPointer === '') {
                // Frame Increment Pointer points to Frame Time (0018,1063) field or is not defined (for addtional flexibility).
                // Yet another value is possible for this field (5200,9230 for Multi-frame Functional Groups)
                // but that case is currently not supported.
                frameTime = dataSet.floatString('x00181063', -1);
                if (frameTime > 0) {
                    imageInfo.frameIncrementPointer = 'frameTime';
                    imageInfo.frameTime = frameTime;
                    imageInfo.averageFrameRate = 1000 / frameTime;
                }
            }

        }

    }

    return imageInfo;

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
