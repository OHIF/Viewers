'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash.endswith');

var _lodash2 = _interopRequireDefault(_lodash);

var _has = require('has');

var _has2 = _interopRequireDefault(_has);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _resolve = require('../core/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _importType = require('../core/importType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (context) {
  var configuration = context.options[0] || 'never';
  var defaultConfig = typeof configuration === 'string' ? configuration : null;
  var modifiers = (0, _objectAssign2.default)({}, (typeof configuration === 'undefined' ? 'undefined' : _typeof(configuration)) === 'object' ? configuration : context.options[1]);

  function isUseOfExtensionRequired(extension) {
    if (!(0, _has2.default)(modifiers, extension)) {
      modifiers[extension] = defaultConfig;
    }
    return modifiers[extension] === 'always';
  }

  function isUseOfExtensionForbidden(extension) {
    if (!(0, _has2.default)(modifiers, extension)) {
      modifiers[extension] = defaultConfig;
    }
    return modifiers[extension] === 'never';
  }

  function isResolvableWithoutExtension(file) {
    var extension = _path2.default.extname(file);
    var fileWithoutExtension = file.slice(0, -extension.length);
    var resolvedFileWithoutExtension = (0, _resolve2.default)(fileWithoutExtension, context);

    return resolvedFileWithoutExtension === (0, _resolve2.default)(file, context);
  }

  function checkFileExtension(node) {
    var source = node.source;

    var importPath = source.value;

    // don't enforce anything on builtins
    if ((0, _importType.isBuiltIn)(importPath, context.settings)) return;

    var resolvedPath = (0, _resolve2.default)(importPath, context);

    // get extension from resolved path, if possible.
    // for unresolved, use source value.
    var extension = _path2.default.extname(resolvedPath || importPath).substring(1);

    if (!extension || !(0, _lodash2.default)(importPath, extension)) {
      if (isUseOfExtensionRequired(extension) && !isUseOfExtensionForbidden(extension)) {
        context.report({
          node: source,
          message: 'Missing file extension ' + (extension ? '"' + extension + '" ' : '') + 'for "' + importPath + '"'
        });
      }
    } else if (extension) {
      if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath)) {
        context.report({
          node: source,
          message: 'Unexpected use of file extension "' + extension + '" for "' + importPath + '"'
        });
      }
    }
  }

  return {
    ImportDeclaration: checkFileExtension
  };
};

var enumValues = { enum: ['always', 'never'] };
var patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues }
};

