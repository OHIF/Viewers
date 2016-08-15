setMammogramViewportAlignment = function(series, enabledElement, imageId) {
    // Don't apply the MG viewport alignment to other series types
    var viewTypes = ['MLO', 'CC', 'LM', 'ML', 'XCCL'];
    var requiresInversion = ['LM']; // Tomo series are flipped

    var instance = cornerstoneTools.metaData.get('instance', imageId);
    if (!instance) {
        return;
    }

    var laterality = instance.laterality;
    var element = enabledElement.element;
    var position;

    var left = $(enabledElement.canvas).offset().left;
    var right = left + enabledElement.canvas.width;

    if (viewTypes.indexOf(instance.viewPosition) < 0) {
        return;
    }

    // Check if we should flip the laterality
    if (requiresInversion.indexOf(instance.viewPosition) > -1) {
        if (laterality === "R") {
            laterality = "L";
        } else if (laterality === "L") {
            laterality = "R";
        }
    }

    if (laterality === "R") {
        // Set X translation to Canvas max in image pixels - image width
        // This places it on the right side of the screen
        position = cornerstone.pageToPixel(element, right, 0);
        if (position.x !== enabledElement.image.width) {
            enabledElement.viewport.translation.x += position.x - enabledElement.image.width;
        }

        addSpecificMetadata(imageId, 'tagDisplay', {
            side: 'L'
        });

    } else if (laterality === 'L') {
        // Use pageToPixel to and jQuery to find pixel coordinates of leftmost
        // side of the current canvas
        position = cornerstone.pageToPixel(element, left, 0);
        if (position.x !== 0) {
            enabledElement.viewport.translation.x += position.x;
        }

        addSpecificMetadata(imageId, 'tagDisplay', {
            side: 'R'
        });
    }

    return enabledElement.viewport;
};

Meteor.startup(function() {
    setInstanceClassDefaultViewportFunction("1.2.840.10008.5.1.4.1.1.1.2", setMammogramViewportAlignment);
});