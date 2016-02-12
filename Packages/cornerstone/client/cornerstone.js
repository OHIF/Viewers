/*! cornerstone - v0.9.0 - 2016-02-12 | (c) 2014 Chris Hafey | https://github.com/chafey/cornerstone */
if(typeof cornerstone === 'undefined'){
    cornerstone = {
        internal : {},
        rendering: {}
    };
}

(function (cornerstone) {

    "use strict";

    function disable(element) {
        if(element === undefined) {
            throw "disable: element element must not be undefined";
        }

        // Search for this element in this list of enabled elements
        var enabledElements = cornerstone.getEnabledElements();
        for(var i=0; i < enabledElements.length; i++) {
            if(enabledElements[i].element === element) {
                // We found it!

                // Fire an event so dependencies can cleanup
                var eventData = {
                    element : element
                };
                $(element).trigger("CornerstoneElementDisabled", eventData);

                // remove the child dom elements that we created (e.g.canvas)
                enabledElements[i].element.removeChild(enabledElements[i].canvas);

                // remove this element from the list of enabled elements
                enabledElements.splice(i, 1);
                return;
            }
        }
    }

    // module/private exports
    cornerstone.disable = disable;

}(cornerstone));
/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
(function ($, cornerstone) {

    "use strict";

    /**
     * sets a new image object for a given element
     * @param element
     * @param image
     */
    function displayImage(element, image, viewport) {
        if(element === undefined) {
            throw "displayImage: parameter element cannot be undefined";
        }
        if(image === undefined) {
            throw "displayImage: parameter image cannot be undefined";
        }

        var enabledElement = cornerstone.getEnabledElement(element);

        enabledElement.image = image;

        if(enabledElement.viewport === undefined) {
            enabledElement.viewport = cornerstone.internal.getDefaultViewport(enabledElement.canvas, image);
        }

        // merge viewport
        if(viewport) {
            for(var attrname in viewport)
            {
                if(viewport[attrname] !== null) {
                    enabledElement.viewport[attrname] = viewport[attrname];
                }
            }
        }

        var now = new Date();
        var frameRate;
        if(enabledElement.lastImageTimeStamp !== undefined) {
            var timeSinceLastImage = now.getTime() - enabledElement.lastImageTimeStamp;
            frameRate = (1000 / timeSinceLastImage).toFixed();
        } else {
        }
        enabledElement.lastImageTimeStamp = now.getTime();

        var newImageEventData = {
            viewport : enabledElement.viewport,
            element : enabledElement.element,
            image : enabledElement.image,
            enabledElement : enabledElement,
            frameRate : frameRate
        };

        $(enabledElement.element).trigger("CornerstoneNewImage", newImageEventData);

        cornerstone.updateImage(element);
    }

    // module/private exports
    cornerstone.displayImage = displayImage;
}($, cornerstone));
/**
 * This module is responsible for immediately drawing an enabled element
 */

(function ($, cornerstone) {

    "use strict";

    /**
     * Immediately draws the enabled element
     *
     * @param element
     */
    function draw(element) {
        var enabledElement = cornerstone.getEnabledElement(element);

        if(enabledElement.image === undefined) {
            throw "draw: image has not been loaded yet";
        }

        cornerstone.drawImage(enabledElement);
    }

    // Module exports
    cornerstone.draw = draw;

}($, cornerstone));
/**
 * This module is responsible for drawing invalidated enabled elements
 */

(function ($, cornerstone) {

    "use strict";

    /**
     * Draws all invalidated enabled elements and clears the invalid flag after drawing it
     */
    function drawInvalidated()
    {
        var enabledElements = cornerstone.getEnabledElements();
        for(var i=0;i < enabledElements.length; i++) {
            var ee = enabledElements[i];
            if(ee.invalid === true) {
                cornerstone.drawImage(ee);
            }
        }
    }

    // Module exports
    cornerstone.drawInvalidated = drawInvalidated;
}($, cornerstone));
/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
(function (cornerstone) {

    "use strict";

    function enable(element, options) {
        if(element === undefined) {
            throw "enable: parameter element cannot be undefined";
        }

        // If this enabled element has the option set for WebGL, we should
        // check if this device actually supports it
        if (options && options.renderer && options.renderer.toLowerCase() === 'webgl') {
            if (cornerstone.webGL.renderer.isWebGLAvailable()) {
                // If WebGL is available on the device, initialize the renderer
                // and return the renderCanvas from the WebGL rendering path
                console.log('Using WebGL rendering path');
                
                cornerstone.webGL.renderer.initRenderer();
                options.renderer = 'webgl';
            } else {
                // If WebGL is not available on this device, we will fall back
                // to using the Canvas renderer
                console.error('WebGL not available, falling back to Canvas renderer');
                delete options.renderer;
            }
        }

        var canvas = document.createElement('canvas');
        element.appendChild(canvas);

        var el = {
            element: element,
            canvas: canvas,
            image : undefined, // will be set once image is loaded
            invalid: false, // true if image needs to be drawn, false if not
            options: options,
            data : {}
        };
        cornerstone.addEnabledElement(el);

        cornerstone.resize(element, true);

        return element;
    }

    // module/private exports
    cornerstone.enable = enable;
}(cornerstone));
(function (cornerstone) {

    "use strict";

    function getElementData(el, dataType) {
        var ee = cornerstone.getEnabledElement(el);
        if(ee.data.hasOwnProperty(dataType) === false)
        {
            ee.data[dataType] = {};
        }
        return ee.data[dataType];
    }

    function removeElementData(el, dataType) {
        var ee = cornerstone.getEnabledElement(el);
        delete ee.data[dataType];
    }

    // module/private exports
    cornerstone.getElementData = getElementData;
    cornerstone.removeElementData = removeElementData;

}(cornerstone));
(function (cornerstone) {

    "use strict";

    var enabledElements = [];

    function getEnabledElement(element) {
        if(element === undefined) {
            throw "getEnabledElement: parameter element must not be undefined";
        }
        for(var i=0; i < enabledElements.length; i++) {
            if(enabledElements[i].element == element) {
                return enabledElements[i];
            }
        }

        throw "element not enabled";
    }

    function addEnabledElement(enabledElement) {
        if(enabledElement === undefined) {
            throw "getEnabledElement: enabledElement element must not be undefined";
        }

        enabledElements.push(enabledElement);
    }

    function getEnabledElementsByImageId(imageId) {
        var ees = [];
        enabledElements.forEach(function(enabledElement) {
            if(enabledElement.image && enabledElement.image.imageId === imageId) {
                ees.push(enabledElement);
            }
        });
        return ees;
    }

    function getEnabledElements() {
        return enabledElements;
    }

    // module/private exports
    cornerstone.getEnabledElement = getEnabledElement;
    cornerstone.addEnabledElement = addEnabledElement;
    cornerstone.getEnabledElementsByImageId = getEnabledElementsByImageId;
    cornerstone.getEnabledElements = getEnabledElements;
}(cornerstone));
/**
 * This module will fit an image to fit inside the canvas displaying it such that all pixels
 * in the image are viewable
 */
(function (cornerstone) {

    "use strict";

    function getImageSize(enabledElement) {
      if(enabledElement.viewport.rotation === 0 ||enabledElement.viewport.rotation === 180) {
        return {
          width: enabledElement.image.width,
          height: enabledElement.image.height
        };
      } else {
        return {
          width: enabledElement.image.height,
          height: enabledElement.image.width
        };
      }
    }

    /**
     * Adjusts an images scale and center so the image is centered and completely visible
     * @param element
     */
    function fitToWindow(element)
    {
        var enabledElement = cornerstone.getEnabledElement(element);
        var imageSize = getImageSize(enabledElement);

        var verticalScale = enabledElement.canvas.height / imageSize.height;
        var horizontalScale= enabledElement.canvas.width / imageSize.width;
        if(horizontalScale < verticalScale) {
          enabledElement.viewport.scale = horizontalScale;
        }
        else
        {
          enabledElement.viewport.scale = verticalScale;
        }
        enabledElement.viewport.translation.x = 0;
        enabledElement.viewport.translation.y = 0;
        cornerstone.updateImage(element);
    }

    cornerstone.fitToWindow = fitToWindow;
}(cornerstone));

/**
 * This file is responsible for returning the default viewport for an image
 */

(function ($, cornerstone) {

    "use strict";

    /**
     * returns a default viewport for display the specified image on the specified
     * enabled element.  The default viewport is fit to window
     *
     * @param element
     * @param image
     */
    function getDefaultViewportForImage(element, image) {
        var enabledElement = cornerstone.getEnabledElement(element);
        var viewport = cornerstone.internal.getDefaultViewport(enabledElement.canvas, image);
        return viewport;
    }

    // Module exports
    cornerstone.getDefaultViewportForImage = getDefaultViewportForImage;
}($, cornerstone));
/**
 * This module is responsible for returning the currently displayed image for an element
 */

(function ($, cornerstone) {

    "use strict";

    /**
     * returns the currently displayed image for an element or undefined if no image has
     * been displayed yet
     *
     * @param element
     */
    function getImage(element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        return enabledElement.image;
    }

    // Module exports
    cornerstone.getImage = getImage;
}($, cornerstone));
/**
 * This module returns a subset of the stored pixels of an image
 */
(function (cornerstone) {

    "use strict";

    /**
     * Returns array of pixels with modality LUT transformation applied
     */
    function getPixels(element, x, y, width, height) {

        var storedPixels = cornerstone.getStoredPixels(element, x, y, width, height);
        var ee = cornerstone.getEnabledElement(element);

        var mlutfn = cornerstone.internal.getModalityLUT(ee.image.slope, ee.image.intercept, ee.viewport.modalityLUT);

        var modalityPixels = storedPixels.map(mlutfn);

        return modalityPixels;
    }

    // module exports
    cornerstone.getPixels = getPixels;
}(cornerstone));
/**
 * This module returns a subset of the stored pixels of an image
 */
(function (cornerstone) {

    "use strict";

    /**
     * Returns an array of stored pixels given a rectangle in the image
     * @param element
     * @param x
     * @param y
     * @param width
     * @param height
     * @returns {Array}
     */
    function getStoredPixels(element, x, y, width, height) {
        if(element === undefined) {
            throw "getStoredPixels: parameter element must not be undefined";
        }

        x = Math.round(x);
        y = Math.round(y);
        var ee = cornerstone.getEnabledElement(element);
        var storedPixels = [];
        var index = 0;
        var pixelData = ee.image.getPixelData();
        for(var row=0; row < height; row++) {
            for(var column=0; column < width; column++) {
                var spIndex = ((row + y) * ee.image.columns) + (column + x);
                storedPixels[index++] = pixelData[spIndex];
            }
        }
        return storedPixels;
    }

    // module exports
    cornerstone.getStoredPixels = getStoredPixels;
}(cornerstone));
/**
 * This module contains functions to deal with getting and setting the viewport for an enabled element
 */
