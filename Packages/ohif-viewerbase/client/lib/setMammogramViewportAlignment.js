import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';

import { OHIF } from 'meteor/ohif:core';
import { setInstanceClassDefaultViewportFunction } from './instanceClassSpecificViewport';

const setMammogramViewportAlignment = (series, enabledElement, imageId) => {
    // Don't apply the MG viewport alignment to other series types
    const viewTypes = ['MLO', 'CC', 'LM', 'ML', 'XCCL'];
    const requiresInversion = ['LM']; // Tomo series are flipped

    const instance = cornerstone.metaData.get('instance', imageId);
    if (!instance) {
        return;
    }

    const element = enabledElement.element;

    const left = $(enabledElement.canvas).offset().left;
    const right = left + enabledElement.canvas.width;

    const metadataProvider = OHIF.viewer.metadataProvider;
    
    let laterality = instance.laterality;
    let position;

    if (viewTypes.indexOf(instance.viewPosition) < 0) {
        return;
    }

    // Check if we should flip the laterality
    if (requiresInversion.indexOf(instance.viewPosition) > -1) {
        if (laterality === 'R') {
            laterality = 'L';
        } else if (laterality === 'L') {
            laterality = 'R';
        }
    }

    if (laterality === 'R') {
        // Set X translation to Canvas max in image pixels - image width
        // This places it on the right side of the screen
        position = cornerstone.pageToPixel(element, right, 0);
        if (position.x !== enabledElement.image.width) {
            enabledElement.viewport.translation.x += position.x - enabledElement.image.width;
        }

        metadataProvider.addSpecificMetadata(imageId, 'tagDisplay', {
            side: 'L'
        });

    } else if (laterality === 'L') {
        // Use pageToPixel to and jQuery to find pixel coordinates of leftmost
        // side of the current canvas
        position = cornerstone.pageToPixel(element, left, 0);
        if (position.x !== 0) {
            enabledElement.viewport.translation.x += position.x;
        }

        metadataProvider.addSpecificMetadata(imageId, 'tagDisplay', {
            side: 'R'
        });
    }

    return enabledElement.viewport;
};

Meteor.startup(function() {
    setInstanceClassDefaultViewportFunction('1.2.840.10008.5.1.4.1.1.1.2', setMammogramViewportAlignment);
});

export { setMammogramViewportAlignment };
