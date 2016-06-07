
describe('clinical:router-middleware-stack', function () {
  var server = meteor();
  var client = browser(server);

  it('MiddlewareStack should exist on the client', function () {
    return client.execute(function () {
      expect(MiddlewareStack).to.exist;
    });
  });

  it('MiddlewareStack should exist on the client', function () {
    return server.execute(function () {
      expect(MiddlewareStack).to.exist;
    });
  });
});
