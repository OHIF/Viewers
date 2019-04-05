Package.describe({
  name: 'ohif:google-cloud',
  summary: 'DICOM Services: Google Cloud Healthcare API integration',
  version: '0.0.1',
  documentation: 'README.md',
});

Npm.depends({
  'healthcare-api-adapter': "git+https://github.com/quantumsoftgroup/healthcare-api-adapter#v0.2.2"
});


Package.onUse(function(api) {
  api.versionsFrom('1.4');

  api.use('http');
  api.use('ecmascript');

  api.use(['templating', 'stylus'], 'client');

  // Main module
  api.mainModule('client/main.js', ['client']);

  const assets = [
    '.npm/package/node_modules/healthcare-api-adapter/dist/gcp.min.js',
    '.npm/package/node_modules/healthcare-api-adapter/dist/gcp.0.min.js',
    '.npm/package/node_modules/healthcare-api-adapter/dist/gcp.2.min.js',
    '.npm/package/node_modules/healthcare-api-adapter/dist/gcp.3.min.js',
    '.npm/package/node_modules/healthcare-api-adapter/dist/gcp.4.min.js',
    '.npm/package/node_modules/healthcare-api-adapter/dist/vue.js',
    '.npm/package/node_modules/healthcare-api-adapter/dist/img/Button_File.473e74a7.svg',
    '.npm/package/node_modules/healthcare-api-adapter/dist/img/Button_Folder.271da60b.svg',
    '.npm/package/node_modules/healthcare-api-adapter/dist/img/Icon-24px-Close.d1a4d6d2.svg',
    '.npm/package/node_modules/healthcare-api-adapter/dist/img/Icon-Arrow.e493b444.svg',
    '.npm/package/node_modules/healthcare-api-adapter/dist/img/Icon-Warn.f3b4b640.svg',
    '.npm/package/node_modules/healthcare-api-adapter/dist/img/arrow_right.d8a5b209.svg',
  ];

  api.addAssets(assets, 'client');
});

