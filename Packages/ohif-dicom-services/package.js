Package.describe({
    name: 'ohif:dicom-services',
    summary: 'DICOM Services: DICOMWeb and DIMSE C-Service functions',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('http');
    api.use('ecmascript');

    // DICOMWeb functions
    api.addFiles('server/DICOMWeb/namespace.js', 'server');
    api.addFiles('server/DICOMWeb/getJSON.js', 'server');
    api.addFiles('server/DICOMWeb/getName.js', 'server');
    api.addFiles('server/DICOMWeb/getNumber.js', 'server');
    api.addFiles('server/DICOMWeb/getString.js', 'server');
    api.addFiles('server/DICOMWeb/getModalities.js', 'server');
    api.addFiles('server/DICOMWeb/getAttribute.js', 'server');
    api.addFiles('server/DICOMWeb/getBulkData.js', 'server');

    api.export('DICOMWeb', 'server');

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
