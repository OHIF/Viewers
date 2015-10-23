//fill selectLesionLocation element
var lesionLocationsArray = [
    {location:"Brain Brainstem",hasDescription:false, description:""},
    {location:"Brain Cerebellum Left",hasDescription:false, description:""},
    {location:"Brain Cerebrum Left",hasDescription:false, description:""},
    {location:"Brain Cerebrum Right",hasDescription:false, description:""},
    {location:"Brain Multiple Sites",hasDescription:false, description:""}
];

Template.lesionLocationDialog.onRendered(function () {

    function fillSelectLesionLocation () {
        var el = $("#selectLesionLocation");
        el.find('option:not(:first)').remove();
        $.each(lesionLocationsArray, function(key, value) {
            el.append("<option value='" + key+ "'>" + value.location + "</option>");
        });
    }

    // Fill dropdown
    fillSelectLesionLocation();
});

Template.lesionLocationDialog.events({
    'click button#btnCloseLesionPopup': function (e) {
        $("#lesionDialog").modal("hide");
    },

    'change select#selectLesionLocation': function (e) {
        var el = $(e.target);
        var selectedLocationIndex = el.val()
        if(selectedLocationIndex !== "-1"){

            var locationObj = lesionLocationsArray[selectedLocationIndex];

            // Trigger location selected event
            $(document).trigger("lesionLocationSelected",locationObj);

            // Set activeModule parameters in index.html
            $("#lesionDialog").modal("hide");

            // Select first option
            el.val($("#selectLesionLocation option:first").val());

            // Set lesion location selected session to prevent open
            Session.set("lesionLocationSelected", true);
        }
    }
});