(function (cornerstone) {

    "use strict";

    /**
     * Returns the viewport for the specified enabled element
     * @param element
     * @returns {*}
     */
    function getViewport(element) {
        var enabledElement = cornerstone.getEnabledElement(element);

        var viewport = enabledElement.viewport;
        if(viewport === undefined) {
            return undefined;
        }
        return {
            scale : viewport.scale,
            translation : {
                x : viewport.translation.x,
                y : viewport.translation.y
            },
            voi : {
                windowWidth: viewport.voi.windowWidth,
                windowCenter : viewport.voi.windowCenter
            },
            invert : viewport.invert,
            pixelReplication: viewport.pixelReplication,
            rotation: viewport.rotation, 
            hflip: viewport.hflip,
            vflip: viewport.vflip,
            modalityLUT: viewport.modalityLUT,
            voiLUT: viewport.voiLUT
        };
    }

    // module/private exports
    cornerstone.getViewport = getViewport;

}(cornerstone));

/**
 * This module deals with caching images
 */

(function (cornerstone) {

    "use strict";

    // dictionary of imageId to cachedImage objects
    var imageCache = {};
    // dictionary of sharedCacheKeys to number of imageId's in cache with this shared cache key
    var sharedCacheKeys = {};
    // array of cachedImage objects
    var cachedImages = [];

    var maximumSizeInBytes = 1024 * 1024 * 1024; // 1 GB
    var cacheSizeInBytes = 0;

    function setMaximumSizeBytes(numBytes) {
        if (numBytes === undefined) {
            throw "setMaximumSizeBytes: parameter numBytes must not be undefined";
        }
        if (numBytes.toFixed === undefined) {
            throw "setMaximumSizeBytes: parameter numBytes must be a number";
        }

        maximumSizeInBytes = numBytes;
        purgeCacheIfNecessary();
    }

    function purgeCacheIfNecessary() {
        // if max cache size has not been exceeded, do nothing
        if (cacheSizeInBytes <= maximumSizeInBytes) {
            return;
        }

        // cache size has been exceeded, create list of images sorted by timeStamp
        // so we can purge the least recently used image
        function compare(a,b) {
            if (a.timeStamp > b.timeStamp) {
                return -1;
            }
            if (a.timeStamp < b.timeStamp) {
                return 1;
            }
            return 0;
        }
        cachedImages.sort(compare);

        // remove images as necessary
        while(cacheSizeInBytes > maximumSizeInBytes) {
            var lastCachedImage = cachedImages[cachedImages.length - 1];
            cacheSizeInBytes -= lastCachedImage.sizeInBytes;
            delete imageCache[lastCachedImage.imageId];
            lastCachedImage.imagePromise.reject();
            cachedImages.pop();
            $(cornerstone).trigger('CornerstoneImageCachePromiseRemoved', {imageId: lastCachedImage.imageId});
        }

        var cacheInfo = cornerstone.imageCache.getCacheInfo();
        $(cornerstone).trigger('CornerstoneImageCacheFull', cacheInfo);
    }

    function putImagePromise(imageId, imagePromise) {
        if (imageId === undefined) {
            throw "getImagePromise: imageId must not be undefined";
        }
        if (imagePromise === undefined) {
            throw "getImagePromise: imagePromise must not be undefined";
        }

        if (imageCache.hasOwnProperty(imageId) === true) {
            throw "putImagePromise: imageId already in cache";
        }

        var cachedImage = {
            loaded : false,
            imageId : imageId,
            sharedCacheKey: undefined, // the sharedCacheKey for this imageId.  undefined by default
            imagePromise : imagePromise,
            timeStamp : new Date(),
            sizeInBytes: 0
        };

        imageCache[imageId] = cachedImage;
        cachedImages.push(cachedImage);

        imagePromise.then(function(image) {
            cachedImage.loaded = true;

            if (image.sizeInBytes === undefined) {
                throw "putImagePromise: image does not have sizeInBytes property or";
            }
            if (image.sizeInBytes.toFixed === undefined) {
                throw "putImagePromise: image.sizeInBytes is not a number";
            }

            // If this image has a shared cache key, reference count it and only
            // count the image size for the first one added with this sharedCacheKey
            if(image.sharedCacheKey) {
              cachedImage.sizeInBytes = image.sizeInBytes;
              cachedImage.sharedCacheKey = image.sharedCacheKey;
              if(sharedCacheKeys[image.sharedCacheKey]) {
                sharedCacheKeys[image.sharedCacheKey]++;
              } else {
                sharedCacheKeys[image.sharedCacheKey] = 1;
                cacheSizeInBytes += cachedImage.sizeInBytes;
              }
            }
            else {
              cachedImage.sizeInBytes = image.sizeInBytes;
              cacheSizeInBytes += cachedImage.sizeInBytes;
            }
            purgeCacheIfNecessary();
        });
    }

    function getImagePromise(imageId) {
        if (imageId === undefined) {
            throw "getImagePromise: imageId must not be undefined";
        }
        var cachedImage = imageCache[imageId];
        if (cachedImage === undefined) {
            return undefined;
        }

        // bump time stamp for cached image
        cachedImage.timeStamp = new Date();
        return cachedImage.imagePromise;
    }

    function removeImagePromise(imageId) {
        if (imageId === undefined) {
            throw "removeImagePromise: imageId must not be undefined";
        }
        var cachedImage = imageCache[imageId];
        if (cachedImage === undefined) {
            throw "removeImagePromise: imageId must not be undefined";
        }
        cachedImages.splice( cachedImages.indexOf(cachedImage), 1);

        // If this is using a sharedCacheKey, decrement the cache size only
        // if it is the last imageId in the cache with this sharedCacheKey
        if(cachedImages.sharedCacheKey) {
          if(sharedCacheKeys[cachedImages.sharedCacheKey] === 1) {
            cacheSizeInBytes -= cachedImage.sizeInBytes;
            delete sharedCacheKeys[cachedImages.sharedCacheKey];
          } else {
            sharedCacheKeys[cachedImages.sharedCacheKey]--;
          }
        } else {
          cacheSizeInBytes -= cachedImage.sizeInBytes;
        }
        delete imageCache[imageId];

        decache(cachedImage.imagePromise, cachedImage.imageId);

        return cachedImage.imagePromise;
    }

    function getCacheInfo() {
        return {
            maximumSizeInBytes : maximumSizeInBytes,
            cacheSizeInBytes : cacheSizeInBytes,
            numberOfImagesCached: cachedImages.length
        };
    }

    function decache(imagePromise, imageId) {
      imagePromise.then(function(image) {
        if(image.decache) {
          image.decache();
        }
        imagePromise.reject();
        delete imageCache[imageId];
      }).always(function() {
        delete imageCache[imageId];
      });
    }

    function purgeCache() {
        while (cachedImages.length > 0) {
          var removedCachedImage = cachedImages.pop();
          decache(removedCachedImage.imagePromise, removedCachedImage.imageId);
        }
        cacheSizeInBytes = 0;
    }

    function changeImageIdCacheSize(imageId, newCacheSize) {
      var cacheEntry = imageCache[imageId];
      if(cacheEntry) {
        cacheEntry.imagePromise.then(function(image) {
          var cacheSizeDifference = newCacheSize - image.sizeInBytes;
          image.sizeInBytes = newCacheSize;
          cacheSizeInBytes += cacheSizeDifference;
        });
      }
    }

    // module exports
    cornerstone.imageCache = {
        putImagePromise : putImagePromise,
        getImagePromise: getImagePromise,
        removeImagePromise: removeImagePromise,
        setMaximumSizeBytes: setMaximumSizeBytes,
        getCacheInfo : getCacheInfo,
        purgeCache: purgeCache,
        cachedImages: cachedImages,
        changeImageIdCacheSize: changeImageIdCacheSize
    };

}(cornerstone));

/**
 * This module deals with ImageLoaders, loading images and caching images
 */

(function ($, cornerstone) {

    "use strict";

    var imageLoaders = {};

    var unknownImageLoader;

    function loadImageFromImageLoader(imageId) {
        var colonIndex = imageId.indexOf(":");
        var scheme = imageId.substring(0, colonIndex);
        var loader = imageLoaders[scheme];
        var imagePromise;
        if(loader === undefined || loader === null) {
            if(unknownImageLoader !== undefined) {
                imagePromise = unknownImageLoader(imageId);
                return imagePromise;
            }
            else {
                return undefined;
            }
        }
        imagePromise = loader(imageId);

        // broadcast an image loaded event once the image is loaded
        // This is based on the idea here: http://stackoverflow.com/questions/3279809/global-custom-events-in-jquery
        imagePromise.then(function(image) {
            $(cornerstone).trigger('CornerstoneImageLoaded', {image: image});
        });

        return imagePromise;
    }

    // Loads an image given an imageId and returns a promise which will resolve
    // to the loaded image object or fail if an error occurred.  The loaded image
    // is not stored in the cache
    function loadImage(imageId) {
        if(imageId === undefined) {
            throw "loadImage: parameter imageId must not be undefined";
        }

        var imagePromise = cornerstone.imageCache.getImagePromise(imageId);
        if(imagePromise !== undefined) {
            return imagePromise;
        }

        imagePromise = loadImageFromImageLoader(imageId);
        if(imagePromise === undefined) {
            throw "loadImage: no image loader for imageId";
        }

        return imagePromise;
    }

    // Loads an image given an imageId and returns a promise which will resolve
    // to the loaded image object or fail if an error occurred.  The image is
    // stored in the cache
    function loadAndCacheImage(imageId) {
        if(imageId === undefined) {
            throw "loadAndCacheImage: parameter imageId must not be undefined";
        }

        var imagePromise = cornerstone.imageCache.getImagePromise(imageId);
        if(imagePromise !== undefined) {
            return imagePromise;
        }

        imagePromise = loadImageFromImageLoader(imageId);
        if(imagePromise === undefined) {
            throw "loadAndCacheImage: no image loader for imageId";
        }

        cornerstone.imageCache.putImagePromise(imageId, imagePromise);

        return imagePromise;
    }


    // registers an imageLoader plugin with cornerstone for the specified scheme
    function registerImageLoader(scheme, imageLoader) {
        imageLoaders[scheme] = imageLoader;
    }

    // Registers a new unknownImageLoader and returns the previous one (if it exists)
    function registerUnknownImageLoader(imageLoader) {
        var oldImageLoader = unknownImageLoader;
        unknownImageLoader = imageLoader;
        return oldImageLoader;
    }

    // module exports

    cornerstone.loadImage = loadImage;
    cornerstone.loadAndCacheImage = loadAndCacheImage;
    cornerstone.registerImageLoader = registerImageLoader;
    cornerstone.registerUnknownImageLoader = registerUnknownImageLoader;

}($, cornerstone));

