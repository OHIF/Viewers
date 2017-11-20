import { OHIF } from 'meteor/ohif:core';

// Allow attaching to jQuery selectors
$.fn.draggable = function(options) {
    makeDraggable(this, options);
    return this;
};

/**
 * This function makes an element movable around the page.
 * It supports mouse and touch input and allows whichever element
 * is specified to be moved to any arbitrary position.
 *
 * @param element
 */
function makeDraggable(element, options={}) {
    const $element = element;

    // Force to hardware acceleration to move element if browser supports translate property
    const { styleProperty } = OHIF.ui;
    const useTransform = styleProperty.check('transform', 'translate(1px, 1px)');

    const $container = $(options.container || window);
    let diffX;
    let diffY;
    let wasNotDragged = true;
    let dragging = false;

    let lastCursor, lastOffset;
    let lastTranslateX = 0;
    let lastTranslateY = 0;

    options.defaultElementCursor = options.defaultElementCursor || 'default';

    // initialize dragged flag
    $element.data('wasDragged', false);

    function matrixToArray(str) {
        return str.match(/(-?[0-9\.]+)/g);
    }

    function getCursorCoords(e) {
        const cursor = {
            x: e.clientX,
            y: e.clientY
        };

        // Handle touchMove cases
        if (cursor.x === undefined) {
            cursor.x = e.originalEvent.touches[0].pageX;
        }

        if (cursor.y === undefined) {
            cursor.y = e.originalEvent.touches[0].pageY;
        }

        return cursor;
    }

    function reposition(elementLeft, elementTop) {
        if (useTransform) {
            const translation = `translate(${elementLeft}px, ${elementTop}px)`;
            styleProperty.set($element[0], 'transform', translation);
        } else {
            $element.css({
                left: elementLeft + 'px',
                top: elementTop + 'px',
                bottom: 'auto', // Setting these to empty doesn't seem to work in Firefox or Safari
                right: 'auto'
            });
        }
    }

    function startMoving(e) {
        // Prevent dragging dialog by clicking on slider
        // (could be extended for buttons, not sure it's necessary
        if (e.target.type && e.target.type === 'range') {
            return;
        }

        // Stop the dragging if it's not the primary button
        if (e.button !== 0) return;

        // Stop the dragging if the element is being resized
        if ($element.hasClass('resizing')) {
            return;
        }

        let elementLeft = parseFloat($element.offset().left);
        let elementTop = parseFloat($element.offset().top);

        const cursor = getCursorCoords(e);
        if (useTransform) {
            lastCursor = cursor;
            lastOffset = $element.offset();
            const transformMatrix = matrixToArray($element.css('transform')) || [];
            lastTranslateX = parseFloat(transformMatrix[4]) || 0;
            lastTranslateY = parseFloat(transformMatrix[5]) || 0;
            elementLeft = lastTranslateX;
            elementTop = lastTranslateY;
        } else {
            diffX = cursor.x - elementLeft;
            diffY = cursor.y - elementTop;
        }

        reposition(elementLeft, elementTop);

        $(document).on('mousemove', moveHandler);
        $(document).on('mouseup', stopMoving);

        $(document).on('touchmove', moveHandler);
        $(document).on('touchend', stopMoving);
    }

    function stopMoving() {
        $container.css('cursor', 'default');
        $element.css('cursor', options.defaultElementCursor);

        if (dragging) {
            setTimeout(() => $element.removeClass('dragging'));
            dragging = false;
        }

        $(document).off('mousemove', moveHandler);
        $(document).off('touchmove', moveHandler);
    }

    function moveHandler(e) {
        if (!dragging) {
            $container.css('cursor', 'move');
            $element.css('cursor', 'move');
            $element.addClass('dragging');
            dragging = true;
        }

        // let outside world know that the element in question has been dragged
        if (wasNotDragged) {
            $element.data('wasDragged', true);
            wasNotDragged = false;
        }

        // Prevent dialog box dragging whole page in iOS
        e.preventDefault();

        const elementWidth = parseFloat($element.outerWidth());
        const elementHeight = parseFloat($element.outerHeight());
        const containerWidth = parseFloat($container.width());
        const containerHeight = parseFloat($container.height());

        const cursor = getCursorCoords(e);

        let elementLeft, elementTop;
        if (useTransform) {
            elementLeft = lastTranslateX - (lastCursor.x - cursor.x);
            elementTop = lastTranslateY - (lastCursor.y - cursor.y);

            const limitX = containerWidth - elementWidth;
            const limitY = containerHeight - elementHeight;
            const sumX = lastOffset.left + (elementLeft - lastTranslateX);
            const sumY = lastOffset.top + (elementTop - lastTranslateY);

            if (sumX > limitX) {
                elementLeft -= sumX - limitX;
            }

            if (sumY > limitY) {
                elementTop -= sumY - limitY;
            }

            if (sumX < 0) {
                elementLeft += 0 - sumX;
            }

            if (sumY < 0) {
                elementTop += 0 - sumY;
            }
        } else {
            elementLeft = cursor.x - diffX;
            elementTop = cursor.y - diffY;

            elementLeft = Math.max(elementLeft, 0);
            elementTop = Math.max(elementTop, 0);

            if (elementLeft + elementWidth > containerWidth) {
                elementLeft = containerWidth - elementWidth;
            }

            if (elementTop + elementHeight > containerHeight) {
                elementTop = containerHeight - elementHeight;
            }
        }

        reposition(elementLeft, elementTop);
    }

    $element.on('mousedown', startMoving);
    $element.on('touchstart', startMoving);
}
