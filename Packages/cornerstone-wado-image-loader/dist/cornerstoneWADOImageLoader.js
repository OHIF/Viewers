/*! cornerstone-wado-image-loader - 2.1.4 - 2018-11-22 | (c) 2016 Chris Hafey | https://github.com/cornerstonejs/cornerstoneWADOImageLoader */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("cornerstoneWADOImageLoader", [], factory);
	else if(typeof exports === 'object')
		exports["cornerstoneWADOImageLoader"] = factory();
	else
		root["cornerstoneWADOImageLoader"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./imageLoader/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./externalModules.js":
/*!****************************!*\
  !*** ./externalModules.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _registerLoaders = __webpack_require__(/*! ./imageLoader/registerLoaders.js */ "./imageLoader/registerLoaders.js");

var _registerLoaders2 = _interopRequireDefault(_registerLoaders);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cornerstone = void 0; /* eslint import/extensions:0 */

var dicomParser = void 0;

var external = {
  set cornerstone(cs) {
    cornerstone = cs;

    (0, _registerLoaders2.default)(cornerstone);
  },
  get cornerstone() {
    if (!cornerstone) {
      if (window && window.cornerstone) {
        cornerstone = window.cornerstone;

        (0, _registerLoaders2.default)(cornerstone);
      } else {
        throw new Error('cornerstoneWADOImageLoader requires a copy of Cornerstone to work properly. Please add cornerstoneWADOImageLoader.external.cornerstone = cornerstone; to your application.');
      }
    }

    return cornerstone;
  },
  set dicomParser(dp) {
    dicomParser = dp;
  },
  get dicomParser() {
    if (!dicomParser) {
      if (window && window.dicomParser) {
        dicomParser = window.dicomParser;
      } else {
        throw new Error('cornerstoneWADOImageLoader requires a copy of dicomParser to work properly. Please add cornerstoneWADOImageLoader.external.dicomParser = dicomParser; to your application.');
      }
    }

    return dicomParser;
  }
};

exports.default = external;

/***/ }),

/***/ "./imageLoader/colorSpaceConverters/convertPALETTECOLOR.js":
/*!*****************************************************************!*\
  !*** ./imageLoader/colorSpaceConverters/convertPALETTECOLOR.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (imageFrame, rgbaBuffer) {
  var numPixels = imageFrame.columns * imageFrame.rows;
  var pixelData = imageFrame.pixelData;
  var rData = imageFrame.redPaletteColorLookupTableData;
  var gData = imageFrame.greenPaletteColorLookupTableData;
  var bData = imageFrame.bluePaletteColorLookupTableData;
  var len = imageFrame.redPaletteColorLookupTableData.length;
  var palIndex = 0;
  var rgbaIndex = 0;

  var start = imageFrame.redPaletteColorLookupTableDescriptor[1];
  var shift = imageFrame.redPaletteColorLookupTableDescriptor[2] === 8 ? 0 : 8;

  var rDataCleaned = convertLUTto8Bit(rData, shift);
  var gDataCleaned = convertLUTto8Bit(gData, shift);
  var bDataCleaned = convertLUTto8Bit(bData, shift);

  for (var i = 0; i < numPixels; ++i) {
    var value = pixelData[palIndex++];

    if (value < start) {
      value = 0;
    } else if (value > start + len - 1) {
      value = len - 1;
    } else {
      value -= start;
    }

    rgbaBuffer[rgbaIndex++] = rDataCleaned[value];
    rgbaBuffer[rgbaIndex++] = gDataCleaned[value];
    rgbaBuffer[rgbaIndex++] = bDataCleaned[value];
    rgbaBuffer[rgbaIndex++] = 255;
  }
};

/* eslint no-bitwise: 0 */

function convertLUTto8Bit(lut, shift) {
  var numEntries = lut.length;
  var cleanedLUT = new Uint8ClampedArray(numEntries);

  for (var i = 0; i < numEntries; ++i) {
    cleanedLUT[i] = lut[i] >> shift;
  }

  return cleanedLUT;
}

/**
 * Convert pixel data with PALETTE COLOR Photometric Interpretation to RGBA
 *
 * @param {ImageFrame} imageFrame
 * @param {Uint8ClampedArray} rgbaBuffer
 * @returns {void}
 */

/***/ }),

/***/ "./imageLoader/colorSpaceConverters/convertRGBColorByPixel.js":
/*!********************************************************************!*\
  !*** ./imageLoader/colorSpaceConverters/convertRGBColorByPixel.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (imageFrame, rgbaBuffer) {
  if (imageFrame === undefined) {
    throw new Error('decodeRGB: rgbBuffer must not be undefined');
  }
  if (imageFrame.length % 3 !== 0) {
    throw new Error('decodeRGB: rgbBuffer length must be divisible by 3');
  }

  var numPixels = imageFrame.length / 3;
  var rgbIndex = 0;
  var rgbaIndex = 0;

  for (var i = 0; i < numPixels; i++) {
    rgbaBuffer[rgbaIndex++] = imageFrame[rgbIndex++]; // red
    rgbaBuffer[rgbaIndex++] = imageFrame[rgbIndex++]; // green
    rgbaBuffer[rgbaIndex++] = imageFrame[rgbIndex++]; // blue
    rgbaBuffer[rgbaIndex++] = 255; // alpha
  }
};

/***/ }),

/***/ "./imageLoader/colorSpaceConverters/convertRGBColorByPlane.js":
/*!********************************************************************!*\
  !*** ./imageLoader/colorSpaceConverters/convertRGBColorByPlane.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (imageFrame, rgbaBuffer) {
  if (imageFrame === undefined) {
    throw new Error('decodeRGB: rgbBuffer must not be undefined');
  }
  if (imageFrame.length % 3 !== 0) {
    throw new Error('decodeRGB: rgbBuffer length must be divisible by 3');
  }

  var numPixels = imageFrame.length / 3;
  var rgbaIndex = 0;
  var rIndex = 0;
  var gIndex = numPixels;
  var bIndex = numPixels * 2;

  for (var i = 0; i < numPixels; i++) {
    rgbaBuffer[rgbaIndex++] = imageFrame[rIndex++]; // red
    rgbaBuffer[rgbaIndex++] = imageFrame[gIndex++]; // green
    rgbaBuffer[rgbaIndex++] = imageFrame[bIndex++]; // blue
    rgbaBuffer[rgbaIndex++] = 255; // alpha
  }
};

/***/ }),

/***/ "./imageLoader/colorSpaceConverters/convertYBRFullByPixel.js":
/*!*******************************************************************!*\
  !*** ./imageLoader/colorSpaceConverters/convertYBRFullByPixel.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (imageFrame, rgbaBuffer) {
  if (imageFrame === undefined) {
    throw new Error('decodeRGB: ybrBuffer must not be undefined');
  }
  if (imageFrame.length % 3 !== 0) {
    throw new Error('decodeRGB: ybrBuffer length must be divisble by 3');
  }

  var numPixels = imageFrame.length / 3;
  var ybrIndex = 0;
  var rgbaIndex = 0;

  for (var i = 0; i < numPixels; i++) {
    var y = imageFrame[ybrIndex++];
    var cb = imageFrame[ybrIndex++];
    var cr = imageFrame[ybrIndex++];

    rgbaBuffer[rgbaIndex++] = y + 1.40200 * (cr - 128); // red
    rgbaBuffer[rgbaIndex++] = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128); // green
    rgbaBuffer[rgbaIndex++] = y + 1.77200 * (cb - 128); // blue
    rgbaBuffer[rgbaIndex++] = 255; // alpha
  }
};

/***/ }),

/***/ "./imageLoader/colorSpaceConverters/convertYBRFullByPlane.js":
/*!*******************************************************************!*\
  !*** ./imageLoader/colorSpaceConverters/convertYBRFullByPlane.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (imageFrame, rgbaBuffer) {
  if (imageFrame === undefined) {
    throw new Error('decodeRGB: ybrBuffer must not be undefined');
  }
  if (imageFrame.length % 3 !== 0) {
    throw new Error('decodeRGB: ybrBuffer length must be divisble by 3');
  }

  var numPixels = imageFrame.length / 3;
  var rgbaIndex = 0;
  var yIndex = 0;
  var cbIndex = numPixels;
  var crIndex = numPixels * 2;

  for (var i = 0; i < numPixels; i++) {
    var y = imageFrame[yIndex++];
    var cb = imageFrame[cbIndex++];
    var cr = imageFrame[crIndex++];

    rgbaBuffer[rgbaIndex++] = y + 1.40200 * (cr - 128); // red
    rgbaBuffer[rgbaIndex++] = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128); // green
    rgbaBuffer[rgbaIndex++] = y + 1.77200 * (cb - 128); // blue
    rgbaBuffer[rgbaIndex++] = 255; // alpha
  }
};

/***/ }),

/***/ "./imageLoader/colorSpaceConverters/index.js":
/*!***************************************************!*\
  !*** ./imageLoader/colorSpaceConverters/index.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _convertRGBColorByPixel = __webpack_require__(/*! ./convertRGBColorByPixel.js */ "./imageLoader/colorSpaceConverters/convertRGBColorByPixel.js");

Object.defineProperty(exports, 'convertRGBColorByPixel', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_convertRGBColorByPixel).default;
  }
});

var _convertRGBColorByPlane = __webpack_require__(/*! ./convertRGBColorByPlane.js */ "./imageLoader/colorSpaceConverters/convertRGBColorByPlane.js");

Object.defineProperty(exports, 'convertRGBColorByPlane', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_convertRGBColorByPlane).default;
  }
});

var _convertYBRFullByPixel = __webpack_require__(/*! ./convertYBRFullByPixel.js */ "./imageLoader/colorSpaceConverters/convertYBRFullByPixel.js");

Object.defineProperty(exports, 'convertYBRFullByPixel', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_convertYBRFullByPixel).default;
  }
});

var _convertYBRFullByPlane = __webpack_require__(/*! ./convertYBRFullByPlane.js */ "./imageLoader/colorSpaceConverters/convertYBRFullByPlane.js");

Object.defineProperty(exports, 'convertYBRFullByPlane', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_convertYBRFullByPlane).default;
  }
});

var _convertPALETTECOLOR = __webpack_require__(/*! ./convertPALETTECOLOR.js */ "./imageLoader/colorSpaceConverters/convertPALETTECOLOR.js");

Object.defineProperty(exports, 'convertPALETTECOLOR', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_convertPALETTECOLOR).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ "./imageLoader/configure.js":
/*!**********************************!*\
  !*** ./imageLoader/configure.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = __webpack_require__(/*! ./internal/index.js */ "./imageLoader/internal/index.js");

function configure(options) {
  (0, _index.setOptions)(options);
}

exports.default = configure;

/***/ }),

/***/ "./imageLoader/convertColorSpace.js":
/*!******************************************!*\
  !*** ./imageLoader/convertColorSpace.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = convertColorSpace;

var _index = __webpack_require__(/*! ./colorSpaceConverters/index.js */ "./imageLoader/colorSpaceConverters/index.js");

function convertRGB(imageFrame, rgbaBuffer) {
  if (imageFrame.planarConfiguration === 0) {
    (0, _index.convertRGBColorByPixel)(imageFrame.pixelData, rgbaBuffer);
  } else {
    (0, _index.convertRGBColorByPlane)(imageFrame.pixelData, rgbaBuffer);
  }
}

function convertYBRFull(imageFrame, rgbaBuffer) {
  if (imageFrame.planarConfiguration === 0) {
    (0, _index.convertYBRFullByPixel)(imageFrame.pixelData, rgbaBuffer);
  } else {
    (0, _index.convertYBRFullByPlane)(imageFrame.pixelData, rgbaBuffer);
  }
}

function convertColorSpace(imageFrame, imageData) {
  var rgbaBuffer = imageData.data;
  // convert based on the photometric interpretation

  if (imageFrame.photometricInterpretation === 'RGB') {
    convertRGB(imageFrame, rgbaBuffer);
  } else if (imageFrame.photometricInterpretation === 'YBR_RCT') {
    convertRGB(imageFrame, rgbaBuffer);
  } else if (imageFrame.photometricInterpretation === 'YBR_ICT') {
    convertRGB(imageFrame, rgbaBuffer);
  } else if (imageFrame.photometricInterpretation === 'PALETTE COLOR') {
    (0, _index.convertPALETTECOLOR)(imageFrame, rgbaBuffer);
  } else if (imageFrame.photometricInterpretation === 'YBR_FULL_422') {
    convertRGB(imageFrame, rgbaBuffer);
  } else if (imageFrame.photometricInterpretation === 'YBR_FULL') {
    convertYBRFull(imageFrame, rgbaBuffer);
  } else {
    throw new Error('No color space conversion for photometric interpretation ' + imageFrame.photometricInterpretation);
  }
}

/***/ }),

/***/ "./imageLoader/createImage.js":
/*!************************************!*\
  !*** ./imageLoader/createImage.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _externalModules = __webpack_require__(/*! ../externalModules.js */ "./externalModules.js");

var _externalModules2 = _interopRequireDefault(_externalModules);

var _getImageFrame = __webpack_require__(/*! ./getImageFrame.js */ "./imageLoader/getImageFrame.js");

var _getImageFrame2 = _interopRequireDefault(_getImageFrame);

var _decodeImageFrame = __webpack_require__(/*! ./decodeImageFrame.js */ "./imageLoader/decodeImageFrame.js");

var _decodeImageFrame2 = _interopRequireDefault(_decodeImageFrame);

var _isColorImage = __webpack_require__(/*! ./isColorImage.js */ "./imageLoader/isColorImage.js");

var _isColorImage2 = _interopRequireDefault(_isColorImage);

var _convertColorSpace = __webpack_require__(/*! ./convertColorSpace.js */ "./imageLoader/convertColorSpace.js");

var _convertColorSpace2 = _interopRequireDefault(_convertColorSpace);

var _getMinMax = __webpack_require__(/*! ../shared/getMinMax.js */ "./shared/getMinMax.js");

var _getMinMax2 = _interopRequireDefault(_getMinMax);

var _isJPEGBaseline8BitColor = __webpack_require__(/*! ./isJPEGBaseline8BitColor.js */ "./imageLoader/isJPEGBaseline8BitColor.js");