(function (cornerstone) {

    "use strict";

    function calculateTransform(enabledElement, scale) {

        var transform = new cornerstone.internal.Transform();
        transform.translate(enabledElement.canvas.width/2, enabledElement.canvas.height / 2);

        //Apply the rotation before scaling for non square pixels
        var angle = enabledElement.viewport.rotation;
        if(angle!==0) {
            transform.rotate(angle*Math.PI/180);
        }

        // apply the scale
        var widthScale = enabledElement.viewport.scale;
        var heightScale = enabledElement.viewport.scale;
        if(enabledElement.image.rowPixelSpacing < enabledElement.image.columnPixelSpacing) {
            widthScale = widthScale * (enabledElement.image.columnPixelSpacing / enabledElement.image.rowPixelSpacing);
        }
        else if(enabledElement.image.columnPixelSpacing < enabledElement.image.rowPixelSpacing) {
            heightScale = heightScale * (enabledElement.image.rowPixelSpacing / enabledElement.image.columnPixelSpacing);
        }
        transform.scale(widthScale, heightScale);

        // unrotate to so we can translate unrotated
        if(angle!==0) {
            transform.rotate(-angle*Math.PI/180);
        }

        // apply the pan offset
        transform.translate(enabledElement.viewport.translation.x, enabledElement.viewport.translation.y);

        // rotate again so we can apply general scale
        if(angle!==0) {
            transform.rotate(angle*Math.PI/180);
        }

        if(scale !== undefined) {
            // apply the font scale
            transform.scale(scale, scale);
        }

        //Apply Flip if required
        if(enabledElement.viewport.hflip) {
            transform.scale(-1,1);
        }

        if(enabledElement.viewport.vflip) {
            transform.scale(1,-1);
        }

        // translate the origin back to the corner of the image so the event handlers can draw in image coordinate system
        transform.translate(-enabledElement.image.width / 2 , -enabledElement.image.height/ 2);
        return transform;
    }

    // Module exports
    cornerstone.internal.calculateTransform = calculateTransform;
}(cornerstone));
/**
 * This module is responsible for drawing an image to an enabled elements canvas element
 */

(function ($, cornerstone) {

    "use strict";

    /**
     * Internal API function to draw an image to a given enabled element
     * @param enabledElement
     * @param invalidated - true if pixel data has been invalidated and cached rendering should not be used
     */
    function drawImage(enabledElement, invalidated) {

        var start = new Date();

        enabledElement.image.render(enabledElement, invalidated);

        var context = enabledElement.canvas.getContext('2d');

        var end = new Date();
        var diff = end - start;
        //console.log(diff + ' ms');

        var eventData = {
            viewport : enabledElement.viewport,
            element : enabledElement.element,
            image : enabledElement.image,
            enabledElement : enabledElement,
            canvasContext: context,
            renderTimeInMs : diff
        };

        $(enabledElement.element).trigger("CornerstoneImageRendered", eventData);
        enabledElement.invalid = false;
    }

    // Module exports
    cornerstone.internal.drawImage = drawImage;
    cornerstone.drawImage = drawImage;

}($, cornerstone));
/**
 * This module generates a lut for an image
 */

(function (cornerstone) {

  "use strict";

  function generateLutNew(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT)
  {
    if(image.lut === undefined) {
      image.lut =  new Int16Array(image.maxPixelValue - Math.min(image.minPixelValue,0)+1);
    }
    var lut = image.lut;
    var maxPixelValue = image.maxPixelValue;
    var minPixelValue = image.minPixelValue;

    var mlutfn = cornerstone.internal.getModalityLUT(image.slope, image.intercept, modalityLUT);
    var vlutfn = cornerstone.internal.getVOILUT(windowWidth, windowCenter, voiLUT);

    var offset = 0;
    if(minPixelValue < 0) {
      offset = minPixelValue;
    }
    var storedValue;
    var modalityLutValue;
    var voiLutValue;
    var clampedValue;

    for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
    {
      modalityLutValue = mlutfn(storedValue);
      voiLutValue = vlutfn(modalityLutValue);
      clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
      if(!invert) {
        lut[storedValue+ (-offset)] = Math.round(clampedValue);
      } else {
        lut[storedValue + (-offset)] = Math.round(255 - clampedValue);
      }
    }
    return lut;
  }



  /**
   * Creates a LUT used while rendering to convert stored pixel values to
   * display pixels
   *
   * @param image
   * @returns {Array}
   */
  function generateLut(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT)
  {
    if(modalityLUT || voiLUT) {
      return generateLutNew(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT);
    }

    if(image.lut === undefined) {
      image.lut =  new Int16Array(image.maxPixelValue - Math.min(image.minPixelValue,0)+1);
    }
    var lut = image.lut;

    var maxPixelValue = image.maxPixelValue;
    var minPixelValue = image.minPixelValue;
    var slope = image.slope;
    var intercept = image.intercept;
    var localWindowWidth = windowWidth;
    var localWindowCenter = windowCenter;
    var modalityLutValue;
    var voiLutValue;
    var clampedValue;
    var storedValue;

    // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
    // We improve performance by offsetting the pixel values for signed data to avoid negative indexes
    // when generating the lut and then undo it in storedPixelDataToCanvasImagedata.  Thanks to @jpambrun
    // for this contribution!

    var offset = 0;
    if(minPixelValue < 0) {
      offset = minPixelValue;
    }

    if(invert === true) {
      for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
      {
        modalityLutValue =  storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
        lut[storedValue + (-offset)] = Math.round(255 - clampedValue);
      }
    }
    else {
      for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
      {
        modalityLutValue = storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
        lut[storedValue+ (-offset)] = Math.round(clampedValue);
      }
    }
  }


  // Module exports
  cornerstone.internal.generateLutNew = generateLutNew;
  cornerstone.internal.generateLut = generateLut;
  cornerstone.generateLutNew = generateLutNew;
  cornerstone.generateLut = generateLut;
}(cornerstone));

/**
 * This module contains a function to get a default viewport for an image given
 * a canvas element to display it in
 *
 */
(function (cornerstone) {

    "use strict";

    /**
     * Creates a new viewport object containing default values for the image and canvas
     * @param canvas
     * @param image
     * @returns viewport object
     */
    function getDefaultViewport(canvas, image) {
        if(canvas === undefined) {
            throw "getDefaultViewport: parameter canvas must not be undefined";
        }
        if(image === undefined) {
            throw "getDefaultViewport: parameter image must not be undefined";
        }
        var viewport = {
            scale : 1.0,
            translation : {
                x : 0,
                y : 0
            },
            voi : {
                windowWidth: image.windowWidth,
                windowCenter: image.windowCenter,
            },
            invert: image.invert,
            pixelReplication: false,
            rotation: 0,
            hflip: false,
            vflip: false,
            modalityLUT: image.modalityLUT,
            voiLUT: image.voiLUT
        };

        // fit image to window
        var verticalScale = canvas.height / image.rows;
        var horizontalScale= canvas.width / image.columns;
        if(horizontalScale < verticalScale) {
            viewport.scale = horizontalScale;
        }
        else {
            viewport.scale = verticalScale;
        }
        return viewport;
    }

    // module/private exports
    cornerstone.internal.getDefaultViewport = getDefaultViewport;
    cornerstone.getDefaultViewport = getDefaultViewport;
}(cornerstone));

(function (cornerstone) {

    "use strict";

    function getTransform(enabledElement)
    {
        // For now we will calculate it every time it is requested.  In the future, we may want to cache
        // it in the enabled element to speed things up
        var transform = cornerstone.internal.calculateTransform(enabledElement);
        return transform;
    }

    // Module exports
    cornerstone.internal.getTransform = getTransform;

}(cornerstone));
/**
 * This module is responsible for drawing an image to an enabled elements canvas element
 */

(function ($, cornerstone) {

    "use strict";

    cornerstone.drawImage = cornerstone.internal.drawImage;
    cornerstone.generateLut = cornerstone.internal.generateLut;
    cornerstone.storedPixelDataToCanvasImageData = cornerstone.internal.storedPixelDataToCanvasImageData;
    cornerstone.storedColorPixelDataToCanvasImageData = cornerstone.internal.storedColorPixelDataToCanvasImageData;

}($, cornerstone));
/**
 * This module generates a Modality LUT
 */

(function (cornerstone) {

  "use strict";


  function generateLinearModalityLUT(slope, intercept) {
    var localSlope = slope;
    var localIntercept = intercept;
    return function(sp) {
      return sp * localSlope + localIntercept;
    }
  }

  function generateNonLinearModalityLUT(modalityLUT) {
    var minValue = modalityLUT.lut[0];
    var maxValue = modalityLUT.lut[modalityLUT.lut.length -1];
    var maxValueMapped = modalityLUT.firstValueMapped + modalityLUT.lut.length;
    return function(sp) {
      if(sp < modalityLUT.firstValueMapped) {
        return minValue;
      }
      else if(sp >= maxValueMapped)
      {
        return maxValue;
      }
      else
      {
        return modalityLUT.lut[sp];
      }
    }
  }

  function getModalityLUT(slope, intercept, modalityLUT) {
    if (modalityLUT) {
      return generateNonLinearModalityLUT(modalityLUT);
    } else {
      return generateLinearModalityLUT(slope, intercept);
    }
  }

    // Module exports
    cornerstone.internal.getModalityLUT = getModalityLUT;

}(cornerstone));

/**
 * This module contains a function to convert stored pixel values to display pixel values using a LUT
 */
(function (cornerstone) {

    "use strict";

    function storedColorPixelDataToCanvasImageData(image, lut, canvasImageDataData)
    {
        var minPixelValue = image.minPixelValue;
        var canvasImageDataIndex = 0;
        var storedPixelDataIndex = 0;
        var numPixels = image.width * image.height * 4;
        var storedPixelData = image.getPixelData();
        var localLut = lut;
        var localCanvasImageDataData = canvasImageDataData;
        // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
        // We have a special code path for this case that improves performance.  Thanks to @jpambrun for this enhancement
        if(minPixelValue < 0){
            while(storedPixelDataIndex < numPixels) {
                localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // red
                localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // green
                localCanvasImageDataData[canvasImageDataIndex] = localLut[storedPixelData[storedPixelDataIndex] + (-minPixelValue)]; // blue
                storedPixelDataIndex+=2;
                canvasImageDataIndex+=2;
            }
        }else{
            while(storedPixelDataIndex < numPixels) {
                localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++]]; // red
                localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++]]; // green
                localCanvasImageDataData[canvasImageDataIndex] = localLut[storedPixelData[storedPixelDataIndex]]; // blue
                storedPixelDataIndex+=2;
                canvasImageDataIndex+=2;
            }
        }
    }

    // Module exports
    cornerstone.internal.storedColorPixelDataToCanvasImageData = storedColorPixelDataToCanvasImageData;
    cornerstone.storedColorPixelDataToCanvasImageData = storedColorPixelDataToCanvasImageData;

}(cornerstone));

/**
 * This module contains a function to convert stored pixel values to display pixel values using a LUT
 */
