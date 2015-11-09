var lastAddedLesionData;

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

Template.lesionLocationDialog.onRendered(function() {
    console.log(this.data);

    function fillSelectLesionLocation() {
        var el = $("#selectLesionLocation");
        el.find('option:not(:first)').remove();
        $.each(lesionLocationsArray, function(key, value) {
            el.append("<option value='" + key + "'>" + value.location + "</option>");
        });
    }

    // Fill dropdown
    fillSelectLesionLocation();

    // Observe Measurements Collection Changes
    Measurements.find().observe({
        added: function(lesionData) {
            lastAddedLesionData = lesionData;
        },
        changed: function(lesionData) {
            console.log("lesionData is changed!");
        }
    });
});

Template.lesionLocationDialog.events({
    'click button#btnCloseLesionPopup': function(e) {
        $("#lesionDialog").modal("hide");
    },

    'change select#selectLesionLocation': function(e) {
        var el = $(e.target);
        var selectedLocationIndex = el.val();
        if (selectedLocationIndex < 0) {
            return;
        }

        // Get selected location data
        var locationObj = lesionLocationsArray[selectedLocationIndex];

        // Gets active lesion measurement data that is latest added data
        var activeLesionMeasurementData = Session.get("lesionMeasurementData");

        // Adds location data to trialPatientLocations array and returns locationUID
        var locationUID = measurementManagerDAL.addNewLocation(locationObj);

        // Linkk locationUID with activeLesionMeasurementData
        activeLesionMeasurementData.locationUID = locationUID;

        // Adds lesion data to timepoints array
        measurementManagerDAL.addLesionData(activeLesionMeasurementData);

        // Trigger location selected event
        $(document).trigger("lesionLocationSelected", locationObj);

        // Set activeModule parameters in index.html
        $("#lesionDialog").modal("hide");

        // Select first option
        el.val($("#selectLesionLocation option:first").val());

        // Set lesion location selected session to prevent open
        Session.set("lesionLocationSelected", true);
    }
});