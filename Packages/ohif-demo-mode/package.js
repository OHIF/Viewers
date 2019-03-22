Package.describe({
  name: 'ohif:demo-mode',
  summary: 'demo mode',
  version: '0.0.1',
});

Package.onUse(function(api) {
  api.versionsFrom('1.4');

  api.use('http');
  api.use('ecmascript');
  api.use(['templating', 'stylus'], 'client');

  // OHIF dependencies
  api.use('ohif:core', 'client');

  // Main module
  api.mainModule('main.js', 'client');
});
