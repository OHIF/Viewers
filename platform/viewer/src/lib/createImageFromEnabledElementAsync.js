/** @module createImageFromEnabledElementAsync */
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

/**
 * This callback receives the enabledElement's rendered image data as a blob
 * @callback createImageFromEnabledElementAsync~blobCallback
 * @param {blob} imageBlob
 */

/**
 * Returns a base64 representation of an enabled element in the image's
 * original resolution, and appropriately sized text and annotations.
 *
 * @exports @public @async @function
 * @param {HTMLElement} enabledElement - The target enabledElement to use when generating an image
 * @param {createImageFromEnabledElementAsync~blobCallback} [blobCallback] - A callback fn that receives the result imgBlob
 * @example
 * // returns base64 string of image
 * const base64Img = await createImageFromEnabledElementAsync(enabledElement)
 * @example
 * // returns undefined, but pass image blob to blobCallback
 * await createImageFromEnabledElementAsync(enabledElement, (blob) => {
 *   const url = URL.createObjectURL(blob);
 *   console.log(url);
 *   URL.revokeObjectURL(url);
 * })
 * @returns {(string|undefined)} base64 string representation of image, or fires blobCallback if provided.
 */
export default async function(enabledElement, blobCallback) {
  const canvas = enabledElement.querySelector('canvas');
  const image = cornerstone.getImage(enabledElement);

  // What we're toggleing
  const toolStyles = getToolStyles();
  const viewport = cornerstone.getViewport(enabledElement);
  const canvasDimensions = getCanvasDimensions(canvas);

  // Some help from our friends
  const flipWidthAndHeight =
    Math.abs(viewport.rotation) === 90 || Math.abs(viewport.rotation === 270);
  const annotationScaleFactor = Math.max(
    Math.max(image.height, image.width) / 1000,
    1.25
  );
  const tempViewport = Object.assign(
    {},
    cornerstone.getViewport(enabledElement),
    { scale: 1, translation: { x: 0, y: 0 } }
  );

  try {
    // Set enabled element, canvas, and viewport to best values for image capture
    setToolStyles({
      width: annotationScaleFactor,
      activeWidth: annotationScaleFactor,
      font: `${15 * annotationScaleFactor}px Arial`,
      fontSize: 15 * annotationScaleFactor,
      backgroundColor: 'rgba(15,10,25,0.6)',
    });

    setCanvasDimensions(canvas, {
      widthAttribute: flipWidthAndHeight ? image.height : image.width,
      heightAttribute: flipWidthAndHeight ? image.width : image.height,
    });
    cornerstone.reset(enabledElement);
    cornerstone.setViewport(enabledElement, tempViewport);

    return await new Promise(resolve => {
      // Handle the image rendered event by capturing and returning the
      // new renderings base64 encoded representation
      const onImageRendered = () => {
        enabledElement.removeEventListener(
          'cornerstoneimagerendered',
          onImageRendered
        );

        if (blobCallback) {
          canvas.toBlob(blobCallback);
          resolve()
        }
        const imgBase64 = canvas.toDataURL();
        resolve(imgBase64)
      };

      // Begin listening for next image rendered event
      enabledElement.addEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        onImageRendered
      );

      // Trigger image rendered event
      cornerstone.updateImage(enabledElement, true);
    })
  } finally {
    // Restore enabled element, canvas, and viewport to original values
    setToolStyles(toolStyles);
    setCanvasDimensions(canvas, canvasDimensions);
    cornerstone.reset(enabledElement);
    cornerstone.setViewport(enabledElement, viewport);
    cornerstone.updateImage(enabledElement, true);
  }
}

/**
 *
 *
 * @returns
 */
function getToolStyles() {
  return {
    width: cornerstoneTools.toolStyle.getToolWidth(),
    activeWidth: cornerstoneTools.toolStyle.getActiveWidth(),
    font: cornerstoneTools.textStyle.getFont(),
    fontSize: cornerstoneTools.textStyle.getFontSize(),
    backgroundColor: cornerstoneTools.textStyle.getBackgroundColor(),
  }
}

/**
 *
 *
 * @param {Number} newStyles.width
 * @param {Number} newStyles.activeWidth
 * @param {String} newStyles.font
 * @param {Number} newStyles.fontSize
 * @param {String} newStyles.backgroundColor
 */
function setToolStyles(newStyles) {
  const currentStyles = getToolStyles();
  const { width, activeWidth, font, fontSize, backgroundColor } = Object.assign(
    {},
    currentStyles,
    newStyles
  );

  cornerstoneTools.toolStyle.setToolWidth(width);
  cornerstoneTools.toolStyle.setActiveWidth(activeWidth);
  cornerstoneTools.textStyle.setFont(font);
  cornerstoneTools.textStyle.setFontSize(fontSize);
  cornerstoneTools.textStyle.setBackgroundColor(backgroundColor);
}

/**
 *
 *
 * @param {HTMLElement} domCanvas - The child canvas HTML Element of the "Enabled" element
 * @returns
 */
function getCanvasDimensions(domCanvas) {
  return {
    widthAttribute: domCanvas.getAttribute('width'),
    heightAttribute: domCanvas.getAttribute('height'),
    widthStyle: domCanvas.style.width,
    heightStyle: domCanvas.style.height,
    position: domCanvas.style.position,
  }
}

/**
 *
 *
 * @param {HTMLElement} canvas
 * @param {*} { position, widthAttribute, heightAttribute, width = 'auto', height = 'auto' }
 */
function setCanvasDimensions(
  canvas,
  {
    widthAttribute,
    heightAttribute,
    position = 'absolute',
    width = 'auto',
    height = 'auto',
  }
) {
  canvas.style.position = position;
  canvas.style.width = width;
  canvas.style.height = height;
  canvas.setAttribute('width', widthAttribute);
  canvas.setAttribute('height', heightAttribute);
}