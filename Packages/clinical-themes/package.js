Package.describe({
  name: 'clinical:themes',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Theme selection component for ClinicalFramework apps.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/awatson1978/clinical-themes',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function (api) {
  api.versionsFrom('1.2.1');
  
  api.use('meteor-platform');
  api.use('less');

  api.addFiles('lib/ActiveThemes.js');

  api.addFiles('components/themeCard.html');
  api.addFiles('components/themeCard.js');
  api.addFiles('components/themeCard.less');

});

Package.onTest(function (api) {
  api.use('tinytest');
  api.use('clinical:themes');
  api.addFiles('tests/clinical-themes.js');
});