var _isJPEGBaseline8BitColor2 = _interopRequireDefault(_isJPEGBaseline8BitColor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lastImageIdDrawn = '';

function isModalityLUTForDisplay(sopClassUid) {
  // special case for XA and XRF
  // https://groups.google.com/forum/#!searchin/comp.protocols.dicom/Modality$20LUT$20XA/comp.protocols.dicom/UBxhOZ2anJ0/D0R_QP8V2wIJ
  return sopClassUid !== '1.2.840.10008.5.1.4.1.1.12.1' && // XA
  sopClassUid !== '1.2.840.10008.5.1.4.1.1.12.2.1'; // XRF
}

function convertToIntPixelData(floatPixelData) {
  var floatMinMax = (0, _getMinMax2.default)(floatPixelData);
  var floatRange = Math.abs(floatMinMax.max - floatMinMax.min);
  var intRange = 65535;
  var slope = floatRange / intRange;
  var intercept = floatMinMax.min;
  var numPixels = floatPixelData.length;
  var intPixelData = new Uint16Array(numPixels);
  var min = 65535;
  var max = 0;

  for (var i = 0; i < numPixels; i++) {
    var rescaledPixel = Math.floor((floatPixelData[i] - intercept) / slope);

    intPixelData[i] = rescaledPixel;
    min = Math.min(min, rescaledPixel);
    max = Math.max(max, rescaledPixel);
  }

  return {
    min: min,
    max: max,
    intPixelData: intPixelData,
    slope: slope,
    intercept: intercept
  };
}

/**
 * Helper function to set pixel data to the right typed array.  This is needed because web workers
 * can transfer array buffers but not typed arrays
 * @param imageFrame
 */
function setPixelDataType(imageFrame) {
  if (imageFrame.bitsAllocated === 32) {
    imageFrame.pixelData = new Float32Array(imageFrame.pixelData);
  } else if (imageFrame.bitsAllocated === 16) {
    if (imageFrame.pixelRepresentation === 0) {
      imageFrame.pixelData = new Uint16Array(imageFrame.pixelData);
    } else {
      imageFrame.pixelData = new Int16Array(imageFrame.pixelData);
    }
  } else {
    imageFrame.pixelData = new Uint8Array(imageFrame.pixelData);
  }
}

function createImage(imageId, pixelData, transferSyntax, options) {

  if (!pixelData || !pixelData.length) {
    return Promise.reject(new Error('The file does not contain image data.'));
  }

  var cornerstone = _externalModules2.default.cornerstone;

  var canvas = document.createElement('canvas');
  var imageFrame = (0, _getImageFrame2.default)(imageId);
  var decodePromise = (0, _decodeImageFrame2.default)(imageFrame, transferSyntax, pixelData, canvas, options);

  return new Promise(function (resolve, reject) {
    decodePromise.then(function (imageFrame) {
      var imagePlaneModule = cornerstone.metaData.get('imagePlaneModule', imageId) || {};
      var voiLutModule = cornerstone.metaData.get('voiLutModule', imageId) || {};
      var modalityLutModule = cornerstone.metaData.get('modalityLutModule', imageId) || {};
      var sopCommonModule = cornerstone.metaData.get('sopCommonModule', imageId) || {};
      var isColorImage = (0, _isColorImage2.default)(imageFrame.photometricInterpretation);

      // JPEGBaseline (8 bits) is already returning the pixel data in the right format (rgba)
      // because it's using a canvas to load and decode images.
      if (!(0, _isJPEGBaseline8BitColor2.default)(imageFrame, transferSyntax)) {
        setPixelDataType(imageFrame);

        // convert color space
        if (isColorImage) {
          // setup the canvas context
          canvas.height = imageFrame.rows;
          canvas.width = imageFrame.columns;

          var context = canvas.getContext('2d');
          var imageData = context.createImageData(imageFrame.columns, imageFrame.rows);

          (0, _convertColorSpace2.default)(imageFrame, imageData);
          imageFrame.imageData = imageData;
          imageFrame.pixelData = imageData.data;

          // calculate smallest and largest PixelValue of the converted pixelData
          var minMax = (0, _getMinMax2.default)(imageFrame.pixelData);

          imageFrame.smallestPixelValue = minMax.min;
          imageFrame.largestPixelValue = minMax.max;
        }
      }

      var image = {
        imageId: imageId,
        color: isColorImage,
        columnPixelSpacing: imagePlaneModule.pixelSpacing ? imagePlaneModule.pixelSpacing[1] : undefined,
        columns: imageFrame.columns,
        height: imageFrame.rows,
        intercept: modalityLutModule.rescaleIntercept ? modalityLutModule.rescaleIntercept : 0,
        invert: imageFrame.photometricInterpretation === 'MONOCHROME1',
        minPixelValue: imageFrame.smallestPixelValue,
        maxPixelValue: imageFrame.largestPixelValue,
        rowPixelSpacing: imagePlaneModule.pixelSpacing ? imagePlaneModule.pixelSpacing[0] : undefined,
        rows: imageFrame.rows,
        sizeInBytes: imageFrame.pixelData.length,
        slope: modalityLutModule.rescaleSlope ? modalityLutModule.rescaleSlope : 1,
        width: imageFrame.columns,
        windowCenter: voiLutModule.windowCenter ? voiLutModule.windowCenter[0] : undefined,
        windowWidth: voiLutModule.windowWidth ? voiLutModule.windowWidth[0] : undefined,
        decodeTimeInMS: imageFrame.decodeTimeInMS,
        floatPixelData: undefined
      };

      // add function to return pixel data
      if (imageFrame.pixelData instanceof Float32Array) {
        var floatPixelData = imageFrame.pixelData;
        var results = convertToIntPixelData(floatPixelData);

        image.minPixelValue = results.min;
        image.maxPixelValue = results.max;
        image.slope = results.slope;
        image.intercept = results.intercept;
        image.floatPixelData = floatPixelData;
        image.getPixelData = function () {
          return results.intPixelData;
        };
      } else {
        image.getPixelData = function () {
          return imageFrame.pixelData;
        };
      }

      if (image.color) {
        image.getCanvas = function () {
          if (lastImageIdDrawn === imageId) {
            return canvas;
          }

          canvas.height = image.rows;
          canvas.width = image.columns;
          var context = canvas.getContext('2d');

          context.putImageData(imageFrame.imageData, 0, 0);
          lastImageIdDrawn = imageId;

          return canvas;
        };
      }

      // Modality LUT
      if (modalityLutModule.modalityLUTSequence && modalityLutModule.modalityLUTSequence.length > 0 && isModalityLUTForDisplay(sopCommonModule.sopClassUID)) {
        image.modalityLUT = modalityLutModule.modalityLUTSequence[0];
      }

      // VOI LUT
      if (voiLutModule.voiLUTSequence && voiLutModule.voiLUTSequence.length > 0) {
        image.voiLUT = voiLutModule.voiLUTSequence[0];
      }

      if (image.color) {
        image.windowWidth = 255;
        image.windowCenter = 127;
      }

      // set the ww/wc to cover the dynamic range of the image if no values are supplied
      if (image.windowCenter === undefined || image.windowWidth === undefined) {
        var maxVoi = image.maxPixelValue * image.slope + image.intercept;
        var minVoi = image.minPixelValue * image.slope + image.intercept;

        image.windowWidth = maxVoi - minVoi;
        image.windowCenter = (maxVoi + minVoi) / 2;
      }
      resolve(image);
    }, reject);
  });
}

exports.default = createImage;

/***/ }),

/***/ "./imageLoader/decodeImageFrame.js":
/*!*****************************************!*\
  !*** ./imageLoader/decodeImageFrame.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _options = __webpack_require__(/*! ./internal/options.js */ "./imageLoader/internal/options.js");

var _webWorkerManager = __webpack_require__(/*! ./webWorkerManager.js */ "./imageLoader/webWorkerManager.js");

var _webWorkerManager2 = _interopRequireDefault(_webWorkerManager);

var _decodeJPEGBaseline8BitColor = __webpack_require__(/*! ./decodeJPEGBaseline8BitColor.js */ "./imageLoader/decodeJPEGBaseline8BitColor.js");

var _decodeJPEGBaseline8BitColor2 = _interopRequireDefault(_decodeJPEGBaseline8BitColor);

var _decodeImageFrame = __webpack_require__(/*! ../shared/decodeImageFrame.js */ "./shared/decodeImageFrame.js");

var _decodeImageFrame2 = _interopRequireDefault(_decodeImageFrame);

var _calculateMinMax = __webpack_require__(/*! ../shared/calculateMinMax.js */ "./shared/calculateMinMax.js");

var _calculateMinMax2 = _interopRequireDefault(_calculateMinMax);

var _decodeJPEG = __webpack_require__(/*! ../shared/decoders/decodeJPEG2000.js */ "./shared/decoders/decodeJPEG2000.js");

var _decodeJPEGLS = __webpack_require__(/*! ../shared/decoders/decodeJPEGLS.js */ "./shared/decoders/decodeJPEGLS.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var codecsInitialized = false;

function processDecodeTask(imageFrame, transferSyntax, pixelData, options) {
  var priority = options.priority || undefined;
  var transferList = options.transferPixelData ? [pixelData.buffer] : undefined;
  var loaderOptions = (0, _options.getOptions)();
  var strict = loaderOptions.strict,
      decodeConfig = loaderOptions.decodeConfig,
      useWebWorkers = loaderOptions.useWebWorkers;


  if (useWebWorkers === false) {
    if (codecsInitialized === false) {
      (0, _decodeJPEG.initializeJPEG2000)(decodeConfig);
      (0, _decodeJPEGLS.initializeJPEGLS)(decodeConfig);

      codecsInitialized = true;
    }

    return new Promise(function (resolve, reject) {
      try {
        var decodeArguments = [imageFrame, transferSyntax, pixelData, decodeConfig, options];
        var decodedImageFrame = _decodeImageFrame2.default.apply(undefined, decodeArguments);

        (0, _calculateMinMax2.default)(decodedImageFrame, strict);

        resolve(decodedImageFrame);
      } catch (error) {
        reject(error);
      }
    });
  }

  return _webWorkerManager2.default.addTask('decodeTask', {
    imageFrame: imageFrame,
    transferSyntax: transferSyntax,
    pixelData: pixelData,
    options: options
  }, priority, transferList).promise;
}

function decodeImageFrame(imageFrame, transferSyntax, pixelData, canvas) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  // TODO: Turn this into a switch statement instead
  if (transferSyntax === '1.2.840.10008.1.2') {
    // Implicit VR Little Endian
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.1') {
    // Explicit VR Little Endian
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.2') {
    // Explicit VR Big Endian (retired)
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.1.99') {
    // Deflate transfer syntax (deflated by dicomParser)
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.5') {
    // RLE Lossless
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.50') {
    // JPEG Baseline lossy process 1 (8 bit)

    // Handle 8-bit JPEG Baseline color images using the browser's built-in
    // JPEG decoding
    if (imageFrame.bitsAllocated === 8 && (imageFrame.samplesPerPixel === 3 || imageFrame.samplesPerPixel === 4)) {
      return (0, _decodeJPEGBaseline8BitColor2.default)(imageFrame, pixelData, canvas);
    }

    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.51') {
    // JPEG Baseline lossy process 2 & 4 (12 bit)
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.57') {
    // JPEG Lossless, Nonhierarchical (Processes 14)
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.70') {
    // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.80') {
    // JPEG-LS Lossless Image Compression
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.81') {
    // JPEG-LS Lossy (Near-Lossless) Image Compression
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.90') {
    // JPEG 2000 Lossless
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.91') {
    // JPEG 2000 Lossy
    return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
  }

  /* Don't know if these work...
   // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
   else if(transferSyntax === "1.2.840.10008.1.2.4.92")
   {
   return cornerstoneWADOImageLoader.decodeJPEG2000(dataSet, frame);
   }
   // JPEG 2000 Part 2 Multicomponent Image Compression
   else if(transferSyntax === "1.2.840.10008.1.2.4.93")
   {
   return cornerstoneWADOImageLoader.decodeJPEG2000(dataSet, frame);
   }
   */

  return new Promise(function (resolve, reject) {
    reject(new Error('No decoder for transfer syntax ' + transferSyntax));
  });
}

exports.default = decodeImageFrame;

/***/ }),

/***/ "./imageLoader/decodeJPEGBaseline8BitColor.js":
/*!****************************************************!*\
  !*** ./imageLoader/decodeJPEGBaseline8BitColor.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getMinMax = __webpack_require__(/*! ../shared/getMinMax.js */ "./shared/getMinMax.js");

var _getMinMax2 = _interopRequireDefault(_getMinMax);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Special decoder for 8 bit jpeg that leverages the browser's built in JPEG decoder for increased performance
 */

function arrayBufferToString(buffer) {
  return binaryToString(String.fromCharCode.apply(null, Array.prototype.slice.apply(new Uint8Array(buffer))));
}

function binaryToString(binary) {
  var error = void 0;

  try {
    return decodeURIComponent(escape(binary));
  } catch (_error) {
    error = _error;
    if (error instanceof URIError) {
      return binary;
    }
    throw error;
  }
}

function decodeJPEGBaseline8BitColor(imageFrame, pixelData, canvas) {
  var start = new Date().getTime();
  var imgBlob = new Blob([pixelData], { type: 'image/jpeg' });

  return new Promise(function (resolve, reject) {
    var fileReader = new FileReader();

    if (fileReader.readAsBinaryString === undefined) {
      fileReader.readAsArrayBuffer(imgBlob);
    } else {
      fileReader.readAsBinaryString(imgBlob); // doesn't work on IE11
    }

    fileReader.onload = function () {
      var img = new Image();

      img.onload = function () {
        canvas.height = img.height;
        canvas.width = img.width;
        imageFrame.rows = img.height;
        imageFrame.columns = img.width;
        var context = canvas.getContext('2d');

        context.drawImage(this, 0, 0);
        var imageData = context.getImageData(0, 0, img.width, img.height);
        var end = new Date().getTime();

        imageFrame.pixelData = imageData.data;
        imageFrame.imageData = imageData;
        imageFrame.decodeTimeInMS = end - start;

        // calculate smallest and largest PixelValue
        var minMax = (0, _getMinMax2.default)(imageFrame.pixelData);

        imageFrame.smallestPixelValue = minMax.min;
        imageFrame.largestPixelValue = minMax.max;

        resolve(imageFrame);
      };

      img.onerror = function (error) {
        reject(error);
      };

      if (fileReader.readAsBinaryString === undefined) {
        img.src = 'data:image/jpeg;base64,' + window.btoa(arrayBufferToString(fileReader.result));
      } else {
        img.src = 'data:image/jpeg;base64,' + window.btoa(fileReader.result); // doesn't work on IE11
      }
    };

    fileReader.onerror = function (e) {
      reject(e);
    };
  });
}

exports.default = decodeJPEGBaseline8BitColor;

/***/ }),

/***/ "./imageLoader/getImageFrame.js":
/*!**************************************!*\
  !*** ./imageLoader/getImageFrame.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _externalModules = __webpack_require__(/*! ../externalModules.js */ "./externalModules.js");

var _externalModules2 = _interopRequireDefault(_externalModules);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getImageFrame(imageId) {
  var cornerstone = _externalModules2.default.cornerstone;

  var imagePixelModule = cornerstone.metaData.get('imagePixelModule', imageId);

  return {
    samplesPerPixel: imagePixelModule.samplesPerPixel,
    photometricInterpretation: imagePixelModule.photometricInterpretation,
    planarConfiguration: imagePixelModule.planarConfiguration,
    rows: imagePixelModule.rows,
    columns: imagePixelModule.columns,
    bitsAllocated: imagePixelModule.bitsAllocated,
    bitsStored: imagePixelModule.bitsStored,
    pixelRepresentation: imagePixelModule.pixelRepresentation, // 0 = unsigned,
    smallestPixelValue: imagePixelModule.smallestPixelValue,
    largestPixelValue: imagePixelModule.largestPixelValue,
    redPaletteColorLookupTableDescriptor: imagePixelModule.redPaletteColorLookupTableDescriptor,
    greenPaletteColorLookupTableDescriptor: imagePixelModule.greenPaletteColorLookupTableDescriptor,
    bluePaletteColorLookupTableDescriptor: imagePixelModule.bluePaletteColorLookupTableDescriptor,
    redPaletteColorLookupTableData: imagePixelModule.redPaletteColorLookupTableData,
    greenPaletteColorLookupTableData: imagePixelModule.greenPaletteColorLookupTableData,
    bluePaletteColorLookupTableData: imagePixelModule.bluePaletteColorLookupTableData,
    pixelData: undefined // populated later after decoding
  };
}

exports.default = getImageFrame;

/***/ }),

/***/ "./imageLoader/index.js":
/*!******************************!*\
  !*** ./imageLoader/index.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = __webpack_require__(/*! ./colorSpaceConverters/index.js */ "./imageLoader/colorSpaceConverters/index.js");

Object.keys(_index).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _index[key];
    }
  });
});

var _index2 = __webpack_require__(/*! ./wadouri/index.js */ "./imageLoader/wadouri/index.js");

Object.defineProperty(exports, 'wadouri', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_index2).default;
  }
});

var _index3 = __webpack_require__(/*! ./wadors/index.js */ "./imageLoader/wadors/index.js");

Object.defineProperty(exports, 'wadors', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_index3).default;
  }
});

var _configure = __webpack_require__(/*! ./configure.js */ "./imageLoader/configure.js");

Object.defineProperty(exports, 'configure', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_configure).default;
  }
});

var _convertColorSpace = __webpack_require__(/*! ./convertColorSpace.js */ "./imageLoader/convertColorSpace.js");

Object.defineProperty(exports, 'convertColorSpace', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_convertColorSpace).default;
  }
});

var _createImage = __webpack_require__(/*! ./createImage.js */ "./imageLoader/createImage.js");

Object.defineProperty(exports, 'createImage', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_createImage).default;
  }
});

var _decodeImageFrame = __webpack_require__(/*! ./decodeImageFrame.js */ "./imageLoader/decodeImageFrame.js");

Object.defineProperty(exports, 'decodeImageFrame', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_decodeImageFrame).default;
  }
});

var _decodeJPEGBaseline8BitColor = __webpack_require__(/*! ./decodeJPEGBaseline8BitColor.js */ "./imageLoader/decodeJPEGBaseline8BitColor.js");

Object.defineProperty(exports, 'decodeJPEGBaseline8BitColor', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_decodeJPEGBaseline8BitColor).default;
  }
});

var _getImageFrame = __webpack_require__(/*! ./getImageFrame.js */ "./imageLoader/getImageFrame.js");

Object.defineProperty(exports, 'getImageFrame', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getImageFrame).default;
  }
});

var _getMinMax = __webpack_require__(/*! ../shared/getMinMax.js */ "./shared/getMinMax.js");

Object.defineProperty(exports, 'getMinMax', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getMinMax).default;
  }
});

var _isColorImage = __webpack_require__(/*! ./isColorImage.js */ "./imageLoader/isColorImage.js");

Object.defineProperty(exports, 'isColorImage', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_isColorImage).default;
  }
});

var _isJPEGBaseline8BitColor = __webpack_require__(/*! ./isJPEGBaseline8BitColor.js */ "./imageLoader/isJPEGBaseline8BitColor.js");

Object.defineProperty(exports, 'isJPEGBaseline8BitColor', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_isJPEGBaseline8BitColor).default;
  }
});

var _webWorkerManager = __webpack_require__(/*! ./webWorkerManager.js */ "./imageLoader/webWorkerManager.js");

Object.defineProperty(exports, 'webWorkerManager', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_webWorkerManager).default;
  }
});