(function (cornerstone) {

    "use strict";

    /**
     * This function transforms stored pixel values into a canvas image data buffer
     * by using a LUT.  This is the most performance sensitive code in cornerstone and
     * we use a special trick to make this go as fast as possible.  Specifically we
     * use the alpha channel only to control the luminance rather than the red, green and
     * blue channels which makes it over 3x faster.  The canvasImageDataData buffer needs
     * to be previously filled with white pixels.
     *
     * NOTE: Attribution would be appreciated if you use this technique!
     *
     * @param pixelData the pixel data
     * @param lut the lut
     * @param canvasImageDataData a canvasImgageData.data buffer filled with white pixels
     */
    function storedPixelDataToCanvasImageData(image, lut, canvasImageDataData)
    {
        var pixelData = image.getPixelData();
        var minPixelValue = image.minPixelValue;
        var canvasImageDataIndex = 3;
        var storedPixelDataIndex = 0;
        var localNumPixels = pixelData.length;
        var localPixelData = pixelData;
        var localLut = lut;
        var localCanvasImageDataData = canvasImageDataData;
        // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
        // We have a special code path for this case that improves performance.  Thanks to @jpambrun for this enhancement
        if(minPixelValue < 0){
            while(storedPixelDataIndex < localNumPixels) {
                localCanvasImageDataData[canvasImageDataIndex] = localLut[localPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // alpha
                canvasImageDataIndex += 4;
            }
        }else{
            while(storedPixelDataIndex < localNumPixels) {
                localCanvasImageDataData[canvasImageDataIndex] = localLut[localPixelData[storedPixelDataIndex++]]; // alpha
                canvasImageDataIndex += 4;
            }
        }
    }

    // Module exports
    cornerstone.internal.storedPixelDataToCanvasImageData = storedPixelDataToCanvasImageData;
    cornerstone.storedPixelDataToCanvasImageData = storedPixelDataToCanvasImageData;

}(cornerstone));

// Last updated November 2011
// By Simon Sarris
// www.simonsarris.com
// sarris@acm.org
//
// Free to use and distribute at will
// So long as you are nice to people, etc

// Simple class for keeping track of the current transformation matrix

// For instance:
//    var t = new Transform();
//    t.rotate(5);
//    var m = t.m;
//    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

// Is equivalent to:
//    ctx.rotate(5);

// But now you can retrieve it :)

(function (cornerstone) {

    "use strict";


    // Remember that this does not account for any CSS transforms applied to the canvas
    function Transform() {
        this.reset();
    }

    Transform.prototype.reset = function() {
        this.m = [1,0,0,1,0,0];
    };

    Transform.prototype.clone = function() {
        var transform = new Transform();
        transform.m[0] = this.m[0];
        transform.m[1] = this.m[1];
        transform.m[2] = this.m[2];
        transform.m[3] = this.m[3];
        transform.m[4] = this.m[4];
        transform.m[5] = this.m[5];
        return transform;
    };


    Transform.prototype.multiply = function(matrix) {
        var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
        var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

        var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
        var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

        var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
        var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
        this.m[4] = dx;
        this.m[5] = dy;
    };

    Transform.prototype.invert = function() {
        var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
        var m0 = this.m[3] * d;
        var m1 = -this.m[1] * d;
        var m2 = -this.m[2] * d;
        var m3 = this.m[0] * d;
        var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
        var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
        this.m[0] = m0;
        this.m[1] = m1;
        this.m[2] = m2;
        this.m[3] = m3;
        this.m[4] = m4;
        this.m[5] = m5;
    };

    Transform.prototype.rotate = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var m11 = this.m[0] * c + this.m[2] * s;
        var m12 = this.m[1] * c + this.m[3] * s;
        var m21 = this.m[0] * -s + this.m[2] * c;
        var m22 = this.m[1] * -s + this.m[3] * c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
    };

    Transform.prototype.translate = function(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
    };

    Transform.prototype.scale = function(sx, sy) {
        this.m[0] *= sx;
        this.m[1] *= sx;
        this.m[2] *= sy;
        this.m[3] *= sy;
    };

    Transform.prototype.transformPoint = function(px, py) {
        var x = px;
        var y = py;
        px = x * this.m[0] + y * this.m[2] + this.m[4];
        py = x * this.m[1] + y * this.m[3] + this.m[5];
        return {x: px, y: py};
    };

    cornerstone.internal.Transform = Transform;
}(cornerstone));
/**
 * This module generates a VOI LUT
 */

(function (cornerstone) {

  "use strict";

  function generateLinearVOILUT(windowWidth, windowCenter) {
    return function(modalityLutValue) {
      return (((modalityLutValue - (windowCenter)) / (windowWidth) + 0.5) * 255.0);
    }
  }

  function generateNonLinearVOILUT(voiLUT) {
    var shift = voiLUT.numBitsPerEntry - 8;
    var minValue = voiLUT.lut[0] >> shift;
    var maxValue = voiLUT.lut[voiLUT.lut.length -1] >> shift;
    var maxValueMapped = voiLUT.firstValueMapped + voiLUT.lut.length - 1;
    return function(modalityLutValue) {
      if(modalityLutValue < voiLUT.firstValueMapped) {
        return minValue;
      }
      else if(modalityLutValue >= maxValueMapped)
      {
        return maxValue;
      }
      else
      {
        return voiLUT.lut[modalityLutValue - voiLUT.firstValueMapped] >> shift;
      }
    }
  }

  function getVOILUT(windowWidth, windowCenter, voiLUT) {
    if(voiLUT) {
      return generateNonLinearVOILUT(voiLUT);
    } else {
      return generateLinearVOILUT(windowWidth, windowCenter);
    }
  }

  // Module exports
  cornerstone.internal.getVOILUT = getVOILUT;
}(cornerstone));

/**
 * This module contains a function to make an image is invalid
 */
(function (cornerstone) {

    "use strict";

    /**
     * Sets the invalid flag on the enabled element and fire an event
     * @param element
     */
    function invalidate(element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        enabledElement.invalid = true;
        var eventData = {
            element: element
        };
        $(enabledElement.element).trigger("CornerstoneInvalidated", eventData);
    }

    // module exports
    cornerstone.invalidate = invalidate;
}(cornerstone));
/**
 * This module contains a function to immediately invalidate an image
 */
(function (cornerstone) {

    "use strict";

    /**
     * Forces the image to be updated/redrawn for the specified enabled element
     * @param element
     */
    function invalidateImageId(imageId) {

        var enabledElements = cornerstone.getEnabledElementsByImageId(imageId);
        enabledElements.forEach(function(enabledElement) {
            cornerstone.drawImage(enabledElement, true);
        });
    }

    // module exports
    cornerstone.invalidateImageId = invalidateImageId;
}(cornerstone));
/**
 * This module contains a helper function to covert page coordinates to pixel coordinates
 */
(function (cornerstone) {

    "use strict";

    /**
     * Converts a point in the page coordinate system to the pixel coordinate
     * system
     * @param element
     * @param pageX
     * @param pageY
     * @returns {{x: number, y: number}}
     */
    function pageToPixel(element, pageX, pageY) {
        var enabledElement = cornerstone.getEnabledElement(element);

        if(enabledElement.image === undefined) {
            throw "image has not been loaded yet";
        }

        var image = enabledElement.image;

        // convert the pageX and pageY to the canvas client coordinates
        var rect = element.getBoundingClientRect();
        var clientX = pageX - rect.left - window.pageXOffset;
        var clientY = pageY - rect.top - window.pageYOffset;

        var pt = {x: clientX, y: clientY};
        var transform = cornerstone.internal.getTransform(enabledElement);
        transform.invert();
        return transform.transformPoint(pt.x, pt.y);
    }

    // module/private exports
    cornerstone.pageToPixel = pageToPixel;

}(cornerstone));

(function (cornerstone) {

    "use strict";

    /**
     * Converts a point in the pixel coordinate system to the canvas coordinate system
     * system.  This can be used to render using canvas context without having the weird
     * side effects that come from scaling and non square pixels
     * @param element
     * @param pt
     * @returns {x: number, y: number}
     */
    function pixelToCanvas(element, pt) {
        var enabledElement = cornerstone.getEnabledElement(element);
        var transform = cornerstone.internal.getTransform(enabledElement);
        return transform.transformPoint(pt.x, pt.y);
    }

    // module/private exports
    cornerstone.pixelToCanvas = pixelToCanvas;

}(cornerstone));

/**
 * This module is responsible for drawing an image to an enabled elements canvas element
 */

(function (cornerstone) {

    "use strict";

    var colorRenderCanvas = document.createElement('canvas');
    var colorRenderCanvasContext;
    var colorRenderCanvasData;

    var lastRenderedImageId;
    var lastRenderedViewport = {};

    function initializeColorRenderCanvas(image)
    {
        // Resize the canvas
        colorRenderCanvas.width = image.width;
        colorRenderCanvas.height = image.height;

        // get the canvas data so we can write to it directly
        colorRenderCanvasContext = colorRenderCanvas.getContext('2d');
        colorRenderCanvasContext.fillStyle = 'white';
        colorRenderCanvasContext.fillRect(0,0, colorRenderCanvas.width, colorRenderCanvas.height);
        colorRenderCanvasData = colorRenderCanvasContext.getImageData(0,0,image.width, image.height);
    }


    function getLut(image, viewport)
    {
        // if we have a cached lut and it has the right values, return it immediately
        if(image.lut !== undefined &&
            image.lut.windowCenter === viewport.voi.windowCenter &&
            image.lut.windowWidth === viewport.voi.windowWidth &&
            image.lut.invert === viewport.invert) {
            return image.lut;
        }

        // lut is invalid or not present, regenerate it and cache it
        cornerstone.generateLut(image, viewport.voi.windowWidth, viewport.voi.windowCenter, viewport.invert);
        image.lut.windowWidth = viewport.voi.windowWidth;
        image.lut.windowCenter = viewport.voi.windowCenter;
        image.lut.invert = viewport.invert;
        return image.lut;
    }

    function doesImageNeedToBeRendered(enabledElement, image)
    {
        if(image.imageId !== lastRenderedImageId ||
            lastRenderedViewport.windowCenter !== enabledElement.viewport.voi.windowCenter ||
            lastRenderedViewport.windowWidth !== enabledElement.viewport.voi.windowWidth ||
            lastRenderedViewport.invert !== enabledElement.viewport.invert ||
            lastRenderedViewport.rotation !== enabledElement.viewport.rotation ||  
            lastRenderedViewport.hflip !== enabledElement.viewport.hflip ||
            lastRenderedViewport.vflip !== enabledElement.viewport.vflip
            )
        {
            return true;
        }

        return false;
    }

    function getRenderCanvas(enabledElement, image, invalidated)
    {

        // The ww/wc is identity and not inverted - get a canvas with the image rendered into it for
        // fast drawing
        if(enabledElement.viewport.voi.windowWidth === 255 &&
            enabledElement.viewport.voi.windowCenter === 128 &&
            enabledElement.viewport.invert === false &&
            image.getCanvas &&
            image.getCanvas()
        )
        {
            return image.getCanvas();
        }

        // apply the lut to the stored pixel data onto the render canvas
        if(doesImageNeedToBeRendered(enabledElement, image) === false && invalidated !== true) {
            return colorRenderCanvas;
        }

        // If our render canvas does not match the size of this image reset it
        // NOTE: This might be inefficient if we are updating multiple images of different
        // sizes frequently.
        if(colorRenderCanvas.width !== image.width || colorRenderCanvas.height != image.height) {
            initializeColorRenderCanvas(image);
        }

        // get the lut to use
        var colorLut = getLut(image, enabledElement.viewport);

        // the color image voi/invert has been modified - apply the lut to the underlying
        // pixel data and put it into the renderCanvas
        cornerstone.storedColorPixelDataToCanvasImageData(image, colorLut, colorRenderCanvasData.data);
        colorRenderCanvasContext.putImageData(colorRenderCanvasData, 0, 0);
        return colorRenderCanvas;
    }

    /**
     * API function to render a color image to an enabled element
     * @param enabledElement
     * @param invalidated - true if pixel data has been invaldiated and cached rendering should not be used
     */
    function renderColorImage(enabledElement, invalidated) {

        if(enabledElement === undefined) {
            throw "drawImage: enabledElement parameter must not be undefined";
        }
        var image = enabledElement.image;
        if(image === undefined) {
            throw "drawImage: image must be loaded before it can be drawn";
        }

        // get the canvas context and reset the transform
        var context = enabledElement.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        // clear the canvas
        context.fillStyle = 'black';
        context.fillRect(0,0, enabledElement.canvas.width, enabledElement.canvas.height);

        // turn off image smooth/interpolation if pixelReplication is set in the viewport
        if(enabledElement.viewport.pixelReplication === true) {
            context.imageSmoothingEnabled = false;
            context.mozImageSmoothingEnabled = false; // firefox doesn't support imageSmoothingEnabled yet
        }
        else {
            context.imageSmoothingEnabled = true;
            context.mozImageSmoothingEnabled = true;
        }

        // save the canvas context state and apply the viewport properties
        context.save();
        cornerstone.setToPixelCoordinateSystem(enabledElement, context);

        var renderCanvas;
        if (enabledElement.options && enabledElement.options.renderer &&
            enabledElement.options.renderer.toLowerCase() === 'webgl') {
            // If this enabled element has the option set for WebGL, we should
            // user it as our renderer.
            renderCanvas = cornerstone.webGL.renderer.render(enabledElement);
        } else {
            // If no options are set we will retrieve the renderCanvas through the
            // normal Canvas rendering path
            renderCanvas = getRenderCanvas(enabledElement, image, invalidated);
        }

        context.drawImage(renderCanvas, 0,0, image.width, image.height, 0, 0, image.width, image.height);

        context.restore();

        lastRenderedImageId = image.imageId;
        lastRenderedViewport.windowCenter = enabledElement.viewport.voi.windowCenter;
        lastRenderedViewport.windowWidth = enabledElement.viewport.voi.windowWidth;
        lastRenderedViewport.invert = enabledElement.viewport.invert;
        lastRenderedViewport.rotation = enabledElement.viewport.rotation;
        lastRenderedViewport.hflip = enabledElement.viewport.hflip;
        lastRenderedViewport.vflip = enabledElement.viewport.vflip;
    }

    // Module exports
    cornerstone.rendering.colorImage = renderColorImage;
    cornerstone.renderColorImage = renderColorImage;
}(cornerstone));

