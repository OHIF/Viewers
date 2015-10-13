cornerstoneWADORSImageLoader = {
  internal : {
    nextIndex: 0,
    imageIds : []
  }
};

cornerstoneWADORSImageLoader.addImage = function(image) {
  var index = cornerstoneWADORSImageLoader.internal.nextIndex++;
  cornerstoneWADORSImageLoader.internal.imageIds[index] = image;
  var imageId = 'wadors:' + index;
  return imageId;
};

function getMinMax(storedPixelData)
{
  // we always calculate the min max values since they are not always
  // present in DICOM and we don't want to trust them anyway as cornerstone
  // depends on us providing reliable values for these
  var min = 65535;
  var max = -32768;
  var numPixels = storedPixelData.length;
  var pixelData = storedPixelData;
  for(var index = 0; index < numPixels; index++) {
    var spv = pixelData[index];
    // TODO: test to see if it is faster to use conditional here rather than calling min/max functions
    min = Math.min(min, spv);
    max = Math.max(max, spv);
  }

  return {
    min: min,
    max: max
  };
}

cornerstone.registerImageLoader('wadors', function(imageId) {
  var index = imageId.substring(7);
  var image = cornerstoneWADORSImageLoader.internal.imageIds[index];

  var deferred = $.Deferred();

  var mediaType;// = 'image/dicom+jp2';

  DICOMWeb.getImageFrame(image.uri, mediaType).then(function(result) {
    //console.log(result);
    // TODO: add support for retrieving compressed pixel data
    var storedPixelData;
    if(image.instance.bitsAllocated === 16) {
      if(image.instance.pixelRepresentation === 0) {
        storedPixelData = new Uint16Array(result.arrayBuffer, result.offset, result.length / 2);
      } else {
        storedPixelData = new Int16Array(result.arrayBuffer, result.offset, result.length / 2);
      }
    } else if(image.instance.bitsAllocated === 8) {
      storedPixelData = new Uint8Array(result.arrayBuffer, result.offset, result.length);
    }

    // TODO: handle various color space conversions

    var minMax = getMinMax(storedPixelData);
    image.imageId = imageId;
    image.minPixelValue = minMax.min;
    image.maxPixelValue = minMax.max;
    image.render = cornerstone.renderGrayscaleImage;
    image.getPixelData = function() {
      return storedPixelData;
    };
    //console.log(image);
    deferred.resolve(image);
  }).catch(function(reason) {
    deferred.reject(reason);
  });

  return deferred;
});

