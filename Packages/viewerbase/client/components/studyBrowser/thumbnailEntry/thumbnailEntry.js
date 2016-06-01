function cloneElement(element, targetId) {
    // Clone the DOM element
    var clone = element.cloneNode(true);

    // Find any canvas children to clone
    var clonedCanvases = $(clone).find('canvas');
    clonedCanvases.each(function(canvasIndex, clonedCanvas) {
        // Draw from the original canvas to the cloned canvas
        var context = clonedCanvas.getContext('2d');
        var thumbnailCanvas = $(element).find('canvas').get(canvasIndex);
        context.drawImage(thumbnailCanvas, 0, 0);
    });

    // Update the clone with the targetId
    clone.id = targetId;
    clone.style.visibility = 'hidden';
    return clone;
}

function thumbnailDragStartHandler(e, data) {
    // Prevent any scrolling behaviour normally caused by the original event
    e.originalEvent.preventDefault();

    // Identify the current study and series index from the thumbnail's DOM position
    var targetThumbnail = e.currentTarget;
    var imageThumbnail = $(targetThumbnail);
    
    // Store this data for use during drag and drop
    OHIF.viewer.dragAndDropData = data;

    // Clone the image thumbnail
    var targetId = targetThumbnail.id + 'DragClone';
    var clone = cloneElement(targetThumbnail, targetId);
    clone.classList.add('imageThumbnailClone');
    
    // Set pointerEvents to pass through the clone DOM element
    // This is necessary in order to identify what is below it
    // when using document.elementFromPoint
    clone.style.pointerEvents = 'none';

    // Append the clone to the parent of the target
    targetThumbnail.parentNode.appendChild(clone);
    
    // Set the cursor x and y positions from the current touch/mouse coordinates
    // Handle touchStart cases
    if (e.type === 'touchstart') {
        cursorX = e.originalEvent.touches[0].pageX;
        cursorY = e.originalEvent.touches[0].pageY;
    } else {
        cursorX = e.pageX;
        cursorY = e.pageY;

        // Also hook up event handlers for mouse events
        $(document).on('mousemove', function(e) {
            thumbnailDragHandler(e, targetThumbnail);
        });
        $(document).on('mouseup', function(e) {
            thumbnailDragEndHandler(e, targetThumbnail);
        });
    }

    // This block gets the current position of the touch/mouse
    // relative to the thumbnail itself
    // 
    // i.e. Where did the user grab it from?
    var position = imageThumbnail.position();
    var left = position.left;
    var top = position.top;

    // This difference is saved for later so the element movement looks normal
    diffX = cursorX - left;
    diffY = cursorY - top;
    
    // This sets the default style properties of the cloned element so it is
    // ready to be dragged around the page
    $(clone).css({
        top: top,
        left: left,
        position: 'absolute',
        'z-index': 100,
        visibility: 'hidden'
    });
}

function thumbnailDragHandler(e, target) {
    // Get the touch/mouse coordinates from the event
    var cursorX,
        cursorY;
    if (e.type === 'touchmove') {
        cursorX = e.originalEvent.changedTouches[0].pageX;
        cursorY = e.originalEvent.changedTouches[0].pageY;
    } else {
        cursorX = e.pageX;
        cursorY = e.pageY;
    }

    // Find the clone element and update it's position on the page
    var clone = $('#' + target.id + 'DragClone');
    clone.css({
        top: cursorY - diffY,
        left: cursorX - diffX,
        position: 'absolute',
        'z-index': 100,
        visibility: 'visible'
    });
    
    // Identify the element below the current cursor position
    var elemBelow = document.elementFromPoint(cursorX + diffX, cursorY + diffY);

    // If none exists, stop here
    if (!elemBelow) {
        return;
    }

    // Remove any current faded effects on viewports
    $('.imageViewerViewport canvas').removeClass('faded');

    // Figure out what to do depending on what we're dragging over
    var viewportsDraggedOver = $(elemBelow).parents('.imageViewerViewport');
    if (viewportsDraggedOver.length) {
        // If we're dragging over a non-empty viewport, fade it and change the cursor style
        viewportsDraggedOver.find('canvas').not('.magnifyTool').addClass('faded');
        document.body.style.cursor = 'copy';
    } else if (elemBelow.classList.contains('imageViewerViewport') && elemBelow.classList.contains('empty')) {
        // If we're dragging over an empty viewport, just change the cursor style
        document.body.style.cursor = 'copy';
    } else {
        // Otherwise, keep the cursor as no-drop style
        document.body.style.cursor = 'no-drop';
    }
}

function thumbnailDragEndHandler(e, target) {
    // Remove the mouse event listeners
    $(document).off('mousemove mouseup');

    // Reset the cursor style to the default
    document.body.style.cursor = 'auto';

    // Get the cloned element
    var clone = $('#' + target.id + 'DragClone');

    // If it doesn't exist, stop here
    if (!clone.length) {
        return;
    }

    var top = clone.position().top;
    var left = clone.position().left;

    // Identify the element below the cloned element position
    var elemBelow = document.elementFromPoint(left + diffX, top + diffY);

    // Remove all cloned elements from the page
    $('.imageThumbnailClone').remove();

    // Remove any current faded effects on viewports
    $('.imageViewerViewport canvas').removeClass('faded');
    
    // If none exists, stop here
    if (!elemBelow) {
        return;
    }

    // Remove any fade effects on the element below
    elemBelow.classList.remove('faded');

    var element;
    var viewportsDraggedOver = $(elemBelow).parents('.imageViewerViewport');
    if (viewportsDraggedOver.length) {
        // If we're dragging over a non-empty viewport, retrieve it
        element = viewportsDraggedOver.get(0);
    } else if (elemBelow.classList.contains('imageViewerViewport') &&
               elemBelow.classList.contains('empty')) {
        // If we're dragging over an empty viewport, retrieve that instead
        element = elemBelow;
    } else {
        // Otherwise, stop here
        return false;
    }

    // If there is no store drag and drop data, stop here
    if (!OHIF.viewer.dragAndDropData) {
        return false;
    }

    var viewportIndex = $('.imageViewerViewport').index(element);

    // Rerender the viewport using the drag and drop data
    layoutManager.rerenderViewportWithNewSeries(viewportIndex, OHIF.viewer.dragAndDropData);
    return false;
}

Template.thumbnailEntry.onRendered(function() {
    var entry = this.find('.thumbnailEntry');
    $(entry).data('seriesInstanceUid', Template.parentData(0).seriesInstanceUid);
    $(entry).data('studyInstanceUid', Template.parentData(1).studyInstanceUid);
});

Template.thumbnailEntry.events({
    // Touch drag/drop events
    'touchstart .thumbnailEntry, mousedown .thumbnailEntry': function(e) {
        var data = {
            studyInstanceUid: this.stack.studyInstanceUid,
            seriesInstanceUid: this.stack.seriesInstanceUid
        };
        thumbnailDragStartHandler(e, data);
    },
    'touchmove .thumbnailEntry': function(e) {
        thumbnailDragHandler(e, e.currentTarget);
    },
    'touchend .thumbnailEntry': function(e) {
        thumbnailDragEndHandler(e, e.currentTarget);
    }
});

Template.thumbnailEntry.helpers({
    seriesDescription: function() {
        return this.stack.seriesDescription || '';
    }
});
