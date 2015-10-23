Template.lesionDialog.onRendered(function () {
    // Listen lesionMeaurementCreated Event and when this event is triggered, show lesionLocationDialog Box
    $(document).on("lesionMeasurementCreated",function(e,eventCaller,data){
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
    });
});