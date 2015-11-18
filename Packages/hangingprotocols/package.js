Package.describe({
    name: "hangingprotocols",
    summary: "Support functions for using DICOM Hanging Protocols",
    version: '0.0.1'
});

Package.onUse(function (api) {
    api.use('cornerstone');;

    api.addFiles('server/namespace.js', 'server');
    api.addFiles('server/dataDictionary.js', 'server');
    api.addFiles('server/instanceDataToJsObject.js', 'server');

    api.export('instanceDataToJsObject', 'server');
    api.export('TAG_DICT', 'server');
    api.export("DICOMHP", ['client', 'server']);
});