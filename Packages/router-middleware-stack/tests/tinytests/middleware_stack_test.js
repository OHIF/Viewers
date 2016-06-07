Tinytest.add('MiddlewareStack - handler names and paths', function (test) {
  var handler;

  // path is a name
  handler = new Handler('home', {});
  test.equal(handler.name, 'home', 'name is "home"');
  test.equal(handler.path, '/home', 'path is "/home"');

  // path is an option
  handler = new Handler('home', {path: '/foo'});
  test.equal(handler.name, 'home', 'name is "home"');
  test.equal(handler.path, '/foo', 'path is "/foo"');

  handler = new Handler('/home', {path: '/bar'});
  test.equal(handler.path, '/bar', 'path is "/bar"');

  handler = new Handler('/home', {path: '/bar', name: 'foo'});
  test.equal(handler.path, '/bar', 'path is "/bar"');
  test.equal(handler.name, 'foo', 'name is "foo"');
});

Tinytest.add('MiddlewareStack - create and find by name', function (test) {
  // basically just test that a handler gets created and keyed by name if thee's
  // a name. Also test duplicate named handlers throws an error.

  var stack = new Iron.MiddlewareStack;
  stack._create('/items', function () {}, {name: 'items'});
  test.isTrue(stack.findByName('items'));

  test.throws(function () {
    // same name
    stack._create('/items', function () {}, {name: 'items'});
  });
});

Tinytest.add('MiddlewareStack - push', function (test) {
  var stack = new Iron.MiddlewareStack;
  var fns = [function () {}, function () {}];
  stack.push(fns[0]);
  test.equal(stack._stack[0].handle, fns[0]);
  stack.push(fns[1]);
  test.equal(stack._stack[1].handle, fns[1]);
});

Tinytest.add('MiddlewareStack - insertAt', function (test) {
  var stack = new Iron.MiddlewareStack;
  var fns = [function () {}, function () {}, function () {}];
  stack.push(fns[0]);
  stack.push(fns[2]);

  stack.insertAt(1, fns[1]);
  test.equal(stack._stack[1].handle, fns[1]);
});

Tinytest.add('MiddlewareStack - insertBefore', function (test) {
  var stack = new Iron.MiddlewareStack;
  var fns = [function one() {}, function two() {}, function three() {}];
  stack.push(fns[0]);
  stack.push(fns[2]);
  stack.insertBefore('three', fns[1]);
  test.equal(stack._stack[1].handle, fns[1]);
});

Tinytest.add('MiddlewareStack - insertAfter ', function (test) {
  var stack = new Iron.MiddlewareStack;
  var fns = [function one() {}, function two() {}, function three() {}];
  stack.push(fns[0]);
  stack.push(fns[2]);
  stack.insertAfter('one', fns[1]);
  test.equal(stack._stack[1].handle, fns[1]);
});

Tinytest.add('MiddlewareStack - dispatch iteration with this.next', function (test) {
  var stack = new Iron.MiddlewareStack;
  var calls = [];

  if (Meteor.isClient) {
    stack.push(function m1 () {
      calls.push('m1');
      this.next();
    });

    stack.push(function m2 () {
      calls.push('m2');
      // no call to next
    });

    stack.push(function m3 () {
      calls.push('m3');
    });

    stack.dispatch('/', {});
    test.equal(calls.length, 2, "call length is two");
    test.equal(calls[0], 'm1', "m1 called");
    test.equal(calls[1], 'm2', "m2 called");
  }

  if (Meteor.isServer) {
    stack.push(function m1 () {
      calls.push('m1');
      this.next();
    }, {where: 'server'});

    stack.push(function m2 () {
      calls.push('m2');
      // no call to next
    }, {where: 'server'});

    stack.push(function m3 () {
      calls.push('m3');
    }, {where: 'server'});

    stack.dispatch('/', {});
    test.equal(calls.length, 2, "call length is two");
    test.equal(calls[0], 'm1', "m1 called");
    test.equal(calls[1], 'm2', "m2 called");
  }
});

Tinytest.add('MiddlewareStack - dispatch callback', function (test) {
  var stack = new Iron.MiddlewareStack;
  var calls = [];
  
  if (Meteor.isClient) {
    stack.push(function m1 () {
      calls.push('m1');
      this.next();
    });

    stack.dispatch('/', {}, function () {
      calls.push('done');
    });

    test.equal(calls.length, 2, "call length is two");
    test.equal(calls[0], 'm1', "m1 called");
    test.equal(calls[1], 'done', "done called");
  }

  if (Meteor.isServer) {
    stack.push(function m1 () {
      calls.push('m1');
      this.next();
    }, {where: 'server'});

    stack.dispatch('/', {}, function () {
      calls.push('done');
    });

    test.equal(calls.length, 2, "call length is two");
    test.equal(calls[0], 'm1', "m1 called");
    test.equal(calls[1], 'done', "done called");
  }
});

if (Meteor.isServer) {
  var Fiber = Npm.require('fibers');
  Tinytest.addAsync('MiddlewareStack - async next maintains fibers', function (test, done) {
    var envVar = new Meteor.EnvironmentVariable;
    
    envVar.withValue(true, function () {
      var stack = new Iron.MiddlewareStack;
      
      test.isTrue(envVar.getOrNullIfOutsideFiber());
      stack.push(function(req, res, next) {
        // break out of the current fiber
        setTimeout(function() {
          next();
        }, 0);
      }, {where: 'server'});

      stack.push(function(req, res, next) {
        test.isTrue(envVar.getOrNullIfOutsideFiber());
        this.next();
      }, {where: 'server'});
    
      stack.dispatch('/', {}, function () {
        test.isTrue(envVar.getOrNullIfOutsideFiber());
        done();
      });
    });
  });
}