/**
 * This module is responsible for drawing a grayscale image
 */

(function (cornerstone) {

    "use strict";

    var grayscaleRenderCanvas = document.createElement('canvas');
    var grayscaleRenderCanvasContext;
    var grayscaleRenderCanvasData;

    var lastRenderedImageId;
    var lastRenderedViewport = {};

    function initializeGrayscaleRenderCanvas(image)
    {
        // Resize the canvas
        grayscaleRenderCanvas.width = image.width;
        grayscaleRenderCanvas.height = image.height;

        // NOTE - we need to fill the render canvas with white pixels since we control the luminance
        // using the alpha channel to improve rendering performance.
        grayscaleRenderCanvasContext = grayscaleRenderCanvas.getContext('2d');
        grayscaleRenderCanvasContext.fillStyle = 'white';
        grayscaleRenderCanvasContext.fillRect(0,0, grayscaleRenderCanvas.width, grayscaleRenderCanvas.height);
        grayscaleRenderCanvasData = grayscaleRenderCanvasContext.getImageData(0,0,image.width, image.height);
    }

    function lutMatches(a, b) {
      // if undefined, they are equal
      if(!a && !b) {
        return true;
      }
      // if one is undefined, not equal
      if(!a || !b) {
        return false;
      }
      // check the unique ids
      return (a.id !== b.id);
    }

    function getLut(image, viewport, invalidated)
    {
        // if we have a cached lut and it has the right values, return it immediately
        if(image.lut !== undefined &&
            image.lut.windowCenter === viewport.voi.windowCenter &&
            image.lut.windowWidth === viewport.voi.windowWidth &&
            lutMatches(image.lut.modalityLUT, viewport.modalityLUT) &&
            lutMatches(image.lut.voiLUT, viewport.voiLUT) &&
            image.lut.invert === viewport.invert &&
            invalidated !== true) {
            return image.lut;
        }

        // lut is invalid or not present, regenerate it and cache it
        cornerstone.generateLut(image, viewport.voi.windowWidth, viewport.voi.windowCenter, viewport.invert, viewport.modalityLUT, viewport.voiLUT);
        image.lut.windowWidth = viewport.voi.windowWidth;
        image.lut.windowCenter = viewport.voi.windowCenter;
        image.lut.invert = viewport.invert;
        image.lut.voiLUT = viewport.voiLUT;
        image.lut.modalityLUT = viewport.modalityLUT;
        return image.lut;
    }

    function doesImageNeedToBeRendered(enabledElement, image)
    {
        if(image.imageId !== lastRenderedImageId ||
            lastRenderedViewport.windowCenter !== enabledElement.viewport.voi.windowCenter ||
            lastRenderedViewport.windowWidth !== enabledElement.viewport.voi.windowWidth ||
            lastRenderedViewport.invert !== enabledElement.viewport.invert ||
            lastRenderedViewport.rotation !== enabledElement.viewport.rotation ||
            lastRenderedViewport.hflip !== enabledElement.viewport.hflip ||
            lastRenderedViewport.vflip !== enabledElement.viewport.vflip ||
            lastRenderedViewport.modalityLUT !== enabledElement.viewport.modalityLUT ||
            lastRenderedViewport.voiLUT !== enabledElement.viewport.voiLUT
            )
        {
            return true;
        }

        return false;
    }

    function getRenderCanvas(enabledElement, image, invalidated)
    {
        // apply the lut to the stored pixel data onto the render canvas

        if(doesImageNeedToBeRendered(enabledElement, image) === false && invalidated !== true) {
            return grayscaleRenderCanvas;
        }

        // If our render canvas does not match the size of this image reset it
        // NOTE: This might be inefficient if we are updating multiple images of different
        // sizes frequently.
        if(grayscaleRenderCanvas.width !== image.width || grayscaleRenderCanvas.height != image.height) {
            initializeGrayscaleRenderCanvas(image);
        }

        // get the lut to use
        var lut = getLut(image, enabledElement.viewport, invalidated);
        // gray scale image - apply the lut and put the resulting image onto the render canvas
        cornerstone.storedPixelDataToCanvasImageData(image, lut, grayscaleRenderCanvasData.data);
        grayscaleRenderCanvasContext.putImageData(grayscaleRenderCanvasData, 0, 0);
        return grayscaleRenderCanvas;
    }

    /**
     * API function to draw a grayscale image to a given enabledElement
     * @param enabledElement
     * @param invalidated - true if pixel data has been invaldiated and cached rendering should not be used
     */
    function renderGrayscaleImage(enabledElement, invalidated) {
        if (enabledElement === undefined) {
            throw "drawImage: enabledElement parameter must not be undefined";
        }

        var image = enabledElement.image;
        if (image === undefined) {
            throw "drawImage: image must be loaded before it can be drawn";
        }

        // get the canvas context and reset the transform
        var context = enabledElement.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        // clear the canvas
        context.fillStyle = 'black';
        context.fillRect(0,0, enabledElement.canvas.width, enabledElement.canvas.height);

        // turn off image smooth/interpolation if pixelReplication is set in the viewport
        if(enabledElement.viewport.pixelReplication === true) {
            context.imageSmoothingEnabled = false;
            context.mozImageSmoothingEnabled = false; // firefox doesn't support imageSmoothingEnabled yet
        }
        else {
            context.imageSmoothingEnabled = true;
            context.mozImageSmoothingEnabled = true;
        }

        // Save the canvas context state and apply the viewport properties
        cornerstone.setToPixelCoordinateSystem(enabledElement, context);

        var renderCanvas;
        if (enabledElement.options && enabledElement.options.renderer &&
            enabledElement.options.renderer.toLowerCase() === 'webgl') {
            // If this enabled element has the option set for WebGL, we should
            // user it as our renderer.
            renderCanvas = cornerstone.webGL.renderer.render(enabledElement);
        } else {
            // If no options are set we will retrieve the renderCanvas through the
            // normal Canvas rendering path
            renderCanvas = getRenderCanvas(enabledElement, image, invalidated);
        }

        // Draw the render canvas half the image size (because we set origin to the middle of the canvas above)
        context.drawImage(renderCanvas, 0,0, image.width, image.height, 0, 0, image.width, image.height);

        lastRenderedImageId = image.imageId;
        lastRenderedViewport.windowCenter = enabledElement.viewport.voi.windowCenter;
        lastRenderedViewport.windowWidth = enabledElement.viewport.voi.windowWidth;
        lastRenderedViewport.invert = enabledElement.viewport.invert;
        lastRenderedViewport.rotation = enabledElement.viewport.rotation;
        lastRenderedViewport.hflip = enabledElement.viewport.hflip;
        lastRenderedViewport.vflip = enabledElement.viewport.vflip;
        lastRenderedViewport.modalityLUT = enabledElement.viewport.modalityLUT;
        lastRenderedViewport.voiLUT = enabledElement.viewport.voiLUT;
    }

    // Module exports
    cornerstone.rendering.grayscaleImage = renderGrayscaleImage;
    cornerstone.renderGrayscaleImage = renderGrayscaleImage;

}(cornerstone));

/**
 * This module is responsible for drawing an image to an enabled elements canvas element
 */

(function (cornerstone) {

    "use strict";

    /**
     * API function to draw a standard web image (PNG, JPG) to an enabledImage
     *
     * @param enabledElement
     * @param invalidated - true if pixel data has been invaldiated and cached rendering should not be used
     */
    function renderWebImage(enabledElement, invalidated) {

        if(enabledElement === undefined) {
            throw "drawImage: enabledElement parameter must not be undefined";
        }
        var image = enabledElement.image;
        if(image === undefined) {
            throw "drawImage: image must be loaded before it can be drawn";
        }

        // get the canvas context and reset the transform
        var context = enabledElement.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        // clear the canvas
        context.fillStyle = 'black';
        context.fillRect(0,0, enabledElement.canvas.width, enabledElement.canvas.height);

        // turn off image smooth/interpolation if pixelReplication is set in the viewport
        if(enabledElement.viewport.pixelReplication === true) {
            context.imageSmoothingEnabled = false;
            context.mozImageSmoothingEnabled = false; // firefox doesn't support imageSmoothingEnabled yet
        }
        else {
            context.imageSmoothingEnabled = true;
            context.mozImageSmoothingEnabled = true;
        }

        // save the canvas context state and apply the viewport properties
        cornerstone.setToPixelCoordinateSystem(enabledElement, context);

        // if the viewport ww/wc and invert all match the initial state of the image, we can draw the image
        // directly.  If any of those are changed, we call renderColorImage() to apply the lut
        if(enabledElement.viewport.voi.windowWidth === enabledElement.image.windowWidth &&
            enabledElement.viewport.voi.windowCenter === enabledElement.image.windowCenter &&
            enabledElement.viewport.invert === false)
        {
            context.drawImage(image.getImage(), 0, 0, image.width, image.height, 0, 0, image.width, image.height);
        } else {
            cornerstone.renderColorImage(enabledElement, invalidated);
        }

    }

    // Module exports
    cornerstone.rendering.webImage = renderWebImage;
    cornerstone.renderWebImage = renderWebImage;

}(cornerstone));
/**
 */
