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
        windowCenter : windowCenter,
        windowWidth : windowWidth,
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

    var imageId = cornerstoneWADORSImageLoader.addImage(image);
    return imageId;
};