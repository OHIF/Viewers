var lesionTableData;

setLesionTableData = function (data) {
    lesionTableData = data;
};

getLesionTableData = function () {
    return lesionTableData;
};

returnTblStr = function (obj) {
    return '<tr id="' + obj.lineIndex + '" toolType="' + obj.toolType + '"><td class="tblRow">1</td><td class="tblRow">' + obj.lesionLocationObj.location + '</td><td class="tblRow">' + obj.lesions + '</td><td id="' + obj.lineIndex + '" toolType="' + obj.toolType + '"><button  type="button" class="btnRemove fa fa-times fa-lg" title="Remove"></button></td></tr>';
};

Template.lesionMeasurementContainer.onRendered( function () {
    console.log("rendered lesion");
    //Link lesionLocationSelected event
    $(document).on("lesionLocationSelected",function(event,data ){
        var lesionData = getLesionTableData();
        lesionData.lesionLocationObj = data;
        var tabId = lesionData.tabId;
        var el_index = lesionData.viewportIndex;
        var lesionTables = $(".lesionTable");
        var tableEl = lesionTables.get(el_index);
        var tblStr = returnTblStr(lesionData);
        $(tableEl).append(tblStr);
    });
});