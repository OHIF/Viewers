Package.describe({
  name: "dimseservice",
  summary: "DICOM DIMSE C-Service",
  version: '0.0.1'
});

Package.onUse(function (api) {
  //api.use("weiwei:dicomservices");

  api.addFiles('server/require.js', 'server');
  api.addFiles('server/constants.js', 'server');
  api.addFiles('server/elements_data.js', 'server');
  api.addFiles('server/Field.js', 'server');
  api.addFiles('server/RWStream.js', 'server');
  api.addFiles('server/Data.js', 'server');
  api.addFiles('server/Message.js', 'server');
  api.addFiles('server/PDU.js', 'server');
  api.addFiles('server/Connection.js', 'server');
  api.addFiles('server/DIMSE.js', 'server');

  api.export("DIMSE", 'server');
});
