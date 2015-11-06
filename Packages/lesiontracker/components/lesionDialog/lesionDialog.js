Template.lesionDialog.onRendered(function () {
    // This event determines whether or not to show the lesion dialog
    // If there already exists a lesion with this specific lesion number,
    // related to the chosen location.

    $(document).on("ShowLesionDialog", function (e, eventData, lesionData) {
        var locationUID = measurementManagerDAL.isLesionNumberAdded(lesionData.lesionNumber);
        
        if (locationUID) {
            lesionData.locationUID = locationUID;
            measurementManagerDAL.updateTimepointData(lesionData);
        } else {
            // Show Dialog
            var dialogPointsOnPage = eventData.currentPoints.page;
            $("#modal-dialog-container").css({
                "top": dialogPointsOnPage.y,
                "left": dialogPointsOnPage.x
            });

            $("#lesionDialog").modal("show");
        }
    });
});