(function (cornerstone) {

  "use strict";

  /**
   * Resets the viewport to the default settings
   *
   * @param element
   */
  function reset(element)
  {
    var enabledElement = cornerstone.getEnabledElement(element);
    var defaultViewport = cornerstone.internal.getDefaultViewport(enabledElement.canvas, enabledElement.image);
    enabledElement.viewport = defaultViewport;
    cornerstone.updateImage(element);
  }

  cornerstone.reset = reset;
}(cornerstone));

/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
(function (cornerstone) {

    "use strict";

    function setCanvasSize(element, canvas)
    {
        // the device pixel ratio is 1.0 for normal displays and > 1.0
        // for high DPI displays like Retina
        /*

        This functionality is disabled due to buggy behavior on systems with mixed DPI's.  If the canvas
        is created on a display with high DPI (e.g. 2.0) and then the browser window is dragged to
        a different display with a different DPI (e.g. 1.0), the canvas is not recreated so the pageToPixel
        produces incorrect results.  I couldn't find any way to determine when the DPI changed other than
        by polling which is not very clean.  If anyone has any ideas here, please let me know, but for now
        we will disable this functionality.  We may want
        to add a mechanism to optionally enable this functionality if we can determine it is safe to do
        so (e.g. iPad or iPhone or perhaps enumerate the displays on the system.  I am choosing
        to be cautious here since I would rather not have bug reports or safety issues related to this
        scenario.

        var devicePixelRatio = window.devicePixelRatio;
        if(devicePixelRatio === undefined) {
            devicePixelRatio = 1.0;
        }
        */

        canvas.width = element.clientWidth;
        canvas.height = element.clientHeight;
        canvas.style.width = element.clientWidth + "px";
        canvas.style.height = element.clientHeight + "px";
    }

    /**
     * resizes an enabled element and optionally fits the image to window
     * @param element
     * @param fitToWindow true to refit, false to leave viewport parameters as they are
     */
    function resize(element, fitToWindow) {

        var enabledElement = cornerstone.getEnabledElement(element);

        setCanvasSize(element, enabledElement.canvas);

        if(enabledElement.image === undefined ) {
            return;
        }

        if(fitToWindow === true) {
            cornerstone.fitToWindow(element);
        }
        else {
            cornerstone.updateImage(element);
        }
    }

    // module/private exports
    cornerstone.resize = resize;

}(cornerstone));
/**
 * This module contains a function that will set the canvas context to the pixel coordinates system
 * making it easy to draw geometry on the image
 */

(function (cornerstone) {

    "use strict";

    /**
     * Sets the canvas context transformation matrix to the pixel coordinate system.  This allows
     * geometry to be driven using the canvas context using coordinates in the pixel coordinate system
     * @param ee
     * @param context
     * @param scale optional scaler to apply
     */
    function setToPixelCoordinateSystem(enabledElement, context, scale)
    {
        if(enabledElement === undefined) {
            throw "setToPixelCoordinateSystem: parameter enabledElement must not be undefined";
        }
        if(context === undefined) {
            throw "setToPixelCoordinateSystem: parameter context must not be undefined";
        }

        var transform = cornerstone.internal.calculateTransform(enabledElement, scale);
        context.setTransform(transform.m[0],transform.m[1],transform.m[2],transform.m[3],transform.m[4],transform.m[5],transform.m[6]);
    }

    // Module exports
    cornerstone.setToPixelCoordinateSystem = setToPixelCoordinateSystem;
}(cornerstone));
/**
 * This module contains functions to deal with getting and setting the viewport for an enabled element
 */
(function (cornerstone) {

    "use strict";

    /**
     * Sets the viewport for an element and corrects invalid values
     *
     * @param element - DOM element of the enabled element
     * @param viewport - Object containing the viewport properties
     * @returns {*}
     */
    function setViewport(element, viewport) {

        var enabledElement = cornerstone.getEnabledElement(element);

        enabledElement.viewport.scale = viewport.scale;
        enabledElement.viewport.translation.x = viewport.translation.x;
        enabledElement.viewport.translation.y = viewport.translation.y;
        enabledElement.viewport.voi.windowWidth = viewport.voi.windowWidth;
        enabledElement.viewport.voi.windowCenter = viewport.voi.windowCenter;
        enabledElement.viewport.invert = viewport.invert;
        enabledElement.viewport.pixelReplication = viewport.pixelReplication;
        enabledElement.viewport.rotation = viewport.rotation;
        enabledElement.viewport.hflip = viewport.hflip;
        enabledElement.viewport.vflip = viewport.vflip;
        enabledElement.viewport.modalityLUT = viewport.modalityLUT;
        enabledElement.viewport.voiLUT = viewport.voiLUT;

        // prevent window width from being too small (note that values close to zero are valid and can occur with
        // PET images in particular)
        if(enabledElement.viewport.voi.windowWidth < 0.000001) {
            enabledElement.viewport.voi.windowWidth = 0.000001;
        }
        // prevent scale from getting too small
        if(enabledElement.viewport.scale < 0.0001) {
            enabledElement.viewport.scale = 0.25;
        }

        if(enabledElement.viewport.rotation===360 || enabledElement.viewport.rotation===-360) {
            enabledElement.viewport.rotation = 0;
        }

        // Force the image to be updated since the viewport has been modified
        cornerstone.updateImage(element);
    }


    // module/private exports
    cornerstone.setViewport = setViewport;

}(cornerstone));

/**
 * This module contains a function to immediately redraw an image
 */
(function (cornerstone) {

    "use strict";

    /**
     * Forces the image to be updated/redrawn for the specified enabled element
     * @param element
     */
    function updateImage(element, invalidated) {
        var enabledElement = cornerstone.getEnabledElement(element);

        if(enabledElement.image === undefined) {
            throw "updateImage: image has not been loaded yet";
        }

        cornerstone.drawImage(enabledElement, invalidated);
    }

    // module exports
    cornerstone.updateImage = updateImage;

}(cornerstone));
(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    /**
     * Creates and compiles a shader.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string} shaderSource The GLSL source code for the shader.
     * @param {number} shaderType The type of shader, VERTEX_SHADER or FRAGMENT_SHADER.
     *     
     * @return {!WebGLShader} The shader.
     */
    function compileShader(gl, shaderSource, shaderType) {
        
        // Create the shader object
        var shader = gl.createShader(shaderType);

        // Set the shader source code.
        gl.shaderSource(shader, shaderSource);

        // Compile the shader
        gl.compileShader(shader);

        // Check if it compiled
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success && !gl.isContextLost()) {
            // Something went wrong during compilation; get the error
            var infoLog = gl.getShaderInfoLog(shader);
            console.error("Could not compile shader:\n" + infoLog);
        }

        return shader;
    }

    /**
     * Creates a program from 2 shaders.
     *
     * @param {!WebGLRenderingContext) gl The WebGL context.
     * @param {!WebGLShader} vertexShader A vertex shader.
     * @param {!WebGLShader} fragmentShader A fragment shader.
     * @return {!WebGLProgram} A program.
     */
    function createProgram(gl, vertexShader, fragmentShader) {
        
        // create a program.
        var program = gl.createProgram();

        // attach the shaders.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // link the program.
        gl.linkProgram(program);

        // Check if it linked.
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success && !gl.isContextLost()) {
            // something went wrong with the link
            var infoLog = gl.getProgramInfoLog(program);
            console.error("WebGL program filed to link:\n" + infoLog);
        }

        return program;
    }

    /**
     * Creates a program from 2 shaders source (Strings)
     * @param  {!WebGLRenderingContext} gl              The WebGL context.
     * @param  {!WebGLShader} vertexShaderSrc   Vertex shader string
     * @param  {!WebGLShader} fragShaderSrc Fragment shader string
     * @return {!WebGLProgram}                 A program
     */
    function createProgramFromString(gl, vertexShaderSrc, fragShaderSrc) {
        var vertexShader = compileShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
        var fragShader = compileShader(gl, fragShaderSrc, gl.FRAGMENT_SHADER);
        return createProgram(gl, vertexShader, fragShader);
    }

    cornerstone.webGL.createProgramFromString = createProgramFromString;

}(cornerstone));

