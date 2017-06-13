/*! cornerstone-web-image-loader - 0.8.1 - 2017-06-13 | (c) 2016 Chris Hafey | https://github.com/chafey/cornerstoneWebImageLoader */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cornerstone-core"));
	else if(typeof define === 'function' && define.amd)
		define("cornerstoneWebImageLoader", ["cornerstone-core"], factory);
	else if(typeof exports === 'object')
		exports["cornerstoneWebImageLoader"] = factory(require("cornerstone-core"));
	else
		root["cornerstoneWebImageLoader"] = factory(root["cornerstone"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
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
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
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
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (arrayBuffer) {
  var deferred = $.Deferred();

  var image = new Image();

  var arrayBufferView = new Uint8Array(arrayBuffer);
  var blob = new Blob([arrayBufferView]);
  var urlCreator = window.URL || window.webkitURL;
  var imageUrl = urlCreator.createObjectURL(blob);

  image.src = imageUrl;
  image.onload = function () {
    deferred.resolve(image);
    urlCreator.revokeObjectURL(imageUrl);
  };
  image.onerror = function (err) {
    urlCreator.revokeObjectURL(imageUrl);
    deferred.reject(err);
  };

  return deferred.promise();
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (image, imageId) {
  // extract the attributes we need
  var rows = image.naturalHeight;
  var columns = image.naturalWidth;

  function getPixelData() {
    var imageData = getImageData();
    var imageDataData = imageData.data;
    var numPixels = image.naturalHeight * image.naturalWidth;
    var storedPixelData = new Uint8Array(numPixels * 4);
    var imageDataIndex = 0;
    var storedPixelDataIndex = 0;

    for (var i = 0; i < numPixels; i++) {
      storedPixelData[storedPixelDataIndex++] = imageDataData[imageDataIndex++];
      storedPixelData[storedPixelDataIndex++] = imageDataData[imageDataIndex++];
      storedPixelData[storedPixelDataIndex++] = imageDataData[imageDataIndex++];
      storedPixelData[storedPixelDataIndex++] = 255; // alpha
      imageDataIndex++;
    }

    return storedPixelData;
  }

  function getImageData() {
    var context = void 0;

    if (lastImageIdDrawn === imageId) {
      context = canvas.getContext('2d');
    } else {
      canvas.height = image.naturalHeight;
      canvas.width = image.naturalWidth;
      context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      lastImageIdDrawn = imageId;
    }

    return context.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
  }

  function getCanvas() {
    if (lastImageIdDrawn === imageId) {
      return canvas;
    }

    canvas.height = image.naturalHeight;
    canvas.width = image.naturalWidth;
    var context = canvas.getContext('2d');

    context.drawImage(image, 0, 0);
    lastImageIdDrawn = imageId;

    return canvas;
  }

  function getImage() {
    return image;
  }

  // Extract the various attributes we need
  return {
    imageId: imageId,
    minPixelValue: 0, // calculated below
    maxPixelValue: 255, // calculated below
    slope: 1.0,
    intercept: 0,
    windowCenter: 128,
    windowWidth: 255,
    render: cornerstone.renderWebImage,
    getPixelData: getPixelData,
    getImageData: getImageData,
    getCanvas: getCanvas,
    getImage: getImage,
    // storedPixelData: extractStoredPixels(image),
    rows: rows,
    columns: columns,
    height: rows,
    width: columns,
    color: true,
    columnPixelSpacing: undefined,
    rowPixelSpacing: undefined,
    invert: false,
    sizeInBytes: rows * columns * 4 // we don't know for sure so we over estimate to be safe
  };
};

var _cornerstoneCore = __webpack_require__(0);

var cornerstone = _interopRequireWildcard(_cornerstoneCore);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var canvas = document.createElement('canvas');
var lastImageIdDrawn = '';

/**
 * creates a cornerstone Image object for the specified Image and imageId
 *
 * @param image - An Image
 * @param imageId - the imageId for this image
 * @returns Cornerstone Image Object
 */

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadImage = loadImage;
exports.configure = configure;

var _cornerstoneCore = __webpack_require__(0);

var cornerstone = _interopRequireWildcard(_cornerstoneCore);

var _arrayBufferToImage = __webpack_require__(1);

var _arrayBufferToImage2 = _interopRequireDefault(_arrayBufferToImage);

var _createImage = __webpack_require__(2);

var _createImage2 = _interopRequireDefault(_createImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//
// This is a cornerstone image loader for web images such as PNG and JPEG
//
var options = {
  // callback allowing customization of the xhr (e.g. adding custom auth headers, cors, etc)
  beforeSend: function beforeSend() /* xhr */{}
};

// Loads an image given a url to an image
function loadImage(imageId) {
  var deferred = $.Deferred();

  var xhr = new XMLHttpRequest();

  xhr.open('GET', imageId, true);
  xhr.responseType = 'arraybuffer';
  options.beforeSend(xhr);

  xhr.onload = function () {
    var imagePromise = (0, _arrayBufferToImage2.default)(this.response);

    imagePromise.then(function (image) {
      var imageObject = (0, _createImage2.default)(image, imageId);

      deferred.resolve(imageObject);
    }, function (error) {
      deferred.reject(error);
    });
  };
  xhr.onprogress = function (oProgress) {

    if (oProgress.lengthComputable) {
      // evt.loaded the bytes browser receive
      // evt.total the total bytes seted by the header
      //
      var loaded = oProgress.loaded;
      var total = oProgress.total;
      var percentComplete = Math.round(loaded / total * 100);

      $(cornerstone.events).trigger('CornerstoneImageLoadProgress', {
        imageId: imageId,
        loaded: loaded,
        total: total,
        percentComplete: percentComplete
      });
    }
  };
  xhr.send();

  return deferred.promise();
}

function configure(opts) {
  options = opts;
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.configure = exports.loadImage = exports.createImage = exports.arrayBufferToImage = undefined;

var _arrayBufferToImage = __webpack_require__(1);

var _arrayBufferToImage2 = _interopRequireDefault(_arrayBufferToImage);

var _createImage = __webpack_require__(2);

var _createImage2 = _interopRequireDefault(_createImage);

var _loadImage = __webpack_require__(3);

var _cornerstoneCore = __webpack_require__(0);

var cornerstone = _interopRequireWildcard(_cornerstoneCore);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.arrayBufferToImage = _arrayBufferToImage2.default;
exports.createImage = _createImage2.default;
exports.loadImage = _loadImage.loadImage;
exports.configure = _loadImage.configure;

// Register the http and https prefixes so we can use standard web urls directly

cornerstone.registerImageLoader('http', _loadImage.loadImage);
cornerstone.registerImageLoader('https', _loadImage.loadImage);

/***/ })
/******/ ]);
});
//# sourceMappingURL=cornerstoneWebImageLoader.js.map