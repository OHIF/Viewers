Template.lesionDialog.onRendered(function () {
    // Listen lesionMeaurementCreated Event and when this event is triggered, show lesionLocationDialog Box
    var viewportIndex = this.data.activeViewport.get();

    $(document).on("LesionMeasurementCreated",function(e, eventData){

        console.log("lesionMeasurementCreated");
        var data = {};
        data.viewportIndex = viewportIndex;

        //Set Lesion Table Data to insert into lesion table
        setLesionTableData(data);

        if( !Session.get("lesionLocationSelected") ) {
            $("#modal-dialog-container").css({
                "top": eventData.currentPoints.page.y,
                "left": eventData.currentPoints.page.x
            });

            $("#lesionDialog").modal("show");
        }
    });
});