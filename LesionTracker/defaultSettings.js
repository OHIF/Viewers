Meteor.startup(function() {
    if (Object.keys(Meteor.settings).length > 1) {
        console.log('Using custom LesionTracker settings');
        console.log(Meteor.settings);
        return;
    }

    Meteor.settings = {
        dicomWeb: {
            endpoints: [{
                name: 'Orthanc',
                wadoUriRootNOTE: 'either this uri is not correct for wado-uri or wado-uri is not configured on orthanc currently',
                wadoUriRoot: 'http://localhost:8043/wado',
                qidoRoot: 'http://localhost:8042/dicom-web',
                wadoRoot: 'http://localhost:8042/dicom-web',
                qidoSupportsIncludeField: false,
                imageRendering: 'wadouri',
                requestOptions: {
                    auth: 'orthanc:orthanc',
                    logRequests: true,
                    logResponses: false,
                    logTiming: true
                }
            }]
        },
        dimse: [{
            host: 'localhost',
            port: 4242,
            aeTitle: 'ORTHANC',
            default: true
        }],
        "defaultServiceType": 'dicomWeb',
        "public": {
            "verifyEmail": false,
            "ui": {
                "studyListFunctionsEnabled": true
            }
        }
        //defaultServiceType: 'dimse'
    };

    console.log('Using default LesionTracker settings with service: ' + Meteor.settings.defaultServiceType);

    // Bind events if window is closed
    $(window).bind('beforeunload', function (e) {
        // have to return null, unless you want a chrome popup alert
       // return 'If you leave this page then any unsaved changes will be lost.';
    });
});

