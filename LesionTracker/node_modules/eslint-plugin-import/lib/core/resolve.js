'use strict';

exports.__esModule = true;
exports.CASE_SENSITIVE_FS = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.relative = relative;
exports.default = resolve;

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _es6Set = require('es6-set');

var _es6Set2 = _interopRequireDefault(_es6Set);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _pkgDir = require('pkg-dir');

var _pkgDir2 = _interopRequireDefault(_pkgDir);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _crypto = require('crypto');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CASE_SENSITIVE_FS = exports.CASE_SENSITIVE_FS = !_fs2.default.existsSync(path.join(__dirname, 'reSOLVE.js'));

var fileExistsCache = new _es6Map2.default();

function cachePath(cacheKey, result) {
  fileExistsCache.set(cacheKey, { result: result, lastSeen: Date.now() });
}

function checkCache(cacheKey, _ref) {
  var lifetime = _ref.lifetime;

  if (fileExistsCache.has(cacheKey)) {
    var _fileExistsCache$get = fileExistsCache.get(cacheKey);

    var result = _fileExistsCache$get.result;
    var lastSeen = _fileExistsCache$get.lastSeen;
    // check fresness

    if (Date.now() - lastSeen < lifetime * 1000) return result;
  }
  // cache miss
  return undefined;
}

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath, cacheSettings) {
  // don't care if the FS is case-sensitive
  if (CASE_SENSITIVE_FS) return true;

  // null means it resolved to a builtin
  if (filepath === null) return true;

  var dir = path.dirname(filepath);

  var result = checkCache(filepath, cacheSettings);
  if (result != null) return result;

  // base case
  if (dir === '/' || dir === '.' || /^[A-Z]:\\$/i.test(dir)) {
    result = true;
  } else {
    var filenames = _fs2.default.readdirSync(dir);
    if (filenames.indexOf(path.basename(filepath)) === -1) {
      result = false;
    } else {
      result = fileExistsWithCaseSync(dir, cacheSettings);
    }
  }
  cachePath(filepath, result);
  return result;
}

function relative(modulePath, sourceFile, settings) {
  return fullResolve(modulePath, sourceFile, settings).path;
}

function fullResolve(modulePath, sourceFile, settings) {
  // check if this is a bonus core module
  var coreSet = new _es6Set2.default(settings['import/core-modules']);
  if (coreSet != null && coreSet.has(modulePath)) return { found: true, path: null };

  var sourceDir = path.dirname(sourceFile),
      cacheKey = sourceDir + hashObject(settings) + modulePath;

  var cacheSettings = (0, _objectAssign2.default)({
    lifetime: 30 }, settings['import/cache']);

  // parse infinity
  if (cacheSettings.lifetime === '∞' || cacheSettings.lifetime === 'Infinity') {
    cacheSettings.lifetime = Infinity;
  }

  var cachedPath = checkCache(cacheKey, cacheSettings);
  if (cachedPath !== undefined) return { found: true, path: cachedPath };

  function cache(resolvedPath) {
    cachePath(cacheKey, resolvedPath);
  }

  function withResolver(resolver, config) {

    function v1() {
      try {
        var _resolved = resolver.resolveImport(modulePath, sourceFile, config);
        if (_resolved === undefined) return { found: false };
        return { found: true, path: _resolved };
      } catch (err) {
        return { found: false };
      }
    }

    function v2() {
      return resolver.resolve(modulePath, sourceFile, config);
    }

    switch (resolver.interfaceVersion) {
      case 2:
        return v2();

      default:
      case 1:
        return v1();
    }
  }

  var configResolvers = settings['import/resolver'] || { 'node': settings['import/resolve'] }; // backward compatibility

  var resolvers = resolverReducer(configResolvers, new _es6Map2.default());

  var resolved = { found: false };
  resolvers.forEach(function (config, name) {
    if (!resolved.found) {
      var resolver = requireResolver(name, sourceFile);
      resolved = withResolver(resolver, config);
      if (resolved.found) {
        // resolvers imply file existence, this double-check just ensures the case matches
        if (fileExistsWithCaseSync(resolved.path, cacheSettings)) {
          // else, counts
          cache(resolved.path);
        } else {
          resolved = { found: false };
        }
      }
    }
  });

  return resolved;
}

