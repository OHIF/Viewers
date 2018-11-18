'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.recursivePatternCapture = recursivePatternCapture;

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _crypto = require('crypto');

var _doctrine = require('doctrine');

var doctrine = _interopRequireWildcard(_doctrine);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _parse2 = require('./parse');

var _parse3 = _interopRequireDefault(_parse2);

var _resolve = require('./resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _ignore = require('./ignore');

var _ignore2 = _interopRequireDefault(_ignore);

var _hash = require('./hash');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = (0, _debug2.default)('eslint-plugin-import:ExportMap');

var exportCache = new _es6Map2.default();

/**
 * detect exports without a full parse.
 * used primarily to ignore the import/ignore setting, iif it looks like
 * there might be something there (i.e., jsnext:main is set).
 * @type {RegExp}
 */
var hasExports = new RegExp('(^|[\\n;])\\s*export\\s[\\w{*]');

var ExportMap = function () {
  function ExportMap(path) {
    _classCallCheck(this, ExportMap);

    this.path = path;
    this.namespace = new _es6Map2.default();
    // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new _es6Map2.default();
    this.dependencies = new _es6Map2.default();
    this.errors = [];
  }

  ExportMap.get = function get(source, context) {

    var path = (0, _resolve2.default)(source, context);
    if (path == null) return null;

    return ExportMap.for(path, context);
  };

  ExportMap.for = function _for(path, context) {
    var exportMap = void 0;

    var cacheKey = (0, _hash.hashObject)((0, _crypto.createHash)('sha256'), {
      settings: context.settings,
      parserPath: context.parserPath,
      parserOptions: context.parserOptions,
      path: path
    }).digest('hex');

    exportMap = exportCache.get(cacheKey);

    // return cached ignore
    if (exportMap === null) return null;

    var stats = fs.statSync(path);
    if (exportMap != null) {
      // date equality check
      if (exportMap.mtime - stats.mtime === 0) {
        return exportMap;
      }
      // future: check content equality?
    }

    // check valid extensions first
    if (!(0, _ignore.hasValidExtension)(path, context)) {
      exportCache.set(cacheKey, null);
      return null;
    }

    var content = fs.readFileSync(path, { encoding: 'utf8' });

    // check for and cache ignore
    if ((0, _ignore2.default)(path, context) && !hasExports.test(content)) {
      exportCache.set(cacheKey, null);
      return null;
    }

    exportMap = ExportMap.parse(path, content, context);
    exportMap.mtime = stats.mtime;

    exportCache.set(cacheKey, exportMap);
    return exportMap;
  };

  ExportMap.parse = function parse(path, content, context) {
    var m = new ExportMap(path);

    try {
      var ast = (0, _parse3.default)(path, content, context);
    } catch (err) {
      log('parse error:', path, err);
      m.errors.push(err);
      return m; // can't continue
    }

    var docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];
    var docStyleParsers = {};
    docstyle.forEach(function (style) {
      docStyleParsers[style] = availableDocStyleParsers[style];
    });

    // attempt to collect module doc
    ast.comments.some(function (c) {
      if (c.type !== 'Block') return false;
      try {
        var doc = doctrine.parse(c.value, { unwrap: true });
        if (doc.tags.some(function (t) {
          return t.title === 'module';
        })) {
          m.doc = doc;
          return true;
        }
      } catch (err) {/* ignore */}
      return false;
    });

    var namespaces = new _es6Map2.default();

    function remotePath(node) {
      return (0, _resolve.relative)(node.source.value, path, context.settings);
    }

    function resolveImport(node) {
      var rp = remotePath(node);
      if (rp == null) return null;
      return ExportMap.for(rp, context);
    }

    function getNamespace(identifier) {
      if (!namespaces.has(identifier.name)) return;

      return function () {
        return resolveImport(namespaces.get(identifier.name));
      };
    }

    function addNamespace(object, identifier) {
      var nsfn = getNamespace(identifier);
      if (nsfn) {
        Object.defineProperty(object, 'namespace', { get: nsfn });
      }

      return object;
    }

    ast.body.forEach(function (n) {

      if (n.type === 'ExportDefaultDeclaration') {
        var exportMeta = captureDoc(docStyleParsers, n);
        if (n.declaration.type === 'Identifier') {
          addNamespace(exportMeta, n.declaration);
        }
        m.namespace.set('default', exportMeta);
        return;
      }

      if (n.type === 'ExportAllDeclaration') {
        var _ret = function () {
          var remoteMap = remotePath(n);
          if (remoteMap == null) return {
              v: void 0
            };
          m.dependencies.set(remoteMap, function () {
            return ExportMap.for(remoteMap, context);
          });
          return {
            v: void 0
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }

      // capture namespaces in case of later export
      if (n.type === 'ImportDeclaration') {
        var ns = void 0;
        if (n.specifiers.some(function (s) {
          return s.type === 'ImportNamespaceSpecifier' && (ns = s);
        })) {
          namespaces.set(ns.local.name, n);
        }
        return;
      }

      if (n.type === 'ExportNamedDeclaration') {
        // capture declaration
        if (n.declaration != null) {
          switch (n.declaration.type) {
            case 'FunctionDeclaration':
            case 'ClassDeclaration':
            case 'TypeAlias':
              // flowtype with babel-eslint parser
              m.namespace.set(n.declaration.id.name, captureDoc(docStyleParsers, n));
              break;
            case 'VariableDeclaration':
              n.declaration.declarations.forEach(function (d) {
                return recursivePatternCapture(d.id, function (id) {
                  return m.namespace.set(id.name, captureDoc(docStyleParsers, d, n));
                });
              });
              break;
          }
        }

        n.specifiers.forEach(function (s) {
          var exportMeta = {};
          var local = void 0;

          switch (s.type) {
            case 'ExportDefaultSpecifier':
              if (!n.source) return;
              local = 'default';
              break;
            case 'ExportNamespaceSpecifier':
              m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', {
                get: function get() {
                  return resolveImport(n);
                }
              }));
              return;
            case 'ExportSpecifier':
              if (!n.source) {
                m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local));
                return;
              }
            // else falls through
            default:
              local = s.local.name;
              break;
          }

          // todo: JSDoc
          m.reexports.set(s.exported.name, { local: local, getImport: function getImport() {
              return resolveImport(n);
            } });
        });
      }
    });

    return m;
  };

  /**
   * Note that this does not check explicitly re-exported names for existence
   * in the base namespace, but it will expand all `export * from '...'` exports
   * if not found in the explicit namespace.
   * @param  {string}  name
   * @return {Boolean} true if `name` is exported by this module.
   */


  ExportMap.prototype.has = function has(name) {
    if (this.namespace.has(name)) return true;
    if (this.reexports.has(name)) return true;

    // default exports must be explicitly re-exported (#328)
    var foundInnerMapName = false;
    if (name !== 'default') {
      this.dependencies.forEach(function (dep) {
        if (!foundInnerMapName) {
          var innerMap = dep();

          // todo: report as unresolved?
          if (innerMap && innerMap.has(name)) foundInnerMapName = true;
        }
      });
    }

    return foundInnerMapName;
  };

  /**
   * ensure that imported name fully resolves.
   * @param  {[type]}  name [description]
   * @return {Boolean}      [description]
   */


  ExportMap.prototype.hasDeep = function hasDeep(name) {
    var _this = this;

    if (this.namespace.has(name)) return { found: true, path: [this] };

    if (this.reexports.has(name)) {
      var _reexports$get = this.reexports.get(name);

      var local = _reexports$get.local;
      var getImport = _reexports$get.getImport;
      var imported = getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] };

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && local === name) return { found: false, path: [this] };

      var deep = imported.hasDeep(local);
      deep.path.unshift(this);

      return deep;
    }

    // default exports must be explicitly re-exported (#328)
    var returnValue = { found: false, path: [this] };
    if (name !== 'default') {
      this.dependencies.forEach(function (dep) {
        if (!returnValue.found) {
          var innerMap = dep();
          // todo: report as unresolved?
          if (innerMap) {

            // safeguard against cycles
            if (innerMap.path !== _this.path) {

              var innerValue = innerMap.hasDeep(name);
              if (innerValue.found) {
                innerValue.path.unshift(_this);
                returnValue = innerValue;
              }
            }
          }
        }
      });
    }

    return returnValue;
  };

  ExportMap.prototype.get = function get(name) {
    var _this2 = this;

    if (this.namespace.has(name)) return this.namespace.get(name);

    if (this.reexports.has(name)) {
      var _reexports$get2 = this.reexports.get(name);

      var local = _reexports$get2.local;
      var getImport = _reexports$get2.getImport;
      var imported = getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) return null;

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && local === name) return undefined;

      return imported.get(local);
    }

    // default exports must be explicitly re-exported (#328)
    var returnValue = undefined;
    if (name !== 'default') {
      this.dependencies.forEach(function (dep) {
        if (returnValue === undefined) {
          var innerMap = dep();
          // todo: report as unresolved?
          if (innerMap) {

            // safeguard against cycles
            if (innerMap.path !== _this2.path) {

              var innerValue = innerMap.get(name);
              if (innerValue !== undefined) returnValue = innerValue;
            }
          }
        }
      });
    }

    return returnValue;
  };

  ExportMap.prototype.forEach = function forEach(callback, thisArg) {
    var _this3 = this;

    this.namespace.forEach(function (v, n) {
      return callback.call(thisArg, v, n, _this3);
    });

    this.reexports.forEach(function (_ref, name) {
      var getImport = _ref.getImport;
      var local = _ref.local;

      var reexported = getImport();
      // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(local), name, _this3);
    });

    this.dependencies.forEach(function (dep) {
      return dep().forEach(function (v, n) {
        return n !== 'default' && callback.call(thisArg, v, n, _this3);
      });
    });
  };

  // todo: keys, values, entries?

  ExportMap.prototype.reportErrors = function reportErrors(context, declaration) {
    context.report({
      node: declaration.source,
      message: 'Parse errors in imported module \'' + declaration.source.value + '\': ' + ('' + this.errors.map(function (e) {
        return e.message + ' (' + e.lineNumber + ':' + e.column + ')';
      }).join(', '))
    });
  };

  _createClass(ExportMap, [{
    key: 'hasDefault',
    get: function get() {
      return this.get('default') != null;
    } // stronger than this.has

  }, {
    key: 'size',
    get: function get() {
      var size = this.namespace.size + this.reexports.size;
      this.dependencies.forEach(function (dep) {
        return size += dep().size;
      });
      return size;
    }
  }]);

  return ExportMap;
}();

