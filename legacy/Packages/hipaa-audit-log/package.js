Package.describe({
  summary: "HIPAA audit log for ClinicalFramework.",
  version: "2.4.2",
  git: "http://github.com/clinical-meteor/clinical-hipaa-audit-log.git",
  name: "clinical:hipaa-audit-log"
});

Package.on_use(function (api) {
  api.versionsFrom('1.1.0.3');

  api.use('meteor-platform');

  api.use('mrt:moment@2.8.1', 'client');
  api.use('grove:less@0.1.1', 'client');

  api.use('clinical:router@2.0.19');
  api.use('clinical:fonts@1.0.0', 'client');
  api.use('clinical:auto-resizing@0.1.2', 'client');
  api.use('clinical:hipaa-logger@1.0.0');

  api.imply('clinical:hipaa-logger');

  api.addFiles('lib/HipaaAuditLog.js');

  api.addFiles('server/initialize.js', "server");
  api.addFiles('server/publication.js', "server");

  api.addFiles('components/hipaaRibbon/hipaaRibbon.html', "client");
  api.addFiles('components/hipaaRibbon/hipaaRibbon.js', "client");
  api.addFiles('components/hipaaRibbon/hipaaRibbon.less', "client");

  api.addFiles('components/hipaaAuditLog/hipaaAuditLog.html', "client");
  api.addFiles('components/hipaaAuditLog/hipaaAuditLog.js', "client");
  api.addFiles('components/hipaaAuditLog/hipaaAuditLog.less', "client");

  api.addFiles('components/hipaaLogPage/hipaaLogPage.html', "client");
  api.addFiles('components/hipaaLogPage/hipaaLogPage.js', "client");
  api.addFiles('components/hipaaLogPage/hipaaLogPage.less', "client");

  api.addFiles('components/hipaaCloseButton/hipaaCloseButton.html', "client");
  api.addFiles('components/hipaaCloseButton/hipaaCloseButton.js', "client");
  api.addFiles('components/hipaaCloseButton/hipaaCloseButton.less', "client");

  api.export('HipaaAuditLog');
});



Package.onTest(function (api) {
  api.use('tinytest');

  api.use('meteor-platform');
  api.use('clinical:router@2.0.19', 'client');
  api.use('mrt:moment@2.8.1', 'client');
  api.use('grove:less@0.1.1', 'client');

  api.use('clinical:verification');
  api.use('clinical:fonts@1.0.0');
  api.use('clinical:hipaa-audit-log');
  api.use('clinical:hipaa-logger@1.0.0');

  api.addFiles('tests/tinytest/audit-log-tests.js');
});
