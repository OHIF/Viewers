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
function makeDraggable(element, options) {
    var container = $(window);
    var diffX,
        diffY,
        wasNotDragged = true;

    options = options || {};
    options.defaultElementCursor = options.defaultElementCursor || 'default';

    // initialize dragged flag
    element.data('wasDragged', false);

    function getCursorCoords(e) {
        var cursor = {
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

    function startMoving(e) {
        // Prevent dragging dialog by clicking on slider
        // (could be extended for buttons, not sure it's necessary
        if (e.target.type && e.target.type === 'range') {
            return;
        }

        // Stop the dragging if the element is being resized
        if ($(element).hasClass('resizing')) {
            return;
        }

        var elementTop = parseFloat(element.offset().top),
            elementLeft = parseFloat(element.offset().left);

        var cursor = getCursorCoords(e);
        diffX = cursor.x - elementLeft;
        diffY = cursor.y - elementTop;

        container.css('cursor', 'move');
        element.css('cursor', 'move');

        element.css({
            cursor: 'move',
            left: elementLeft + 'px',
            top: elementTop + 'px',
            bottom: 'auto', // Setting these to empty doesn't seem to work in Firefox or Safari
            right: 'auto'
        });

        $(document).on('mousemove', moveHandler);
        $(document).on('mouseup', stopMoving);

        $(document).on('touchmove', moveHandler);
        $(document).on('touchend', stopMoving);

        // let outside world know that the element in question has been dragged
        if (wasNotDragged) {
            element.data('wasDragged', true);
            wasNotDragged = false;
        }

    }

    function stopMoving() {
        container.css('cursor', 'default');
        element.css('cursor', options.defaultElementCursor);

        $(document).off('mousemove', moveHandler);
        $(document).off('touchmove', moveHandler);
    }

    function moveHandler(e) {
        // Prevent dialog box dragging whole page in iOS
        e.preventDefault();

        var elementWidth = parseFloat(element.outerWidth()),
            elementHeight = parseFloat(element.outerHeight()),
            containerWidth = parseFloat(container.width()),
            containerHeight = parseFloat(container.height());

        var cursor = getCursorCoords(e);

        var elementLeft = cursor.x - diffX;
        var elementTop = cursor.y - diffY;

        elementLeft = Math.max(elementLeft, 0);
        elementTop = Math.max(elementTop, 0);

        if (elementLeft + elementWidth > containerWidth) {
            elementLeft = containerWidth - elementWidth;
        }

        if (elementTop + elementHeight > containerHeight) {
            elementTop = containerHeight - elementHeight;
        }

        element.css({
            left: elementLeft + 'px',
            top: elementTop + 'px',
            bottom: 'auto', // Setting these to empty doesn't seem to work in Firefox or Safari
            right: 'auto'
        });
    }

    element.on('mousedown', startMoving);
    element.on('touchstart', startMoving);
};
