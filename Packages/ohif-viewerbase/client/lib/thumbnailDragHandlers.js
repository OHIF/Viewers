import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

const cloneElement = (element, targetId) => {
    // Clone the DOM element
    const clone = element.cloneNode(true);

    // Find any canvas children to clone
    const clonedCanvases = $(clone).find('canvas');
    clonedCanvases.each((canvasIndex, clonedCanvas) => {
        // Draw from the original canvas to the cloned canvas
        const context = clonedCanvas.getContext('2d');
        const thumbnailCanvas = $(element).find('canvas').get(canvasIndex);
        context.drawImage(thumbnailCanvas, 0, 0);
    });

    // Update the clone with the targetId
    clone.id = targetId;
    clone.style.visibility = 'hidden';

    return clone;
};

const thumbnailDragStartHandler = (event, data) => {
    // Prevent any scrolling behaviour normally caused by the original event
    event.originalEvent.preventDefault();

    // Identify the current study and series index from the thumbnail's DOM position
    const targetThumbnail = event.currentTarget;
    const $imageThumbnail = $(targetThumbnail);

    // Force to hardware acceleration to move element
    // if browser supports translate property
    const useTransform = OHIF.ui.styleProperty.check('transform', 'translate(1px, 1px)');

    // Clone the image thumbnail
    const targetId = 'DragClone';
    const clone = cloneElement(targetThumbnail, targetId);
    const $clone = $(clone);
    $clone.addClass('imageThumbnailClone');

    // Set pointerEvents to pass through the clone DOM element
    // This is necessary in order to identify what is below it
    // when using document.elementFromPoint
    clone.style.pointerEvents = 'none';

    // Append the clone to the body
    document.body.appendChild(clone);

    // Set the cursor x and y positions from the current touch/mouse coordinates
    let cursorX;
    let cursorY;
    // Handle touchStart cases
    if (event.type === 'touchstart') {
        cursorX = event.originalEvent.touches[0].pageX;
        cursorY = event.originalEvent.touches[0].pageY;
    } else {
        cursorX = event.pageX;
        cursorY = event.pageY;

        // Also hook up event handlers for mouse events
        const handlers = {};
        handlers.mousemove = event => thumbnailDragHandler(event);
        handlers.mouseup = event => thumbnailDragEndHandler(event, data, handlers);

        $(document).on('mousemove', handlers.mousemove);
        $(document).on('mouseup', handlers.mouseup);
    }

    // This block gets the current offset of the touch/mouse
    // relative to the window
    //
    // i.e. Where did the user grab it from?
    const offset = $imageThumbnail.offset();
    const { left, top } = offset;

    // This difference is saved for later so the element movement looks normal
    const diff = {
        x: cursorX - left,
        y: cursorY - top
    };
    $clone.data('diff', diff);

    $clone.css({
        visibility: 'hidden',
        'z-index': 100000
    });

    // This sets the default style properties of the cloned element so it is
    // ready to be dragged around the page
    if (useTransform) {
        const viewerHeight = $('#viewer').height();
        const headerHeight = $('.header').outerHeight();
        const heightDiff = viewerHeight + headerHeight;

        // Save height difference for later to set top position of the element during movement
        $clone.data('heightDiff', heightDiff);

        const positionX = cursorX - diff.x;
        const positionY = cursorY - diff.y - heightDiff;

        const translation = `translate(${positionX}px, ${positionY}px)`;
        OHIF.ui.styleProperty.set($clone.get(0), 'transform', translation);
    } else {
        $clone.css({
            left: cursorX - diff.x,
            position: 'fixed',
            top: cursorY - diff.y,
        });
    }
};