var _version = __webpack_require__(/*! ../version.js */ "./version.js");

Object.defineProperty(exports, 'version', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_version).default;
  }
});

var _index4 = __webpack_require__(/*! ./internal/index.js */ "./imageLoader/internal/index.js");

Object.defineProperty(exports, 'internal', {
  enumerable: true,
  get: function get() {
    return _index4.internal;
  }
});

var _externalModules = __webpack_require__(/*! ../externalModules.js */ "./externalModules.js");

Object.defineProperty(exports, 'external', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_externalModules).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ "./imageLoader/internal/index.js":
/*!***************************************!*\
  !*** ./imageLoader/internal/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.internal = exports.xhrRequest = exports.getOptions = exports.setOptions = undefined;

var _xhrRequest = __webpack_require__(/*! ./xhrRequest.js */ "./imageLoader/internal/xhrRequest.js");

var _xhrRequest2 = _interopRequireDefault(_xhrRequest);

var _options = __webpack_require__(/*! ./options.js */ "./imageLoader/internal/options.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var internal = {
  xhrRequest: _xhrRequest2.default,
  setOptions: _options.setOptions,
  getOptions: _options.getOptions
};

exports.setOptions = _options.setOptions;
exports.getOptions = _options.getOptions;
exports.xhrRequest = _xhrRequest2.default;
exports.internal = internal;

/***/ }),

/***/ "./imageLoader/internal/options.js":
/*!*****************************************!*\
  !*** ./imageLoader/internal/options.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setOptions = setOptions;
exports.getOptions = getOptions;
var options = {
  // callback allowing customization of the xhr (e.g. adding custom auth headers, cors, etc)
  beforeSend: function beforeSend() /* xhr, imageId */{},

  // callback allowing modification of newly created image objects
  imageCreated: function imageCreated() /* image */{},

  strict: false,
  useWebWorkers: true,
  decodeConfig: {
    usePDFJS: false
  }
};

function setOptions(newOptions) {
  options = Object.assign(options, newOptions);
}

function getOptions() {
  return options;
}

/***/ }),

/***/ "./imageLoader/internal/xhrRequest.js":
/*!********************************************!*\
  !*** ./imageLoader/internal/xhrRequest.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _externalModules = __webpack_require__(/*! ../../externalModules.js */ "./externalModules.js");

var _externalModules2 = _interopRequireDefault(_externalModules);

var _options = __webpack_require__(/*! ./options.js */ "./imageLoader/internal/options.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function xhrRequest(url, imageId) {
  var headers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var params = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var cornerstone = _externalModules2.default.cornerstone;

  var options = (0, _options.getOptions)();

  // Make the request for the DICOM P10 SOP Instance
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open('get', url, true);
    xhr.responseType = 'arraybuffer';
    options.beforeSend(xhr, imageId);
    Object.keys(headers).forEach(function (key) {
      // xhr.setRequestHeader(key, headers[key]);
    });

    params.deferred = {
      resolve: resolve,
      reject: reject
    };
    params.url = url;
    params.imageId = imageId;

    // Event triggered when downloading an image starts
    xhr.onloadstart = function (event) {
      // Action
      if (options.onloadstart) {
        options.onloadstart(event, params);
      }

      // Event
      var eventData = {
        url: url,
        imageId: imageId
      };

      cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadstart', eventData);
    };

    // Event triggered when downloading an image ends
    xhr.onloadend = function (event) {
      // Action
      if (options.onloadend) {
        options.onloadend(event, params);
      }

      var eventData = {
        url: url,
        imageId: imageId
      };

      // Event
      cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadend', eventData);
    };

    // handle response data
    xhr.onreadystatechange = function (event) {
      // Action
      if (options.onreadystatechange) {
        options.onreadystatechange(event, params);

        return;
      }

      // Default action
      // TODO: consider sending out progress messages here as we receive the pixel data
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response, xhr);
        } else {
          // request failed, reject the Promise
          reject(xhr);
        }
      }
    };

    // Event triggered when downloading an image progresses
    xhr.onprogress = function (oProgress) {
      // console.log('progress:',oProgress)
      var loaded = oProgress.loaded; // evt.loaded the bytes browser receive
      var total = void 0;
      var percentComplete = void 0;

      if (oProgress.lengthComputable) {
        total = oProgress.total; // evt.total the total bytes seted by the header
        percentComplete = Math.round(loaded / total * 100);
      }

      // Action
      if (options.onprogress) {
        options.onprogress(oProgress, params);
      }

      // Event
      var eventData = {
        url: url,
        imageId: imageId,
        loaded: loaded,
        total: total,
        percentComplete: percentComplete
      };

      cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadprogress', eventData);
    };

    xhr.send();
  });
}

exports.default = xhrRequest;

/***/ }),

/***/ "./imageLoader/isColorImage.js":
/*!*************************************!*\
  !*** ./imageLoader/isColorImage.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (photoMetricInterpretation) {
  return photoMetricInterpretation === 'RGB' || photoMetricInterpretation === 'PALETTE COLOR' || photoMetricInterpretation === 'YBR_FULL' || photoMetricInterpretation === 'YBR_FULL_422' || photoMetricInterpretation === 'YBR_PARTIAL_422' || photoMetricInterpretation === 'YBR_PARTIAL_420' || photoMetricInterpretation === 'YBR_RCT' || photoMetricInterpretation === 'YBR_ICT';
};

/***/ }),

/***/ "./imageLoader/isJPEGBaseline8BitColor.js":
/*!************************************************!*\
  !*** ./imageLoader/isJPEGBaseline8BitColor.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function isJPEGBaseline8BitColor(imageFrame, transferSyntax) {
  transferSyntax = transferSyntax || imageFrame.transferSyntax;

  if (imageFrame.bitsAllocated === 8 && transferSyntax === '1.2.840.10008.1.2.4.50' && (imageFrame.samplesPerPixel === 3 || imageFrame.samplesPerPixel === 4)) {
    return true;
  }
}

exports.default = isJPEGBaseline8BitColor;

/***/ }),

/***/ "./imageLoader/registerLoaders.js":
/*!****************************************!*\
  !*** ./imageLoader/registerLoaders.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = __webpack_require__(/*! ./wadors/index.js */ "./imageLoader/wadors/index.js");

var _index2 = _interopRequireDefault(_index);

var _index3 = __webpack_require__(/*! ./wadouri/index.js */ "./imageLoader/wadouri/index.js");

var _index4 = _interopRequireDefault(_index3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Register the WADO-URI and WADO-RS image loaders and metaData providers
 * with an instance of Cornerstone Core.
 *
 * @param cornerstone The Cornerstone Core library to register the image loaders with
 */
function registerLoaders(cornerstone) {
  _index2.default.register(cornerstone);
  _index4.default.register(cornerstone);
}

exports.default = registerLoaders;

/***/ }),

/***/ "./imageLoader/wadors/findIndexOfString.js":
/*!*************************************************!*\
  !*** ./imageLoader/wadors/findIndexOfString.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function checkToken(token, data, dataOffset) {

  if (dataOffset + token.length > data.length) {
    return false;
  }

  var endIndex = dataOffset;

  for (var i = 0; i < token.length; i++) {
    if (token[i] !== data[endIndex++]) {
      return false;
    }
  }

  return true;
}

function stringToUint8Array(str) {
  var uint = new Uint8Array(str.length);

  for (var i = 0, j = str.length; i < j; i++) {
    uint[i] = str.charCodeAt(i);
  }

  return uint;
}

function findIndexOfString(data, str, offset) {

  offset = offset || 0;

  var token = stringToUint8Array(str);

  for (var i = offset; i < data.length; i++) {
    if (token[0] === data[i]) {
      // console.log('match @', i);
      if (checkToken(token, data, i)) {
        return i;
      }
    }
  }

  return -1;
}
exports.default = findIndexOfString;

/***/ }),

/***/ "./imageLoader/wadors/getPixelData.js":
/*!********************************************!*\
  !*** ./imageLoader/wadors/getPixelData.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = __webpack_require__(/*! ../internal/index.js */ "./imageLoader/internal/index.js");

var _findIndexOfString = __webpack_require__(/*! ./findIndexOfString.js */ "./imageLoader/wadors/findIndexOfString.js");

var _findIndexOfString2 = _interopRequireDefault(_findIndexOfString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findBoundary(header) {
  for (var i = 0; i < header.length; i++) {
    if (header[i].substr(0, 2) === '--') {
      return header[i];
    }
  }
}

function findContentType(header) {
  for (var i = 0; i < header.length; i++) {
    if (header[i].substr(0, 13) === 'Content-Type:') {
      return header[i].substr(13).trim();
    }
  }
}

function uint8ArrayToString(data, offset, length) {
  offset = offset || 0;
  length = length || data.length - offset;
  var str = '';

  for (var i = offset; i < offset + length; i++) {
    str += String.fromCharCode(data[i]);
  }

  return str;
}

function getPixelData(uri, imageId) {
  var mediaType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'application/octet-stream';

  var headers = {
    accept: mediaType
  };

  return new Promise(function (resolve, reject) {
    var loadPromise = (0, _index.xhrRequest)(uri, imageId, headers);

    loadPromise.then(function (imageFrameAsArrayBuffer /* , xhr*/) {

      // request succeeded, Parse the multi-part mime response
      var response = new Uint8Array(imageFrameAsArrayBuffer);

      // First look for the multipart mime header
      var tokenIndex = (0, _findIndexOfString2.default)(response, '\r\n\r\n');

      if (tokenIndex === -1) {
        reject(new Error('invalid response - no multipart mime header'));
      }
      var header = uint8ArrayToString(response, 0, tokenIndex);
      // Now find the boundary  marker
      var split = header.split('\r\n');
      var boundary = findBoundary(split);

      if (!boundary) {
        reject(new Error('invalid response - no boundary marker'));
      }
      var offset = tokenIndex + 4; // skip over the \r\n\r\n

      // find the terminal boundary marker
      var endIndex = (0, _findIndexOfString2.default)(response, boundary, offset);

      if (endIndex === -1) {
        reject(new Error('invalid response - terminating boundary not found'));
      }

      // Remove \r\n from the length
      var length = endIndex - offset - 2;

      // return the info for this pixel data
      resolve({
        contentType: findContentType(split),
        imageFrame: {
          pixelData: new Uint8Array(imageFrameAsArrayBuffer, offset, length)
        }
      });
    });
  });
}

exports.default = getPixelData;

/***/ }),

/***/ "./imageLoader/wadors/index.js":
/*!*************************************!*\
  !*** ./imageLoader/wadors/index.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = __webpack_require__(/*! ./metaData/index.js */ "./imageLoader/wadors/metaData/index.js");

var _findIndexOfString = __webpack_require__(/*! ./findIndexOfString.js */ "./imageLoader/wadors/findIndexOfString.js");

var _findIndexOfString2 = _interopRequireDefault(_findIndexOfString);

var _getPixelData = __webpack_require__(/*! ./getPixelData.js */ "./imageLoader/wadors/getPixelData.js");

var _getPixelData2 = _interopRequireDefault(_getPixelData);

var _metaDataManager = __webpack_require__(/*! ./metaDataManager.js */ "./imageLoader/wadors/metaDataManager.js");

var _metaDataManager2 = _interopRequireDefault(_metaDataManager);

var _loadImage = __webpack_require__(/*! ./loadImage.js */ "./imageLoader/wadors/loadImage.js");

var _loadImage2 = _interopRequireDefault(_loadImage);

var _register = __webpack_require__(/*! ./register.js */ "./imageLoader/wadors/register.js");

var _register2 = _interopRequireDefault(_register);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var metaData = {
  getNumberString: _index.getNumberString,
  getNumberValue: _index.getNumberValue,
  getNumberValues: _index.getNumberValues,
  getValue: _index.getValue,
  metaDataProvider: _index.metaDataProvider
};

exports.default = {
  metaData: metaData,
  findIndexOfString: _findIndexOfString2.default,
  getPixelData: _getPixelData2.default,
  loadImage: _loadImage2.default,
  metaDataManager: _metaDataManager2.default,
  register: _register2.default
};

/***/ }),

/***/ "./imageLoader/wadors/loadImage.js":
/*!*****************************************!*\
  !*** ./imageLoader/wadors/loadImage.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTransferSyntaxForContentType = getTransferSyntaxForContentType;

var _metaDataManager = __webpack_require__(/*! ./metaDataManager.js */ "./imageLoader/wadors/metaDataManager.js");

var _metaDataManager2 = _interopRequireDefault(_metaDataManager);

var _getPixelData = __webpack_require__(/*! ./getPixelData.js */ "./imageLoader/wadors/getPixelData.js");

var _getPixelData2 = _interopRequireDefault(_getPixelData);

var _createImage = __webpack_require__(/*! ../createImage.js */ "./imageLoader/createImage.js");

var _createImage2 = _interopRequireDefault(_createImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Helper method to extract the transfer-syntax from the response of the server.
 * @param {string} contentType The value of the content-type header as returned by the WADO-RS server.
 * @return The transfer-syntax as announced by the server, or Implicit Little Endian by default.
 */
function getTransferSyntaxForContentType(contentType) {
  var transferSyntax = '1.2.840.10008.1.2'; // Default is Implicit Little Endian.

  if (contentType) {
    // Browse through the content type parameters
    var parameters = contentType.split(';');

    parameters.forEach(function (parameter) {
      // Look for a transfer-syntax=XXXX pair
      var parameterValues = parameter.split('=');

      if (parameterValues.length !== 2) {
        return;
      }

      if (parameterValues[0].trim() === 'transfer-syntax') {
        transferSyntax = parameterValues[1].trim() || transferSyntax;
      }
    });
  }

  return transferSyntax;
}

function loadImage(imageId, options) {
  var start = new Date().getTime();
  var uri = imageId.substring(7);

  var promise = new Promise(function (resolve, reject) {
    // check to make sure we have metadata for this imageId
    var metaData = _metaDataManager2.default.get(imageId);

    if (metaData === undefined) {
      var error = new Error('no metadata for imageId ' + imageId);

      return reject(error);
    }

    // TODO: load bulk data items that we might need
    var mediaType = 'multipart/related; type="application/octet-stream"'; // 'image/dicom+jp2';

    // get the pixel data from the server
    (0, _getPixelData2.default)(uri, imageId, mediaType).then(function (result) {
      var transferSyntax = getTransferSyntaxForContentType(result.contentType);
      var pixelData = result.imageFrame.pixelData;
      var imagePromise = (0, _createImage2.default)(imageId, pixelData, transferSyntax, options);

      imagePromise.then(function (image) {
        // add the loadTimeInMS property
        var end = new Date().getTime();

        image.loadTimeInMS = end - start;
        resolve(image);
      }, reject);
    }, reject);
  });

  return {
    promise: promise,
    cancelFn: undefined
  };
}

exports.default = loadImage;

/***/ }),

/***/ "./imageLoader/wadors/metaData/getNumberString.js":
/*!********************************************************!*\
  !*** ./imageLoader/wadors/metaData/getNumberString.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getValue = __webpack_require__(/*! ./getValue.js */ "./imageLoader/wadors/metaData/getValue.js");

var _getValue2 = _interopRequireDefault(_getValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns the first string value as a Javascript number
 *
 * @param element - The javascript object for the specified element in the metadata
 * @param [index] - the index of the value in a multi-valued element, default is 0
 * @param [defaultValue] - The default value to return if the element does not exist
 * @returns {*}
 */
function getNumberString(element, index, defaultValue) {
  var value = (0, _getValue2.default)(element, index, defaultValue);

  if (value === undefined) {
    return;
  }

  return parseFloat(value);
}

exports.default = getNumberString;

/***/ }),

/***/ "./imageLoader/wadors/metaData/getNumberValue.js":
/*!*******************************************************!*\
  !*** ./imageLoader/wadors/metaData/getNumberValue.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getValue = __webpack_require__(/*! ./getValue.js */ "./imageLoader/wadors/metaData/getValue.js");

var _getValue2 = _interopRequireDefault(_getValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getNumberValue(element, index) {
  var value = (0, _getValue2.default)(element, index);

  if (value === undefined) {
    return;
  }

  return parseFloat(value);
}

exports.default = getNumberValue;

/***/ }),

/***/ "./imageLoader/wadors/metaData/getNumberValues.js":
/*!********************************************************!*\
  !*** ./imageLoader/wadors/metaData/getNumberValues.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});


/**
 * Returns the values as an array of javascript numbers
 *
 * @param element - The javascript object for the specified element in the metadata
 * @param [minimumLength] - the minimum number of values
 * @returns {*}
 */
function getNumberValues(element, minimumLength) {
  if (!element) {
    return;
  }
  // Value is not present if the attribute has a zero length value
  if (!element.Value) {
    return;
  }
  // make sure we have the expected length
  if (minimumLength && element.Value.length < minimumLength) {
    return;
  }

  var values = [];

  for (var i = 0; i < element.Value.length; i++) {
    values.push(parseFloat(element.Value[i]));
  }

  return values;
}

