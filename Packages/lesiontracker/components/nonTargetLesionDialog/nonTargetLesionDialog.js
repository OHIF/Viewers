//fill selectLesionLocation element
var lesionLocationsArray = [{
    location: "Brain Brainstem",
    hasDescription: false,
    description: ""
}, {
    location: "Brain Cerebellum Left",
    hasDescription: false,
    description: ""
}, {
    location: "Brain Cerebrum Left",
    hasDescription: false,
    description: ""
}, {
    location: "Brain Cerebrum Right",
    hasDescription: false,
    description: ""
}, {
    location: "Brain Multiple Sites",
    hasDescription: false,
    description: ""
}];

var lesionLocationsResponseArray = [
    {
    text: "Complete response",
    code: "CR",
    description: ""
    },
    {
        text: "Progressive disease",
        code: "PD",
        description: ""
    },
    {
        text: "Stable disease",
        code: "SD",
        description: ""
    },
    {
        text: "Non-measurable",
        code: "NM",
        description: ""
    },
    {
        text: "Unknown",
        code: "UN",
        description: ""
    },
    {
        text: "Not Evaluable",
        code: "NE",
        description: ""
    },
    {
        text: "Non-CR/Non-PD",
        code: "NN",
        description: ""
    },
    {
        text: "Excluded",
        code: "EX",
        description: ""
    }
];

Template.nonTargetLesionDialog.onRendered(function() {

    function fillSelectLesionLocation() {
        var el = $("#selectNonTargetLesionLocation");
        el.find('option:not(:first)').remove();
        $.each(lesionLocationsArray, function(key, value) {
            el.append("<option value='" + key + "'>" + value.location + "</option>");
        });
    }

    function fillResponses() {
        var el = $("#selectNonTargetLesionLocationResponse");
        el.find('option:not(:first)').remove();
        $.each(lesionLocationsResponseArray, function(key, value) {
            el.append("<option value='" + value.code + "'>" + value.code +" - "+value.text + "</option>");
        });
    }

    // Fill dropdown
    fillSelectLesionLocation();

    // Fill location responses
    fillResponses();

});

Template.nonTargetLesionDialog.events({
    'click button#btnCloseNonTargetLesionPopup': function(e) {
        $("#nonTargetLesionLocationDialog").modal("hide");
    },

    'click button#nonTargetLesionOK': function() {

        var lesionData = Session.get("nonTargetLesionData");
        // Get selected location data
        var selectedLocationIndex = $("#selectNonTargetLesionLocation").val();
        if (selectedLocationIndex < 0) {
            return;
        }
        // Get selected location data
        var locationObj = lesionLocationsArray[selectedLocationIndex];
        lesionData.location = $("#selectNonTargetLesionLocation :selected").text();

        var response = $("#selectNonTargetLesionLocationResponse").val();
        if(response === "-1") {
            return;
        }
        $("#nonTargetLesionLocationDialog").modal("hide");
        lesionData.measurementText = response;

        // Select first option
        $("#selectNonTargetLesionLocation").val($("#selectNonTargetLesionLocation option:first").val());
        $("#selectNonTargetLesionLocationResponse").val($("#selectNonTargetLesionLocationResponse option:first").val());

        if (typeof lesionData.locationUID !== 'undefined') {
            measurementManagerDAL.updateTimepointData(lesionData);
            return;
        }

        // Adds location data to trialPatientLocations array and returns locationUID
        var locationUID = measurementManagerDAL.addNewLocation(locationObj);
        // Link locationUID with activeLesionMeasurementData
        lesionData.locationUID = locationUID;
        measurementManagerDAL.addLesionData(lesionData);



    }
});