const thumbnailDragHandler = event => {
    // Get the touch/mouse coordinates from the event
    let cursorX;
    let cursorY;
    if (event.type === 'touchmove') {
        cursorX = event.originalEvent.changedTouches[0].pageX;
        cursorY = event.originalEvent.changedTouches[0].pageY;
    } else {
        cursorX = event.pageX;
        cursorY = event.pageY;
    }

    // Find the clone element and update it's position on the page
    const $clone = $('#DragClone');
    const diff = $clone.data('diff');

    // Force to hardware acceleration to move element
    // if browser supports translate property
    const useTransform = OHIF.ui.styleProperty.check('transform', 'translate(1px, 1px)');

    $clone.css({
        visibility: 'visible',
        'z-index': 100000
    });

    // This sets the default style properties of the cloned element so it is
    // ready to be dragged around the page
    if (useTransform) {
        const heightDiff = $clone.data('heightDiff');
        const positionX = cursorX - diff.x;
        const positionY = cursorY - diff.y - heightDiff;

        const translation = `translate(${positionX}px, ${positionY}px)`;
        OHIF.ui.styleProperty.set($clone.get(0), 'transform', translation);
    } else {
        $clone.css({
            left: cursorX - diff.x,
            position: 'fixed',
            top: cursorY - diff.y,
        });
    }

    // Identify the element below the current cursor position
    const elemBelow = document.elementFromPoint(cursorX, cursorY);

    // If none exists, stop here
    if (!elemBelow) {
        return;
    }

    // Remove any current faded effects on viewports
    $('.viewportContainer canvas').removeClass('faded');

    // Figure out what to do depending on what we're dragging over
    const $viewportsDraggedOver = $(elemBelow).parents('.viewportContainer');
    if ($viewportsDraggedOver.length) {
        // If we're dragging over a non-empty viewport, fade it and change the cursor style
        $viewportsDraggedOver.find('canvas').not('.magnifyTool').addClass('faded');
        document.body.style.cursor = 'copy';
    } else if (elemBelow.classList.contains('viewportContainer') && elemBelow.classList.contains('empty')) {
        // If we're dragging over an empty viewport, just change the cursor style
        document.body.style.cursor = 'copy';
    } else {
        // Otherwise, keep the cursor as no-drop style
        document.body.style.cursor = 'no-drop';
    }
};

const thumbnailDragEndHandler = (event, data, handlers) => {
    // Remove the mouse event listeners
    if (handlers) {
        $(document).off('mousemove', handlers.mousemove);
        $(document).off('mouseup', handlers.mouseup);
    }

    // Reset the cursor style to the default
    document.body.style.cursor = 'auto';

    // Get the cloned element
    const $clone = $('#DragClone');

    // If it doesn't exist, stop here
    if (!$clone.length) {
        return;
    }

    const offset = $clone.offset();
    const { top, left } = offset;
    const diff = $clone.data('diff');

    // Identify the element below the cloned element position
    const elemBelow = document.elementFromPoint(left + diff.x, top + diff.y);

    // Remove all cloned elements from the page
    $('.imageThumbnailClone').remove();

    // Remove any current faded effects on viewports
    $('.viewportContainer canvas').removeClass('faded');

    // If none exists, stop here
    if (!elemBelow) {
        return;
    }

    // Remove any fade effects on the element below
    elemBelow.classList.remove('faded');

    let element;
    const $viewportsDraggedOver = $(elemBelow).closest('.viewportContainer');

    if ($viewportsDraggedOver.length) {
        // If we're dragging over a non-empty viewport, retrieve it
        element = $viewportsDraggedOver.get(0);
    } else if (elemBelow.classList.contains('viewportContainer') &&
               elemBelow.classList.contains('empty')) {
        // If we're dragging over an empty viewport, retrieve that instead
        element = elemBelow;
    } else {
        // Otherwise, stop here
        return false;
    }

    // If there is no stored drag and drop data, stop here
    if (!data) {
        return false;
    }

    // Get the dropped viewport index
    const viewportIndex = $('.viewportContainer').index(element);

    // Rerender the viewport using the dragged thumbnail data
    OHIF.viewerbase.layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, data);

    return false;
};

const thumbnailDragHandlers = {
    thumbnailDragEndHandler,
    thumbnailDragStartHandler,
    thumbnailDragHandler
};

export { thumbnailDragHandlers };