exports.default = getNumberValues;

/***/ }),

/***/ "./imageLoader/wadors/metaData/getValue.js":
/*!*************************************************!*\
  !*** ./imageLoader/wadors/metaData/getValue.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});


/**
 * Returns the raw value
 *
 * @param element - The javascript object for the specified element in the metadata
 * @param [index] - the index of the value in a multi-valued element, default is 0
 * @param [defaultValue] - The default value to return if the element does not exist
 * @returns {*}
 */
function getValue(element, index, defaultValue) {
  index = index || 0;
  if (!element) {
    return defaultValue;
  }
  // Value is not present if the attribute has a zero length value
  if (!element.Value) {
    return defaultValue;
  }
  // make sure we have the specified index
  if (element.Value.length <= index) {
    return defaultValue;
  }

  return element.Value[index];
}

exports.default = getValue;

/***/ }),

/***/ "./imageLoader/wadors/metaData/index.js":
/*!**********************************************!*\
  !*** ./imageLoader/wadors/metaData/index.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getNumberString = __webpack_require__(/*! ./getNumberString.js */ "./imageLoader/wadors/metaData/getNumberString.js");

Object.defineProperty(exports, 'getNumberString', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getNumberString).default;
  }
});

var _getNumberValue = __webpack_require__(/*! ./getNumberValue.js */ "./imageLoader/wadors/metaData/getNumberValue.js");

Object.defineProperty(exports, 'getNumberValue', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getNumberValue).default;
  }
});

var _getNumberValues = __webpack_require__(/*! ./getNumberValues.js */ "./imageLoader/wadors/metaData/getNumberValues.js");

Object.defineProperty(exports, 'getNumberValues', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getNumberValues).default;
  }
});

var _getValue = __webpack_require__(/*! ./getValue.js */ "./imageLoader/wadors/metaData/getValue.js");

Object.defineProperty(exports, 'getValue', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getValue).default;
  }
});

var _metaDataProvider = __webpack_require__(/*! ./metaDataProvider.js */ "./imageLoader/wadors/metaData/metaDataProvider.js");

Object.defineProperty(exports, 'metaDataProvider', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_metaDataProvider).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ "./imageLoader/wadors/metaData/metaDataProvider.js":
/*!*********************************************************!*\
  !*** ./imageLoader/wadors/metaData/metaDataProvider.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _externalModules = __webpack_require__(/*! ../../../externalModules.js */ "./externalModules.js");

var _externalModules2 = _interopRequireDefault(_externalModules);

var _getNumberValues = __webpack_require__(/*! ./getNumberValues.js */ "./imageLoader/wadors/metaData/getNumberValues.js");

var _getNumberValues2 = _interopRequireDefault(_getNumberValues);

var _getValue = __webpack_require__(/*! ./getValue.js */ "./imageLoader/wadors/metaData/getValue.js");

var _getValue2 = _interopRequireDefault(_getValue);

var _getNumberValue = __webpack_require__(/*! ./getNumberValue.js */ "./imageLoader/wadors/metaData/getNumberValue.js");

var _getNumberValue2 = _interopRequireDefault(_getNumberValue);

var _metaDataManager = __webpack_require__(/*! ../metaDataManager.js */ "./imageLoader/wadors/metaDataManager.js");

var _metaDataManager2 = _interopRequireDefault(_metaDataManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function metaDataProvider(type, imageId) {
  var dicomParser = _externalModules2.default.dicomParser;

  var metaData = _metaDataManager2.default.get(imageId);

  if (!metaData) {
    return;
  }

  if (type === 'generalSeriesModule') {
    return {
      modality: (0, _getValue2.default)(metaData['00080060']),
      seriesInstanceUID: (0, _getValue2.default)(metaData['0020000e']),
      seriesNumber: (0, _getNumberValue2.default)(metaData['00200011']),
      studyInstanceUID: (0, _getValue2.default)(metaData['0020000d']),
      seriesDate: dicomParser.parseDA((0, _getValue2.default)(metaData['00080021'])),
      seriesTime: dicomParser.parseTM((0, _getValue2.default)(metaData['00080031'], 0, ''))
    };
  }

  if (type === 'patientStudyModule') {
    return {
      patientAge: (0, _getNumberValue2.default)(metaData['00101010']),
      patientSize: (0, _getNumberValue2.default)(metaData['00101020']),
      patientWeight: (0, _getNumberValue2.default)(metaData['00101030'])
    };
  }

  if (type === 'imagePlaneModule') {
    var imageOrientationPatient = (0, _getNumberValues2.default)(metaData['00200037'], 6);
    var imagePositionPatient = (0, _getNumberValues2.default)(metaData['00200032'], 3);
    var pixelSpacing = (0, _getNumberValues2.default)(metaData['00280030'], 2);
    var columnPixelSpacing = 1.0;
    var rowPixelSpacing = 1.0;

    if (pixelSpacing) {
      rowPixelSpacing = pixelSpacing[0];
      columnPixelSpacing = pixelSpacing[1];
    }

    var rowCosines = null;
    var columnCosines = null;

    if (imageOrientationPatient) {
      rowCosines = [parseFloat(imageOrientationPatient[0]), parseFloat(imageOrientationPatient[1]), parseFloat(imageOrientationPatient[2])];
      columnCosines = [parseFloat(imageOrientationPatient[3]), parseFloat(imageOrientationPatient[4]), parseFloat(imageOrientationPatient[5])];
    }

    return {
      frameOfReferenceUID: (0, _getValue2.default)(metaData['00200052']),
      rows: (0, _getNumberValue2.default)(metaData['00280010']),
      columns: (0, _getNumberValue2.default)(metaData['00280011']),
      imageOrientationPatient: imageOrientationPatient,
      rowCosines: rowCosines,
      columnCosines: columnCosines,
      imagePositionPatient: imagePositionPatient,
      sliceThickness: (0, _getNumberValue2.default)(metaData['00180050']),
      sliceLocation: (0, _getNumberValue2.default)(metaData['00201041']),
      pixelSpacing: pixelSpacing,
      rowPixelSpacing: rowPixelSpacing,
      columnPixelSpacing: columnPixelSpacing
    };
  }

  if (type === 'imagePixelModule') {
    return {
      samplesPerPixel: (0, _getNumberValue2.default)(metaData['00280002']),
      photometricInterpretation: (0, _getValue2.default)(metaData['00280004']),
      rows: (0, _getNumberValue2.default)(metaData['00280010']),
      columns: (0, _getNumberValue2.default)(metaData['00280011']),
      bitsAllocated: (0, _getNumberValue2.default)(metaData['00280100']),
      bitsStored: (0, _getNumberValue2.default)(metaData['00280101']),
      highBit: (0, _getValue2.default)(metaData['00280102']),
      pixelRepresentation: (0, _getNumberValue2.default)(metaData['00280103']),
      planarConfiguration: (0, _getNumberValue2.default)(metaData['00280006']),
      pixelAspectRatio: (0, _getValue2.default)(metaData['00280034']),
      redPaletteColorLookupTableDescriptor: (0, _getNumberValues2.default)(metaData['00281101']),
      greenPaletteColorLookupTableDescriptor: (0, _getNumberValues2.default)(metaData['00281102']),
      bluePaletteColorLookupTableDescriptor: (0, _getNumberValues2.default)(metaData['00281103']),
      redPaletteColorLookupTableData: (0, _getNumberValues2.default)(metaData['00281201']),
      greenPaletteColorLookupTableData: (0, _getNumberValues2.default)(metaData['00281202']),
      bluePaletteColorLookupTableData: (0, _getNumberValues2.default)(metaData['00281203'])
    };
  }

  if (type === 'voiLutModule') {
    return {
      // TODO VOT LUT Sequence
      windowCenter: (0, _getNumberValues2.default)(metaData['00281050'], 1),
      windowWidth: (0, _getNumberValues2.default)(metaData['00281051'], 1)
    };
  }

  if (type === 'modalityLutModule') {
    return {
      // TODO VOT LUT Sequence
      rescaleIntercept: (0, _getNumberValue2.default)(metaData['00281052']),
      rescaleSlope: (0, _getNumberValue2.default)(metaData['00281053']),
      rescaleType: (0, _getValue2.default)(metaData['00281054'])
    };
  }

  if (type === 'sopCommonModule') {
    return {
      sopClassUID: (0, _getValue2.default)(metaData['00080016']),
      sopInstanceUID: (0, _getValue2.default)(metaData['00080018'])
    };
  }

  if (type === 'petIsotopeModule') {
    var radiopharmaceuticalInfo = (0, _getValue2.default)(metaData['00540016']);

    if (radiopharmaceuticalInfo === undefined) {
      return;
    }

    return {
      radiopharmaceuticalInfo: {
        radiopharmaceuticalStartTime: dicomParser.parseTM((0, _getValue2.default)(radiopharmaceuticalInfo['00181072'], 0, '')),
        radionuclideTotalDose: (0, _getNumberValue2.default)(radiopharmaceuticalInfo['00181074']),
        radionuclideHalfLife: (0, _getNumberValue2.default)(radiopharmaceuticalInfo['00181075'])
      }
    };
  }
}

exports.default = metaDataProvider;

/***/ }),

/***/ "./imageLoader/wadors/metaDataManager.js":
/*!***********************************************!*\
  !*** ./imageLoader/wadors/metaDataManager.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});


var imageIds = [];

function add(imageId, metadata) {
  imageIds[imageId] = metadata;
}

function get(imageId) {
  return imageIds[imageId];
}

function remove(imageId) {
  imageIds[imageId] = undefined;
}

function purge() {
  imageIds = [];
}

exports.default = {
  add: add,
  get: get,
  remove: remove,
  purge: purge
};

/***/ }),

/***/ "./imageLoader/wadors/register.js":
/*!****************************************!*\
  !*** ./imageLoader/wadors/register.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (cornerstone) {
  // register wadors scheme and metadata provider
  cornerstone.registerImageLoader('wadors', _loadImage2.default);
  cornerstone.metaData.addProvider(_index.metaDataProvider);
};

var _loadImage = __webpack_require__(/*! ./loadImage.js */ "./imageLoader/wadors/loadImage.js");

var _loadImage2 = _interopRequireDefault(_loadImage);

var _index = __webpack_require__(/*! ./metaData/index.js */ "./imageLoader/wadors/metaData/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ "./imageLoader/wadouri/dataSetCacheManager.js":
/*!****************************************************!*\
  !*** ./imageLoader/wadouri/dataSetCacheManager.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInfo = getInfo;

var _externalModules = __webpack_require__(/*! ../../externalModules.js */ "./externalModules.js");

var _externalModules2 = _interopRequireDefault(_externalModules);

var _index = __webpack_require__(/*! ../internal/index.js */ "./imageLoader/internal/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This object supports loading of DICOM P10 dataset from a uri and caching it so it can be accessed
 * by the caller.  This allows a caller to access the datasets without having to go through cornerstone's
 * image loader mechanism.  One reason a caller may need to do this is to determine the number of frames
 * in a multiframe sop instance so it can create the imageId's correctly.
 */
var cacheSizeInBytes = 0;

var loadedDataSets = {};
var promises = {};

// returns true if the wadouri for the specified index has been loaded
function isLoaded(uri) {
  return loadedDataSets[uri] !== undefined;
}

function get(uri) {
  if (!loadedDataSets[uri]) {
    return;
  }

  return loadedDataSets[uri].dataSet;
}

// loads the dicom dataset from the wadouri sp
function load(uri) {
  var loadRequest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _index.xhrRequest;
  var imageId = arguments[2];
  var cornerstone = _externalModules2.default.cornerstone,
      dicomParser = _externalModules2.default.dicomParser;

  // if already loaded return it right away

  if (loadedDataSets[uri]) {
    // console.log('using loaded dataset ' + uri);
    return new Promise(function (resolve) {
      loadedDataSets[uri].cacheCount++;
      resolve(loadedDataSets[uri].dataSet);
    });
  }

  // if we are currently loading this uri, increment the cacheCount and return its promise
  if (promises[uri]) {
    // console.log('returning existing load promise for ' + uri);
    promises[uri].cacheCount++;

    return promises[uri];
  }

  // This uri is not loaded or being loaded, load it via an xhrRequest
  var loadDICOMPromise = loadRequest(uri, imageId);

  // handle success and failure of the XHR request load
  var promise = new Promise(function (resolve, reject) {
    loadDICOMPromise.then(function (dicomPart10AsArrayBuffer /* , xhr*/) {
      var byteArray = new Uint8Array(dicomPart10AsArrayBuffer);

      // Reject the promise if parsing the dicom file fails
      var dataSet = void 0;

      try {
        dataSet = dicomParser.parseDicom(byteArray);
      } catch (error) {
        return reject(error);
      }

      loadedDataSets[uri] = {
        dataSet: dataSet,
        cacheCount: promise.cacheCount
      };
      cacheSizeInBytes += dataSet.byteArray.length;
      resolve(dataSet);

      cornerstone.triggerEvent(cornerstone.events, 'datasetscachechanged', {
        uri: uri,
        action: 'loaded',
        cacheInfo: getInfo()
      });
    }, reject).then(function () {
      // Remove the promise if success
      delete promises[uri];
    }, function () {
      // Remove the promise if failure
      delete promises[uri];
    });
  });

  promise.cacheCount = 1;

  promises[uri] = promise;

  return promise;
}

// remove the cached/loaded dicom dataset for the specified wadouri to free up memory
function unload(uri) {
  var cornerstone = _externalModules2.default.cornerstone;

  // console.log('unload for ' + uri);

  if (loadedDataSets[uri]) {
    loadedDataSets[uri].cacheCount--;
    if (loadedDataSets[uri].cacheCount === 0) {
      // console.log('removing loaded dataset for ' + uri);
      cacheSizeInBytes -= loadedDataSets[uri].dataSet.byteArray.length;
      delete loadedDataSets[uri];

      cornerstone.triggerEvent(cornerstone.events, 'datasetscachechanged', {
        uri: uri,
        action: 'unloaded',
        cacheInfo: getInfo()
      });
    }
  }
}

function getInfo() {
  return {
    cacheSizeInBytes: cacheSizeInBytes,
    numberOfDataSetsCached: Object.keys(loadedDataSets).length
  };
}

// removes all cached datasets from memory
function purge() {
  loadedDataSets = {};
  promises = {};
}

exports.default = {
  isLoaded: isLoaded,
  load: load,
  unload: unload,
  getInfo: getInfo,
  purge: purge,
  get: get
};

/***/ }),

/***/ "./imageLoader/wadouri/fileManager.js":
/*!********************************************!*\
  !*** ./imageLoader/wadouri/fileManager.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var files = [];

function add(file) {
  var fileIndex = files.push(file);

  return "dicomfile:" + (fileIndex - 1);
}

function get(index) {
  return files[index];
}

function remove(index) {
  files[index] = undefined;
}

function purge() {
  files = [];
}

exports.default = {
  add: add,
  get: get,
  remove: remove,
  purge: purge
};

/***/ }),

/***/ "./imageLoader/wadouri/getEncapsulatedImageFrame.js":
/*!**********************************************************!*\
  !*** ./imageLoader/wadouri/getEncapsulatedImageFrame.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getEncapsulatedImageFrame;

var _externalModules = __webpack_require__(/*! ../../externalModules.js */ "./externalModules.js");

var _externalModules2 = _interopRequireDefault(_externalModules);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Function to deal with extracting an image frame from an encapsulated data set.
 */

function framesAreFragmented(dataSet) {
  var numberOfFrames = dataSet.intString('x00280008');
  var pixelDataElement = dataSet.elements.x7fe00010;

  return numberOfFrames !== pixelDataElement.fragments.length;
}

function getEncapsulatedImageFrame(dataSet, frameIndex) {
  var dicomParser = _externalModules2.default.dicomParser;


  if (dataSet.elements.x7fe00010 && dataSet.elements.x7fe00010.basicOffsetTable.length) {
    // Basic Offset Table is not empty
    return dicomParser.readEncapsulatedImageFrame(dataSet, dataSet.elements.x7fe00010, frameIndex);
  }

  // Empty basic offset table

  if (framesAreFragmented(dataSet)) {
    var basicOffsetTable = dicomParser.createJPEGBasicOffsetTable(dataSet, dataSet.elements.x7fe00010);

    return dicomParser.readEncapsulatedImageFrame(dataSet, dataSet.elements.x7fe00010, frameIndex, basicOffsetTable);
  }

  return dicomParser.readEncapsulatedPixelDataFromFragments(dataSet, dataSet.elements.x7fe00010, frameIndex);
}

/***/ }),

/***/ "./imageLoader/wadouri/getPixelData.js":
/*!*********************************************!*\
  !*** ./imageLoader/wadouri/getPixelData.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getEncapsulatedImageFrame = __webpack_require__(/*! ./getEncapsulatedImageFrame.js */ "./imageLoader/wadouri/getEncapsulatedImageFrame.js");

