Package.describe({
    name: 'ohif:dicom-services',
    summary: 'DICOM Services: DIMSE C-Service functions',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('http');
    api.use('ecmascript');

    // DIMSE functions
    api.addFiles('server/DIMSE/require.js', 'server');
    api.addFiles('server/DIMSE/constants.js', 'server');
    api.addFiles('server/DIMSE/elements_data.js', 'server');
    api.addFiles('server/DIMSE/Field.js', 'server');
    api.addFiles('server/DIMSE/RWStream.js', 'server');
    api.addFiles('server/DIMSE/Data.js', 'server');
    api.addFiles('server/DIMSE/Message.js', 'server');
    api.addFiles('server/DIMSE/PDU.js', 'server');
    api.addFiles('server/DIMSE/CSocket.js', 'server');
    api.addFiles('server/DIMSE/Connection.js', 'server');
    api.addFiles('server/DIMSE/DIMSE.js', 'server');

    api.export('DIMSE', 'server');
});
