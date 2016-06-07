Package.describe({
  name: 'clinical:router-middleware-stack',
  summary: 'Client and server middleware support inspired by Connect.',
  version: '2.1.2',
  git: 'https://github.com/clinical-meteor/clinical-router-middleware-stack'
});

Package.on_use(function (api) {
  api.versionsFrom('1.1.0.3');

  api.use('underscore');
  api.use('ejson');

  api.use('iron:core@1.0.11');
  api.imply('iron:core');

  api.use('clinical:router-url@2.1.0');

  api.add_files('lib/handler.js');
  api.add_files('lib/middleware_stack.js');

  api.export('MiddlewareStack');
  api.export('Handler', {testOnly: true});
});

Package.on_test(function (api) {
  api.use('clinical:router-middleware-stack');
  api.use('tinytest');
  api.use('test-helpers');
  api.add_files('tests/tinytests/handler_test.js');
  api.add_files('tests/tinytests/middleware_stack_test.js');
});
