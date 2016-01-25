Meteor.startup(function() {
    if (Meteor.settings.dicomWeb) {
        console.log('dicomWeb settings defined!');
        console.log(Meteor.settings);
        return;
    }

    console.log('Using default LesionTracker dicomWeb settings');
    Meteor.settings = {
      "dicomWeb" : {
        "endpoints": [
          {
            "name": "Orthanc",
            "wadoUriRootNOTE" : "either this uri is not correct for wado-uri or wado-uri is not configured on orthanc currently",
            "wadoUriRoot" : "http://localhost:8043/wado",
            "qidoRoot": "http://localhost:8042/dicom-web",
            "wadoRoot": "http://localhost:8042/dicom-web",
            "qidoSupportsIncludeField": false,
            "imageRendering" : "wadouri",
            "requestOptions" : {
              "auth": "orthanc:orthanc",
              "logRequests" : true,
              "logResponses" : false,
              "logTiming" : true
            }
          }
        ]
      }
    };
});