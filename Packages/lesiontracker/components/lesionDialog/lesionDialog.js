Template.lesionDialog.onRendered(function () {
    // Show Lesion Dialog
    $(document).on("ShowLesionDialog", function (e, eventData, activeLesionMeasurementData) {

        var locationUID = measurementManagerDAL.isLesionNumberAdded(activeLesionMeasurementData.lesionNumber);

        if(locationUID != null) {

            activeLesionMeasurementData.locationUID = locationUID;
            measurementManagerDAL.addLesionData(activeLesionMeasurementData);
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



// Listen lesionMeaurementCreated Event and when this event is triggered, show lesionLocationDialog Box
/*
 $(document).on("lesionMeasurementCreated",function(e,eventCaller,data){
 console.log("Lesion measurement xreated");
 var element  = data.element;
 var tabId = data.tabId;
 var viewports = $("#content"+tabId).find(".imageViewerViewport");
 var viewportIndex = $(viewports).index($(element));
 data.viewportIndex = viewportIndex;
 data.totalViewportCount = viewports.length;

 //Set Lesion Table Data to insert into lesion table
 setLesionTableData(data);

 // Check popup will shown or not
 var returnVal = lesionNumberIsAdded(data);
 if(!returnVal.isFound) {
 if( !Session.get("lesionLocationSelected") ) {
 $("#modal-dialog-container").css({
 "top": eventCaller.pageY,
 "left": eventCaller.pageX
 });

 $("#lesionDialog").modal("show");
 }
 } else {
 // If lesionNumber is added before:
 data.rowIndex = returnVal.rowIndex;
 $(document).trigger("addLesionToExistedRow",data);
 }
 });*/
