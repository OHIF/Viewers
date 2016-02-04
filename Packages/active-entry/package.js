Package.describe({
  name: 'clinical:active-entry',
  version: '1.5.15',
  summary: 'SignIn, SignUp, and ForgotPassword pages for Clinical Framework.',
  git: 'https://github.com/clinical-meteor/clinical-active-entry',
  documentation: 'README.md'
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.3');

  api.use([
    'meteor-platform',
    'templating',
    'clinical:router@2.0.17',
    'grove:less@0.1.1',
    'session',
    'reactive-dict',
    'accounts-base',
    'accounts-password',
    'codetheweb:zxcvbn'
  ], ['client']);

  api.use([
    'accounts-base',
    'accounts-password'
  ], ['server']);

  api.use([
    'zuuk:stale-session@1.0.8'
  ], ['client', 'server']);

  api.addFiles([
    'lib/ActiveEntry.js',
    'lib/Accounts.js'
  ]);

  api.addFiles([
    'lib/jquery.pwstrength.bootstrap.js',
    'lib/checkPasswordStrength.js'
  ], ['client']);

  api.imply('accounts-base');
  api.imply('accounts-password');

  api.addFiles([
    'components/entryPages.js',
    'components/entryPages.less',

    'components/entrySignIn/entrySignIn.html',
    'components/entrySignIn/entrySignIn.js',
    'components/entrySignIn/entrySignIn.less',

    'components/entrySignUp/entrySignUp.html',
    'components/entrySignUp/entrySignUp.js',
    'components/entrySignUp/entrySignUp.less',

    'components/forgotPassword/forgotPassword.html',
    'components/forgotPassword/forgotPassword.js',
    'components/forgotPassword/forgotPassword.less',

  ], ['client']);


  api.addFiles('server/methods.js', "server", {testOnly: true});

  api.export("ActiveEntry");
});


Package.onTest(function (api) {
  api.use([
    'templating',
    'clinical:router@2.0.13',
    'grove:less@0.1.1',
    'standard-app-packages'
  ], ['client']);

  api.use('tinytest');
  api.use('clinical:active-entry');
  api.use('clinical:verification');
  api.addFiles('tests/gagarin/activeEntryTests.js');
});
