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