var _getEncapsulatedImageFrame2 = _interopRequireDefault(_getEncapsulatedImageFrame);

var _getUncompressedImageFrame = __webpack_require__(/*! ./getUncompressedImageFrame.js */ "./imageLoader/wadouri/getUncompressedImageFrame.js");

var _getUncompressedImageFrame2 = _interopRequireDefault(_getUncompressedImageFrame);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getPixelData(dataSet) {
  var frameIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  var pixelDataElement = dataSet.elements.x7fe00010 || dataSet.elements.x7fe00008;

  if (!pixelDataElement) {
    return null;
  }

  if (pixelDataElement.encapsulatedPixelData) {
    return (0, _getEncapsulatedImageFrame2.default)(dataSet, frameIndex);
  }

  return (0, _getUncompressedImageFrame2.default)(dataSet, frameIndex);
}

exports.default = getPixelData;

/***/ }),

/***/ "./imageLoader/wadouri/getUncompressedImageFrame.js":
/*!**********************************************************!*\
  !*** ./imageLoader/wadouri/getUncompressedImageFrame.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _unpackBinaryFrame = __webpack_require__(/*! ./unpackBinaryFrame.js */ "./imageLoader/wadouri/unpackBinaryFrame.js");

var _unpackBinaryFrame2 = _interopRequireDefault(_unpackBinaryFrame);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Function to deal with extracting an image frame from an encapsulated data set.
 */

function getUncompressedImageFrame(dataSet, frameIndex) {
  var pixelDataElement = dataSet.elements.x7fe00010 || dataSet.elements.x7fe00008;
  var bitsAllocated = dataSet.uint16('x00280100');
  var rows = dataSet.uint16('x00280010');
  var columns = dataSet.uint16('x00280011');
  var samplesPerPixel = dataSet.uint16('x00280002');

  var pixelDataOffset = pixelDataElement.dataOffset;
  var pixelsPerFrame = rows * columns * samplesPerPixel;

  var frameOffset = void 0;

  if (bitsAllocated === 8) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame;
    if (frameOffset >= dataSet.byteArray.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return new Uint8Array(dataSet.byteArray.buffer, frameOffset, pixelsPerFrame);
  } else if (bitsAllocated === 16) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame * 2;
    if (frameOffset >= dataSet.byteArray.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return new Uint8Array(dataSet.byteArray.buffer, frameOffset, pixelsPerFrame * 2);
  } else if (bitsAllocated === 1) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame * 0.125;
    if (frameOffset >= dataSet.byteArray.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return (0, _unpackBinaryFrame2.default)(dataSet.byteArray, frameOffset, pixelsPerFrame);
  } else if (bitsAllocated === 32) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame * 4;
    if (frameOffset >= dataSet.byteArray.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return new Uint8Array(dataSet.byteArray.buffer, frameOffset, pixelsPerFrame * 4);
  }

  throw new Error('unsupported pixel format');
}

exports.default = getUncompressedImageFrame;

/***/ }),

/***/ "./imageLoader/wadouri/index.js":
/*!**************************************!*\
  !*** ./imageLoader/wadouri/index.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = __webpack_require__(/*! ./metaData/index.js */ "./imageLoader/wadouri/metaData/index.js");

var _dataSetCacheManager = __webpack_require__(/*! ./dataSetCacheManager.js */ "./imageLoader/wadouri/dataSetCacheManager.js");

var _dataSetCacheManager2 = _interopRequireDefault(_dataSetCacheManager);

var _fileManager = __webpack_require__(/*! ./fileManager.js */ "./imageLoader/wadouri/fileManager.js");

var _fileManager2 = _interopRequireDefault(_fileManager);

var _getEncapsulatedImageFrame = __webpack_require__(/*! ./getEncapsulatedImageFrame.js */ "./imageLoader/wadouri/getEncapsulatedImageFrame.js");

var _getEncapsulatedImageFrame2 = _interopRequireDefault(_getEncapsulatedImageFrame);

var _getUncompressedImageFrame = __webpack_require__(/*! ./getUncompressedImageFrame.js */ "./imageLoader/wadouri/getUncompressedImageFrame.js");

var _getUncompressedImageFrame2 = _interopRequireDefault(_getUncompressedImageFrame);

var _loadFileRequest = __webpack_require__(/*! ./loadFileRequest.js */ "./imageLoader/wadouri/loadFileRequest.js");

var _loadFileRequest2 = _interopRequireDefault(_loadFileRequest);

var _loadImage = __webpack_require__(/*! ./loadImage.js */ "./imageLoader/wadouri/loadImage.js");

var _parseImageId = __webpack_require__(/*! ./parseImageId.js */ "./imageLoader/wadouri/parseImageId.js");

var _parseImageId2 = _interopRequireDefault(_parseImageId);

var _unpackBinaryFrame = __webpack_require__(/*! ./unpackBinaryFrame.js */ "./imageLoader/wadouri/unpackBinaryFrame.js");

var _unpackBinaryFrame2 = _interopRequireDefault(_unpackBinaryFrame);

var _register = __webpack_require__(/*! ./register.js */ "./imageLoader/wadouri/register.js");

var _register2 = _interopRequireDefault(_register);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var metaData = {
  getImagePixelModule: _index.getImagePixelModule,
  getLUTs: _index.getLUTs,
  getModalityLUTOutputPixelRepresentation: _index.getModalityLUTOutputPixelRepresentation,
  getNumberValues: _index.getNumberValues,
  metaDataProvider: _index.metaDataProvider
};

exports.default = {
  metaData: metaData,
  dataSetCacheManager: _dataSetCacheManager2.default,
  fileManager: _fileManager2.default,
  getEncapsulatedImageFrame: _getEncapsulatedImageFrame2.default,
  getUncompressedImageFrame: _getUncompressedImageFrame2.default,
  loadFileRequest: _loadFileRequest2.default,
  loadImageFromPromise: _loadImage.loadImageFromPromise,
  getLoaderForScheme: _loadImage.getLoaderForScheme,
  loadImage: _loadImage.loadImage,
  parseImageId: _parseImageId2.default,
  unpackBinaryFrame: _unpackBinaryFrame2.default,
  register: _register2.default
};

/***/ }),

/***/ "./imageLoader/wadouri/loadFileRequest.js":
/*!************************************************!*\
  !*** ./imageLoader/wadouri/loadFileRequest.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _parseImageId = __webpack_require__(/*! ./parseImageId.js */ "./imageLoader/wadouri/parseImageId.js");

var _parseImageId2 = _interopRequireDefault(_parseImageId);

var _fileManager = __webpack_require__(/*! ./fileManager.js */ "./imageLoader/wadouri/fileManager.js");

var _fileManager2 = _interopRequireDefault(_fileManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function loadFileRequest(uri) {
  var parsedImageId = (0, _parseImageId2.default)(uri);
  var fileIndex = parseInt(parsedImageId.url, 10);
  var file = _fileManager2.default.get(fileIndex);

  return new Promise(function (resolve, reject) {
    var fileReader = new FileReader();

    fileReader.onload = function (e) {
      var dicomPart10AsArrayBuffer = e.target.result;

      resolve(dicomPart10AsArrayBuffer);
    };

    fileReader.onerror = reject;

    fileReader.readAsArrayBuffer(file);
  });
}

exports.default = loadFileRequest;

/***/ }),

/***/ "./imageLoader/wadouri/loadImage.js":
/*!******************************************!*\
  !*** ./imageLoader/wadouri/loadImage.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadImage = exports.getLoaderForScheme = exports.loadImageFromPromise = undefined;

var _createImage = __webpack_require__(/*! ../createImage.js */ "./imageLoader/createImage.js");

var _createImage2 = _interopRequireDefault(_createImage);

var _parseImageId = __webpack_require__(/*! ./parseImageId.js */ "./imageLoader/wadouri/parseImageId.js");

var _parseImageId2 = _interopRequireDefault(_parseImageId);

var _dataSetCacheManager = __webpack_require__(/*! ./dataSetCacheManager.js */ "./imageLoader/wadouri/dataSetCacheManager.js");

var _dataSetCacheManager2 = _interopRequireDefault(_dataSetCacheManager);

var _loadFileRequest = __webpack_require__(/*! ./loadFileRequest.js */ "./imageLoader/wadouri/loadFileRequest.js");

var _loadFileRequest2 = _interopRequireDefault(_loadFileRequest);

var _getPixelData = __webpack_require__(/*! ./getPixelData.js */ "./imageLoader/wadouri/getPixelData.js");

var _getPixelData2 = _interopRequireDefault(_getPixelData);

var _index = __webpack_require__(/*! ../internal/index.js */ "./imageLoader/internal/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// add a decache callback function to clear out our dataSetCacheManager
function addDecache(imageLoadObject, imageId) {
  imageLoadObject.decache = function () {
    // console.log('decache');
    var parsedImageId = (0, _parseImageId2.default)(imageId);

    _dataSetCacheManager2.default.unload(parsedImageId.url);
  };
}

function loadImageFromPromise(dataSetPromise, imageId) {
  var frame = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var sharedCacheKey = arguments[3];
  var options = arguments[4];
  var callbacks = arguments[5];

  var start = new Date().getTime();
  var imageLoadObject = {
    cancelFn: undefined
  };

  imageLoadObject.promise = new Promise(function (resolve, reject) {
    dataSetPromise.then(function (dataSet /* , xhr*/) {
      var pixelData = (0, _getPixelData2.default)(dataSet, frame);
      var transferSyntax = dataSet.string('x00020010');
      var loadEnd = new Date().getTime();
      var imagePromise = (0, _createImage2.default)(imageId, pixelData, transferSyntax, options);

      addDecache(imageLoadObject, imageId);

      imagePromise.then(function (image) {
        image.data = dataSet;
        image.sharedCacheKey = sharedCacheKey;
        var end = new Date().getTime();

        image.loadTimeInMS = loadEnd - start;
        image.totalTimeInMS = end - start;
        if (callbacks !== undefined && callbacks.imageDoneCallback !== undefined) {
          callbacks.imageDoneCallback(image);
        }
        resolve(image);
      }, function (error) {
        // Reject the error, and the dataSet
        reject({
          error: error,
          dataSet: dataSet
        });
      });
    }, function (error) {
      // Reject the error
      reject({
        error: error
      });
    });
  });

  return imageLoadObject;
}

function loadImageFromDataSet(dataSet, imageId) {
  var frame = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var sharedCacheKey = arguments[3];
  var options = arguments[4];

  var start = new Date().getTime();

  var promise = new Promise(function (resolve, reject) {
    var loadEnd = new Date().getTime();
    var imagePromise = void 0;

    try {
      var pixelData = (0, _getPixelData2.default)(dataSet, frame);
      var transferSyntax = dataSet.string('x00020010');

      imagePromise = (0, _createImage2.default)(imageId, pixelData, transferSyntax, options);
    } catch (error) {
      // Reject the error, and the dataSet
      reject({
        error: error,
        dataSet: dataSet
      });

      return;
    }

    imagePromise.then(function (image) {
      image.data = dataSet;
      image.sharedCacheKey = sharedCacheKey;
      var end = new Date().getTime();

      image.loadTimeInMS = loadEnd - start;
      image.totalTimeInMS = end - start;
      resolve(image);
    }, reject);
  });

  return {
    promise: promise,
    cancelFn: undefined
  };
}

function getLoaderForScheme(scheme) {
  if (scheme === 'dicomweb' || scheme === 'wadouri') {
    return _index.xhrRequest;
  } else if (scheme === 'dicomfile') {
    return _loadFileRequest2.default;
  }
}

function loadImage(imageId) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var parsedImageId = (0, _parseImageId2.default)(imageId);
  var loader = options.loader;

  if (loader === undefined) {
    loader = getLoaderForScheme(parsedImageId.scheme);
  }

  // if the dataset for this url is already loaded, use it
  if (_dataSetCacheManager2.default.isLoaded(parsedImageId.url)) {
    var dataSet = _dataSetCacheManager2.default.get(parsedImageId.url, loader, imageId);

    return loadImageFromDataSet(dataSet, imageId, parsedImageId.frame, parsedImageId.url, options);
  }

  // load the dataSet via the dataSetCacheManager
  var dataSetPromise = _dataSetCacheManager2.default.load(parsedImageId.url, loader, imageId);

  return loadImageFromPromise(dataSetPromise, imageId, parsedImageId.frame, parsedImageId.url, options);
}

exports.loadImageFromPromise = loadImageFromPromise;
exports.getLoaderForScheme = getLoaderForScheme;
exports.loadImage = loadImage;

/***/ }),

/***/ "./imageLoader/wadouri/metaData/getImagePixelModule.js":
/*!*************************************************************!*\
  !*** ./imageLoader/wadouri/metaData/getImagePixelModule.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function getLutDescriptor(dataSet, tag) {
  if (!dataSet.elements[tag] || dataSet.elements[tag].length !== 6) {
    return;
  }

  return [dataSet.uint16(tag, 0), dataSet.uint16(tag, 1), dataSet.uint16(tag, 2)];
}

function getLutData(lutDataSet, tag, lutDescriptor) {
  var lut = [];
  var lutData = lutDataSet.elements[tag];

  for (var i = 0; i < lutDescriptor[0]; i++) {
    // Output range is always unsigned
    if (lutDescriptor[2] === 16) {
      lut[i] = lutDataSet.uint16(tag, i);
    } else {
      lut[i] = lutDataSet.byteArray[i + lutData.dataOffset];
    }
  }

  return lut;
}

function populatePaletteColorLut(dataSet, imagePixelModule) {
  imagePixelModule.redPaletteColorLookupTableDescriptor = getLutDescriptor(dataSet, 'x00281101');
  imagePixelModule.greenPaletteColorLookupTableDescriptor = getLutDescriptor(dataSet, 'x00281102');
  imagePixelModule.bluePaletteColorLookupTableDescriptor = getLutDescriptor(dataSet, 'x00281103');

  // The first Palette Color Lookup Table Descriptor value is the number of entries in the lookup table.
  // When the number of table entries is equal to 2ˆ16 then this value shall be 0.
  // See http://dicom.nema.org/MEDICAL/DICOM/current/output/chtml/part03/sect_C.7.6.3.html#sect_C.7.6.3.1.5
  if (imagePixelModule.redPaletteColorLookupTableDescriptor[0] === 0) {
    imagePixelModule.redPaletteColorLookupTableDescriptor[0] = 65536;
    imagePixelModule.greenPaletteColorLookupTableDescriptor[0] = 65536;
    imagePixelModule.bluePaletteColorLookupTableDescriptor[0] = 65536;
  }

  // The third Palette Color Lookup Table Descriptor value specifies the number of bits for each entry in the Lookup Table Data.
  // It shall take the value of 8 or 16.
  // The LUT Data shall be stored in a format equivalent to 8 bits allocated when the number of bits for each entry is 8, and 16 bits allocated when the number of bits for each entry is 16, where in both cases the high bit is equal to bits allocated-1.
  // The third value shall be identical for each of the Red, Green and Blue Palette Color Lookup Table Descriptors.
  //
  // Note: Some implementations have encoded 8 bit entries with 16 bits allocated, padding the high bits;
  // this can be detected by comparing the number of entries specified in the LUT Descriptor with the actual value length of the LUT Data entry.
  // The value length in bytes should equal the number of entries if bits allocated is 8, and be twice as long if bits allocated is 16.
  var numLutEntries = imagePixelModule.redPaletteColorLookupTableDescriptor[0];
  var lutData = dataSet.elements.x00281201;
  var lutBitsAllocated = lutData.length === numLutEntries ? 8 : 16;

  // If the descriptors do not appear to have the correct values, correct them
  if (imagePixelModule.redPaletteColorLookupTableDescriptor[2] !== lutBitsAllocated) {
    imagePixelModule.redPaletteColorLookupTableDescriptor[2] = lutBitsAllocated;
    imagePixelModule.greenPaletteColorLookupTableDescriptor[2] = lutBitsAllocated;
    imagePixelModule.bluePaletteColorLookupTableDescriptor[2] = lutBitsAllocated;
  }

  imagePixelModule.redPaletteColorLookupTableData = getLutData(dataSet, 'x00281201', imagePixelModule.redPaletteColorLookupTableDescriptor);
  imagePixelModule.greenPaletteColorLookupTableData = getLutData(dataSet, 'x00281202', imagePixelModule.greenPaletteColorLookupTableDescriptor);
  imagePixelModule.bluePaletteColorLookupTableData = getLutData(dataSet, 'x00281203', imagePixelModule.bluePaletteColorLookupTableDescriptor);
}

function populateSmallestLargestPixelValues(dataSet, imagePixelModule) {
  var pixelRepresentation = dataSet.uint16('x00280103');

  if (pixelRepresentation === 0) {
    imagePixelModule.smallestPixelValue = dataSet.uint16('x00280106');
    imagePixelModule.largestPixelValue = dataSet.uint16('x00280107');
  } else {
    imagePixelModule.smallestPixelValue = dataSet.int16('x00280106');
    imagePixelModule.largestPixelValue = dataSet.int16('x00280107');
  }
}

function getImagePixelModule(dataSet) {
  var imagePixelModule = {
    samplesPerPixel: dataSet.uint16('x00280002'),
    photometricInterpretation: dataSet.string('x00280004'),
    rows: dataSet.uint16('x00280010'),
    columns: dataSet.uint16('x00280011'),
    bitsAllocated: dataSet.uint16('x00280100'),
    bitsStored: dataSet.uint16('x00280101'),
    highBit: dataSet.uint16('x00280102'),
    pixelRepresentation: dataSet.uint16('x00280103'),
    planarConfiguration: dataSet.uint16('x00280006'),
    pixelAspectRatio: dataSet.string('x00280034')
  };

  populateSmallestLargestPixelValues(dataSet, imagePixelModule);

  if (imagePixelModule.photometricInterpretation === 'PALETTE COLOR' && dataSet.elements.x00281101) {
    populatePaletteColorLut(dataSet, imagePixelModule);
  }

  return imagePixelModule;
}

exports.default = getImagePixelModule;

/***/ }),

