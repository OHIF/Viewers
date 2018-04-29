/*! cornerstone-web-image-loader - 2.1.0 - 2018-04-11 | (c) 2016 Chris Hafey | https://github.com/cornerstonejs/cornerstoneWebImageLoader */
(function webpackUniversalModuleDefinition(root, factory) {
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define("cornerstoneWebImageLoader", [], factory);
    else if(typeof exports === 'object')
        exports["cornerstoneWebImageLoader"] = factory();
    else
        root["cornerstoneWebImageLoader"] = factory();
})(window, function() {
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
                /******/ 			Object.defineProperty(exports, name, {
                    /******/ 				configurable: false,
                    /******/ 				enumerable: true,
                    /******/ 				get: getter
                    /******/ 			});
                /******/ 		}
            /******/ 	};
        /******/
        /******/ 	// define __esModule on exports
        /******/ 	__webpack_require__.r = function(exports) {
            /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
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
        /******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
        /******/ })
    /************************************************************************/
    /******/ ({

        /***/ "./arrayBufferToImage.js":
        /*!*******************************!*\
          !*** ./arrayBufferToImage.js ***!
          \*******************************/
        /*! no static exports found */
        /***/ (function(module, exports, __webpack_require__) {

            "use strict";


            Object.defineProperty(exports, "__esModule", {
                value: true
            });

            exports.default = function (arrayBuffer) {
                return new Promise(function (resolve, reject) {
                    var image = new Image();
                    var arrayBufferView = new Uint8Array(arrayBuffer);
                    var blob = new Blob([arrayBufferView]);
                    var urlCreator = window.URL || window.webkitURL;
                    var imageUrl = urlCreator.createObjectURL(blob);

                    image.src = imageUrl;
                    image.onload = function () {
                        resolve(image);
                        urlCreator.revokeObjectURL(imageUrl);
                    };

                    image.onerror = function (error) {
                        urlCreator.revokeObjectURL(imageUrl);
                        reject(error);
                    };
                });
            };

            /***/ }),

        /***/ "./createImage.js":
        /*!************************!*\
          !*** ./createImage.js ***!
          \************************/
        /*! no static exports found */
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

                    return imageData.data;
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

                // Extract the various attributes we need
                return {
                    imageId: imageId,
                    minPixelValue: 0,
                    maxPixelValue: 255,
                    slope: 1,
                    intercept: 0,
                    windowCenter: 128,
                    windowWidth: 255,
                    render: _externalModules.external.cornerstone.renderWebImage,
                    getPixelData: getPixelData,
                    getCanvas: getCanvas,
                    getImage: function getImage() {
                        return image;
                    },
                    rows: rows,
                    columns: columns,
                    height: rows,
                    width: columns,
                    color: true,
                    rgba: false,
                    columnPixelSpacing: undefined,
                    rowPixelSpacing: undefined,
                    invert: false,
                    sizeInBytes: rows * columns * 4
                };
            };

            var _externalModules = __webpack_require__(/*! ./externalModules.js */ "./externalModules.js");

            var canvas = document.createElement('canvas');
            var lastImageIdDrawn = void 0;

            /**
             * creates a cornerstone Image object for the specified Image and imageId
             *
             * @param image - An Image
             * @param imageId - the imageId for this image
             * @returns Cornerstone Image Object
             */

            /***/ }),

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
            exports.external = undefined;

            var _registerLoaders = __webpack_require__(/*! ./registerLoaders.js */ "./registerLoaders.js");

            var _registerLoaders2 = _interopRequireDefault(_registerLoaders);

            function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

            var cornerstone = void 0;

            var external = {
                set cornerstone(cs) {
                    cornerstone = cs;

                    (0, _registerLoaders2.default)(cornerstone);
                },
                get cornerstone() {
                    return cornerstone;
                }
            };

            exports.external = external;

            /***/ }),

        /***/ "./index.js":
        /*!******************!*\
          !*** ./index.js ***!
          \******************/
        /*! no static exports found */
        /***/ (function(module, exports, __webpack_require__) {

            "use strict";


            Object.defineProperty(exports, "__esModule", {
                value: true
            });
            exports.external = exports.configure = exports.loadImage = exports.createImage = exports.arrayBufferToImage = undefined;

            var _arrayBufferToImage = __webpack_require__(/*! ./arrayBufferToImage.js */ "./arrayBufferToImage.js");

            var _arrayBufferToImage2 = _interopRequireDefault(_arrayBufferToImage);

            var _createImage = __webpack_require__(/*! ./createImage.js */ "./createImage.js");

            var _createImage2 = _interopRequireDefault(_createImage);

            var _loadImage = __webpack_require__(/*! ./loadImage.js */ "./loadImage.js");

            var _externalModules = __webpack_require__(/*! ./externalModules.js */ "./externalModules.js");

            function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

            exports.arrayBufferToImage = _arrayBufferToImage2.default;
            exports.createImage = _createImage2.default;
            exports.loadImage = _loadImage.loadImage;
            exports.configure = _loadImage.configure;
            exports.external = _externalModules.external;

            /***/ }),

        /***/ "./loadImage.js":
        /*!**********************!*\
          !*** ./loadImage.js ***!
          \**********************/
        /*! no static exports found */
        /***/ (function(module, exports, __webpack_require__) {

            "use strict";


            Object.defineProperty(exports, "__esModule", {
                value: true
            });
            exports.loadImage = loadImage;
            exports.configure = configure;

            var _externalModules = __webpack_require__(/*! ./externalModules.js */ "./externalModules.js");

            var _arrayBufferToImage = __webpack_require__(/*! ./arrayBufferToImage.js */ "./arrayBufferToImage.js");

            var _arrayBufferToImage2 = _interopRequireDefault(_arrayBufferToImage);

            var _createImage = __webpack_require__(/*! ./createImage.js */ "./createImage.js");

            var _createImage2 = _interopRequireDefault(_createImage);

            function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//
// This is a cornerstone image loader for web images such as PNG and JPEG
//
            var options = {
                // callback allowing customization of the xhr (e.g. adding custom auth headers, cors, etc)
                beforeSend: function beforeSend() /* xhr */{}
            };

// Loads an image given a url to an image
            function loadImage(imageId) {
                var cornerstone = _externalModules.external.cornerstone;

                var xhr = new XMLHttpRequest();

                xhr.open('GET', imageId, true);
                xhr.responseType = 'arraybuffer';
                options.beforeSend(xhr);

                xhr.onprogress = function (oProgress) {
                    if (oProgress.lengthComputable) {
                        // evt.loaded the bytes browser receive
                        // evt.total the total bytes set by the header
                        var loaded = oProgress.loaded;
                        var total = oProgress.total;
                        var percentComplete = Math.round(loaded / total * 100);

                        var eventData = {
                            imageId: imageId,
                            loaded: loaded,
                            total: total,
                            percentComplete: percentComplete
                        };

                        cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadprogress', eventData);
                    }
                };

                var promise = new Promise(function (resolve, reject) {
                    xhr.onload = function () {
                        var imagePromise = (0, _arrayBufferToImage2.default)(this.response);

                        imagePromise.then(function (image) {
                            var imageObject = (0, _createImage2.default)(image, imageId);

                            resolve(imageObject);
                        }, reject);
                    };

                    xhr.send();
                });

                var cancelFn = function cancelFn() {
                    xhr.abort();
                };

                return {
                    promise: promise,
                    cancelFn: cancelFn
                };
            }

            function configure(opts) {
                options = opts;
            }

            /***/ }),

        /***/ "./registerLoaders.js":
        /*!****************************!*\
          !*** ./registerLoaders.js ***!
          \****************************/
        /*! no static exports found */
        /***/ (function(module, exports, __webpack_require__) {

            "use strict";


            Object.defineProperty(exports, "__esModule", {
                value: true
            });

            exports.default = function (cornerstone) {
                // Register the http and https prefixes so we can use standard web urls directly
                cornerstone.registerImageLoader('http', _loadImage.loadImage);
                cornerstone.registerImageLoader('https', _loadImage.loadImage);
            };

            var _loadImage = __webpack_require__(/*! ./loadImage.js */ "./loadImage.js");

            /***/ })

        /******/ });
});
//# sourceMappingURL=cornerstoneWebImageLoader.js.map
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
