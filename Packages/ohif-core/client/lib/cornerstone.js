import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

OHIF.cornerstone = {};

OHIF.cornerstone.pixelToPage = (element, position) => {
    const enabledElement = cornerstone.getEnabledElement(element);
    const result = {
        x: 0,
        y: 0
    };

    // Stop here if the cornerstone element is not enabled or position is not an object
    if (!enabledElement || typeof position !== 'object') {
        return result;
    }

    const canvas = enabledElement.canvas;

    const canvasOffset = $(canvas).offset();
    result.x += canvasOffset.left;
    result.y += canvasOffset.top;

    const canvasPosition = cornerstone.pixelToCanvas(element, position);
    result.x += canvasPosition.x;
    result.y += canvasPosition.y;

    return result;
};

OHIF.cornerstone.repositionTextBoxWhileDragging = (eventData, measurementData) => {
    const element = eventData.element;
    const enabledElement = cornerstone.getEnabledElement(element);
    const $element = $(element);
    const image = enabledElement.image;

    const getAvailableBlankAreas = (enabledElement, labelWidth, labelHeight) => {
        const { element, canvas, image } = enabledElement;

        const topLeft = cornerstone.pixelToCanvas(element, {
            x: 0,
            y: 0
        });

        const bottomRight = cornerstone.pixelToCanvas(element, {
            x: image.width,
            y: image.height
        });

        const $canvas = $(canvas);
        const canvasWidth = $canvas.outerWidth();
        const canvasHeight = $canvas.outerHeight();

        const result = {};
        result['x-1'] = topLeft.x > labelWidth;
        result['y-1'] = topLeft.y > labelHeight;
        result.x1 = canvasWidth - bottomRight.x > labelWidth;
        result.y1 = canvasHeight - bottomRight.y > labelHeight;

        return result;
    };

    const getRenderingInformation = (limits, tool) => {
        const mid = {};
        mid.x = limits.width / 2;
        mid.y = limits.height / 2;

        const directions = {};
        directions.x = tool.x < mid.x ? -1 : 1;
        directions.y = tool.y < mid.y ? -1 : 1;

        const diffX = directions.x < 0 ? tool.x : limits.width - tool.x;
        const diffY = directions.y < 0 ? tool.y : limits.height - tool.y;
        const cornerAxis = diffY < diffX ? 'y' : 'x';

        return {
            directions,
            cornerAxis
        };
    };

    const calculateAxisCenter = (axis, start, end) => {
        const a = start[axis];
        const b = end[axis];
        const lowest = Math.min(a, b);
        const highest = Math.max(a, b);
        return lowest + ((highest - lowest) / 2);
    };

    const getTextBoxSizeInPixels = (element, bounds) => {
        const topLeft = cornerstone.pageToPixel(element, 0, 0);
        const bottomRight = cornerstone.pageToPixel(element, bounds.x, bounds.y);
        return {
            x: bottomRight.x - topLeft.x,
            y: bottomRight.y - topLeft.y
        };
    };

    const modifiedCallback = () => {
        const handles = measurementData.handles;
        const textBox = handles.textBox;

        const bounds = {};
        bounds.x = textBox.boundingBox.width;
        bounds.y = textBox.boundingBox.height;

        const getHandlePosition = key => _.pick(handles[key], ['x', 'y']);
        const start = getHandlePosition('start');
        const end = getHandlePosition('end');

        const tool = {};
        tool.x = calculateAxisCenter('x', start, end);
        tool.y = calculateAxisCenter('y', start, end);

        let limits = _.pick(image, ['width', 'height']);
        let { directions, cornerAxis } = getRenderingInformation(limits, tool);

        const availableAreas = getAvailableBlankAreas(enabledElement, bounds.x, bounds.y);
        const tempDirections = _.clone(directions);
        let tempCornerAxis = cornerAxis;
        let foundPlace = false;
        let current = 0;
        while (current < 4) {
            if (availableAreas[tempCornerAxis + tempDirections[tempCornerAxis]]) {
                foundPlace = true;
                break;
            }

            // Invert the direction for the next iteration
            tempDirections[tempCornerAxis] *= -1;

            // Invert the tempCornerAxis
            tempCornerAxis = tempCornerAxis === 'x' ? 'y' : 'x';

            current++;
        }

        let cornerAxisPosition;
        if (foundPlace) {
            _.extend(directions, tempDirections);
            cornerAxis = tempCornerAxis;
            const sizeProperty = cornerAxis === 'x' ? 'width' : 'height';
            cornerAxisPosition = directions[cornerAxis] < 0 ? 0 : limits[sizeProperty];
        } else {
            const $canvas = $(enabledElement.canvas);
            limits.width = $canvas.outerWidth();
            limits.height = $canvas.outerHeight();

            const toolPositionOnCanvas = cornerstone.pixelToCanvas(element, tool);
            const renderingInformation = getRenderingInformation(limits, toolPositionOnCanvas);
            directions = renderingInformation.directions;
            cornerAxis = renderingInformation.cornerAxis;

            const offset = $canvas.offset();
            const position = {
                x: directions.x < 0 ? offset.left : offset.left + $canvas.outerWidth(),
                y: directions.y < 0 ? offset.top : offset.top + $canvas.outerHeight()
            };

            const pixelPosition = cornerstone.pageToPixel(element, position.x, position.y);
            cornerAxisPosition = pixelPosition[cornerAxis];
        }

        const toolAxis = cornerAxis === 'x' ? 'y' : 'x';
        const boxSize = getTextBoxSizeInPixels(element, bounds);

        textBox[cornerAxis] = cornerAxisPosition;
        textBox[toolAxis] = tool[toolAxis] - (boxSize[toolAxis] / 2);

        // Adjust the text box position reducing its size from the corner axis
        const isDirectionPositive = directions[cornerAxis] > 0;
        if ((foundPlace && !isDirectionPositive) || (!foundPlace && isDirectionPositive)) {
            textBox[cornerAxis] -= boxSize[cornerAxis];
        }
    };

    const mouseUpCallback = () => {
        $element.off('CornerstoneToolsMeasurementModified', modifiedCallback);
    };

    $element.one('CornerstoneToolsMouseDrag', () => {
        $element.on('CornerstoneToolsMeasurementModified', modifiedCallback);
    });

    // Using mouseup because sometimes the CornerstoneToolsMouseUp event is not triggered
    $element.one('mouseup', mouseUpCallback);
};