/***/ "./imageLoader/wadouri/metaData/getLUTs.js":
/*!*************************************************!*\
  !*** ./imageLoader/wadouri/metaData/getLUTs.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function getLUT(pixelRepresentation, lutDataSet) {
  var numLUTEntries = lutDataSet.uint16('x00283002', 0);

  if (numLUTEntries === 0) {
    numLUTEntries = 65535;
  }
  var firstValueMapped = 0;

  if (pixelRepresentation === 0) {
    firstValueMapped = lutDataSet.uint16('x00283002', 1);
  } else {
    firstValueMapped = lutDataSet.int16('x00283002', 1);
  }
  var numBitsPerEntry = lutDataSet.uint16('x00283002', 2);
  // console.log('LUT(', numLUTEntries, ',', firstValueMapped, ',', numBitsPerEntry, ')');
  var lut = {
    id: '1',
    firstValueMapped: firstValueMapped,
    numBitsPerEntry: numBitsPerEntry,
    lut: []
  };

  // console.log("minValue=", minValue, "; maxValue=", maxValue);
  for (var i = 0; i < numLUTEntries; i++) {
    if (pixelRepresentation === 0) {
      lut.lut[i] = lutDataSet.uint16('x00283006', i);
    } else {
      lut.lut[i] = lutDataSet.int16('x00283006', i);
    }
  }

  return lut;
}

function getLUTs(pixelRepresentation, lutSequence) {
  if (!lutSequence || !lutSequence.items.length) {
    return;
  }
  var luts = [];

  for (var i = 0; i < lutSequence.items.length; i++) {
    var lutDataSet = lutSequence.items[i].dataSet;
    var lut = getLUT(pixelRepresentation, lutDataSet);

    if (lut) {
      luts.push(lut);
    }
  }

  return luts;
}

exports.default = getLUTs;

/***/ }),

/***/ "./imageLoader/wadouri/metaData/getModalityLUTOutputPixelRepresentation.js":
/*!*********************************************************************************!*\
  !*** ./imageLoader/wadouri/metaData/getModalityLUTOutputPixelRepresentation.js ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint no-bitwise: 0 */

function getMinStoredPixelValue(dataSet) {
  var pixelRepresentation = dataSet.uint16('x00280103');
  var bitsStored = dataSet.uint16('x00280101');

  if (pixelRepresentation === 0) {
    return 0;
  }

  return -1 << bitsStored - 1;
}

// 0 = unsigned / US, 1 = signed / SS
function getModalityLUTOutputPixelRepresentation(dataSet) {

  // CT SOP Classes are always signed
  var sopClassUID = dataSet.string('x00080016');

  if (sopClassUID === '1.2.840.10008.5.1.4.1.1.2' || sopClassUID === '1.2.840.10008.5.1.4.1.1.2.1') {
    return 1;
  }

  // if rescale intercept and rescale slope are present, pass the minimum stored
  // pixel value through them to see if we get a signed output range
  var rescaleIntercept = dataSet.floatString('x00281052');
  var rescaleSlope = dataSet.floatString('x00281053');

  if (rescaleIntercept !== undefined && rescaleSlope !== undefined) {
    var minStoredPixelValue = getMinStoredPixelValue(dataSet); //
    var minModalityLutValue = minStoredPixelValue * rescaleSlope + rescaleIntercept;

    if (minModalityLutValue < 0) {
      return 1;
    }

    return 0;
  }

  // Output of non linear modality lut is always unsigned
  if (dataSet.elements.x00283000 && dataSet.elements.x00283000.length > 0) {
    return 0;
  }

  // If no modality lut transform, output is same as pixel representation
  return dataSet.uint16('x00280103');
}

exports.default = getModalityLUTOutputPixelRepresentation;

/***/ }),

/***/ "./imageLoader/wadouri/metaData/getNumberValues.js":
/*!*********************************************************!*\
  !*** ./imageLoader/wadouri/metaData/getNumberValues.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function getNumberValues(dataSet, tag, minimumLength) {
  var values = [];
  var valueAsString = dataSet.string(tag);

  if (!valueAsString) {
    return;
  }
  var split = valueAsString.split('\\');

  if (minimumLength && split.length < minimumLength) {
    return;
  }
  for (var i = 0; i < split.length; i++) {
    values.push(parseFloat(split[i]));
  }

  return values;
}

exports.default = getNumberValues;

/***/ }),

/***/ "./imageLoader/wadouri/metaData/index.js":
/*!***********************************************!*\
  !*** ./imageLoader/wadouri/metaData/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getImagePixelModule = __webpack_require__(/*! ./getImagePixelModule.js */ "./imageLoader/wadouri/metaData/getImagePixelModule.js");

Object.defineProperty(exports, 'getImagePixelModule', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getImagePixelModule).default;
  }
});

var _getLUTs = __webpack_require__(/*! ./getLUTs.js */ "./imageLoader/wadouri/metaData/getLUTs.js");

Object.defineProperty(exports, 'getLUTs', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getLUTs).default;
  }
});

var _getModalityLUTOutputPixelRepresentation = __webpack_require__(/*! ./getModalityLUTOutputPixelRepresentation.js */ "./imageLoader/wadouri/metaData/getModalityLUTOutputPixelRepresentation.js");

Object.defineProperty(exports, 'getModalityLUTOutputPixelRepresentation', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getModalityLUTOutputPixelRepresentation).default;
  }
});

var _getNumberValues = __webpack_require__(/*! ./getNumberValues.js */ "./imageLoader/wadouri/metaData/getNumberValues.js");

Object.defineProperty(exports, 'getNumberValues', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getNumberValues).default;
  }
});

var _metaDataProvider = __webpack_require__(/*! ./metaDataProvider.js */ "./imageLoader/wadouri/metaData/metaDataProvider.js");

Object.defineProperty(exports, 'metaDataProvider', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_metaDataProvider).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ "./imageLoader/wadouri/metaData/metaDataProvider.js":
/*!**********************************************************!*\
  !*** ./imageLoader/wadouri/metaData/metaDataProvider.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _externalModules = __webpack_require__(/*! ../../../externalModules.js */ "./externalModules.js");

var _externalModules2 = _interopRequireDefault(_externalModules);

var _getNumberValues = __webpack_require__(/*! ./getNumberValues.js */ "./imageLoader/wadouri/metaData/getNumberValues.js");

var _getNumberValues2 = _interopRequireDefault(_getNumberValues);

var _parseImageId = __webpack_require__(/*! ../parseImageId.js */ "./imageLoader/wadouri/parseImageId.js");

var _parseImageId2 = _interopRequireDefault(_parseImageId);

var _dataSetCacheManager = __webpack_require__(/*! ../dataSetCacheManager.js */ "./imageLoader/wadouri/dataSetCacheManager.js");

var _dataSetCacheManager2 = _interopRequireDefault(_dataSetCacheManager);

var _getImagePixelModule = __webpack_require__(/*! ./getImagePixelModule.js */ "./imageLoader/wadouri/metaData/getImagePixelModule.js");

var _getImagePixelModule2 = _interopRequireDefault(_getImagePixelModule);

var _getLUTs = __webpack_require__(/*! ./getLUTs.js */ "./imageLoader/wadouri/metaData/getLUTs.js");

var _getLUTs2 = _interopRequireDefault(_getLUTs);

var _getModalityLUTOutputPixelRepresentation = __webpack_require__(/*! ./getModalityLUTOutputPixelRepresentation.js */ "./imageLoader/wadouri/metaData/getModalityLUTOutputPixelRepresentation.js");

var _getModalityLUTOutputPixelRepresentation2 = _interopRequireDefault(_getModalityLUTOutputPixelRepresentation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function metaDataProvider(type, imageId) {
  var dicomParser = _externalModules2.default.dicomParser;

  var parsedImageId = (0, _parseImageId2.default)(imageId);

  var dataSet = _dataSetCacheManager2.default.get(parsedImageId.url);

  if (!dataSet) {
    return;
  }

  if (type === 'generalSeriesModule') {
    return {
      modality: dataSet.string('x00080060'),
      seriesInstanceUID: dataSet.string('x0020000e'),
      seriesNumber: dataSet.intString('x00200011'),
      studyInstanceUID: dataSet.string('x0020000d'),
      seriesDate: dicomParser.parseDA(dataSet.string('x00080021')),
      seriesTime: dicomParser.parseTM(dataSet.string('x00080031') || '')
    };
  }

  if (type === 'patientStudyModule') {
    return {
      patientAge: dataSet.intString('x00101010'),
      patientSize: dataSet.floatString('x00101020'),
      patientWeight: dataSet.floatString('x00101030')
    };
  }

  if (type === 'imagePlaneModule') {

    var imageOrientationPatient = (0, _getNumberValues2.default)(dataSet, 'x00200037', 6);
    var imagePositionPatient = (0, _getNumberValues2.default)(dataSet, 'x00200032', 3);
    var pixelSpacing = (0, _getNumberValues2.default)(dataSet, 'x00280030', 2);

    var columnPixelSpacing = 1.0;
    var rowPixelSpacing = 1.0;

    if (pixelSpacing) {
      rowPixelSpacing = pixelSpacing[0];
      columnPixelSpacing = pixelSpacing[1];
    }

    var rowCosines = null;
    var columnCosines = null;

    if (imageOrientationPatient) {
      rowCosines = [parseFloat(imageOrientationPatient[0]), parseFloat(imageOrientationPatient[1]), parseFloat(imageOrientationPatient[2])];
      columnCosines = [parseFloat(imageOrientationPatient[3]), parseFloat(imageOrientationPatient[4]), parseFloat(imageOrientationPatient[5])];
    }

    return {
      frameOfReferenceUID: dataSet.string('x00200052'),
      rows: dataSet.uint16('x00280010'),
      columns: dataSet.uint16('x00280011'),
      imageOrientationPatient: imageOrientationPatient,
      rowCosines: rowCosines,
      columnCosines: columnCosines,
      imagePositionPatient: imagePositionPatient,
      sliceThickness: dataSet.floatString('x00180050'),
      sliceLocation: dataSet.floatString('x00201041'),
      pixelSpacing: pixelSpacing,
      rowPixelSpacing: rowPixelSpacing,
      columnPixelSpacing: columnPixelSpacing
    };
  }

  if (type === 'imagePixelModule') {
    return (0, _getImagePixelModule2.default)(dataSet);
  }

  if (type === 'modalityLutModule') {
    return {
      rescaleIntercept: dataSet.floatString('x00281052'),
      rescaleSlope: dataSet.floatString('x00281053'),
      rescaleType: dataSet.string('x00281054'),
      modalityLUTSequence: (0, _getLUTs2.default)(dataSet.uint16('x00280103'), dataSet.elements.x00283000)
    };
  }

  if (type === 'voiLutModule') {
    var modalityLUTOutputPixelRepresentation = (0, _getModalityLUTOutputPixelRepresentation2.default)(dataSet);

    return {
      windowCenter: (0, _getNumberValues2.default)(dataSet, 'x00281050', 1),
      windowWidth: (0, _getNumberValues2.default)(dataSet, 'x00281051', 1),
      voiLUTSequence: (0, _getLUTs2.default)(modalityLUTOutputPixelRepresentation, dataSet.elements.x00283010)
    };
  }

  if (type === 'sopCommonModule') {
    return {
      sopClassUID: dataSet.string('x00080016'),
      sopInstanceUID: dataSet.string('x00080018')
    };
  }

  if (type === 'petIsotopeModule') {
    var radiopharmaceuticalInfo = dataSet.elements.x00540016;

    if (radiopharmaceuticalInfo === undefined) {
      return;
    }

    var firstRadiopharmaceuticalInfoDataSet = radiopharmaceuticalInfo.items[0].dataSet;

    return {
      radiopharmaceuticalInfo: {
        radiopharmaceuticalStartTime: dicomParser.parseTM(firstRadiopharmaceuticalInfoDataSet.string('x00181072') || ''),
        radionuclideTotalDose: firstRadiopharmaceuticalInfoDataSet.floatString('x00181074'),
        radionuclideHalfLife: firstRadiopharmaceuticalInfoDataSet.floatString('x00181075')
      }
    };
  }
}

exports.default = metaDataProvider;

/***/ }),

/***/ "./imageLoader/wadouri/parseImageId.js":
/*!*********************************************!*\
  !*** ./imageLoader/wadouri/parseImageId.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function parseImageId(imageId) {
  // build a url by parsing out the url scheme and frame index from the imageId
  var firstColonIndex = imageId.indexOf(':');
  var url = imageId.substring(firstColonIndex + 1);
  var frameIndex = url.indexOf('frame=');
  var frame = void 0;

  if (frameIndex !== -1) {
    var frameStr = url.substr(frameIndex + 6);

    frame = parseInt(frameStr, 10);
    url = url.substr(0, frameIndex - 1);
  }

  return {
    scheme: imageId.substr(0, firstColonIndex),
    url: url,
    frame: frame
  };
}

exports.default = parseImageId;

/***/ }),

/***/ "./imageLoader/wadouri/register.js":
/*!*****************************************!*\
  !*** ./imageLoader/wadouri/register.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (cornerstone) {
  // register dicomweb and wadouri image loader prefixes
  cornerstone.registerImageLoader('dicomweb', _loadImage.loadImage);
  cornerstone.registerImageLoader('wadouri', _loadImage.loadImage);
  cornerstone.registerImageLoader('dicomfile', _loadImage.loadImage);

  // add wadouri metadata provider
  cornerstone.metaData.addProvider(_index.metaDataProvider);
};

var _loadImage = __webpack_require__(/*! ./loadImage.js */ "./imageLoader/wadouri/loadImage.js");

var _index = __webpack_require__(/*! ./metaData/index.js */ "./imageLoader/wadouri/metaData/index.js");

/***/ }),

/***/ "./imageLoader/wadouri/unpackBinaryFrame.js":
/*!**************************************************!*\
  !*** ./imageLoader/wadouri/unpackBinaryFrame.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint no-bitwise: 0 */

function isBitSet(byte, bitPos) {
  return byte & 1 << bitPos;
}

/**
 * Function to deal with unpacking a binary frame
 */
function unpackBinaryFrame(byteArray, frameOffset, pixelsPerFrame) {
  // Create a new pixel array given the image size
  var pixelData = new Uint8Array(pixelsPerFrame);

  for (var i = 0; i < pixelsPerFrame; i++) {
    // Compute byte position
    var bytePos = Math.floor(i / 8);

    // Get the current byte
    var byte = byteArray[bytePos + frameOffset];

    // Bit position (0-7) within byte
    var bitPos = i % 8;

    // Check whether bit at bitpos is set
    pixelData[i] = isBitSet(byte, bitPos) ? 1 : 0;
  }

  return pixelData;
}

exports.default = unpackBinaryFrame;

/***/ }),

/***/ "./imageLoader/webWorkerManager.js":
/*!*****************************************!*\
  !*** ./imageLoader/webWorkerManager.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _options = __webpack_require__(/*! ./internal/options.js */ "./imageLoader/internal/options.js");

// the taskId to assign to the next task added via addTask()
var nextTaskId = 0;

// array of queued tasks sorted with highest priority task first
var tasks = [];

// array of web workers to dispatch decode tasks to
var webWorkers = [];

// The options for CornerstoneWADOImageLoader
var options = (0, _options.getOptions)();

var defaultConfig = {
  maxWebWorkers: navigator.hardwareConcurrency || 1,
  startWebWorkersOnDemand: true,
  webWorkerPath: '../../dist/cornerstoneWADOImageLoaderWebWorker.js',
  webWorkerTaskPaths: [],
  taskConfiguration: {
    decodeTask: {
      loadCodecsOnStartup: true,
      initializeCodecsOnStartup: false,
      codecsPath: '../dist/cornerstoneWADOImageLoaderCodecs.js',
      usePDFJS: false,
      strict: options.strict
    }
  }
};

