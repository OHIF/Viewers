measurements = new Meteor.Collection(null);

var test = {
    lesionNumber: 1,
    isTarget: true,
    location: 'Brain',
    timepoints: {
        "now": {
            imageId: "blah",
            timepointUid: "timepointX",
            date: 2010,
            isDirty: true,
            longestDiameter: 5
        },
        "earlier": {
            imageId: "blah2",
            timepointUid: "timepointy",
            date: 2010,
            isDirty: true,
            longestDiameter: 8
        }
    }
};

measurements.insert(test);

Template.lesionTable.helpers({
    'measurement': function() {
        return measurements.find();
    },
    'timepointNames': function() {
        return [
            {name: 'now'},
            {name: 'earlier'}
            ];
    }
});

/*var lesionTableData;
setLesionTableData = function (data) {
    lesionTableData = data;
};

getLesionTableData = function () {
    return lesionTableData;
};

lesionNumberIsAdded = function(data) {
    var tabId = data.tabId;
    var returnValue = {isFound: false, rowIndex : -1};
    $('#content'+tabId+' table tbody tr td.lesionNumber').each( function(){
        console.log($(this).text());
        var lesionNumber = parseInt($(this).text());

        if(lesionNumber == data.lesionNumber) {
            var $tr = $(this).closest('tr');
            var rowIndex = $tr.index();
            returnValue.rowIndex = rowIndex;
            returnValue.isFound =  true;
        }
    });

    return returnValue;
};

returnTblStr = function (obj) {
    // Get count of lds
    var tabId = obj.tabId;
    var lds = $("#content"+tabId).find(".lesionTable th.ld");

    var rowStr = '<tr style="background-color: #b3b3b3;">' +
        '<td style="text-align:center;"><button  type="button" class="btnRemove fa fa-times fa-lg" title="Remove"></button></td>' +
        '<td style="text-align:center;" class="lesionNumber">'+obj.lesionNumber+'</td>' +
        '<td style="text-align:center;">Y</td>';

    // Add measurement to right column
    if(obj.totalViewportCount) {
        for(var i=0; i< lds.length; i++) {
            if(i === obj.viewportIndex) {
                rowStr += '<td>'+obj.lesionLocationObj.location+'</td><td id='+obj.lineIndex+' class="lesion" style="text-align: left;">'+obj.lesions+'</td>';

            }else{
                rowStr += '<td>'+obj.lesionLocationObj.location+'</td><td class="lesion" style="text-align: left;"></td>';
            }
        }
    }
    rowStr += '</tr>';

    return rowStr;
};

//Link lesionLocationSelected event
$(document).on("lesionLocationSelected",function(event,data ){
    var lesionData = getLesionTableData();
    lesionData.lesionLocationObj = data;
    var tabId = lesionData.tabId;
    //var el_index = lesionData.viewportIndex;
    var tableEl = $("#content"+tabId).find(".lesionTable");
    var tblStr = returnTblStr(lesionData);
    $(tableEl).append(tblStr);

});

//Link addLesionToExistedRow event
$(document).on("addLesionToExistedRow",function(event,data ){
    // Get count of lds
    var tabId = data.tabId;
    var lds = $("#content"+tabId).find(".lesionTable th.ld");
    // Add measurement to right column
    for(var i=0; i< lds.length; i++) {
        if(i === data.viewportIndex) {
            var rowIndex =  data.rowIndex + 1;
            var row = $("#content"+tabId).find(".lesionTable tr").eq(rowIndex);
            var cell = $(row).find("td.lesion").eq(data.viewportIndex);
            $(cell).attr("id", data.lineIndex);
            $(cell).html(data.lesions);
        }
    }
});

$(document).on("lesionTextChanged", function(event, data){
    var cellId = data.index;
    $("td#"+cellId).html(data.measurementText);
});


Template.lesionTable.onRendered( function () {

    // TODO: Set lesion table as hiding-panel
    console.log(this);
    var template = this;
    var tabId = this.data.tabId;
    var viewports = $("#content"+tabId).find(".imageViewerViewport");
    var lesionTable = $("#content"+tabId).find(".lesionTable");

    var viewportCount = viewports.length;

    var lesionTableWidth = $(lesionTable).width();
    var viewportWidth = viewports.width();
    var ldColumnRatio = viewportWidth / lesionTableWidth * 100;

    // Add LD column as viewportCount
    // Set lesion table columns width

    if(viewportCount > 0) {
        if(viewportCount == 1) {
            $('#content'+tabId+' thead tr').append( $('<th />', {text : 'Location', width: ldColumnRatio/2+'%', class:'thLocation'}) )
            $('#content'+tabId+' thead tr').append( $('<th />', {text : 'LD', width: ldColumnRatio/2+'%', class:'ld'}) )

        } else if(viewportCount == 2) {

            for(var i = 0; i< viewportCount; i++) {
                $('#content'+tabId+' thead tr').append( $('<th />', {text : 'Location'+i, width: ldColumnRatio/2+'%', class:'thLocation'}) )
                $('#content'+tabId+' thead tr').append( $('<th />', {text : 'LD'+i, width: ldColumnRatio/2+'%', class:'ld'}) )
            }

        } else if(viewportCount > 2) {
            // TODO: Set when viewport count is bigger than 2
        }
    }
    // TODO: When layout is changed, add and calculate new columns for measurement
});

Template.lesionTable.events({
    'click button.btnRemove': function (e) {
        var el = $(e.target);
    },
    'click table tbody tr': function(e) {
        console.log(this);
        var row = e.currentTarget;
        var lesionCells =  $(row).find("td.lesion");
        for(var i = 0; i< lesionCells.length; i++) {
            var cell =  lesionCells[i];
            var idAttr = $(cell).attr("id");
            if(idAttr != undefined) {
               // TODO: Create eventObject and trigger LesionToolModified event
                var viewports = $(".imageViewerViewport");
                var eventObject = {
                    enabledElement: cornerstone.getEnabledElement(viewports[0]),
                    lineIndex: parseInt(idAttr),
                    type: "active"
                };
                $(viewports[0]).trigger("LesionToolModified", eventObject);
            }
        }
    }
});*/