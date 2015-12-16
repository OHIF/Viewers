clearTools = function() {
    var patientId = Session.get("patientId");
    var toolTypes = ["lesion", "nonTarget", "biDirectional"];
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
    var toolStateKeys = Object.keys(toolState).slice(0);

    // Set null array for toolState data found by imageId and toolType
    toolStateKeys.forEach(function (imageId) {
        toolTypes.forEach(function (toolType) {
            var toolTypeData = toolState[imageId][toolType];
            if(toolTypeData && toolTypeData.data.length > 0) {
                if(toolTypeData.data[0].patientId === patientId) {
                    toolState[imageId][toolType] = {
                        data: []
                    };
                }
            }
        });
    });

    // Update imageViewerViewport elements to remove lesions on current image
    var viewportElements = $(".imageViewerViewport").not('.empty');
    viewportElements.each(function(index, element) {
        cornerstone.updateImage(element);
    });

    // Remove patient's measurements
    Meteor.call('removeMeasurementsByPatientId', patientId);
};