/**
 * parse docs from the first node that has leading comments
 * @param  {...[type]} nodes [description]
 * @return {{doc: object}}
 */


exports.default = ExportMap;
function captureDoc(docStyleParsers) {
  var metadata = {};

  // 'some' short-circuits on first 'true'

  for (var _len = arguments.length, nodes = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    nodes[_key - 1] = arguments[_key];
  }

  nodes.some(function (n) {
    if (!n.leadingComments) return false;

    for (var name in docStyleParsers) {
      var doc = docStyleParsers[name](n.leadingComments);
      if (doc) {
        metadata.doc = doc;
      }
    }

    return true;
  });

  return metadata;
}

var availableDocStyleParsers = {
  jsdoc: captureJsDoc,
  tomdoc: captureTomDoc
};

/**
 * parse JSDoc from leading comments
 * @param  {...[type]} comments [description]
 * @return {{doc: object}}
 */
function captureJsDoc(comments) {
  var doc = void 0;

  // capture XSDoc
  comments.forEach(function (comment) {
    // skip non-block comments
    if (comment.value.slice(0, 4) !== '*\n *') return;
    try {
      doc = doctrine.parse(comment.value, { unwrap: true });
    } catch (err) {
      /* don't care, for now? maybe add to `errors?` */
    }
  });

  return doc;
}

/**
  * parse TomDoc section from comments
  */
function captureTomDoc(comments) {
  // collect lines up to first paragraph break
  var lines = [];
  for (var i = 0; i < comments.length; i++) {
    var comment = comments[i];
    if (comment.value.match(/^\s*$/)) break;
    lines.push(comment.value.trim());
  }

  // return doctrine-like object
  var statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);
  if (statusMatch) {
    return {
      description: statusMatch[2],
      tags: [{
        title: statusMatch[1].toLowerCase(),
        description: statusMatch[2]
      }]
    };
  }
}

/**
 * Traverse a pattern/identifier node, calling 'callback'
 * for each leaf identifier.
 * @param  {node}   pattern
 * @param  {Function} callback
 * @return {void}
 */
