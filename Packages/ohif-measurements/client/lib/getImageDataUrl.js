import { OHIF } from 'meteor/ohif:core';
import { $ } from 'meteor/jquery';
import { cornerstone, cornerstoneMath, cornerstoneTools } from 'meteor/ohif:cornerstone';

OHIF.measurements.getImageDataUrl = ({
    imageType='image/jpeg',
    quality=1,
    width=512,
    height=512,
    cacheImage=true,
    imagePath,
    measurement,
    alwaysVisibleText=true,
    viewport
}) => {
    imagePath = imagePath || measurement.imagePath;
    const imageId = OHIF.viewerbase.getImageIdForImagePath(imagePath);

    // Create a deep copy of the measurement to prevent changing its original properties
    if (measurement) {
        measurement = $.extend(true, {}, measurement);
    }

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
                Object.keys(measurement.handles).forEach(handleKey => {
                    const handle = Object.assign({}, state.handles[handleKey]);
                    handle.selected = false;
                    handle.active = false;
                    handle.moving = false;
                    state.handles[handleKey] = handle;
                });

                cornerstoneTools.addToolState(element, measurement.toolType, state);
                cornerstoneTools[measurement.toolType].enable(element);
            }

            // Set the viewport voi if present
            if (viewport && viewport.voi) {
                const csViewport = cornerstone.getViewport(element);
                Object.assign(csViewport, { voi: viewport.voi });
                cornerstone.setViewport(element, csViewport);
            }

            // Resolve the current promise giving the dataUrl as parameter
            const renderedCallback = () => {
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
            };

            // Wait for image rendering to get its data URL
            $(element).one('cornerstoneimagerendered', () => {
                if (measurement && alwaysVisibleText) {
                    rearrangeTextBox(image, measurement, element).then(() => renderedCallback());
                } else {
                    renderedCallback();
                }
            });
        });
    });
};

const getPoint = (x, y) => {
    return {
        x,
        y
    };
};

const lineRectangleIntersection = (line, rect) => {
    let intersection;

    Object.keys(rect).forEach(side => {
        if (intersection) return;
        const rectSegment = rect[side];
        intersection = cornerstoneMath.lineSegment.intersectLine(line, rectSegment);
    });

    return intersection;
};

const rearrangeTextBox = (image, measurement, element) => new Promise((resolve, reject) => {
    const handles = measurement && measurement.handles;
    if (!handles) return resolve();
    const { textBox, start, end } = handles;
    if (!textBox || !textBox.boundingBox || !start || !end) return resolve();

    // Build the dashed line segment
    let dashedLine = new cornerstoneMath.Line3();
    const maxX = Math.max(start.x, end.x);
    const minX = Math.min(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    const minY = Math.min(start.y, end.y);
    dashedLine.start = getPoint(minX + ((maxX - minX) / 2), minY + ((maxY - minY) / 2));
    dashedLine.end = getPoint(textBox.x, textBox.y);

    // Build the bounding rectangle
    const x0 = (textBox.boundingBox.width / 2);
    const x1 = image.width - x0;
    const y0 = (textBox.boundingBox.height / 2);
    const y1 = image.height - y0;
    const topLeft = getPoint(x0, y0);
    const topRight = getPoint(x1, y0);
    const bottomLeft = getPoint(x0, y1);
    const bottomRight = getPoint(x1, y1);
    const boundingRect = {
        top: new cornerstoneMath.Line3(topLeft, topRight),
        left: new cornerstoneMath.Line3(topLeft, bottomLeft),
        right: new cornerstoneMath.Line3(topRight, bottomRight),
        bottom: new cornerstoneMath.Line3(bottomLeft, bottomRight)
    };

    // Check if the measurement center is outside the bounding rectangle
    const imageCenter = getPoint(image.width / 2, image.height / 2);
    const imageCenterToMeasurement = new cornerstoneMath.Line3();
    imageCenterToMeasurement.start = imageCenter;
    imageCenterToMeasurement.end = dashedLine.start;
    if (lineRectangleIntersection(imageCenterToMeasurement, boundingRect)) {
        dashedLine = new cornerstoneMath.Line3(imageCenter, dashedLine.end);
    }

    // Check if the text box is outside the image area
    const intersection = lineRectangleIntersection(dashedLine, boundingRect);
    if (intersection) {
        textBox.boundingBox.left = intersection.x - x0;
        textBox.boundingBox.top = intersection.y - y0;
        Object.assign(textBox, intersection);
        cornerstone.updateImage(element);
        $(element).one('cornerstoneimagerendered', () => resolve());
    } else {
        resolve();
    }
});

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
    cornerstone.enable(element, { renderer: OHIF.cornerstone.renderer });

    const enabledElement = cornerstone.getEnabledElement(element);
    enabledElement.toolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();

    return enabledElement;
};

const destroyEnabledElement = enabledElement => {
    cornerstone.disable(enabledElement.element);
    $(enabledElement.element).remove();
};
