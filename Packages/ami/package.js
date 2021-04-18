Package.describe({
  name: 'gtajesgenga:ami',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
    three: '0.100.0',
    'gtajesgenga-ami.js': '0.28.1'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.6');
  api.use('ecmascript');
  api.use('modules');
  api.use('polguixe:meteor-datgui');
  api.mainModule('ami.js', 'client');
  api.addFiles(['TrackballControls.js'], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('gtajesgenga:ami');
  api.mainModule('ami-tests.js',  'client');
});