module.exports.schema = {
  anyOf: [{
    type: 'array',
    items: [enumValues],
    additionalItems: false
  }, {
    type: 'array',
    items: [patternProperties],
    additionalItems: false
  }, {
    type: 'array',
    items: [enumValues, patternProperties],
    additionalItems: false
  }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2V4dGVuc2lvbnMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImNvbnRleHQiLCJjb25maWd1cmF0aW9uIiwib3B0aW9ucyIsImRlZmF1bHRDb25maWciLCJtb2RpZmllcnMiLCJpc1VzZU9mRXh0ZW5zaW9uUmVxdWlyZWQiLCJleHRlbnNpb24iLCJpc1VzZU9mRXh0ZW5zaW9uRm9yYmlkZGVuIiwiaXNSZXNvbHZhYmxlV2l0aG91dEV4dGVuc2lvbiIsImZpbGUiLCJleHRuYW1lIiwiZmlsZVdpdGhvdXRFeHRlbnNpb24iLCJzbGljZSIsImxlbmd0aCIsInJlc29sdmVkRmlsZVdpdGhvdXRFeHRlbnNpb24iLCJjaGVja0ZpbGVFeHRlbnNpb24iLCJub2RlIiwic291cmNlIiwiaW1wb3J0UGF0aCIsInZhbHVlIiwic2V0dGluZ3MiLCJyZXNvbHZlZFBhdGgiLCJzdWJzdHJpbmciLCJyZXBvcnQiLCJtZXNzYWdlIiwiSW1wb3J0RGVjbGFyYXRpb24iLCJlbnVtVmFsdWVzIiwiZW51bSIsInBhdHRlcm5Qcm9wZXJ0aWVzIiwidHlwZSIsInNjaGVtYSIsImFueU9mIiwiaXRlbXMiLCJhZGRpdGlvbmFsSXRlbXMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOzs7O0FBQ0E7Ozs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQixVQUFVQyxPQUFWLEVBQW1CO0FBQ2xDLE1BQU1DLGdCQUFnQkQsUUFBUUUsT0FBUixDQUFnQixDQUFoQixLQUFzQixPQUE1QztBQUNBLE1BQU1DLGdCQUFnQixPQUFPRixhQUFQLEtBQXlCLFFBQXpCLEdBQW9DQSxhQUFwQyxHQUFvRCxJQUExRTtBQUNBLE1BQU1HLFlBQVksNEJBQ2hCLEVBRGdCLEVBRWhCLFFBQU9ILGFBQVAseUNBQU9BLGFBQVAsT0FBeUIsUUFBekIsR0FBb0NBLGFBQXBDLEdBQW9ERCxRQUFRRSxPQUFSLENBQWdCLENBQWhCLENBRnBDLENBQWxC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eEIiLCJmaWxlIjoicnVsZXMvZXh0ZW5zaW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZW5kc1dpdGggZnJvbSAnbG9kYXNoLmVuZHN3aXRoJ1xuaW1wb3J0IGhhcyBmcm9tICdoYXMnXG5pbXBvcnQgYXNzaWduIGZyb20gJ29iamVjdC1hc3NpZ24nXG5cbmltcG9ydCByZXNvbHZlIGZyb20gJy4uL2NvcmUvcmVzb2x2ZSdcbmltcG9ydCB7IGlzQnVpbHRJbiB9IGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICBjb25zdCBjb25maWd1cmF0aW9uID0gY29udGV4dC5vcHRpb25zWzBdIHx8ICduZXZlcidcbiAgY29uc3QgZGVmYXVsdENvbmZpZyA9IHR5cGVvZiBjb25maWd1cmF0aW9uID09PSAnc3RyaW5nJyA/IGNvbmZpZ3VyYXRpb24gOiBudWxsXG4gIGNvbnN0IG1vZGlmaWVycyA9IGFzc2lnbihcbiAgICB7fSxcbiAgICB0eXBlb2YgY29uZmlndXJhdGlvbiA9PT0gJ29iamVjdCcgPyBjb25maWd1cmF0aW9uIDogY29udGV4dC5vcHRpb25zWzFdXG4gIClcblxuICBmdW5jdGlvbiBpc1VzZU9mRXh0ZW5zaW9uUmVxdWlyZWQoZXh0ZW5zaW9uKSB7XG4gICAgaWYgKCFoYXMobW9kaWZpZXJzLCBleHRlbnNpb24pKSB7IG1vZGlmaWVyc1tleHRlbnNpb25dID0gZGVmYXVsdENvbmZpZyB9XG4gICAgcmV0dXJuIG1vZGlmaWVyc1tleHRlbnNpb25dID09PSAnYWx3YXlzJ1xuICB9XG5cbiAgZnVuY3Rpb24gaXNVc2VPZkV4dGVuc2lvbkZvcmJpZGRlbihleHRlbnNpb24pIHtcbiAgICBpZiAoIWhhcyhtb2RpZmllcnMsIGV4dGVuc2lvbikpIHsgbW9kaWZpZXJzW2V4dGVuc2lvbl0gPSBkZWZhdWx0Q29uZmlnIH1cbiAgICByZXR1cm4gbW9kaWZpZXJzW2V4dGVuc2lvbl0gPT09ICduZXZlcidcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzUmVzb2x2YWJsZVdpdGhvdXRFeHRlbnNpb24oZmlsZSkge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IHBhdGguZXh0bmFtZShmaWxlKVxuICAgIGNvbnN0IGZpbGVXaXRob3V0RXh0ZW5zaW9uID0gZmlsZS5zbGljZSgwLCAtZXh0ZW5zaW9uLmxlbmd0aClcbiAgICBjb25zdCByZXNvbHZlZEZpbGVXaXRob3V0RXh0ZW5zaW9uID0gcmVzb2x2ZShmaWxlV2l0aG91dEV4dGVuc2lvbiwgY29udGV4dClcblxuICAgIHJldHVybiByZXNvbHZlZEZpbGVXaXRob3V0RXh0ZW5zaW9uID09PSByZXNvbHZlKGZpbGUsIGNvbnRleHQpXG4gIH1cblxuICBmdW5jdGlvbiBjaGVja0ZpbGVFeHRlbnNpb24obm9kZSkge1xuICAgIGNvbnN0IHsgc291cmNlIH0gPSBub2RlXG4gICAgY29uc3QgaW1wb3J0UGF0aCA9IHNvdXJjZS52YWx1ZVxuXG4gICAgLy8gZG9uJ3QgZW5mb3JjZSBhbnl0aGluZyBvbiBidWlsdGluc1xuICAgIGlmIChpc0J1aWx0SW4oaW1wb3J0UGF0aCwgY29udGV4dC5zZXR0aW5ncykpIHJldHVyblxuXG4gICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShpbXBvcnRQYXRoLCBjb250ZXh0KVxuXG4gICAgLy8gZ2V0IGV4dGVuc2lvbiBmcm9tIHJlc29sdmVkIHBhdGgsIGlmIHBvc3NpYmxlLlxuICAgIC8vIGZvciB1bnJlc29sdmVkLCB1c2Ugc291cmNlIHZhbHVlLlxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IHBhdGguZXh0bmFtZShyZXNvbHZlZFBhdGggfHwgaW1wb3J0UGF0aCkuc3Vic3RyaW5nKDEpXG5cbiAgICBpZiAoIWV4dGVuc2lvbiB8fCAhZW5kc1dpdGgoaW1wb3J0UGF0aCwgZXh0ZW5zaW9uKSkge1xuICAgICAgaWYgKGlzVXNlT2ZFeHRlbnNpb25SZXF1aXJlZChleHRlbnNpb24pICYmICFpc1VzZU9mRXh0ZW5zaW9uRm9yYmlkZGVuKGV4dGVuc2lvbikpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHNvdXJjZSxcbiAgICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgICAgYE1pc3NpbmcgZmlsZSBleHRlbnNpb24gJHtleHRlbnNpb24gPyBgXCIke2V4dGVuc2lvbn1cIiBgIDogJyd9Zm9yIFwiJHtpbXBvcnRQYXRofVwiYCxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGV4dGVuc2lvbikge1xuICAgICAgaWYgKGlzVXNlT2ZFeHRlbnNpb25Gb3JiaWRkZW4oZXh0ZW5zaW9uKSAmJiBpc1Jlc29sdmFibGVXaXRob3V0RXh0ZW5zaW9uKGltcG9ydFBhdGgpKSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICBub2RlOiBzb3VyY2UsXG4gICAgICAgICAgbWVzc2FnZTogYFVuZXhwZWN0ZWQgdXNlIG9mIGZpbGUgZXh0ZW5zaW9uIFwiJHtleHRlbnNpb259XCIgZm9yIFwiJHtpbXBvcnRQYXRofVwiYCxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIEltcG9ydERlY2xhcmF0aW9uOiBjaGVja0ZpbGVFeHRlbnNpb24sXG4gIH1cbn1cblxuY29uc3QgZW51bVZhbHVlcyA9IHsgZW51bTogWyAnYWx3YXlzJywgJ25ldmVyJyBdIH1cbmNvbnN0IHBhdHRlcm5Qcm9wZXJ0aWVzID0ge1xuICB0eXBlOiAnb2JqZWN0JyxcbiAgcGF0dGVyblByb3BlcnRpZXM6IHsgJy4qJzogZW51bVZhbHVlcyB9LFxufVxuXG5tb2R1bGUuZXhwb3J0cy5zY2hlbWEgPSB7XG4gIGFueU9mOiBbXG4gICAge1xuICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgIGl0ZW1zOiBbZW51bVZhbHVlc10sXG4gICAgICBhZGRpdGlvbmFsSXRlbXM6IGZhbHNlLFxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgIGl0ZW1zOiBbcGF0dGVyblByb3BlcnRpZXNdLFxuICAgICAgYWRkaXRpb25hbEl0ZW1zOiBmYWxzZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICBpdGVtczogW1xuICAgICAgICBlbnVtVmFsdWVzLFxuICAgICAgICBwYXR0ZXJuUHJvcGVydGllcyxcbiAgICAgIF0sXG4gICAgICBhZGRpdGlvbmFsSXRlbXM6IGZhbHNlLFxuICAgIH0sXG4gIF0sXG59XG4iXX0=