import { OHIF } from 'meteor/ohif:core';
import { $ } from 'meteor/jquery';

OHIF.measurements.getImageDataUrl = ({
    imageType='image/jpeg',
    quality=1,
    width=512,
    height=512,
    cacheImage=true,
    imageId,
    measurement
}) => {
    imageId = imageId || measurement.imageId;

    return new Promise((resolve, reject) => {
        const loadMethod = cacheImage ? 'loadAndCacheImage' : 'loadImage';
        cornerstone[loadMethod](imageId).then(image => {
            // Create a cornerstone enabled element to handle the image
            const enabledElement = createEnabledElement(width, height);
            const element = enabledElement.element;

            // Display the image on cornerstone's canvas
            cornerstone.displayImage(element, image);

            // Add the measurement state and enable the tool if a measurement was given
            if (measurement) {
                const state = Object.assign({}, measurement, { active: true });
                cornerstoneTools.addToolState(element, measurement.toolType, state);
                cornerstoneTools[measurement.toolType].enable(element);
            }

            // Wait for image rendering to get its data URL
            $(element).one('CornerstoneImageRendered', () => {
                const dataUrl = enabledElement.canvas.toDataURL(imageType, quality);

                // Disable the tool and clear the measurement state if a measurement was given
                if (measurement) {
                    cornerstoneTools[measurement.toolType].disable(element);
                    cornerstoneTools.clearToolState(element, measurement.toolType);
                }

                // Destroy the cornerstone enabled element, removing it from the DOM
                destroyEnabledElement(enabledElement);

                // Resolve the promise with the image's data URL
                resolve(dataUrl);
            });
        });
    });
};

const createEnabledElement = (width, height) => {
    const $element = $('<div></div>').css({
        height,
        left: 0,
        position: 'fixed',
        top: 0,
        visibility: 'hidden',
        width,
        'z-index': -1
    });

    const element = $element[0];
    $element.appendTo(document.body);
    cornerstone.enable(element, { renderer: 'webgl' });

    const enabledElement = cornerstone.getEnabledElement(element);
    enabledElement.toolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();

    return enabledElement;
};

const destroyEnabledElement = enabledElement => {
    cornerstone.disable(enabledElement.element);
    $(enabledElement.element).remove();
};
