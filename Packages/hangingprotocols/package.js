Package.describe({
  name: "weiwei:hangingprotocols",
  summary: "DICOM Haning Protocols",
  version: '0.0.1'
});

Package.onUse(function (api) {
  api.use("weiwei:dicomservices");

  api.addFiles('server/namespace.js', 'server');

  api.export("DICOMHP", 'server');
});

Package.onTest(function (api){
  api.use(["weiwei:hangingprotocols"]);
});