function recursivePatternCapture(pattern, callback) {
  switch (pattern.type) {
    case 'Identifier':
      // base case
      callback(pattern);
      break;

    case 'ObjectPattern':
      pattern.properties.forEach(function (_ref2) {
        var value = _ref2.value;

        recursivePatternCapture(value, callback);
      });
      break;

    case 'ArrayPattern':
      pattern.elements.forEach(function (element) {
        if (element == null) return;
        recursivePatternCapture(element, callback);
      });
      break;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvZ2V0RXhwb3J0cy5qcyJdLCJuYW1lcyI6WyJyZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZSIsImZzIiwiZG9jdHJpbmUiLCJsb2ciLCJleHBvcnRDYWNoZSIsImhhc0V4cG9ydHMiLCJSZWdFeHAiLCJFeHBvcnRNYXAiLCJwYXRoIiwibmFtZXNwYWNlIiwicmVleHBvcnRzIiwiZGVwZW5kZW5jaWVzIiwiZXJyb3JzIiwiZ2V0Iiwic291cmNlIiwiY29udGV4dCIsImZvciIsImV4cG9ydE1hcCIsImNhY2hlS2V5Iiwic2V0dGluZ3MiLCJwYXJzZXJQYXRoIiwicGFyc2VyT3B0aW9ucyIsImRpZ2VzdCIsInN0YXRzIiwic3RhdFN5bmMiLCJtdGltZSIsInNldCIsImNvbnRlbnQiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsInRlc3QiLCJwYXJzZSIsIm0iLCJhc3QiLCJlcnIiLCJwdXNoIiwiZG9jc3R5bGUiLCJkb2NTdHlsZVBhcnNlcnMiLCJmb3JFYWNoIiwic3R5bGUiLCJhdmFpbGFibGVEb2NTdHlsZVBhcnNlcnMiLCJjb21tZW50cyIsInNvbWUiLCJjIiwidHlwZSIsImRvYyIsInZhbHVlIiwidW53cmFwIiwidGFncyIsInQiLCJ0aXRsZSIsIm5hbWVzcGFjZXMiLCJyZW1vdGVQYXRoIiwibm9kZSIsInJlc29sdmVJbXBvcnQiLCJycCIsImdldE5hbWVzcGFjZSIsImlkZW50aWZpZXIiLCJoYXMiLCJuYW1lIiwiYWRkTmFtZXNwYWNlIiwib2JqZWN0IiwibnNmbiIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiYm9keSIsIm4iLCJleHBvcnRNZXRhIiwiY2FwdHVyZURvYyIsImRlY2xhcmF0aW9uIiwicmVtb3RlTWFwIiwibnMiLCJzcGVjaWZpZXJzIiwicyIsImxvY2FsIiwiaWQiLCJkZWNsYXJhdGlvbnMiLCJkIiwiZXhwb3J0ZWQiLCJnZXRJbXBvcnQiLCJmb3VuZElubmVyTWFwTmFtZSIsImRlcCIsImlubmVyTWFwIiwiaGFzRGVlcCIsImZvdW5kIiwiaW1wb3J0ZWQiLCJkZWVwIiwidW5zaGlmdCIsInJldHVyblZhbHVlIiwiaW5uZXJWYWx1ZSIsInVuZGVmaW5lZCIsImNhbGxiYWNrIiwidGhpc0FyZyIsInYiLCJjYWxsIiwicmVleHBvcnRlZCIsInJlcG9ydEVycm9ycyIsInJlcG9ydCIsIm1lc3NhZ2UiLCJtYXAiLCJlIiwibGluZU51bWJlciIsImNvbHVtbiIsImpvaW4iLCJzaXplIiwibWV0YWRhdGEiLCJub2RlcyIsImxlYWRpbmdDb21tZW50cyIsImpzZG9jIiwiY2FwdHVyZUpzRG9jIiwidG9tZG9jIiwiY2FwdHVyZVRvbURvYyIsImNvbW1lbnQiLCJzbGljZSIsImxpbmVzIiwiaSIsImxlbmd0aCIsIm1hdGNoIiwidHJpbSIsInN0YXR1c01hdGNoIiwiZGVzY3JpcHRpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdHRlcm4iLCJwcm9wZXJ0aWVzIiwiZWxlbWVudHMiLCJlbGVtZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQWdkZ0JBLHVCLEdBQUFBLHVCOztBQWhkaEI7Ozs7QUFFQTs7SUFBWUMsRTs7QUFFWjs7QUFDQTs7SUFBWUMsUTs7QUFFWjs7OztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOzs7Ozs7OztBQUVBLElBQU1DLE1BQU0scUJBQU0sZ0NBQU4sQ0FBWjs7QUFFQSxJQUFNQyxjQUFjLHNCQUFwQjs7QUFFQTs7Ozs7O0FBTUEsSUFBTUMsYUFBYSxJQUFJQyxNQUFKLENBQVcsZ0NBQVgsQ0FBbkI7O0lBRXFCQyxTO0FBQ25CLHFCQUFZQyxJQUFaLEVBQWtCO0FBQUE7O0FBQ2hCLFNBQUtBLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsc0JBQWpCO0FBQ0E7QUFDQSxTQUFLQyxTQUFMLEdBQWlCLHNCQUFqQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0Isc0JBQXBCO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLEVBQWQ7QUFDRDs7WUFVTUMsRyxnQkFBSUMsTSxFQUFRQyxPLEVBQVM7O0FBRTFCLFFB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QmMsS0FBaEIsQ0FBc0IsdUNBQXRCLENBQXBCO0FBQ0EsTUFBSUUsV0FBSixFQUFpQjtBQUNmLFdBQU87QUFDTEMsbUJBQWFELFlBQVksQ0FBWixDQURSO0FBRUx2RSxZQUFNLENBQUM7QUFDTEUsZUFBT3FFLFlBQVksQ0FBWixFQUFlRSxXQUFmLEVBREY7QUFFTEQscUJBQWFELFlBQVksQ0FBWjtBQUZSLE9BQUQ7QUFGRCxLQUFQO0FBT0Q7QUFDRjs7QUFFRDs7Ozs7OztBQU9PLFNBQVN2SCx1QkFBVCxDQUFpQzBILE9BQWpDLEVBQTBDL0IsUUFBMUMsRUFBb0Q7QUFDekQsVUFBUStCLFFBQVE5RSxJQUFoQjtBQUNFLFNBQUssWUFBTDtBQUFtQjtBQUNqQitDLGVBQVMrQixPQUFUO0FBQ0E7O0FBRUYsU0FBSyxlQUFMO0FBQ0VBLGNBQVFDLFVBQVIsQ0FBbUJyRixPQUFuQixDQUEyQixpQkFBZTtBQUFBLFlBQVpRLEtBQVksU0FBWkEsS0FBWTs7QUFDeEM5QyxnQ0FBd0I4QyxLQUF4QixFQUErQjZDLFFBQS9CO0FBQ0QsT0FGRDtBQUdBOztBQUVGLFNBQUssY0FBTDtBQUNFK0IsY0FBUUUsUUFBUixDQUFpQnRGLE9BQWpCLENBQXlCLFVBQUN1RixPQUFELEVBQWE7QUFDcEMsWUFBSUEsV0FBVyxJQUFmLEVBQXFCO0FBQ3JCN0gsZ0NBQXdCNkgsT0FBeEIsRUFBaUNsQyxRQUFqQztBQUNELE9BSEQ7QUFJQTtBQWhCSjtBQWtCRCIsImZpbGUiOiJjb3JlL2dldEV4cG9ydHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTWFwIGZyb20gJ2VzNi1tYXAnXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuXG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSAnY3J5cHRvJ1xuaW1wb3J0ICogYXMgZG9jdHJpbmUgZnJvbSAnZG9jdHJpbmUnXG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1ZydcblxuaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UnXG5pbXBvcnQgcmVzb2x2ZSwgeyByZWxhdGl2ZSBhcyByZXNvbHZlUmVsYXRpdmUgfSBmcm9tICcuL3Jlc29sdmUnXG5pbXBvcnQgaXNJZ25vcmVkLCB7IGhhc1ZhbGlkRXh0ZW5zaW9uIH0gZnJvbSAnLi9pZ25vcmUnXG5cbmltcG9ydCB7IGhhc2hPYmplY3QgfSBmcm9tICcuL2hhc2gnXG5cbmNvbnN0IGxvZyA9IGRlYnVnKCdlc2xpbnQtcGx1Z2luLWltcG9ydDpFeHBvcnRNYXAnKVxuXG5jb25zdCBleHBvcnRDYWNoZSA9IG5ldyBNYXAoKVxuXG4vKipcbiAqIGRldGVjdCBleHBvcnRzIHdpdGhvdXQgYSBmdWxsIHBhcnNlLlxuICogdXNlZCBwcmltYXJpbHkgdG8gaWdub3JlIHRoZSBpbXBvcnQvaWdub3JlIHNldHRpbmcsIGlpZiBpdCBsb29rcyBsaWtlXG4gKiB0aGVyZSBtaWdodCBiZSBzb21ldGhpbmcgdGhlcmUgKGkuZS4sIGpzbmV4dDptYWluIGlzIHNldCkuXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG5jb25zdCBoYXNFeHBvcnRzID0gbmV3IFJlZ0V4cCgnKF58W1xcXFxuO10pXFxcXHMqZXhwb3J0XFxcXHNbXFxcXHd7Kl0nKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFeHBvcnRNYXAge1xuICBjb25zdHJ1Y3RvcihwYXRoKSB7XG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMubmFtZXNwYWNlID0gbmV3IE1hcCgpXG4gICAgLy8gdG9kbzogcmVzdHJ1Y3R1cmUgdG8ga2V5IG9uIHBhdGgsIHZhbHVlIGlzIHJlc29sdmVyICsgbWFwIG9mIG5hbWVzXG4gICAgdGhpcy5yZWV4cG9ydHMgPSBuZXcgTWFwKClcbiAgICB0aGlzLmRlcGVuZGVuY2llcyA9IG5ldyBNYXAoKVxuICAgIHRoaXMuZXJyb3JzID0gW11cbiAgfVxuXG4gIGdldCBoYXNEZWZhdWx0KCkgeyByZXR1cm4gdGhpcy5nZXQoJ2RlZmF1bHQnKSAhPSBudWxsIH0gLy8gc3Ryb25nZXIgdGhhbiB0aGlzLmhhc1xuXG4gIGdldCBzaXplKCkge1xuICAgIGxldCBzaXplID0gdGhpcy5uYW1lc3BhY2Uuc2l6ZSArIHRoaXMucmVleHBvcnRzLnNpemVcbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiBzaXplICs9IGRlcCgpLnNpemUpXG4gICAgcmV0dXJuIHNpemVcbiAgfVxuXG4gIHN0YXRpYyBnZXQoc291cmNlLCBjb250ZXh0KSB7XG5cbiAgICB2YXIgcGF0aCA9IHJlc29sdmUoc291cmNlLCBjb250ZXh0KVxuICAgIGlmIChwYXRoID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgICByZXR1cm4gRXhwb3J0TWFwLmZvcihwYXRoLCBjb250ZXh0KVxuICB9XG5cbiAgc3RhdGljIGZvcihwYXRoLCBjb250ZXh0KSB7XG4gICAgbGV0IGV4cG9ydE1hcFxuXG4gICAgY29uc3QgY2FjaGVLZXkgPSBoYXNoT2JqZWN0KGNyZWF0ZUhhc2goJ3NoYTI1NicpLCB7XG4gICAgICBzZXR0aW5nczogY29udGV4dC5zZXR0aW5ncyxcbiAgICAgIHBhcnNlclBhdGg6IGNvbnRleHQucGFyc2VyUGF0aCxcbiAgICAgIHBhcnNlck9wdGlvbnM6IGNvbnRleHQucGFyc2VyT3B0aW9ucyxcbiAgICAgIHBhdGgsXG4gICAgfSkuZGlnZXN0KCdoZXgnKVxuXG4gICAgZXhwb3J0TWFwID0gZXhwb3J0Q2FjaGUuZ2V0KGNhY2hlS2V5KVxuXG4gICAgLy8gcmV0dXJuIGNhY2hlZCBpZ25vcmVcbiAgICBpZiAoZXhwb3J0TWFwID09PSBudWxsKSByZXR1cm4gbnVsbFxuXG4gICAgY29uc3Qgc3RhdHMgPSBmcy5zdGF0U3luYyhwYXRoKVxuICAgIGlmIChleHBvcnRNYXAgIT0gbnVsbCkge1xuICAgICAgLy8gZGF0ZSBlcXVhbGl0eSBjaGVja1xuICAgICAgaWYgKGV4cG9ydE1hcC5tdGltZSAtIHN0YXRzLm10aW1lID09PSAwKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRNYXBcbiAgICAgIH1cbiAgICAgIC8vIGZ1dHVyZTogY2hlY2sgY29udGVudCBlcXVhbGl0eT9cbiAgICB9XG5cbiAgICAvLyBjaGVjayB2YWxpZCBleHRlbnNpb25zIGZpcnN0XG4gICAgaWYgKCFoYXNWYWxpZEV4dGVuc2lvbihwYXRoLCBjb250ZXh0KSkge1xuICAgICAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KVxuXG4gICAgLy8gY2hlY2sgZm9yIGFuZCBjYWNoZSBpZ25vcmVcbiAgICBpZiAoaXNJZ25vcmVkKHBhdGgsIGNvbnRleHQpICYmICFoYXNFeHBvcnRzLnRlc3QoY29udGVudCkpIHtcbiAgICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgbnVsbClcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgZXhwb3J0TWFwID0gRXhwb3J0TWFwLnBhcnNlKHBhdGgsIGNvbnRlbnQsIGNvbnRleHQpXG4gICAgZXhwb3J0TWFwLm10aW1lID0gc3RhdHMubXRpbWVcblxuICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgZXhwb3J0TWFwKVxuICAgIHJldHVybiBleHBvcnRNYXBcbiAgfVxuXG4gIHN0YXRpYyBwYXJzZShwYXRoLCBjb250ZW50LCBjb250ZXh0KSB7XG4gICAgdmFyIG0gPSBuZXcgRXhwb3J0TWFwKHBhdGgpXG5cbiAgICB0cnkge1xuICAgICAgdmFyIGFzdCA9IHBhcnNlKHBhdGgsIGNvbnRlbnQsIGNvbnRleHQpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2coJ3BhcnNlIGVycm9yOicsIHBhdGgsIGVycilcbiAgICAgIG0uZXJyb3JzLnB1c2goZXJyKVxuICAgICAgcmV0dXJuIG0gLy8gY2FuJ3QgY29udGludWVcbiAgICB9XG5cbiAgICBjb25zdCBkb2NzdHlsZSA9IChjb250ZXh0LnNldHRpbmdzICYmIGNvbnRleHQuc2V0dGluZ3NbJ2ltcG9ydC9kb2NzdHlsZSddKSB8fCBbJ2pzZG9jJ11cbiAgICBjb25zdCBkb2NTdHlsZVBhcnNlcnMgPSB7fVxuICAgIGRvY3N0eWxlLmZvckVhY2goc3R5bGUgPT4ge1xuICAgICAgZG9jU3R5bGVQYXJzZXJzW3N0eWxlXSA9IGF2YWlsYWJsZURvY1N0eWxlUGFyc2Vyc1tzdHlsZV1cbiAgICB9KVxuXG4gICAgLy8gYXR0ZW1wdCB0byBjb2xsZWN0IG1vZHVsZSBkb2NcbiAgICBhc3QuY29tbWVudHMuc29tZShjID0+IHtcbiAgICAgIGlmIChjLnR5cGUgIT09ICdCbG9jaycpIHJldHVybiBmYWxzZVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZG9jID0gZG9jdHJpbmUucGFyc2UoYy52YWx1ZSwgeyB1bndyYXA6IHRydWUgfSlcbiAgICAgICAgaWYgKGRvYy50YWdzLnNvbWUodCA9PiB0LnRpdGxlID09PSAnbW9kdWxlJykpIHtcbiAgICAgICAgICBtLmRvYyA9IGRvY1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikgeyAvKiBpZ25vcmUgKi8gfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSlcblxuICAgIGNvbnN0IG5hbWVzcGFjZXMgPSBuZXcgTWFwKClcblxuICAgIGZ1bmN0aW9uIHJlbW90ZVBhdGgobm9kZSkge1xuICAgICAgcmV0dXJuIHJlc29sdmVSZWxhdGl2ZShub2RlLnNvdXJjZS52YWx1ZSwgcGF0aCwgY29udGV4dC5zZXR0aW5ncylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlSW1wb3J0KG5vZGUpIHtcbiAgICAgIGNvbnN0IHJwID0gcmVtb3RlUGF0aChub2RlKVxuICAgICAgaWYgKHJwID09IG51bGwpIHJldHVybiBudWxsXG4gICAgICByZXR1cm4gRXhwb3J0TWFwLmZvcihycCwgY29udGV4dClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROYW1lc3BhY2UoaWRlbnRpZmllcikge1xuICAgICAgaWYgKCFuYW1lc3BhY2VzLmhhcyhpZGVudGlmaWVyLm5hbWUpKSByZXR1cm5cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVJbXBvcnQobmFtZXNwYWNlcy5nZXQoaWRlbnRpZmllci5uYW1lKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGROYW1lc3BhY2Uob2JqZWN0LCBpZGVudGlmaWVyKSB7XG4gICAgICBjb25zdCBuc2ZuID0gZ2V0TmFtZXNwYWNlKGlkZW50aWZpZXIpXG4gICAgICBpZiAobnNmbikge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnbmFtZXNwYWNlJywgeyBnZXQ6IG5zZm4gfSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9iamVjdFxuICAgIH1cblxuXG4gICAgYXN0LmJvZHkuZm9yRWFjaChmdW5jdGlvbiAobikge1xuXG4gICAgICBpZiAobi50eXBlID09PSAnRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uJykge1xuICAgICAgICBjb25zdCBleHBvcnRNZXRhID0gY2FwdHVyZURvYyhkb2NTdHlsZVBhcnNlcnMsIG4pXG4gICAgICAgIGlmIChuLmRlY2xhcmF0aW9uLnR5cGUgPT09ICdJZGVudGlmaWVyJykge1xuICAgICAgICAgIGFkZE5hbWVzcGFjZShleHBvcnRNZXRhLCBuLmRlY2xhcmF0aW9uKVxuICAgICAgICB9XG4gICAgICAgIG0ubmFtZXNwYWNlLnNldCgnZGVmYXVsdCcsIGV4cG9ydE1ldGEpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAobi50eXBlID09PSAnRXhwb3J0QWxsRGVjbGFyYXRpb24nKSB7XG4gICAgICAgIGxldCByZW1vdGVNYXAgPSByZW1vdGVQYXRoKG4pXG4gICAgICAgIGlmIChyZW1vdGVNYXAgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgIG0uZGVwZW5kZW5jaWVzLnNldChyZW1vdGVNYXAsICgpID0+IEV4cG9ydE1hcC5mb3IocmVtb3RlTWFwLCBjb250ZXh0KSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIGNhcHR1cmUgbmFtZXNwYWNlcyBpbiBjYXNlIG9mIGxhdGVyIGV4cG9ydFxuICAgICAgaWYgKG4udHlwZSA9PT0gJ0ltcG9ydERlY2xhcmF0aW9uJykge1xuICAgICAgICBsZXQgbnNcbiAgICAgICAgaWYgKG4uc3BlY2lmaWVycy5zb21lKHMgPT4gcy50eXBlID09PSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJyAmJiAobnMgPSBzKSkpIHtcbiAgICAgICAgICBuYW1lc3BhY2VzLnNldChucy5sb2NhbC5uYW1lLCBuKVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAobi50eXBlID09PSAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbicpe1xuICAgICAgICAvLyBjYXB0dXJlIGRlY2xhcmF0aW9uXG4gICAgICAgIGlmIChuLmRlY2xhcmF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICBzd2l0Y2ggKG4uZGVjbGFyYXRpb24udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnRnVuY3Rpb25EZWNsYXJhdGlvbic6XG4gICAgICAgICAgICBjYXNlICdDbGFzc0RlY2xhcmF0aW9uJzpcbiAgICAgICAgICAgIGNhc2UgJ1R5cGVBbGlhcyc6IC8vIGZsb3d0eXBlIHdpdGggYmFiZWwtZXNsaW50IHBhcnNlclxuICAgICAgICAgICAgICBtLm5hbWVzcGFjZS5zZXQobi5kZWNsYXJhdGlvbi5pZC5uYW1lLCBjYXB0dXJlRG9jKGRvY1N0eWxlUGFyc2VycywgbikpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdWYXJpYWJsZURlY2xhcmF0aW9uJzpcbiAgICAgICAgICAgICAgbi5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMuZm9yRWFjaCgoZCkgPT5cbiAgICAgICAgICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShkLmlkLCBpZCA9PlxuICAgICAgICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KGlkLm5hbWUsIGNhcHR1cmVEb2MoZG9jU3R5bGVQYXJzZXJzLCBkLCBuKSkpKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG4uc3BlY2lmaWVycy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgICAgY29uc3QgZXhwb3J0TWV0YSA9IHt9XG4gICAgICAgICAgbGV0IGxvY2FsXG5cbiAgICAgICAgICBzd2l0Y2ggKHMudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnRXhwb3J0RGVmYXVsdFNwZWNpZmllcic6XG4gICAgICAgICAgICAgIGlmICghbi5zb3VyY2UpIHJldHVyblxuICAgICAgICAgICAgICBsb2NhbCA9ICdkZWZhdWx0J1xuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnRXhwb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzpcbiAgICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KHMuZXhwb3J0ZWQubmFtZSwgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydE1ldGEsICduYW1lc3BhY2UnLCB7XG4gICAgICAgICAgICAgICAgZ2V0KCkgeyByZXR1cm4gcmVzb2x2ZUltcG9ydChuKSB9LFxuICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBjYXNlICdFeHBvcnRTcGVjaWZpZXInOlxuICAgICAgICAgICAgICBpZiAoIW4uc291cmNlKSB7XG4gICAgICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KHMuZXhwb3J0ZWQubmFtZSwgYWRkTmFtZXNwYWNlKGV4cG9ydE1ldGEsIHMubG9jYWwpKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGVsc2UgZmFsbHMgdGhyb3VnaFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgbG9jYWwgPSBzLmxvY2FsLm5hbWVcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyB0b2RvOiBKU0RvY1xuICAgICAgICAgIG0ucmVleHBvcnRzLnNldChzLmV4cG9ydGVkLm5hbWUsIHsgbG9jYWwsIGdldEltcG9ydDogKCkgPT4gcmVzb2x2ZUltcG9ydChuKSB9KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gbVxuICB9XG5cbiAgLyoqXG4gICAqIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IGNoZWNrIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgbmFtZXMgZm9yIGV4aXN0ZW5jZVxuICAgKiBpbiB0aGUgYmFzZSBuYW1lc3BhY2UsIGJ1dCBpdCB3aWxsIGV4cGFuZCBhbGwgYGV4cG9ydCAqIGZyb20gJy4uLidgIGV4cG9ydHNcbiAgICogaWYgbm90IGZvdW5kIGluIHRoZSBleHBsaWNpdCBuYW1lc3BhY2UuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gIG5hbWVcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgbmFtZWAgaXMgZXhwb3J0ZWQgYnkgdGhpcyBtb2R1bGUuXG4gICAqL1xuICBoYXMobmFtZSkge1xuICAgIGlmICh0aGlzLm5hbWVzcGFjZS5oYXMobmFtZSkpIHJldHVybiB0cnVlXG4gICAgaWYgKHRoaXMucmVleHBvcnRzLmhhcyhuYW1lKSkgcmV0dXJuIHRydWVcblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgbGV0IGZvdW5kSW5uZXJNYXBOYW1lID0gZmFsc2VcbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKChkZXApID0+IHtcbiAgICAgICAgaWYgKCFmb3VuZElubmVyTWFwTmFtZSkge1xuICAgICAgICAgIGxldCBpbm5lck1hcCA9IGRlcCgpXG5cbiAgICAgICAgICAvLyB0b2RvOiByZXBvcnQgYXMgdW5yZXNvbHZlZD9cbiAgICAgICAgICBpZiAoaW5uZXJNYXAgJiYgaW5uZXJNYXAuaGFzKG5hbWUpKSBmb3VuZElubmVyTWFwTmFtZSA9IHRydWVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gZm91bmRJbm5lck1hcE5hbWVcbiAgfVxuXG4gIC8qKlxuICAgKiBlbnN1cmUgdGhhdCBpbXBvcnRlZCBuYW1lIGZ1bGx5IHJlc29sdmVzLlxuICAgKiBAcGFyYW0gIHtbdHlwZV19ICBuYW1lIFtkZXNjcmlwdGlvbl1cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gICAgICBbZGVzY3JpcHRpb25dXG4gICAqL1xuICBoYXNEZWVwKG5hbWUpIHtcbiAgICBpZiAodGhpcy5uYW1lc3BhY2UuaGFzKG5hbWUpKSByZXR1cm4geyBmb3VuZDogdHJ1ZSwgcGF0aDogW3RoaXNdIH1cblxuICAgIGlmICh0aGlzLnJlZXhwb3J0cy5oYXMobmFtZSkpIHtcbiAgICAgIGNvbnN0IHsgbG9jYWwsIGdldEltcG9ydCB9ID0gdGhpcy5yZWV4cG9ydHMuZ2V0KG5hbWUpXG4gICAgICAgICAgLCBpbXBvcnRlZCA9IGdldEltcG9ydCgpXG5cbiAgICAgIC8vIGlmIGltcG9ydCBpcyBpZ25vcmVkLCByZXR1cm4gZXhwbGljaXQgJ251bGwnXG4gICAgICBpZiAoaW1wb3J0ZWQgPT0gbnVsbCkgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9XG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgbG9jYWwgPT09IG5hbWUpIHJldHVybiB7IGZvdW5kOiBmYWxzZSwgcGF0aDogW3RoaXNdIH1cblxuICAgICAgY29uc3QgZGVlcCA9IGltcG9ydGVkLmhhc0RlZXAobG9jYWwpXG4gICAgICBkZWVwLnBhdGgudW5zaGlmdCh0aGlzKVxuXG4gICAgICByZXR1cm4gZGVlcFxuICAgIH1cblxuXG4gICAgLy8gZGVmYXVsdCBleHBvcnRzIG11c3QgYmUgZXhwbGljaXRseSByZS1leHBvcnRlZCAoIzMyOClcbiAgICBsZXQgcmV0dXJuVmFsdWUgPSB7IGZvdW5kOiBmYWxzZSwgcGF0aDogW3RoaXNdIH1cbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKChkZXApID0+IHtcbiAgICAgICAgaWYgKCFyZXR1cm5WYWx1ZS5mb3VuZCkge1xuICAgICAgICAgIGxldCBpbm5lck1hcCA9IGRlcCgpXG4gICAgICAgICAgLy8gdG9kbzogcmVwb3J0IGFzIHVucmVzb2x2ZWQ/XG4gICAgICAgICAgaWYgKGlubmVyTWFwKSB7XG5cbiAgICAgICAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlc1xuICAgICAgICAgICAgaWYgKGlubmVyTWFwLnBhdGggIT09IHRoaXMucGF0aCkge1xuXG4gICAgICAgICAgICAgIGxldCBpbm5lclZhbHVlID0gaW5uZXJNYXAuaGFzRGVlcChuYW1lKVxuICAgICAgICAgICAgICBpZiAoaW5uZXJWYWx1ZS5mb3VuZCkge1xuICAgICAgICAgICAgICAgIGlubmVyVmFsdWUucGF0aC51bnNoaWZ0KHRoaXMpXG4gICAgICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBpbm5lclZhbHVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHJldHVyblZhbHVlXG4gIH1cblxuICBnZXQobmFtZSkge1xuICAgIGlmICh0aGlzLm5hbWVzcGFjZS5oYXMobmFtZSkpIHJldHVybiB0aGlzLm5hbWVzcGFjZS5nZXQobmFtZSlcblxuICAgIGlmICh0aGlzLnJlZXhwb3J0cy5oYXMobmFtZSkpIHtcbiAgICAgIGNvbnN0IHsgbG9jYWwsIGdldEltcG9ydCB9ID0gdGhpcy5yZWV4cG9ydHMuZ2V0KG5hbWUpXG4gICAgICAgICAgLCBpbXBvcnRlZCA9IGdldEltcG9ydCgpXG5cbiAgICAgIC8vIGlmIGltcG9ydCBpcyBpZ25vcmVkLCByZXR1cm4gZXhwbGljaXQgJ251bGwnXG4gICAgICBpZiAoaW1wb3J0ZWQgPT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICAgICAgLy8gc2FmZWd1YXJkIGFnYWluc3QgY3ljbGVzLCBvbmx5IGlmIG5hbWUgbWF0Y2hlc1xuICAgICAgaWYgKGltcG9ydGVkLnBhdGggPT09IHRoaXMucGF0aCAmJiBsb2NhbCA9PT0gbmFtZSkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgICByZXR1cm4gaW1wb3J0ZWQuZ2V0KGxvY2FsKVxuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgbGV0IHJldHVyblZhbHVlID0gdW5kZWZpbmVkXG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgdGhpcy5kZXBlbmRlbmNpZXMuZm9yRWFjaCgoZGVwKSA9PiB7XG4gICAgICAgIGlmIChyZXR1cm5WYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbGV0IGlubmVyTWFwID0gZGVwKClcbiAgICAgICAgICAvLyB0b2RvOiByZXBvcnQgYXMgdW5yZXNvbHZlZD9cbiAgICAgICAgICBpZiAoaW5uZXJNYXApIHtcblxuICAgICAgICAgICAgLy8gc2FmZWd1YXJkIGFnYWluc3QgY3ljbGVzXG4gICAgICAgICAgICBpZiAoaW5uZXJNYXAucGF0aCAhPT0gdGhpcy5wYXRoKSB7XG5cbiAgICAgICAgICAgICAgbGV0IGlubmVyVmFsdWUgPSBpbm5lck1hcC5nZXQobmFtZSlcbiAgICAgICAgICAgICAgaWYgKGlubmVyVmFsdWUgIT09IHVuZGVmaW5lZCkgcmV0dXJuVmFsdWUgPSBpbm5lclZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICB9XG5cbiAgZm9yRWFjaChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHRoaXMubmFtZXNwYWNlLmZvckVhY2goKHYsIG4pID0+XG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHYsIG4sIHRoaXMpKVxuXG4gICAgdGhpcy5yZWV4cG9ydHMuZm9yRWFjaCgoeyBnZXRJbXBvcnQsIGxvY2FsIH0sIG5hbWUpID0+IHtcbiAgICAgIGNvbnN0IHJlZXhwb3J0ZWQgPSBnZXRJbXBvcnQoKVxuICAgICAgLy8gY2FuJ3QgbG9vayB1cCBtZXRhIGZvciBpZ25vcmVkIHJlLWV4cG9ydHMgKCMzNDgpXG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHJlZXhwb3J0ZWQgJiYgcmVleHBvcnRlZC5nZXQobG9jYWwpLCBuYW1lLCB0aGlzKVxuICAgIH0pXG5cbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiBkZXAoKS5mb3JFYWNoKCh2LCBuKSA9PlxuICAgICAgbiAhPT0gJ2RlZmF1bHQnICYmIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdiwgbiwgdGhpcykpKVxuICB9XG5cbiAgLy8gdG9kbzoga2V5cywgdmFsdWVzLCBlbnRyaWVzP1xuXG4gIHJlcG9ydEVycm9ycyhjb250ZXh0LCBkZWNsYXJhdGlvbikge1xuICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgIG5vZGU6IGRlY2xhcmF0aW9uLnNvdXJjZSxcbiAgICAgIG1lc3NhZ2U6IGBQYXJzZSBlcnJvcnMgaW4gaW1wb3J0ZWQgbW9kdWxlICcke2RlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZX0nOiBgICtcbiAgICAgICAgICAgICAgICAgIGAke3RoaXMuZXJyb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKGUgPT4gYCR7ZS5tZXNzYWdlfSAoJHtlLmxpbmVOdW1iZXJ9OiR7ZS5jb2x1bW59KWApXG4gICAgICAgICAgICAgICAgICAgICAgICAuam9pbignLCAnKX1gLFxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBwYXJzZSBkb2NzIGZyb20gdGhlIGZpcnN0IG5vZGUgdGhhdCBoYXMgbGVhZGluZyBjb21tZW50c1xuICogQHBhcmFtICB7Li4uW3R5cGVdfSBub2RlcyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHt7ZG9jOiBvYmplY3R9fVxuICovXG5mdW5jdGlvbiBjYXB0dXJlRG9jKGRvY1N0eWxlUGFyc2VycywgLi4ubm9kZXMpIHtcbiAgY29uc3QgbWV0YWRhdGEgPSB7fVxuXG4gIC8vICdzb21lJyBzaG9ydC1jaXJjdWl0cyBvbiBmaXJzdCAndHJ1ZSdcbiAgbm9kZXMuc29tZShuID0+IHtcbiAgICBpZiAoIW4ubGVhZGluZ0NvbW1lbnRzKSByZXR1cm4gZmFsc2VcblxuICAgIGZvciAobGV0IG5hbWUgaW4gZG9jU3R5bGVQYXJzZXJzKSB7XG4gICAgICBjb25zdCBkb2MgPSBkb2NTdHlsZVBhcnNlcnNbbmFtZV0obi5sZWFkaW5nQ29tbWVudHMpXG4gICAgICBpZiAoZG9jKSB7XG4gICAgICAgIG1ldGFkYXRhLmRvYyA9IGRvY1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH0pXG5cbiAgcmV0dXJuIG1ldGFkYXRhXG59XG5cbmNvbnN0IGF2YWlsYWJsZURvY1N0eWxlUGFyc2VycyA9IHtcbiAganNkb2M6IGNhcHR1cmVKc0RvYyxcbiAgdG9tZG9jOiBjYXB0dXJlVG9tRG9jLFxufVxuXG4vKipcbiAqIHBhcnNlIEpTRG9jIGZyb20gbGVhZGluZyBjb21tZW50c1xuICogQHBhcmFtICB7Li4uW3R5cGVdfSBjb21tZW50cyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHt7ZG9jOiBvYmplY3R9fVxuICovXG5mdW5jdGlvbiBjYXB0dXJlSnNEb2MoY29tbWVudHMpIHtcbiAgbGV0IGRvY1xuXG4gIC8vIGNhcHR1cmUgWFNEb2NcbiAgY29tbWVudHMuZm9yRWFjaChjb21tZW50ID0+IHtcbiAgICAvLyBza2lwIG5vbi1ibG9jayBjb21tZW50c1xuICAgIGlmIChjb21tZW50LnZhbHVlLnNsaWNlKDAsIDQpICE9PSAnKlxcbiAqJykgcmV0dXJuXG4gICAgdHJ5IHtcbiAgICAgIGRvYyA9IGRvY3RyaW5lLnBhcnNlKGNvbW1lbnQudmFsdWUsIHsgdW53cmFwOiB0cnVlIH0pXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvKiBkb24ndCBjYXJlLCBmb3Igbm93PyBtYXliZSBhZGQgdG8gYGVycm9ycz9gICovXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBkb2Ncbn1cblxuLyoqXG4gICogcGFyc2UgVG9tRG9jIHNlY3Rpb24gZnJvbSBjb21tZW50c1xuICAqL1xuZnVuY3Rpb24gY2FwdHVyZVRvbURvYyhjb21tZW50cykge1xuICAvLyBjb2xsZWN0IGxpbmVzIHVwIHRvIGZpcnN0IHBhcmFncmFwaCBicmVha1xuICBjb25zdCBsaW5lcyA9IFtdXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjb21tZW50ID0gY29tbWVudHNbaV1cbiAgICBpZiAoY29tbWVudC52YWx1ZS5tYXRjaCgvXlxccyokLykpIGJyZWFrXG4gICAgbGluZXMucHVzaChjb21tZW50LnZhbHVlLnRyaW0oKSlcbiAgfVxuXG4gIC8vIHJldHVybiBkb2N0cmluZS1saWtlIG9iamVjdFxuICBjb25zdCBzdGF0dXNNYXRjaCA9IGxpbmVzLmpvaW4oJyAnKS5tYXRjaCgvXihQdWJsaWN8SW50ZXJuYWx8RGVwcmVjYXRlZCk6XFxzKiguKykvKVxuICBpZiAoc3RhdHVzTWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGVzY3JpcHRpb246IHN0YXR1c01hdGNoWzJdLFxuICAgICAgdGFnczogW3tcbiAgICAgICAgdGl0bGU6IHN0YXR1c01hdGNoWzFdLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdGF0dXNNYXRjaFsyXSxcbiAgICAgIH1dLFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlIGEgcGF0dGVybi9pZGVudGlmaWVyIG5vZGUsIGNhbGxpbmcgJ2NhbGxiYWNrJ1xuICogZm9yIGVhY2ggbGVhZiBpZGVudGlmaWVyLlxuICogQHBhcmFtICB7bm9kZX0gICBwYXR0ZXJuXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShwYXR0ZXJuLCBjYWxsYmFjaykge1xuICBzd2l0Y2ggKHBhdHRlcm4udHlwZSkge1xuICAgIGNhc2UgJ0lkZW50aWZpZXInOiAvLyBiYXNlIGNhc2VcbiAgICAgIGNhbGxiYWNrKHBhdHRlcm4pXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnT2JqZWN0UGF0dGVybic6XG4gICAgICBwYXR0ZXJuLnByb3BlcnRpZXMuZm9yRWFjaCgoeyB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKHZhbHVlLCBjYWxsYmFjaylcbiAgICAgIH0pXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnQXJyYXlQYXR0ZXJuJzpcbiAgICAgIHBhdHRlcm4uZWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudCA9PSBudWxsKSByZXR1cm5cbiAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoZWxlbWVudCwgY2FsbGJhY2spXG4gICAgICB9KVxuICAgICAgYnJlYWtcbiAgfVxufVxuIl19