var config = void 0;

var statistics = {
  maxWebWorkers: 0,
  numWebWorkers: 0,
  numTasksQueued: 0,
  numTasksExecuting: 0,
  numTasksCompleted: 0,
  totalTaskTimeInMS: 0,
  totalTimeDelayedInMS: 0
};

/**
 * Function to start a task on a web worker
 */
function startTaskOnWebWorker() {
  // return immediately if no decode tasks to do
  if (!tasks.length) {
    return;
  }

  // look for a web worker that is ready
  for (var i = 0; i < webWorkers.length; i++) {
    if (webWorkers[i].status === 'ready') {
      // mark it as busy so tasks are not assigned to it
      webWorkers[i].status = 'busy';

      // get the highest priority task
      var task = tasks.shift();

      task.start = new Date().getTime();

      // update stats with how long this task was delayed (waiting in queue)
      var end = new Date().getTime();

      statistics.totalTimeDelayedInMS += end - task.added;

      // assign this task to this web worker and send the web worker
      // a message to execute it
      webWorkers[i].task = task;
      webWorkers[i].worker.postMessage({
        taskType: task.taskType,
        workerIndex: i,
        data: task.data
      }, task.transferList);
      statistics.numTasksExecuting++;

      return;
    }
  }

  // if no available web workers and we haven't started max web workers, start a new one
  if (webWorkers.length < config.maxWebWorkers) {
    spawnWebWorker();
  }
}

/**
 * Function to handle a message from a web worker
 * @param msg
 */
function handleMessageFromWorker(msg) {
  // console.log('handleMessageFromWorker', msg.data);
  if (msg.data.taskType === 'initialize') {
    webWorkers[msg.data.workerIndex].status = 'ready';
    startTaskOnWebWorker();
  } else {
    var start = webWorkers[msg.data.workerIndex].task.start;

    webWorkers[msg.data.workerIndex].task.deferred.resolve(msg.data.result);
    webWorkers[msg.data.workerIndex].task = undefined;

    statistics.numTasksExecuting--;
    webWorkers[msg.data.workerIndex].status = 'ready';
    statistics.numTasksCompleted++;

    var end = new Date().getTime();

    statistics.totalTaskTimeInMS += end - start;

    startTaskOnWebWorker();
  }
}

/**
 * Spawns a new web worker
 */
function spawnWebWorker() {
  // prevent exceeding maxWebWorkers
  if (webWorkers.length >= config.maxWebWorkers) {
    return;
  }

  // spawn the webworker
  var worker = new Worker(config.webWorkerPath);

  webWorkers.push({
    worker: worker,
    status: 'initializing'
  });
  worker.addEventListener('message', handleMessageFromWorker);
  worker.postMessage({
    taskType: 'initialize',
    workerIndex: webWorkers.length - 1,
    config: config
  });
}

/**
 * Initialization function for the web worker manager - spawns web workers
 * @param configObject
 */
function initialize(configObject) {
  configObject = configObject || defaultConfig;

  // prevent being initialized more than once
  if (config) {
    throw new Error('WebWorkerManager already initialized');
  }

  config = configObject;

  config.maxWebWorkers = config.maxWebWorkers || navigator.hardwareConcurrency || 1;

  // Spawn new web workers
  if (!config.startWebWorkersOnDemand) {
    for (var i = 0; i < config.maxWebWorkers; i++) {
      spawnWebWorker();
    }
  }
}

/**
 * dynamically loads a web worker task
 * @param sourcePath
 * @param taskConfig
 */
function loadWebWorkerTask(sourcePath, taskConfig) {
  // add it to the list of web worker tasks paths so on demand web workers
  // load this properly
  config.webWorkerTaskPaths.push(sourcePath);

  // if a task specific configuration is provided, merge it into the config
  if (taskConfig) {
    config.taskConfiguration = Object.assign(config.taskConfiguration, taskConfig);
  }

  // tell each spawned web worker to load this task
  for (var i = 0; i < webWorkers.length; i++) {
    webWorkers[i].worker.postMessage({
      taskType: 'loadWebWorkerTask',
      workerIndex: webWorkers.length - 1,
      sourcePath: sourcePath,
      config: config
    });
  }
}

/**
 * Function to add a decode task to be performed
 *
 * @param taskType - the taskType for this task
 * @param data - data specific to the task
 * @param priority - optional priority of the task (defaults to 0), > 0 is higher, < 0 is lower
 * @param transferList - optional array of data to transfer to web worker
 * @returns {*}
 */
function addTask(taskType, data) {
  var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var transferList = arguments[3];

  if (!config) {
    initialize();
  }

  var deferred = {};
  var promise = new Promise(function (resolve, reject) {
    deferred = {
      resolve: resolve,
      reject: reject
    };
  });

  // find the right spot to insert this decode task (based on priority)
  var i = void 0;

  for (i = 0; i < tasks.length; i++) {
    if (tasks[i].priority < priority) {
      break;
    }
  }

  var taskId = nextTaskId++;

  // insert the decode task at position i
  tasks.splice(i, 0, {
    taskId: taskId,
    taskType: taskType,
    status: 'ready',
    added: new Date().getTime(),
    data: data,
    deferred: deferred,
    priority: priority,
    transferList: transferList
  });

  // try to start a task on the web worker since we just added a new task and a web worker may be available
  startTaskOnWebWorker();

  return {
    taskId: taskId,
    promise: promise
  };
}

/**
 * Changes the priority of a queued task
 * @param taskId - the taskId to change the priority of
 * @param priority - priority of the task (defaults to 0), > 0 is higher, < 0 is lower
 * @returns boolean - true on success, false if taskId not found
 */
function setTaskPriority(taskId) {
  var priority = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  // search for this taskId
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].taskId === taskId) {
      // taskId found, remove it
      var task = tasks.splice(i, 1)[0];

      // set its priority
      task.priority = priority;

      // find the right spot to insert this decode task (based on priority)
      for (i = 0; i < tasks.length; i++) {
        if (tasks[i].priority < priority) {
          break;
        }
      }

      // insert the decode task at position i
      tasks.splice(i, 0, task);

      return true;
    }
  }

  return false;
}

/**
 * Cancels a queued task and rejects
 * @param taskId - the taskId to cancel
 * @param reason - optional reason the task was rejected
 * @returns boolean - true on success, false if taskId not found
 */
function cancelTask(taskId, reason) {
  // search for this taskId
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].taskId === taskId) {
      // taskId found, remove it
      var task = tasks.splice(i, 1);

      task.deferred.reject(reason);

      return true;
    }
  }

  return false;
}

/**
 * Function to return the statistics on running web workers
 * @returns object containing statistics
 */
function getStatistics() {
  statistics.maxWebWorkers = config.maxWebWorkers;
  statistics.numWebWorkers = webWorkers.length;
  statistics.numTasksQueued = tasks.length;

  return statistics;
}

exports.default = {
  initialize: initialize,
  loadWebWorkerTask: loadWebWorkerTask,
  addTask: addTask,
  getStatistics: getStatistics,
  setTaskPriority: setTaskPriority,
  cancelTask: cancelTask
};

/***/ }),

/***/ "./shared/calculateMinMax.js":
/*!***********************************!*\
  !*** ./shared/calculateMinMax.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = calculateMinMax;

var _getMinMax = __webpack_require__(/*! ./getMinMax.js */ "./shared/getMinMax.js");

var _getMinMax2 = _interopRequireDefault(_getMinMax);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Check the minimum and maximum values in the imageFrame pixel data
 * match with the provided smallestPixelValue and largestPixelValue metaData.
 *
 * If 'strict' is true, log to the console a warning if these values do not match.
 * Otherwise, correct them automatically.
 *
 * @param {Object} imageFrame
 * @param {Boolean} strict If 'strict' is true, log to the console a warning if these values do not match.
 * Otherwise, correct them automatically.Default is true.
 */
function calculateMinMax(imageFrame) {
  var strict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  var minMax = (0, _getMinMax2.default)(imageFrame.pixelData);
  var mustAssign = !(isNumber(imageFrame.smallestPixelValue) && isNumber(imageFrame.largestPixelValue));

  if (strict === true && !mustAssign) {
    if (imageFrame.smallestPixelValue !== minMax.min) {
      console.warn('Image smallestPixelValue tag is incorrect. Rendering performance will suffer considerably.');
    }

    if (imageFrame.largestPixelValue !== minMax.max) {
      console.warn('Image largestPixelValue tag is incorrect. Rendering performance will suffer considerably.');
    }
  } else {
    imageFrame.smallestPixelValue = minMax.min;
    imageFrame.largestPixelValue = minMax.max;
  }
}

function isNumber(numValue) {
  return typeof numValue === 'number';
}

/***/ }),

/***/ "./shared/decodeImageFrame.js":
/*!************************************!*\
  !*** ./shared/decodeImageFrame.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _decodeLittleEndian = __webpack_require__(/*! ./decoders/decodeLittleEndian.js */ "./shared/decoders/decodeLittleEndian.js");

var _decodeLittleEndian2 = _interopRequireDefault(_decodeLittleEndian);

var _decodeBigEndian = __webpack_require__(/*! ./decoders/decodeBigEndian.js */ "./shared/decoders/decodeBigEndian.js");

var _decodeBigEndian2 = _interopRequireDefault(_decodeBigEndian);

var _decodeRLE = __webpack_require__(/*! ./decoders/decodeRLE.js */ "./shared/decoders/decodeRLE.js");

var _decodeRLE2 = _interopRequireDefault(_decodeRLE);

var _decodeJPEGBaseline = __webpack_require__(/*! ./decoders/decodeJPEGBaseline.js */ "./shared/decoders/decodeJPEGBaseline.js");

var _decodeJPEGBaseline2 = _interopRequireDefault(_decodeJPEGBaseline);

var _decodeJPEGLossless = __webpack_require__(/*! ./decoders/decodeJPEGLossless.js */ "./shared/decoders/decodeJPEGLossless.js");

var _decodeJPEGLossless2 = _interopRequireDefault(_decodeJPEGLossless);

var _decodeJPEGLS = __webpack_require__(/*! ./decoders/decodeJPEGLS.js */ "./shared/decoders/decodeJPEGLS.js");

var _decodeJPEGLS2 = _interopRequireDefault(_decodeJPEGLS);

var _decodeJPEG = __webpack_require__(/*! ./decoders/decodeJPEG2000.js */ "./shared/decoders/decodeJPEG2000.js");

