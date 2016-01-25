Package.describe({
  summary: "UI vocabulary for ClinicalFramework.",
  version: "1.0.5",
  git: "http://github.com/awatson1978/clinical-ui-vocabulary.git",
  name: "clinical:ui-vocabulary"
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  
  api.use('ian:bootstrap-3@3.3.1');

  api.addFiles('anchoring.less', 'client');
  api.addFiles('borders.less', 'client');
  api.addFiles('colors.less', 'client');
  api.addFiles('fonts.less', 'client');
  api.addFiles('haptics.less', 'client');
  api.addFiles('padding.less', 'client');
  api.addFiles('pages.less', 'client');
  api.addFiles('sizing.less', 'client');
  api.addFiles('text.less', 'client');

});

Package.onTest(function(api) {
  api.use('tinytest');
});
