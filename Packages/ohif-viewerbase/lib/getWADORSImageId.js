import { OHIF } from 'meteor/ohif:core';

/**
 * Obtain an imageId for Cornerstone based on the WADO-RS scheme
 *
 * @param instance
 * @returns {string} The imageId to be used by Cornerstone
 */

getWADORSImageId = function(instance) {
    var columnPixelSpacing = 1.0;
    var rowPixelSpacing = 1.0;
    if (instance.pixelSpacing) {
        var split = instance.pixelSpacing.split('\\');
        rowPixelSpacing = parseFloat(split[0]);
        columnPixelSpacing = parseFloat(split[1]);
    }

    var windowWidth;
    var windowCenter;

    if (instance.windowWidth && instance.windowCenter) {
        windowWidth = parseFloat(instance.windowWidth.split('\\')[0]);
        windowCenter = parseFloat(instance.windowCenter.split('\\')[0]);
    }

    var image = {
        uri: instance.wadorsuri,
        //imageId : '',
        //minPixelValue : 0,
        //maxPixelValue : 255,
        slope: instance.rescaleSlope,
        intercept: instance.rescaleIntercept,
        samplesPerPixel: instance.samplesPerPixel,
        imageOrientationPatient: instance.imageOrientationPatient,
        imagePositionPatient: instance.imagePositionPatient,
        sopClassUid: instance.sopClassUid,
        instanceNumber: instance.instanceNumber,
        frameOfReferenceUID: instance.frameOfReferenceUID,
        windowCenter: windowCenter,
        windowWidth: windowWidth,
        //render: cornerstone.renderColorImage,
        //getPixelData: getPixelData,
        //getImageData: getImageData,
        //getCanvas: getCanvas,
        rows: instance.rows,
        columns: instance.columns,
        height: instance.rows,
        width: instance.columns,
        color: false,
        columnPixelSpacing: columnPixelSpacing,
        rowPixelSpacing: rowPixelSpacing,
        invert: false,
        sizeInBytes: instance.rows * instance.columns * (instance.bitsAllocated / 8),
        instance: instance
    };

    var imageId = cornerstoneWADOImageLoader.imageManager.add(image);

    OHIF.log.info('WADO-RS ImageID: ' + imageId);
    return imageId;
};
