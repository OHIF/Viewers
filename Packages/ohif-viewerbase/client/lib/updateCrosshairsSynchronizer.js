import { $ } from 'meteor/jquery';
import { getFrameOfReferenceUID } from './getFrameOfReferenceUID';
import { crosshairsSynchronizers } from './crosshairsSynchronizers';

/**
 * This function is used to maintain the updateImageSynchronizers
 * that are using in the Crosshair tool. The function creates
 * (and destroys any currently existing) a new synchronizer for the given
 * frame of reference. It then searches for other viewports that share the same
 * frame of reference, and adds those to the synchronizer. These viewports
 * will now function together when the Crosshair tool is used.
 *
 * @param currentFrameOfReferenceUID
 */
 export function updateCrosshairsSynchronizer(currentFrameOfReferenceUID) {
    // Check if an old synchronizer exists, and if it does, destroy it
    // If not, create a new one
    let synchronizer = crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID];
    if (synchronizer) {
        // If it already exists, remove all source & target elements
        synchronizer.destroy();
    } else {
        // Create a new synchronizer
        crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID] = new cornerstoneTools.Synchronizer('cornerstonenewimage', cornerstoneTools.updateImageSynchronizer);
        synchronizer = crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID];
    }

    // Add all elements that stem from the same frame of reference
    $('.imageViewerViewport').each((index, element) => {
        const frameOfReferenceUID = getFrameOfReferenceUID(element);
        if (currentFrameOfReferenceUID !== frameOfReferenceUID) {
            return;
        }
        synchronizer.add(element);
    });
}
