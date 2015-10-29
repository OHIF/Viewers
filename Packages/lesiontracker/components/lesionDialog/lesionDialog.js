Template.lesionDialog.onRendered(function () {
    // Show Lesion Dialog
    $(document).on("ShowLesionDialog", function (e, eventData, activeLesionMeasurementData) {

        var locationUID = measurementManagerDAL.isLesionNumberAdded(activeLesionMeasurementData.lesionNumber);

        if(locationUID != null) {

            activeLesionMeasurementData.locationUID = locationUID;
            measurementManagerDAL.updateTimepointData(activeLesionMeasurementData);
        }else{

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