function resolverReducer(resolvers, map) {
  if (resolvers instanceof Array) {
    resolvers.forEach(function (r) {
      return resolverReducer(r, map);
    });
    return map;
  }

  if (typeof resolvers === 'string') {
    map.set(resolvers, null);
    return map;
  }

  if ((typeof resolvers === 'undefined' ? 'undefined' : _typeof(resolvers)) === 'object') {
    for (var key in resolvers) {
      map.set(key, resolvers[key]);
    }
    return map;
  }

  throw new Error('invalid resolver config');
}

function requireResolver(name, sourceFile) {
  // Try to resolve package with conventional name
  try {
    return require('eslint-import-resolver-' + name);
  } catch (err) {} /* continue */

  // Try to resolve package with custom name (@myorg/resolver-name)
  try {
    return require(name);
  } catch (err) {} /* continue */

  // Try to resolve package with path, relative to closest package.json
  // or current working directory
  try {
    var baseDir = _pkgDir2.default.sync(sourceFile) || process.cwd();
    // absolute paths ignore base, so this covers both
    return require(path.resolve(baseDir, name));
  } catch (err) {} /* continue */

  // all else failed
  throw new Error('unable to load resolver "' + name + '".');
}

var erroredContexts = new _es6Set2.default();

/**
 * Given
 * @param  {string} p - module path
 * @param  {object} context - ESLint context
 * @return {string} - the full module filesystem path;
 *                    null if package is core;
 *                    undefined if not found
 */
function resolve(p, context) {
  try {
    return relative(p, context.getFilename(), context.settings);
  } catch (err) {
    if (!erroredContexts.has(context)) {
      context.report({
        message: 'Resolve error: ' + err.message,
        loc: { line: 1, col: 0 }
      });
      erroredContexts.add(context);
    }
  }
}
resolve.relative = relative;