(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    var renderCanvas = document.createElement('canvas');
    var renderCanvasContext;
    var renderCanvasData;
    var gl;
    var programs;
    var shader;
    var texCoordBuffer, positionBuffer;
    cornerstone.webGL.isWebGLInitialized = false;

    function getRenderCanvas() {
        return renderCanvas;
    }

    function initShaders() {
        for (var id in cornerstone.webGL.shaders) {
            console.log("WEBGL: Loading shader", id);
            var shader = cornerstone.webGL.shaders[ id ];
            shader.attributes = {};
            shader.uniforms = {};
            shader.vert = cornerstone.webGL.vertexShader;

            shader.program = cornerstone.webGL.createProgramFromString(gl, shader.vert, shader.frag);

            shader.attributes.texCoordLocation = gl.getAttribLocation(shader.program, "a_texCoord");
            gl.enableVertexAttribArray(shader.attributes.texCoordLocation);
        
            shader.attributes.positionLocation = gl.getAttribLocation(shader.program, "a_position");
            gl.enableVertexAttribArray(shader.attributes.positionLocation);
        
            shader.uniforms.resolutionLocation = gl.getUniformLocation(shader.program, "u_resolution");
        }
    }

    function initRenderer() {
        if (cornerstone.webGL.isWebGLInitialized === true) {
            console.log("WEBGL Renderer already initialized");
            return;
        }

        if (initWebGL(renderCanvas)) {
            initBuffers();
            initShaders();
            console.log("WEBGL Renderer initialized!");
            cornerstone.webGL.isWebGLInitialized = true;
        }
    }

    function updateRectangle(gl, width, height) {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            width, height,
            0, height,
            width, 0,
            0, 0]), gl.STATIC_DRAW);
    }

    function handleLostContext(event) {
        event.preventDefault();
        console.warn('WebGL Context Lost!');
    }

    function handleRestoredContext(event) {
        event.preventDefault();
        cornerstone.webGL.isWebGLInitialized = false;
        cornerstone.webGL.textureCache.purgeCache();
        initRenderer();
        console.log('WebGL Context Restored.');
    }

    function initWebGL(canvas) {

        gl = null;
        try {
            // Try to grab the standard context. If it fails, fallback to experimental.
            var options = {
                preserveDrawingBuffer: true, // preserve buffer so we can copy to display canvas element
            };

            // ---------------- Testing purposes ------------- 
            if (cornerstone.webGL.debug === true && WebGLDebugUtils) {
                renderCanvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(renderCanvas);
            }
            // ---------------- Testing purposes -------------

            gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);

            // Set up event listeners for context lost / context restored
            canvas.removeEventListener("webglcontextlost", handleLostContext, false);
            canvas.addEventListener("webglcontextlost", handleLostContext, false);

            canvas.removeEventListener("webglcontextrestored", handleRestoredContext, false);
            canvas.addEventListener("webglcontextrestored", handleRestoredContext, false);

        } catch(error) {
            throw "Error creating WebGL context";
        }

        // If we don't have a GL context, give up now
        if (!gl) {
            console.error("Unable to initialize WebGL. Your browser may not support it.");
            gl = null;
        }
        return gl;
    }

    function getImageDataType(image) {
        if (image.color) {
            return 'rgb';
        }

        var datatype = 'int';
        if (image.minPixelValue >= 0) {
            datatype = 'u' + datatype;
        }

        if (image.maxPixelValue > 255) {
            datatype += '16';
        } else {
            datatype += '8';
        }
        return datatype;
    }

    function getShaderProgram(image) {

        var datatype = getImageDataType(image);
        // We need a mechanism for
        // choosing the shader based on the image datatype
        // console.log("Datatype: " + datatype);
        if (cornerstone.webGL.shaders.hasOwnProperty(datatype)) {
            return cornerstone.webGL.shaders[datatype];
        }

        var shader = cornerstone.webGL.shaders.rgb;
        return shader;
    }

    function getImageTexture( image ) {
        var imageTexture = cornerstone.webGL.textureCache.getImageTexture(image.imageId);
        if (!imageTexture) {
            //console.log("Generating texture for imageid: ", image.imageId);
            imageTexture = generateTexture(image);
            cornerstone.webGL.textureCache.putImageTexture(image, imageTexture);
        }
        return imageTexture.texture;

    }

    function generateTexture( image ) {
        var TEXTURE_FORMAT = {
            uint8: gl.LUMINANCE,
            int8: gl.LUMINANCE_ALPHA,
            uint16: gl.LUMINANCE_ALPHA,
            int16: gl.RGB,
            rgb: gl.RGB
        };

        var TEXTURE_BYTES = {
            int8: 1, // Luminance
            uint16: 2, // Luminance + Alpha
            int16: 3, // RGB
            rgb: 3 // RGB
        };

        var imageDataType = getImageDataType(image);
        var format = TEXTURE_FORMAT[imageDataType];

        // GL texture configuration
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        var imageData = cornerstone.webGL.dataUtilities[imageDataType].storedPixelDataToImageData(image, image.width, image.height);

        gl.texImage2D(gl.TEXTURE_2D, 0, format, image.width, image.height, 0, format, gl.UNSIGNED_BYTE, imageData);

        // Calculate the size in bytes of this image in memory
        var sizeInBytes = image.width * image.height * TEXTURE_BYTES[imageDataType];
        var imageTexture = {
            texture: texture,
            sizeInBytes: sizeInBytes
        };
        return imageTexture;

    }

    function initBuffers() {
        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            1, 1,
            0, 1,
            1, 0,
            0, 0
        ]), gl.STATIC_DRAW);
 
 
        texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
        ]), gl.STATIC_DRAW);
    }

    function renderQuad(shader, parameters, texture, width, height) {
        gl.clearColor(1.0,0.0,0.0,1.0);
        gl.viewport( 0, 0, width, height );
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(shader.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(shader.attributes.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(shader.attributes.positionLocation, 2, gl.FLOAT, false, 0, 0);

        for (var key in parameters) {
            var uniformLocation = gl.getUniformLocation(shader.program, key);
            if ( !uniformLocation ) {
                throw "Could not access location for uniform: " + key;
            }

            var uniform = parameters[key];

            var type = uniform.type;
            var value = uniform.value;

            if( type == "i" ) {
                gl.uniform1i( uniformLocation, value );
            } else if( type == "f" ) {
                gl.uniform1f( uniformLocation, value );
            } else if( type == "2f" ) {
                gl.uniform2f( uniformLocation, value[0], value[1] );
            }
        }

        updateRectangle(gl, width, height);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    }

    function render(enabledElement) {
        // Resize the canvas
        var image = enabledElement.image;
        renderCanvas.width = image.width;
        renderCanvas.height = image.height;

        var viewport = enabledElement.viewport;

        // Render the current image
        var shader = getShaderProgram(image);
        var texture = getImageTexture(image);
        var parameters = {
            "u_resolution": { type: "2f", value: [image.width, image.height] },
            "wc": { type: "f", value: viewport.voi.windowCenter },
            "ww": { type: "f", value: viewport.voi.windowWidth },
            "slope": { type: "f", value: image.slope },
            "intercept": { type: "f", value: image.intercept },
            //"minPixelValue": { type: "f", value: image.minPixelValue },
            "invert": { type: "i", value: viewport.invert ? 1 : 0 },
        };
        renderQuad(shader, parameters, texture, image.width, image.height );

        return renderCanvas;
    }

    function isWebGLAvailable() {
        // Adapted from
        // http://stackoverflow.com/questions/9899807/three-js-detect-webgl-support-and-fallback-to-regular-canvas
        
        var options = {
            failIfMajorPerformanceCaveat: true
        };

        try {
            var canvas = document.createElement("canvas");
            return !!
                window.WebGLRenderingContext &&
                (canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
        } catch(e) {
            return false;
        }
    }

    cornerstone.webGL.renderer = {
        render: render,
        initRenderer: initRenderer,
        getRenderCanvas: getRenderCanvas,
        isWebGLAvailable: isWebGLAvailable
    };

}(cornerstone));


(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    if (!cornerstone.webGL.shaders) {
        cornerstone.webGL.shaders = {};
    }

    if (!cornerstone.webGL.dataUtilities) {
        cornerstone.webGL.dataUtilities = {};
    }

    // Pack int16 into three uint8 channels (r, g, b)
    var shader = {};

    function storedPixelDataToImageData(image) {

        // Transfer image data to alpha and luminance channels of WebGL texture
        // Credit to @jpambrun and @fernandojsg

        // Pack int16 into three uint8 channels (r, g, b)
        var pixelData = image.getPixelData();
        var numberOfChannels = 3;
        var data = new Uint8Array(image.width * image.height * numberOfChannels);
        var offset = 0;

        for (var i = 0; i < pixelData.length; i++) {
            var val = Math.abs(pixelData[i]);
            data[offset++] = parseInt(val & 0xFF, 10);
            data[offset++] = parseInt(val >> 8, 10);
            data[offset++] = pixelData[i] < 0 ? 0: 1; // 0 For negative, 1 for positive
        }
        return data;
    }

    cornerstone.webGL.dataUtilities.int16 = {
        storedPixelDataToImageData: storedPixelDataToImageData
    };

    shader.frag = 'precision mediump float;' +
        'uniform sampler2D u_image;' +
        'uniform float ww;' +
        'uniform float wc;' +
        'uniform float slope;' +
        'uniform float intercept;' +
        'uniform int invert;' +
        'varying vec2 v_texCoord;' +
        
        'void main() {' +
            // Get texture
            'vec4 color = texture2D(u_image, v_texCoord);' +

            // Calculate luminance from packed texture
            'float intensity = color.r*256.0 + color.g*65536.0;'+

            'if (color.b == 0.0)' +
                'intensity = -intensity;' +

            // Rescale based on slope and window settings
            'intensity = intensity * slope + intercept;'+
            'float center0 = wc - 0.5;'+
            'float width0 = max(ww, 1.0);' +
            'intensity = (intensity - center0) / width0 + 0.5;'+

            // Clamp intensity
            'intensity = clamp(intensity, 0.0, 1.0);' +

            // RGBA output
            'gl_FragColor = vec4(intensity, intensity, intensity, 1.0);' +

            // Apply any inversion necessary
            'if (invert == 1)' +
                'gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;' +
        '}';

    cornerstone.webGL.shaders.int16 = shader;

}(cornerstone));
(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    if (!cornerstone.webGL.shaders) {
        cornerstone.webGL.shaders = {};
    }

    if (!cornerstone.webGL.dataUtilities) {
        cornerstone.webGL.dataUtilities = {};
    }

    var shader = {};

    function storedPixelDataToImageData(image) {
        // Transfer image data to alpha channel of WebGL texture
        // Store data in Uint8Array
        var pixelData = image.getPixelData();
        var numberOfChannels = 2;
        var data = new Uint8Array(image.width * image.height * numberOfChannels);
        var offset = 0;

        for (var i = 0; i < pixelData.length; i++) {
            data[offset++] = parseInt(pixelData[i], 10);
            data[offset++] = pixelData[i] < 0 ? 0: 1; // 0 For negative, 1 for positive
        }
        return data;
    }

    cornerstone.webGL.dataUtilities.int8 = {
        storedPixelDataToImageData: storedPixelDataToImageData
    };

    shader.frag = 'precision mediump float;' +
        'uniform sampler2D u_image;' +
        'uniform float ww;' +
        'uniform float wc;' +
        'uniform float slope;' +
        'uniform float intercept;' +
        'uniform float minPixelValue;' +
        'uniform int invert;' +
        'varying vec2 v_texCoord;' +
        
        'void main() {' +
            // Get texture
            'vec4 color = texture2D(u_image, v_texCoord);' +

            // Calculate luminance from packed texture
            'float intensity = color.r*256.;'+

            'if (color.a == 0.0)' +
                'intensity = -intensity;' +

            // Rescale based on slope and window settings
            'intensity = intensity * slope + intercept;'+
            'float center0 = wc - 0.5;'+
            'float width0 = max(ww, 1.0);' +
            'intensity = (intensity - center0) / width0 + 0.5;'+

            // Clamp intensity
            'intensity = clamp(intensity, 0.0, 1.0);' +

            // RGBA output
            'gl_FragColor = vec4(intensity, intensity, intensity, 1.0);' +

            // Apply any inversion necessary
            'if (invert == 1)' +
                'gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;' +
        '}';

    cornerstone.webGL.shaders.int8 = shader;


}(cornerstone));
(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    if (!cornerstone.webGL.shaders) {
        cornerstone.webGL.shaders = {};
    }

    if (!cornerstone.webGL.dataUtilities) {
        cornerstone.webGL.dataUtilities = {};
    }

    // Pack RGB images into a 3-channel RGB texture
    var shader = {};

    function storedPixelDataToImageData(image) {
        var minPixelValue = image.minPixelValue;
        var canvasImageDataIndex = 0;
        var storedPixelDataIndex = 0;
        // Only 3 channels, since we use WebGL's RGB texture format
        var numStoredPixels = image.width * image.height * 4;
        var numOutputPixels = image.width * image.height * 3;
        var storedPixelData = image.getPixelData();
        var data = new Uint8Array(numOutputPixels);

        // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
        // We have a special code path for this case that improves performance.  Thanks to @jpambrun for this enhancement
        if (minPixelValue < 0){
            while (storedPixelDataIndex < numStoredPixels) {
                data[canvasImageDataIndex++] = storedPixelData[storedPixelDataIndex++] + (-minPixelValue); // red
                data[canvasImageDataIndex++] = storedPixelData[storedPixelDataIndex++] + (-minPixelValue); // green
                data[canvasImageDataIndex++] = storedPixelData[storedPixelDataIndex++] + (-minPixelValue); // blue
                storedPixelDataIndex += 1; // The stored pixel data has 4 channels
            }
        } else {
            while (storedPixelDataIndex < numStoredPixels) {
                data[canvasImageDataIndex++] = storedPixelData[storedPixelDataIndex++]; // red
                data[canvasImageDataIndex++] = storedPixelData[storedPixelDataIndex++]; // green
                data[canvasImageDataIndex++] = storedPixelData[storedPixelDataIndex++]; // blue
                storedPixelDataIndex += 1; // The stored pixel data has 4 channels
            }
        }
        return data;
    }

    cornerstone.webGL.dataUtilities.rgb = {
        storedPixelDataToImageData: storedPixelDataToImageData
    };

    shader.frag = 'precision mediump float;' +
        'uniform sampler2D u_image;' +
        'uniform float ww;' +
        'uniform float wc;' +
        'uniform float slope;' +
        'uniform float intercept;' +
        'uniform float minPixelValue;' +
        'uniform int invert;' +
        'varying vec2 v_texCoord;' +

        'void main() {' +
            
            // Get texture
            'vec3 color = texture2D(u_image, v_texCoord).xyz;' +

            // Rescale based on slope and intercept 
            'color = color * 256.0 * slope + intercept;' +
            
            // Apply window settings
            'float center0 = wc - 0.5 - minPixelValue;'+
            'float width0 = ww - 1.0;'+
            'color = (color - center0) / width0 + 0.5;'+

            // RGBA output
            'gl_FragColor = vec4(color, 1);' +
            
            // Apply any inversion necessary
            'if (invert == 1)' +
                'gl_FragColor.rgb = 1. - gl_FragColor.rgb;' +
        '}';

    cornerstone.webGL.shaders.rgb = shader;

}(cornerstone));
(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    if (!cornerstone.webGL.shaders) {
        cornerstone.webGL.shaders = {};
    }

    if (!cornerstone.webGL.dataUtilities) {
        cornerstone.webGL.dataUtilities = {};
    }

    // For uint16 pack uint16 into two uint8 channels (r and a)
    var shader = {};

    function storedPixelDataToImageData(image) {

        // Transfer image data to alpha and luminance channels of WebGL texture
        // Credit to @jpambrun and @fernandojsg

        // Pack uint16 into two uint8 channels (r and a)
        var pixelData = image.getPixelData();
        var numberOfChannels = 2;
        var data = new Uint8Array(image.width * image.height * numberOfChannels);
        var offset = 0;

        for (var i = 0; i < pixelData.length; i++) {
            var val = pixelData[i];
            data[offset++] = parseInt(val & 0xFF, 10);
            data[offset++] = parseInt(val >> 8, 10);
        }
        return data;
    }

    cornerstone.webGL.dataUtilities.uint16 = {
        storedPixelDataToImageData: storedPixelDataToImageData
    };

    shader.frag = 'precision mediump float;' +
        'uniform sampler2D u_image;' +
        'uniform float ww;' +
        'uniform float wc;' +
        'uniform float slope;' +
        'uniform float intercept;' +
        'uniform int invert;' +
        'varying vec2 v_texCoord;' +
        
        'void main() {' +
            // Get texture
            'vec4 color = texture2D(u_image, v_texCoord);' +

            // Calculate luminance from packed texture
            'float intensity = color.r*256.0 + color.a*65536.0;'+

            // Rescale based on slope and window settings
            'intensity = intensity * slope + intercept;'+
            'float center0 = wc - 0.5;'+
            'float width0 = ww - 1.0;'+
            'intensity = (intensity - center0) / width0 + 0.5;'+

            // Clamp intensity
            'intensity = clamp(intensity, 0.0, 1.0);' +

            // RGBA output
            'gl_FragColor = vec4(intensity, intensity, intensity, 1.0);' +

            // Apply any inversion necessary
            'if (invert == 1)' +
                'gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;' +
        '}';

    cornerstone.webGL.shaders.uint16 = shader;

}(cornerstone));
(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    if (!cornerstone.webGL.shaders) {
        cornerstone.webGL.shaders = {};
    }

    if (!cornerstone.webGL.dataUtilities) {
        cornerstone.webGL.dataUtilities = {};
    }

    var shader = {};

    function storedPixelDataToImageData(image) {
        // Transfer image data to alpha channel of WebGL texture
        // Store data in Uuint8Array
        var pixelData = image.getPixelData();
        var data = new Uint8Array(pixelData.length);
        for (var i = 0; i < pixelData.length; i++) {
            data[i] = parseInt(pixelData[i], 10);
        }
        return data;
    }

    cornerstone.webGL.dataUtilities.uint8 = {
        storedPixelDataToImageData: storedPixelDataToImageData
    };

    shader.frag = 'precision mediump float;' +
        'uniform sampler2D u_image;' +
        'uniform float ww;' +
        'uniform float wc;' +
        'uniform float slope;' +
        'uniform float intercept;' +
        //'uniform float minPixelValue;' +
        'uniform int invert;' +
        'varying vec2 v_texCoord;' +
        
        'void main() {' +
            // Get texture
            'vec4 color = texture2D(u_image, v_texCoord);' +

            // Calculate luminance from packed texture
            'float intensity = color.r*256.0;'+

            // Rescale based on slope and window settings
            'intensity = intensity * slope + intercept;'+
            'float center0 = wc - 0.5;'+
            'float width0 = max(ww, 1.0);' +
            'intensity = (intensity - center0) / width0 + 0.5;'+

            // Clamp intensity
            'intensity = clamp(intensity, 0.0, 1.0);' +

            // RGBA output
            'gl_FragColor = vec4(intensity, intensity, intensity, 1.0);' +

            // Apply any inversion necessary
            'if (invert == 1)' +
                'gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;' +
        '}';

    cornerstone.webGL.shaders.uint8 = shader;


}(cornerstone));
/**
 * This module deals with caching image textures in VRAM for WebGL
 */

