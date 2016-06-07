stack = new Iron.MiddlewareStack;

printUrls = function (name, thisArg) {
  console.log('%c***********************', 'color: orange;');
  console.log("<" + name + "> this.originalUrl: " + JSON.stringify(thisArg.originalUrl));
  console.log("<" + name + "> this.url: " + JSON.stringify(thisArg.url));
  console.log('%c***********************', 'color: orange;');
};

stack.push(function m1 () {
  printUrls('m1', this);
  this.next();
});

stack.push(function m2 () {
  printUrls('m2', this);
  this.next();
});

stack.push('/admin', function adminApp () {
  printUrls('adminApp', this);
}, {mount: true});

console.log('%cDispatch "/"', 'color: blue;');
stack.dispatch('/', {});

console.log('');
console.log('%cDispatch "/admin"', 'color: blue;');
stack.dispatch('/admin', {});
