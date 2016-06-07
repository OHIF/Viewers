Tinytest.add('MiddlewareStack - handler basics', function (test) {
  var handler;
  var fn = function myName () {};
  var opts = {};
  // constructor options

  // middleware handler
  handler = new Handler(fn);
  test.equal(handler.handle, fn);
  test.equal(handler.name, 'myName', 'name is "myName"');
  test.equal(handler.where, 'client');
  test.isTrue(handler.test('/'));
  test.isTrue(handler.test('/match/everything'));

  opts.name = 'newName';
  handler = new Handler('/items/:id', fn, opts);
  test.equal(handler.handle, fn);
  test.equal(handler.name, 'newName', 'name is "newName"');
  test.equal(handler.options, opts);
  test.isTrue(handler.test('/items/1'));
  test.isTrue(handler.test('/items/2'));


  handler = new Handler('/items/:id?', fn, opts);
  test.isTrue(handler.test('/items/1'));
  test.isTrue(handler.test('/items'));

  handler = new Handler(/.*/, fn, opts);
  test.isTrue(handler.test('/'));
  test.isTrue(handler.test('/foo'));

  var called = false;
  var thisArg = {
    methodName: function () {called = true;}
  };
  handler = new Handler('/items/:id', 'methodName');
  handler.handle.call(thisArg);
  test.isTrue(called);

  handler = new Handler('/items/:id', fn);
  var params = handler.params('/items/5');
  test.equal(params.id, "5");
});

Tinytest.add('Handler - test', function (test) {
  var handler = new Handler('/testme', function () {}, {
    where: 'server',
    method: 'GET'
  });

  test.isTrue(handler.test('/testme', {where: 'server', method: 'GET'}));
  test.isFalse(handler.test('/testme', {where: 'client', method: 'GET'}));
  test.isFalse(handler.test('/testme', {where: 'server', method: 'POST'}));
});