(function (cornerstone) {

    "use strict";

    var imageCache = {};

    var cachedImages = [];

    var maximumSizeInBytes = 1024 * 1024 * 256; // 256 MB
    var cacheSizeInBytes = 0;

    function setMaximumSizeBytes(numBytes) {
        if (numBytes === undefined) {
            throw "setMaximumSizeBytes: parameter numBytes must not be undefined";
        }
        if (numBytes.toFixed === undefined) {
            throw "setMaximumSizeBytes: parameter numBytes must be a number";
        }

        maximumSizeInBytes = numBytes;
        purgeCacheIfNecessary();
    }

    function purgeCacheIfNecessary() {
        // if max cache size has not been exceeded, do nothing
        if (cacheSizeInBytes <= maximumSizeInBytes) {
            return;
        }

        // cache size has been exceeded, create list of images sorted by timeStamp
        // so we can purge the least recently used image
        function compare(a,b) {
            if (a.timeStamp > b.timeStamp) {
                return -1;
            }
            if (a.timeStamp < b.timeStamp) {
                return 1;
            }
            return 0;
        }
        cachedImages.sort(compare);

        // remove images as necessary
        while(cacheSizeInBytes > maximumSizeInBytes) {
            var lastCachedImage = cachedImages[cachedImages.length - 1];
            cacheSizeInBytes -= lastCachedImage.sizeInBytes;
            delete imageCache[lastCachedImage.imageId];
            cachedImages.pop();
            $(cornerstone).trigger('CornerstoneWebGLTextureRemoved', {imageId: lastCachedImage.imageId});
        }

        var cacheInfo = cornerstone.imageCache.getCacheInfo();
        console.log('CornerstoneWebGLTextureCacheFull');
        $(cornerstone).trigger('CornerstoneWebGLTextureCacheFull', cacheInfo);
    }

    function putImageTexture(image, imageTexture) {
        var imageId = image.imageId;
        if (image === undefined) {
            throw "putImageTexture: image must not be undefined";
        }

        if (imageId === undefined) {
            throw "putImageTexture: imageId must not be undefined";
        }

        if (imageTexture === undefined) {
            throw "putImageTexture: imageTexture must not be undefined";
        }

        if (imageCache.hasOwnProperty(imageId) === true) {
            throw "putImageTexture: imageId already in cache";
        }

        var cachedImage = {
            imageId : imageId,
            imageTexture : imageTexture,
            timeStamp : new Date(),
            sizeInBytes: imageTexture.sizeInBytes
        };

        imageCache[imageId] = cachedImage;
        cachedImages.push(cachedImage);

        if (imageTexture.sizeInBytes === undefined) {
            throw "putImageTexture: imageTexture does not have sizeInBytes property or";
        }
        if (imageTexture.sizeInBytes.toFixed === undefined) {
            throw "putImageTexture: imageTexture.sizeInBytes is not a number";
        }
        cacheSizeInBytes += cachedImage.sizeInBytes;
        purgeCacheIfNecessary();
    }

    function getImageTexture(imageId) {
        if (imageId === undefined) {
            throw "getImageTexture: imageId must not be undefined";
        }
        var cachedImage = imageCache[imageId];
        if (cachedImage === undefined) {
            return undefined;
        }

        // bump time stamp for cached image
        cachedImage.timeStamp = new Date();
        return cachedImage.imageTexture;
    }

    function removeImageTexture(imageId) {
        if (imageId === undefined) {
            throw "removeImageTexture: imageId must not be undefined";
        }
        var cachedImage = imageCache[imageId];
        if (cachedImage === undefined) {
            throw "removeImageTexture: imageId must not be undefined";
        }
        cachedImages.splice( cachedImages.indexOf(cachedImage), 1);
        cacheSizeInBytes -= cachedImage.sizeInBytes;
        delete imageCache[imageId];

        return cachedImage.imageTexture;
    }

    function getCacheInfo() {
        return {
            maximumSizeInBytes : maximumSizeInBytes,
            cacheSizeInBytes : cacheSizeInBytes,
            numberOfImagesCached: cachedImages.length
        };
    }

    function purgeCache() {
        while (cachedImages.length > 0) {
            var removedCachedImage = cachedImages.pop();
            delete imageCache[removedCachedImage.imageId];
        }
        cacheSizeInBytes = 0;
    }

    // module exports
    cornerstone.webGL.textureCache = {
        putImageTexture : putImageTexture,
        getImageTexture: getImageTexture,
        removeImageTexture: removeImageTexture,
        setMaximumSizeBytes: setMaximumSizeBytes,
        getCacheInfo : getCacheInfo,
        purgeCache: purgeCache,
        cachedImages: cachedImages
    };

}(cornerstone));

(function (cornerstone) {

    "use strict";

    if (!cornerstone.webGL) {
        cornerstone.webGL = {};
    }

    cornerstone.webGL.vertexShader = 'attribute vec2 a_position;' +
        'attribute vec2 a_texCoord;' +
        'uniform vec2 u_resolution;' +
        'varying vec2 v_texCoord;' +
        'void main() {' +
            'vec2 zeroToOne = a_position / u_resolution;' +
            'vec2 zeroToTwo = zeroToOne * 2.0;' +
            'vec2 clipSpace = zeroToTwo - 1.0;' +
            'gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);' +
            'v_texCoord = a_texCoord;' +
        '}';

}(cornerstone));