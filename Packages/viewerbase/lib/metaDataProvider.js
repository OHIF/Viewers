var metaDataLookup = {};

addMetaData = function(imageId, data) {
    var instanceMetaData = data.instance;
    var seriesMetaData = data.series;
    var studyMetaData = data.study;
    var imageIndex = data.imageIndex;
    var numImages = data.numImages;

    var metaData = {};

    metaData.study = {
        date: instanceMetaData.studyDate,
        time: instanceMetaData.studyTime,
        description: instanceMetaData.studyDescription
    };

    metaData.series = {
        description: seriesMetaData.seriesDescription,
        number: seriesMetaData.seriesNumber,
        modality: seriesMetaData.modality,
        instanceUid: seriesMetaData.instanceUid,
        numImages: numImages
    };

    metaData.instance = {
        number: instanceMetaData.instanceNumber,
        index: imageIndex
    };

    metaData.patient = {
        name: instanceMetaData.patientName,
        id: instanceMetaData.patientId
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
