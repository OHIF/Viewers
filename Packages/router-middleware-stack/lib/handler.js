var Url = Iron.Url;

Handler = function (path, fn, options) {
  if (_.isFunction(path)) {
    options = options || fn || {};
    fn = path;
    path = '/';

    // probably need a better approach here to differentiate between
    // Router.use(function () {}) and Router.use(MyAdminApp). In the first
    // case we don't want to count it as a viable server handler when we're
    // on the client and need to decide whether to go to the server. in the
    // latter case, we DO want to go to the server, potentially.
    this.middleware = true;

    if (typeof options.mount === 'undefined')
      options.mount = true;
  }

  // if fn is a function then typeof fn => 'function'
  // but note we can't use _.isObject here because that will return true if the
  // fn is a function OR an object.
  if (typeof fn === 'object') {
    options = fn;
    fn = options.action || 'action';
  }

  options = options || {};

  this.options = options;
  this.mount = options.mount;
  this.method = (options.method && options.method.toLowerCase()) || false;

  // should the handler be on the 'client', 'server' or 'both'?
  // XXX can't we default this to undefined in which case it's run in all
  // environments?
  this.where = options.where || 'client';

  // if we're mounting at path '/foo' then this handler should also handle
  // '/foo/bar' and '/foo/bar/baz'
  if (this.mount)
    options.end = false;

  // set the name
  if (options.name)
    this.name = options.name;
  else if (typeof path === 'string' && path.charAt(0) !== '/')
    this.name = path;
  else if (typeof path === 'string' && path !== '/')
    this.name = path.split('/').slice(1).join('.');

  // if the path is explicitly set on the options (e.g. legacy router support)
  // then use that
  // otherwise use the path argument which could also be a name
  path = options.path || path;

  if (typeof path === 'string' && path.charAt(0) !== '/')
    path = '/' + path;

  this.path = path;
  this.compiledUrl = new Url(path, options);

  if (_.isString(fn)) {
    this.handle = function handle () {
      // try to find a method on the current thisArg which might be a Controller
      // for example.
      var func = this[fn];

      if (typeof func !== 'function')
        throw new Error("No method named " + JSON.stringify(fn) + " found on handler.");

      return func.apply(this, arguments);
    };
  } else if (_.isFunction(fn)) {
    // or just a regular old function
    this.handle = fn;
  }
};

/**
 * Returns true if the path matches the handler's compiled url, method
 * and environment (e.g. client/server). If no options.method or options.where
 * is provided, then only the path will be used to test.
 */
Handler.prototype.test = function (path, options) {
  options = options || {};

  var isUrlMatch = this.compiledUrl.test(path);
  var isMethodMatch = true;
  var isEnvMatch = true;

  if (this.method && options.method)
    isMethodMatch = this.method == options.method.toLowerCase();

  if (options.where)
    isEnvMatch = this.where == options.where;

  return isUrlMatch && isMethodMatch && isEnvMatch;
};

Handler.prototype.params = function (path) {
  return this.compiledUrl.params(path);
};

Handler.prototype.resolve = function (params, options) {
  return this.compiledUrl.resolve(params, options);
};

/**
 * Returns a new cloned Handler.
 * XXX problem is here because we're not storing the original path.
 */
Handler.prototype.clone = function () {
  var clone = new Handler(this.path, this.handle, this.options);
  // in case the original function had a name
  clone.name = this.name;
  return clone;
};
