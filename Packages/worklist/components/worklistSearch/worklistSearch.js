//Get all studies
search();

var studyDateFrom;
var studyDateTo;
var checkFrom = false;
var checkTo = false;

function getFilter(filter) {
    if(filter && filter.length && filter.substr(filter.length - 1) !== '*') {
        filter += '*';
    }
    return filter;
}

//Search value
function isIndexOf(mainVal, searchVal) {
    if(mainVal === undefined || mainVal === '' || mainVal.indexOf(searchVal) > -1){
        return true;
    }

    return false;
}

//Replace object is undefined
function replaceUndefinedColumnValue (text) {
    if (text == undefined || text === "undefined") {
        return "";
    } else {
        return text;
    }
}

//Convert string to study date
function convertStringToStudyDate (dateStr) {
    var y = dateStr.substring(0,4);
    var m = dateStr.substring(4,6);
    var d = dateStr.substring(6,8);
    var newDateStr = y+"/"+m+"/"+d;
    var date_ = new Date(newDateStr);
    return date_;
}

function search() {
    var filter = {
        patientName: getFilter($('#patientName').val()),
        patientId: getFilter($('#patientId').val()),
        accessionNumber: getFilter($('#patientAccessionNumber').val())
    };

    var modality = replaceUndefinedColumnValue($('#modality').val());

    Studies.remove({});
    Meteor.call('WorklistSearch', filter, function(error, studies) {
        if (studies) {
            studies.forEach(function(study) {

                if(isIndexOf(study.modalities, modality) &&
                    (new Date(studyDateFrom).setHours(0,0,0,0) <= convertStringToStudyDate(study.studyDate) || !checkFrom) &&
                    (convertStringToStudyDate(study.studyDate) <= new Date(studyDateTo).setHours(0,0,0,0) || !checkTo)) {

                    Studies.insert(study);
                }
            });
        }
    });

}

Template.worklistSearch.events({

    //Search
    'click button#btnSearch' :function(event) {
        studyDateFrom = $('#studyDateFrom').val();
        studyDateTo = $('#studyDateTo').val();
        checkFrom = $('#checkFrom').is(':checked');
        checkTo = $('#checkTo').is(':checked');
        search();

        return false;
    },

    //Today
    'click button#btnToday' :function(event) {
        studyDateTo = new Date();
        studyDateFrom =  studyDateTo;
        checkFrom = true;
        checkTo = true;

        search();

        return false;
    },

    //Clear
    'click button#btnClear' :function(event) {
        $("#patientId").val("");
        $("#patientName").val("");
        $("#patientAccessionNumber").val("");
        $("#studyDescription").val("");
        $("#referringPhysician").val("");
        $("#studyDateFrom").val("");
        $("#studyDateTo").val("");
        $("#modality").val("");
        $('#checkFrom').prop('checked', false);
        $('#checkTo').prop('checked', false);

    },

    //Last 7 Days
    'click button#btnLastSevenDays' :function(event) {
        studyDateTo = new Date();
        studyDateFrom =  new Date();
        studyDateFrom.setDate(studyDateFrom.getDate()-7);
        checkFrom = true;
        checkTo = true;

        search();

        return false;
    }


});