/**
 * Obtain an imageId for Cornerstone from an image instance
 *
 * @param instance
 * @returns {string} The imageId to be used by Cornerstone
 */
getImageId = function(instance) {
    if (!instance) {
        return;
    }
    if (instance.wadouri) {
        return 'dicomweb:' + instance.wadouri; // WADO-URI
    } else {
        return getWADORSImageId(instance); // WADO-RS Retrieve Frame
    }
};