var _decodeJPEG2 = _interopRequireDefault(_decodeJPEG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function decodeImageFrame(imageFrame, transferSyntax, pixelData, decodeConfig, options) {
  var start = new Date().getTime();

  if (transferSyntax === '1.2.840.10008.1.2') {
    // Implicit VR Little Endian
    imageFrame = (0, _decodeLittleEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.1') {
    // Explicit VR Little Endian
    imageFrame = (0, _decodeLittleEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.2') {
    // Explicit VR Big Endian (retired)
    imageFrame = (0, _decodeBigEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.1.99') {
    // Deflate transfer syntax (deflated by dicomParser)
    imageFrame = (0, _decodeLittleEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.5') {
    // RLE Lossless
    imageFrame = (0, _decodeRLE2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.50') {
    // JPEG Baseline lossy process 1 (8 bit)
    imageFrame = (0, _decodeJPEGBaseline2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.51') {
    // JPEG Baseline lossy process 2 & 4 (12 bit)
    imageFrame = (0, _decodeJPEGBaseline2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.57') {
    // JPEG Lossless, Nonhierarchical (Processes 14)
    imageFrame = (0, _decodeJPEGLossless2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.70') {
    // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
    imageFrame = (0, _decodeJPEGLossless2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.80') {
    // JPEG-LS Lossless Image Compression
    imageFrame = (0, _decodeJPEGLS2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.81') {
    // JPEG-LS Lossy (Near-Lossless) Image Compression
    imageFrame = (0, _decodeJPEGLS2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.90') {
    // JPEG 2000 Lossless
    imageFrame = (0, _decodeJPEG2.default)(imageFrame, pixelData, decodeConfig, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.91') {
    // JPEG 2000 Lossy
    imageFrame = (0, _decodeJPEG2.default)(imageFrame, pixelData, decodeConfig, options);
  } else {
    throw new Error('no decoder for transfer syntax ' + transferSyntax);
  }

  /* Don't know if these work...
   // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
   else if(transferSyntax === "1.2.840.10008.1.2.4.92")
   {
   return decodeJPEG2000(dataSet, frame);
   }
   // JPEG 2000 Part 2 Multicomponent Image Compression
   else if(transferSyntax === "1.2.840.10008.1.2.4.93")
   {
   return decodeJPEG2000(dataSet, frame);
   }
   */

  var shouldShift = imageFrame.pixelRepresentation !== undefined && imageFrame.pixelRepresentation === 1;
  var shift = shouldShift && imageFrame.bitsStored !== undefined ? 32 - imageFrame.bitsStored : undefined;

  if (shouldShift && shift !== undefined) {
    for (var i = 0; i < imageFrame.pixelData.length; i++) {
      // eslint-disable-next-line no-bitwise
      imageFrame.pixelData[i] = imageFrame.pixelData[i] << shift >> shift;
    }
  }

  var end = new Date().getTime();

  imageFrame.decodeTimeInMS = end - start;

  return imageFrame;
}

exports.default = decodeImageFrame;

/***/ }),

/***/ "./shared/decoders/decodeBigEndian.js":
/*!********************************************!*\
  !*** ./shared/decoders/decodeBigEndian.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint no-bitwise: 0 */
function swap16(val) {
  return (val & 0xFF) << 8 | val >> 8 & 0xFF;
}

function decodeBigEndian(imageFrame, pixelData) {
  if (imageFrame.bitsAllocated === 16) {
    var arrayBuffer = pixelData.buffer;
    var offset = pixelData.byteOffset;
    var length = pixelData.length;
    // if pixel data is not aligned on even boundary, shift it so we can create the 16 bit array
    // buffers on it

    if (offset % 2) {
      arrayBuffer = arrayBuffer.slice(offset);
      offset = 0;
    }

    if (imageFrame.pixelRepresentation === 0) {
      imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
    } else {
      imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
    }
    // Do the byte swap
    for (var i = 0; i < imageFrame.pixelData.length; i++) {
      imageFrame.pixelData[i] = swap16(imageFrame.pixelData[i]);
    }
  } else if (imageFrame.bitsAllocated === 8) {
    imageFrame.pixelData = pixelData;
  }

  return imageFrame;
}

exports.default = decodeBigEndian;

/***/ }),

/***/ "./shared/decoders/decodeJPEG2000.js":
/*!*******************************************!*\
  !*** ./shared/decoders/decodeJPEG2000.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function decodeJpx(imageFrame, pixelData) {
  var jpxImage = new JpxImage();

  jpxImage.parse(pixelData);

  var tileCount = jpxImage.tiles.length;

  if (tileCount !== 1) {
    throw new Error('JPEG2000 decoder returned a tileCount of ' + tileCount + ', when 1 is expected');
  }

  imageFrame.columns = jpxImage.width;
  imageFrame.rows = jpxImage.height;
  imageFrame.pixelData = jpxImage.tiles[0].items;

  return imageFrame;
}

var openJPEG = void 0;

function decodeOpenJPEG(data, bytesPerPixel, signed) {
  var dataPtr = openJPEG._malloc(data.length);

  openJPEG.writeArrayToMemory(data, dataPtr);

  // create param outpout
  var imagePtrPtr = openJPEG._malloc(4);
  var imageSizePtr = openJPEG._malloc(4);
  var imageSizeXPtr = openJPEG._malloc(4);
  var imageSizeYPtr = openJPEG._malloc(4);
  var imageSizeCompPtr = openJPEG._malloc(4);

  var t0 = new Date().getTime();
  var ret = openJPEG.ccall('jp2_decode', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number'], [dataPtr, data.length, imagePtrPtr, imageSizePtr, imageSizeXPtr, imageSizeYPtr, imageSizeCompPtr]);
  // add num vomp..etc

  if (ret !== 0) {
    console.log('[opj_decode] decoding failed!');
    openJPEG._free(dataPtr);
    openJPEG._free(openJPEG.getValue(imagePtrPtr, '*'));
    openJPEG._free(imageSizeXPtr);
    openJPEG._free(imageSizeYPtr);
    openJPEG._free(imageSizePtr);
    openJPEG._free(imageSizeCompPtr);

    return;
  }

  var imagePtr = openJPEG.getValue(imagePtrPtr, '*');

  var image = {
    length: openJPEG.getValue(imageSizePtr, 'i32'),
    sx: openJPEG.getValue(imageSizeXPtr, 'i32'),
    sy: openJPEG.getValue(imageSizeYPtr, 'i32'),
    nbChannels: openJPEG.getValue(imageSizeCompPtr, 'i32'), // hard coded for now
    perf_timetodecode: undefined,
    pixelData: undefined
  };

  // Copy the data from the EMSCRIPTEN heap into the correct type array
  var length = image.sx * image.sy * image.nbChannels;
  var src32 = new Int32Array(openJPEG.HEAP32.buffer, imagePtr, length);

  if (bytesPerPixel === 1) {
    if (Uint8Array.from) {
      image.pixelData = Uint8Array.from(src32);
    } else {
      image.pixelData = new Uint8Array(length);
      for (var i = 0; i < length; i++) {
        image.pixelData[i] = src32[i];
      }
    }
  } else if (signed) {
    if (Int16Array.from) {
      image.pixelData = Int16Array.from(src32);
    } else {
      image.pixelData = new Int16Array(length);
      for (var _i = 0; _i < length; _i++) {
        image.pixelData[_i] = src32[_i];
      }
    }
  } else if (Uint16Array.from) {
    image.pixelData = Uint16Array.from(src32);
  } else {
    image.pixelData = new Uint16Array(length);
    for (var _i2 = 0; _i2 < length; _i2++) {
      image.pixelData[_i2] = src32[_i2];
    }
  }

  var t1 = new Date().getTime();

  image.perf_timetodecode = t1 - t0;

  // free
  openJPEG._free(dataPtr);
  openJPEG._free(imagePtrPtr);
  openJPEG._free(imagePtr);
  openJPEG._free(imageSizePtr);
  openJPEG._free(imageSizeXPtr);
  openJPEG._free(imageSizeYPtr);
  openJPEG._free(imageSizeCompPtr);

  return image;
}

function decodeOpenJpeg2000(imageFrame, pixelData) {
  var bytesPerPixel = imageFrame.bitsAllocated <= 8 ? 1 : 2;
  var signed = imageFrame.pixelRepresentation === 1;

  var image = decodeOpenJPEG(pixelData, bytesPerPixel, signed);

  imageFrame.columns = image.sx;
  imageFrame.rows = image.sy;
  imageFrame.pixelData = image.pixelData;
  if (image.nbChannels > 1) {
    imageFrame.photometricInterpretation = 'RGB';
  }

  return imageFrame;
}

function initializeJPEG2000(decodeConfig) {
  // check to make sure codec is loaded
  if (!decodeConfig.usePDFJS) {
    if (typeof OpenJPEG === 'undefined') {
      throw new Error('OpenJPEG decoder not loaded');
    }
  }

  if (!openJPEG) {
    openJPEG = OpenJPEG();
    if (!openJPEG || !openJPEG._jp2_decode) {
      throw new Error('OpenJPEG failed to initialize');
    }
  }
}

function decodeJPEG2000(imageFrame, pixelData, decodeConfig) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  initializeJPEG2000(decodeConfig);

  if (options.usePDFJS || decodeConfig.usePDFJS) {
    // OHIF image-JPEG2000 https://github.com/OHIF/image-JPEG2000
    // console.log('PDFJS')
    return decodeJpx(imageFrame, pixelData);
  }

  // OpenJPEG2000 https://github.com/jpambrun/openjpeg
  // console.log('OpenJPEG')
  return decodeOpenJpeg2000(imageFrame, pixelData);
}

exports.default = decodeJPEG2000;
exports.initializeJPEG2000 = initializeJPEG2000;

/***/ }),

/***/ "./shared/decoders/decodeJPEGBaseline.js":
/*!***********************************************!*\
  !*** ./shared/decoders/decodeJPEGBaseline.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});


function decodeJPEGBaseline(imageFrame, pixelData) {
  // check to make sure codec is loaded
  if (typeof JpegImage === 'undefined') {
    throw new Error('No JPEG Baseline decoder loaded');
  }
  var jpeg = new JpegImage();

  jpeg.parse(pixelData);

  // Do not use the internal jpeg.js color transformation,
  // since we will handle this afterwards
  jpeg.colorTransform = false;

  if (imageFrame.bitsAllocated === 8) {
    imageFrame.pixelData = jpeg.getData(imageFrame.columns, imageFrame.rows);

    return imageFrame;
  } else if (imageFrame.bitsAllocated === 16) {
    imageFrame.pixelData = jpeg.getData16(imageFrame.columns, imageFrame.rows);

    return imageFrame;
  }
}

exports.default = decodeJPEGBaseline;

/***/ }),

/***/ "./shared/decoders/decodeJPEGLS.js":
/*!*****************************************!*\
  !*** ./shared/decoders/decodeJPEGLS.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var charLS = void 0;

function jpegLSDecode(data, isSigned) {
  // prepare input parameters
  var dataPtr = charLS._malloc(data.length);

  charLS.writeArrayToMemory(data, dataPtr);

  // prepare output parameters
  var imagePtrPtr = charLS._malloc(4);
  var imageSizePtr = charLS._malloc(4);
  var widthPtr = charLS._malloc(4);
  var heightPtr = charLS._malloc(4);
  var bitsPerSamplePtr = charLS._malloc(4);
  var stridePtr = charLS._malloc(4);
  var allowedLossyErrorPtr = charLS._malloc(4);
  var componentsPtr = charLS._malloc(4);
  var interleaveModePtr = charLS._malloc(4);

  // Decode the image
  var result = charLS.ccall('jpegls_decode', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], [dataPtr, data.length, imagePtrPtr, imageSizePtr, widthPtr, heightPtr, bitsPerSamplePtr, stridePtr, componentsPtr, allowedLossyErrorPtr, interleaveModePtr]);

  // Extract result values into object
  var image = {
    result: result,
    width: charLS.getValue(widthPtr, 'i32'),
    height: charLS.getValue(heightPtr, 'i32'),
    bitsPerSample: charLS.getValue(bitsPerSamplePtr, 'i32'),
    stride: charLS.getValue(stridePtr, 'i32'),
    components: charLS.getValue(componentsPtr, 'i32'),
    allowedLossyError: charLS.getValue(allowedLossyErrorPtr, 'i32'),
    interleaveMode: charLS.getValue(interleaveModePtr, 'i32'),
    pixelData: undefined
  };

  // Copy image from emscripten heap into appropriate array buffer type
  var imagePtr = charLS.getValue(imagePtrPtr, '*');

  if (image.bitsPerSample <= 8) {
    image.pixelData = new Uint8Array(image.width * image.height * image.components);
    image.pixelData.set(new Uint8Array(charLS.HEAP8.buffer, imagePtr, image.pixelData.length));
  } else if (isSigned) {
    image.pixelData = new Int16Array(image.width * image.height * image.components);
    image.pixelData.set(new Int16Array(charLS.HEAP16.buffer, imagePtr, image.pixelData.length));
  } else {
    image.pixelData = new Uint16Array(image.width * image.height * image.components);
    image.pixelData.set(new Uint16Array(charLS.HEAP16.buffer, imagePtr, image.pixelData.length));
  }

  // free memory and return image object
  charLS._free(dataPtr);
  charLS._free(imagePtr);
  charLS._free(imagePtrPtr);
  charLS._free(imageSizePtr);
  charLS._free(widthPtr);
  charLS._free(heightPtr);
  charLS._free(bitsPerSamplePtr);
  charLS._free(stridePtr);
  charLS._free(componentsPtr);
  charLS._free(interleaveModePtr);

  return image;
}

function initializeJPEGLS() {
  // check to make sure codec is loaded
  if (typeof CharLS === 'undefined') {
    throw new Error('No JPEG-LS decoder loaded');
  }

  // Try to initialize CharLS
  // CharLS https://github.com/cornerstonejs/charls
  if (!charLS) {
    charLS = CharLS();
    if (!charLS || !charLS._jpegls_decode) {
      throw new Error('JPEG-LS failed to initialize');
    }
  }
}

function decodeJPEGLS(imageFrame, pixelData) {
  initializeJPEGLS();

  var image = jpegLSDecode(pixelData, imageFrame.pixelRepresentation === 1);

  // throw error if not success or too much data
  if (image.result !== 0 && image.result !== 6) {
    throw new Error('JPEG-LS decoder failed to decode frame (error code ' + image.result + ')');
  }

  imageFrame.columns = image.width;
  imageFrame.rows = image.height;
  imageFrame.pixelData = image.pixelData;

  return imageFrame;
}

exports.default = decodeJPEGLS;
exports.initializeJPEGLS = initializeJPEGLS;

/***/ }),

/***/ "./shared/decoders/decodeJPEGLossless.js":
/*!***********************************************!*\
  !*** ./shared/decoders/decodeJPEGLossless.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});


function decodeJPEGLossless(imageFrame, pixelData) {
  // check to make sure codec is loaded
  if (typeof jpeg === 'undefined' || typeof jpeg.lossless === 'undefined' || typeof jpeg.lossless.Decoder === 'undefined') {
    throw new Error('No JPEG Lossless decoder loaded');
  }

  var byteOutput = imageFrame.bitsAllocated <= 8 ? 1 : 2;
  // console.time('jpeglossless');
  var buffer = pixelData.buffer;
  var decoder = new jpeg.lossless.Decoder();
  var decompressedData = decoder.decode(buffer, pixelData.byteOffset, pixelData.length, byteOutput);
  // console.timeEnd('jpeglossless');

  if (imageFrame.pixelRepresentation === 0) {
    if (imageFrame.bitsAllocated === 16) {
      imageFrame.pixelData = new Uint16Array(decompressedData.buffer);

      return imageFrame;
    }
    // untested!
    imageFrame.pixelData = new Uint8Array(decompressedData.buffer);

    return imageFrame;
  }
  imageFrame.pixelData = new Int16Array(decompressedData.buffer);

  return imageFrame;
}

exports.default = decodeJPEGLossless;

/***/ }),

/***/ "./shared/decoders/decodeLittleEndian.js":
/*!***********************************************!*\
  !*** ./shared/decoders/decodeLittleEndian.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function decodeLittleEndian(imageFrame, pixelData) {
  var arrayBuffer = pixelData.buffer;
  var offset = pixelData.byteOffset;
  var length = pixelData.length;

  if (imageFrame.bitsAllocated === 16) {
    // if pixel data is not aligned on even boundary, shift it so we can create the 16 bit array
    // buffers on it
    if (offset % 2) {
      arrayBuffer = arrayBuffer.slice(offset);
      offset = 0;
    }

    if (imageFrame.pixelRepresentation === 0) {
      imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
    } else {
      imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
    }
  } else if (imageFrame.bitsAllocated === 8 || imageFrame.bitsAllocated === 1) {
    imageFrame.pixelData = pixelData;
  } else if (imageFrame.bitsAllocated === 32) {
    // if pixel data is not aligned on even boundary, shift it
    if (offset % 2) {
      arrayBuffer = arrayBuffer.slice(offset);
      offset = 0;
    }

    imageFrame.pixelData = new Float32Array(arrayBuffer, offset, length / 4);
  }

  return imageFrame;
}

exports.default = decodeLittleEndian;

/***/ }),

/***/ "./shared/decoders/decodeRLE.js":
/*!**************************************!*\
  !*** ./shared/decoders/decodeRLE.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function decodeRLE(imageFrame, pixelData) {
  if (imageFrame.bitsAllocated === 8) {
    if (imageFrame.planarConfiguration) {
      return decode8Planar(imageFrame, pixelData);
    }

    return decode8(imageFrame, pixelData);
  } else if (imageFrame.bitsAllocated === 16) {
    return decode16(imageFrame, pixelData);
  }

  throw new Error('unsupported pixel format for RLE');
}

function decode8(imageFrame, pixelData) {
  var frameData = pixelData;
  var frameSize = imageFrame.rows * imageFrame.columns;
  var outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel);
  var header = new DataView(frameData.buffer, frameData.byteOffset);
  var data = new Int8Array(frameData.buffer, frameData.byteOffset);
  var out = new Int8Array(outFrame);

  var outIndex = 0;
  var numSegments = header.getInt32(0, true);

  for (var s = 0; s < numSegments; ++s) {
    outIndex = s;

    var inIndex = header.getInt32((s + 1) * 4, true);
    var maxIndex = header.getInt32((s + 2) * 4, true);

    if (maxIndex === 0) {
      maxIndex = frameData.length;
    }

    var endOfSegment = frameSize * numSegments;

    while (inIndex < maxIndex) {
      var n = data[inIndex++];

      if (n >= 0 && n <= 127) {
        // copy n bytes
        for (var i = 0; i < n + 1 && outIndex < endOfSegment; ++i) {
          out[outIndex] = data[inIndex++];
          outIndex += imageFrame.samplesPerPixel;
        }
      } else if (n <= -1 && n >= -127) {
        var value = data[inIndex++];
        // run of n bytes

        for (var j = 0; j < -n + 1 && outIndex < endOfSegment; ++j) {
          out[outIndex] = value;
          outIndex += imageFrame.samplesPerPixel;
        }
      } /* else if (n === -128) {
        } // do nothing */
    }
  }
  imageFrame.pixelData = new Uint8Array(outFrame);

  return imageFrame;
}

function decode8Planar(imageFrame, pixelData) {
  var frameData = pixelData;
  var frameSize = imageFrame.rows * imageFrame.columns;
  var outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel);
  var header = new DataView(frameData.buffer, frameData.byteOffset);
  var data = new Int8Array(frameData.buffer, frameData.byteOffset);
  var out = new Int8Array(outFrame);

  var outIndex = 0;
  var numSegments = header.getInt32(0, true);

  for (var s = 0; s < numSegments; ++s) {
    outIndex = s * frameSize;

    var inIndex = header.getInt32((s + 1) * 4, true);
    var maxIndex = header.getInt32((s + 2) * 4, true);

    if (maxIndex === 0) {
      maxIndex = frameData.length;
    }

    var endOfSegment = frameSize * numSegments;

    while (inIndex < maxIndex) {
      var n = data[inIndex++];

      if (n >= 0 && n <= 127) {
        // copy n bytes
        for (var i = 0; i < n + 1 && outIndex < endOfSegment; ++i) {
          out[outIndex] = data[inIndex++];
          outIndex++;
        }
      } else if (n <= -1 && n >= -127) {
        var value = data[inIndex++];
        // run of n bytes

        for (var j = 0; j < -n + 1 && outIndex < endOfSegment; ++j) {
          out[outIndex] = value;
          outIndex++;
        }
      } /* else if (n === -128) {
        } // do nothing */
    }
  }
  imageFrame.pixelData = new Uint8Array(outFrame);

  return imageFrame;
}

function decode16(imageFrame, pixelData) {
  var frameData = pixelData;
  var frameSize = imageFrame.rows * imageFrame.columns;
  var outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel * 2);

  var header = new DataView(frameData.buffer, frameData.byteOffset);
  var data = new Int8Array(frameData.buffer, frameData.byteOffset);
  var out = new Int8Array(outFrame);

  var numSegments = header.getInt32(0, true);

  for (var s = 0; s < numSegments; ++s) {
    var outIndex = 0;
    var highByte = s === 0 ? 1 : 0;

    var inIndex = header.getInt32((s + 1) * 4, true);
    var maxIndex = header.getInt32((s + 2) * 4, true);

    if (maxIndex === 0) {
      maxIndex = frameData.length;
    }

    while (inIndex < maxIndex) {
      var n = data[inIndex++];

      if (n >= 0 && n <= 127) {
        for (var i = 0; i < n + 1 && outIndex < frameSize; ++i) {
          out[outIndex * 2 + highByte] = data[inIndex++];
          outIndex++;
        }
      } else if (n <= -1 && n >= -127) {
        var value = data[inIndex++];

        for (var j = 0; j < -n + 1 && outIndex < frameSize; ++j) {
          out[outIndex * 2 + highByte] = value;
          outIndex++;
        }
      } /* else if (n === -128) {
        } // do nothing */
    }
  }
  if (imageFrame.pixelRepresentation === 0) {
    imageFrame.pixelData = new Uint16Array(outFrame);
  } else {
    imageFrame.pixelData = new Int16Array(outFrame);
  }

  return imageFrame;
}

exports.default = decodeRLE;

/***/ }),

/***/ "./shared/getMinMax.js":
/*!*****************************!*\
  !*** ./shared/getMinMax.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Calculate the minimum and maximum values in an Array
 *
 * @param {Number[]} storedPixelData
 * @return {{min: Number, max: Number}}
 */
function getMinMax(storedPixelData) {
  // we always calculate the min max values since they are not always
  // present in DICOM and we don't want to trust them anyway as cornerstone
  // depends on us providing reliable values for these
  var min = storedPixelData[0];
  var max = storedPixelData[0];
  var storedPixel = void 0;
  var numPixels = storedPixelData.length;

  for (var index = 1; index < numPixels; index++) {
    storedPixel = storedPixelData[index];
    min = Math.min(min, storedPixel);
    max = Math.max(max, storedPixel);
  }

  return {
    min: min,
    max: max
  };
}

exports.default = getMinMax;

/***/ }),

/***/ "./version.js":
/*!********************!*\
  !*** ./version.js ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = '2.1.4';

/***/ })

/******/ });
});
//# sourceMappingURL=cornerstoneWADOImageLoader.js.map