function hashObject(object) {
  var settingsShasum = (0, _crypto.createHash)('sha1');
  settingsShasum.update(JSON.stringify(object));
  return settingsShasum.digest('hex');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvcmVzb2x2ZS5qcyJdLCJuYW1lcyI6WyJyZWxhdGl2ZSIsInJlc29sdmUiLCJwYXRoIiwiQ0FTRV9TRU5TSVRJVkVfRlMiLCJleGlzdHNTeW5jIiwiam9pbiIsIl9fZGlybmFtZSIsImZpbGVFeGlzdHNDYWNoZSIsImNhY2hlUGF0aCIsImNhY2hlS2V5IiwicmVzdWx0Iiwic2V0IiwibGFzdFNlZW4iLCJEYXRlIiwibm93IiwiY2hlY2tDYWNoZSIsImxpZmV0aW1lIiwiaGFzIiwiZ2V0IiwidW5kZWZpbmVkIiwiZmlsZUV4aXN0c1dpdGhDYXNlU3luYyIsImZpbGVwYXRoIiwiY2FjaGVTZXR0aW5ncyIsImRpciIsImRpcm5hbWUiLCJ0ZXN0IiwiZmlsZW5hbWVzIiwicmVhZGRpclN5bmMiLCJpbmRleE9mIiwiYmFzZW5hbWUiLCJtb2R1bGVQYXRoIiwic291cmNlRmlsZSIsInNldHRpbmdzIiwiZnVsbFJlc29sdmUiLCJjb3JlU2V0IiwiZm91bmQiLCJzb3VyY2VEaXIiLCJoYXNoT2JqZWN0IiwiSW5maW5pdHkiLCJjYWNoZWRQYXRoIiwiY2FjaGUiLCJyZXNvbHZlZFBhdGgiLCJ3aXRoUmVzb2x2ZXIiLCJyZXNvbHZlciIsImNvbmZpZyIsInYxIiwicmVzb2x2ZWQiLCJyZXNvbHZlSW1wb3J0IiwiZXJyIiwidjIiLCJpbnRlcmZhY2VWZXJzaW9uIiwiY29uZmlnUmVzb2x2ZXJzIiwicmVzb2x2ZXJzIiwicmVzb2x2ZXJSZWR1Y2VyIiwiZm9yRWFjaCIsIm5hbWUiLCJyZXF1aXJlUmVzb2x2ZXIiLCJtYXAiLCJBcnJheSIsInIiLCJrZXkiLCJFcnJvciIsInJlcXVpcmUiLCJiYXNlRGlyIiwic3luYyIsInByb2Nlc3MiLCJjd2QiLCJlcnJvcmVkQ29udGV4dHMiLCJwIiwiY29udGV4dCIsImdldEZpbGVuYW1lIiwicmVwb3J0IiwibWVzc2FnZSIsImxvYyIsImxpbmUiLCJjb2wiLCJhZGQiLCJvYmplY3QiLCJzZXR0aW5nc1NoYXN1bSIsInVwZGF0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RmxCLENBQVA7QUFJRCxHQUxELENBS0UsT0FBT2dCLEdBQVAsRUFBWTtBQUNaLFFBQUksQ0FBQ21CLGdCQUFnQmxELEdBQWhCLENBQW9Cb0QsT0FBcEIsQ0FBTCxFQUFtQztBQUNqQ0EsY0FBUUUsTUFBUixDQUFlO0FBQ2JDLHFDQUEyQnhCLElBQUl3QixPQURsQjtBQUViQyxhQUFLLEVBQUVDLE1BQU0sQ0FBUixFQUFXQyxLQUFLLENBQWhCO0FBRlEsT0FBZjtBQUlBUixzQkFBZ0JTLEdBQWhCLENBQW9CUCxPQUFwQjtBQUNEO0FBQ0Y7QUFDRjtBQUNEcEUsUUFBUUQsUUFBUixHQUFtQkEsUUFBbkI7O0FBSUEsU0FBU3FDLFVBQVQsQ0FBb0J3QyxNQUFwQixFQUE0QjtBQUMxQixNQUFNQyxpQkFBaUIsd0JBQVcsTUFBWCxDQUF2QjtBQUNBQSxpQkFBZUMsTUFBZixDQUFzQkMsS0FBS0MsU0FBTCxDQUFlSixNQUFmLENBQXRCO0FBQ0EsU0FBT0MsZUFBZUksTUFBZixDQUFzQixLQUF0QixDQUFQO0FBQ0QiLCJmaWxlIjoiY29yZS9yZXNvbHZlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE1hcCBmcm9tICdlczYtbWFwJ1xuaW1wb3J0IFNldCBmcm9tICdlczYtc2V0J1xuaW1wb3J0IGFzc2lnbiBmcm9tICdvYmplY3QtYXNzaWduJ1xuaW1wb3J0IHBrZ0RpciBmcm9tICdwa2ctZGlyJ1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5cbmV4cG9ydCBjb25zdCBDQVNFX1NFTlNJVElWRV9GUyA9ICFmcy5leGlzdHNTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdyZVNPTFZFLmpzJykpXG5cbmNvbnN0IGZpbGVFeGlzdHNDYWNoZSA9IG5ldyBNYXAoKVxuXG5mdW5jdGlvbiBjYWNoZVBhdGgoY2FjaGVLZXksIHJlc3VsdCkge1xuICBmaWxlRXhpc3RzQ2FjaGUuc2V0KGNhY2hlS2V5LCB7IHJlc3VsdCwgbGFzdFNlZW46IERhdGUubm93KCkgfSlcbn1cblxuZnVuY3Rpb24gY2hlY2tDYWNoZShjYWNoZUtleSwgeyBsaWZldGltZSB9KSB7XG4gIGlmIChmaWxlRXhpc3RzQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuICAgIGNvbnN0IHsgcmVzdWx0LCBsYXN0U2VlbiB9ID0gZmlsZUV4aXN0c0NhY2hlLmdldChjYWNoZUtleSlcbiAgICAvLyBjaGVjayBmcmVzbmVzc1xuICAgIGlmIChEYXRlLm5vdygpIC0gbGFzdFNlZW4gPCAobGlmZXRpbWUgKiAxMDAwKSkgcmV0dXJuIHJlc3VsdFxuICB9XG4gIC8vIGNhY2hlIG1pc3NcbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNzM4MjgzOFxuZnVuY3Rpb24gZmlsZUV4aXN0c1dpdGhDYXNlU3luYyhmaWxlcGF0aCwgY2FjaGVTZXR0aW5ncykge1xuICAvLyBkb24ndCBjYXJlIGlmIHRoZSBGUyBpcyBjYXNlLXNlbnNpdGl2ZVxuICBpZiAoQ0FTRV9TRU5TSVRJVkVfRlMpIHJldHVybiB0cnVlXG5cbiAgLy8gbnVsbCBtZWFucyBpdCByZXNvbHZlZCB0byBhIGJ1aWx0aW5cbiAgaWYgKGZpbGVwYXRoID09PSBudWxsKSByZXR1cm4gdHJ1ZVxuXG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShmaWxlcGF0aClcblxuICBsZXQgcmVzdWx0ID0gY2hlY2tDYWNoZShmaWxlcGF0aCwgY2FjaGVTZXR0aW5ncylcbiAgaWYgKHJlc3VsdCAhPSBudWxsKSByZXR1cm4gcmVzdWx0XG5cbiAgLy8gYmFzZSBjYXNlXG4gIGlmIChkaXIgPT09ICcvJyB8fCBkaXIgPT09ICcuJyB8fCAvXltBLVpdOlxcXFwkL2kudGVzdChkaXIpKSB7XG4gICAgcmVzdWx0ID0gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGZpbGVuYW1lcyA9IGZzLnJlYWRkaXJTeW5jKGRpcilcbiAgICBpZiAoZmlsZW5hbWVzLmluZGV4T2YocGF0aC5iYXNlbmFtZShmaWxlcGF0aCkpID09PSAtMSkge1xuICAgICAgcmVzdWx0ID0gZmFsc2VcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gZmlsZUV4aXN0c1dpdGhDYXNlU3luYyhkaXIsIGNhY2hlU2V0dGluZ3MpXG4gICAgfVxuICB9XG4gIGNhY2hlUGF0aChmaWxlcGF0aCwgcmVzdWx0KVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWxhdGl2ZShtb2R1bGVQYXRoLCBzb3VyY2VGaWxlLCBzZXR0aW5ncykge1xuICByZXR1cm4gZnVsbFJlc29sdmUobW9kdWxlUGF0aCwgc291cmNlRmlsZSwgc2V0dGluZ3MpLnBhdGhcbn1cblxuZnVuY3Rpb24gZnVsbFJlc29sdmUobW9kdWxlUGF0aCwgc291cmNlRmlsZSwgc2V0dGluZ3MpIHtcbiAgLy8gY2hlY2sgaWYgdGhpcyBpcyBhIGJvbnVzIGNvcmUgbW9kdWxlXG4gIGNvbnN0IGNvcmVTZXQgPSBuZXcgU2V0KHNldHRpbmdzWydpbXBvcnQvY29yZS1tb2R1bGVzJ10pXG4gIGlmIChjb3JlU2V0ICE9IG51bGwgJiYgY29yZVNldC5oYXMobW9kdWxlUGF0aCkpIHJldHVybiB7IGZvdW5kOiB0cnVlLCBwYXRoOiBudWxsIH1cblxuICBjb25zdCBzb3VyY2VEaXIgPSBwYXRoLmRpcm5hbWUoc291cmNlRmlsZSlcbiAgICAgICwgY2FjaGVLZXkgPSBzb3VyY2VEaXIgKyBoYXNoT2JqZWN0KHNldHRpbmdzKSArIG1vZHVsZVBhdGhcblxuICBjb25zdCBjYWNoZVNldHRpbmdzID0gYXNzaWduKHtcbiAgICBsaWZldGltZTogMzAsICAvLyBzZWNvbmRzXG4gIH0sIHNldHRpbmdzWydpbXBvcnQvY2FjaGUnXSlcblxuICAvLyBwYXJzZSBpbmZpbml0eVxuICBpZiAoY2FjaGVTZXR0aW5ncy5saWZldGltZSA9PT0gJ+KInicgfHwgY2FjaGVTZXR0aW5ncy5saWZldGltZSA9PT0gJ0luZmluaXR5Jykge1xuICAgIGNhY2hlU2V0dGluZ3MubGlmZXRpbWUgPSBJbmZpbml0eVxuICB9XG5cbiAgY29uc3QgY2FjaGVkUGF0aCA9IGNoZWNrQ2FjaGUoY2FjaGVLZXksIGNhY2hlU2V0dGluZ3MpXG4gIGlmIChjYWNoZWRQYXRoICE9PSB1bmRlZmluZWQpIHJldHVybiB7IGZvdW5kOiB0cnVlLCBwYXRoOiBjYWNoZWRQYXRoIH1cblxuICBmdW5jdGlvbiBjYWNoZShyZXNvbHZlZFBhdGgpIHtcbiAgICBjYWNoZVBhdGgoY2FjaGVLZXksIHJlc29sdmVkUGF0aClcbiAgfVxuXG4gIGZ1bmN0aW9uIHdpdGhSZXNvbHZlcihyZXNvbHZlciwgY29uZmlnKSB7XG5cbiAgICBmdW5jdGlvbiB2MSgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZXIucmVzb2x2ZUltcG9ydChtb2R1bGVQYXRoLCBzb3VyY2VGaWxlLCBjb25maWcpXG4gICAgICAgIGlmIChyZXNvbHZlZCA9PT0gdW5kZWZpbmVkKSByZXR1cm4geyBmb3VuZDogZmFsc2UgfVxuICAgICAgICByZXR1cm4geyBmb3VuZDogdHJ1ZSwgcGF0aDogcmVzb2x2ZWQgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiB7IGZvdW5kOiBmYWxzZSB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdjIoKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZXIucmVzb2x2ZShtb2R1bGVQYXRoLCBzb3VyY2VGaWxlLCBjb25maWcpXG4gICAgfVxuXG4gICAgc3dpdGNoIChyZXNvbHZlci5pbnRlcmZhY2VWZXJzaW9uKSB7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiB2MigpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiB2MSgpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgY29uZmlnUmVzb2x2ZXJzID0gKHNldHRpbmdzWydpbXBvcnQvcmVzb2x2ZXInXVxuICAgIHx8IHsgJ25vZGUnOiBzZXR0aW5nc1snaW1wb3J0L3Jlc29sdmUnXSB9KSAvLyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5cbiAgY29uc3QgcmVzb2x2ZXJzID0gcmVzb2x2ZXJSZWR1Y2VyKGNvbmZpZ1Jlc29sdmVycywgbmV3IE1hcCgpKVxuXG4gIGxldCByZXNvbHZlZCA9IHsgZm91bmQ6IGZhbHNlIH1cbiAgcmVzb2x2ZXJzLmZvckVhY2goZnVuY3Rpb24gKGNvbmZpZywgbmFtZSkgIHtcbiAgICBpZiAoIXJlc29sdmVkLmZvdW5kKSB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IHJlcXVpcmVSZXNvbHZlcihuYW1lLCBzb3VyY2VGaWxlKVxuICAgICAgcmVzb2x2ZWQgPSB3aXRoUmVzb2x2ZXIocmVzb2x2ZXIsIGNvbmZpZylcbiAgICAgIGlmIChyZXNvbHZlZC5mb3VuZCkge1xuICAgICAgICAvLyByZXNvbHZlcnMgaW1wbHkgZmlsZSBleGlzdGVuY2UsIHRoaXMgZG91YmxlLWNoZWNrIGp1c3QgZW5zdXJlcyB0aGUgY2FzZSBtYXRjaGVzXG4gICAgICAgIGlmIChmaWxlRXhpc3RzV2l0aENhc2VTeW5jKHJlc29sdmVkLnBhdGgsIGNhY2hlU2V0dGluZ3MpKSB7XG4gICAgICAgICAgLy8gZWxzZSwgY291bnRzXG4gICAgICAgICAgY2FjaGUocmVzb2x2ZWQucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlZCA9IHsgZm91bmQ6IGZhbHNlIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gcmVzb2x2ZWRcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZXJSZWR1Y2VyKHJlc29sdmVycywgbWFwKSB7XG4gIGlmIChyZXNvbHZlcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHJlc29sdmVycy5mb3JFYWNoKHIgPT4gcmVzb2x2ZXJSZWR1Y2VyKHIsIG1hcCkpXG4gICAgcmV0dXJuIG1hcFxuICB9XG5cbiAgaWYgKHR5cGVvZiByZXNvbHZlcnMgPT09ICdzdHJpbmcnKSB7XG4gICAgbWFwLnNldChyZXNvbHZlcnMsIG51bGwpXG4gICAgcmV0dXJuIG1hcFxuICB9XG5cbiAgaWYgKHR5cGVvZiByZXNvbHZlcnMgPT09ICdvYmplY3QnKSB7XG4gICAgZm9yIChsZXQga2V5IGluIHJlc29sdmVycykge1xuICAgICAgbWFwLnNldChrZXksIHJlc29sdmVyc1trZXldKVxuICAgIH1cbiAgICByZXR1cm4gbWFwXG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcmVzb2x2ZXIgY29uZmlnJylcbn1cblxuZnVuY3Rpb24gcmVxdWlyZVJlc29sdmVyKG5hbWUsIHNvdXJjZUZpbGUpIHtcbiAgLy8gVHJ5IHRvIHJlc29sdmUgcGFja2FnZSB3aXRoIGNvbnZlbnRpb25hbCBuYW1lXG4gIHRyeSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoYGVzbGludC1pbXBvcnQtcmVzb2x2ZXItJHtuYW1lfWApXG4gIH0gY2F0Y2ggKGVycikgeyAvKiBjb250aW51ZSAqLyB9XG5cbiAgLy8gVHJ5IHRvIHJlc29sdmUgcGFja2FnZSB3aXRoIGN1c3RvbSBuYW1lIChAbXlvcmcvcmVzb2x2ZXItbmFtZSlcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVxdWlyZShuYW1lKVxuICB9IGNhdGNoIChlcnIpIHsgLyogY29udGludWUgKi8gfVxuXG4gIC8vIFRyeSB0byByZXNvbHZlIHBhY2thZ2Ugd2l0aCBwYXRoLCByZWxhdGl2ZSB0byBjbG9zZXN0IHBhY2thZ2UuanNvblxuICAvLyBvciBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5XG4gIHRyeSB7XG4gICAgY29uc3QgYmFzZURpciA9IHBrZ0Rpci5zeW5jKHNvdXJjZUZpbGUpIHx8IHByb2Nlc3MuY3dkKClcbiAgICAvLyBhYnNvbHV0ZSBwYXRocyBpZ25vcmUgYmFzZSwgc28gdGhpcyBjb3ZlcnMgYm90aFxuICAgIHJldHVybiByZXF1aXJlKHBhdGgucmVzb2x2ZShiYXNlRGlyLCBuYW1lKSlcbiAgfSBjYXRjaCAoZXJyKSB7IC8qIGNvbnRpbnVlICovIH1cblxuICAvLyBhbGwgZWxzZSBmYWlsZWRcbiAgdGhyb3cgbmV3IEVycm9yKGB1bmFibGUgdG8gbG9hZCByZXNvbHZlciBcIiR7bmFtZX1cIi5gKVxufVxuXG5jb25zdCBlcnJvcmVkQ29udGV4dHMgPSBuZXcgU2V0KClcblxuLyoqXG4gKiBHaXZlblxuICogQHBhcmFtICB7c3RyaW5nfSBwIC0gbW9kdWxlIHBhdGhcbiAqIEBwYXJhbSAge29iamVjdH0gY29udGV4dCAtIEVTTGludCBjb250ZXh0XG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gdGhlIGZ1bGwgbW9kdWxlIGZpbGVzeXN0ZW0gcGF0aDtcbiAqICAgICAgICAgICAgICAgICAgICBudWxsIGlmIHBhY2thZ2UgaXMgY29yZTtcbiAqICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJlc29sdmUocCwgY29udGV4dCkge1xuICB0cnkge1xuICAgIHJldHVybiByZWxhdGl2ZSggcFxuICAgICAgICAgICAgICAgICAgICwgY29udGV4dC5nZXRGaWxlbmFtZSgpXG4gICAgICAgICAgICAgICAgICAgLCBjb250ZXh0LnNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoIWVycm9yZWRDb250ZXh0cy5oYXMoY29udGV4dCkpIHtcbiAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgbWVzc2FnZTogYFJlc29sdmUgZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCxcbiAgICAgICAgbG9jOiB7IGxpbmU6IDEsIGNvbDogMCB9LFxuICAgICAgfSlcbiAgICAgIGVycm9yZWRDb250ZXh0cy5hZGQoY29udGV4dClcbiAgICB9XG4gIH1cbn1cbnJlc29sdmUucmVsYXRpdmUgPSByZWxhdGl2ZVxuXG5cbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdjcnlwdG8nXG5mdW5jdGlvbiBoYXNoT2JqZWN0KG9iamVjdCkge1xuICBjb25zdCBzZXR0aW5nc1NoYXN1bSA9IGNyZWF0ZUhhc2goJ3NoYTEnKVxuICBzZXR0aW5nc1NoYXN1bS51cGRhdGUoSlNPTi5zdHJpbmdpZnkob2JqZWN0KSlcbiAgcmV0dXJuIHNldHRpbmdzU2hhc3VtLmRpZ2VzdCgnaGV4Jylcbn1cbiJdfQ==