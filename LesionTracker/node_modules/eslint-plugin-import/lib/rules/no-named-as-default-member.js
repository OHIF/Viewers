'use strict';

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

var _importDeclaration = require('../importDeclaration');

var _importDeclaration2 = _interopRequireDefault(_importDeclaration);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  var fileImports = new _es6Map2.default();
  var allPropertyLookups = new _es6Map2.default();

  function handleImportDefault(node) {
    var declaration = (0, _importDeclaration2.default)(context);
    var exportMap = _getExports2.default.get(declaration.source.value, context);
    if (exportMap == null) return;

    if (exportMap.errors.length) {
      exportMap.reportErrors(context, declaration);
      return;
    }

    fileImports.set(node.local.name, {
      exportMap: exportMap,
      sourcePath: declaration.source.value
    });
  }

  function storePropertyLookup(objectName, propName, node) {
    var lookups = allPropertyLookups.get(objectName) || [];
    lookups.push({ node: node, propName: propName });
    allPropertyLookups.set(objectName, lookups);
  }

  function handlePropLookup(node) {
    var objectName = node.object.name;
    var propName = node.property.name;
    storePropertyLookup(objectName, propName, node);
  }

  function handleDestructuringAssignment(node) {
    var isDestructure = node.id.type === 'ObjectPattern' && node.init != null && node.init.type === 'Identifier';
    if (!isDestructure) return;

    var objectName = node.init.name;
    node.id.properties.forEach(function (_ref) {
      var key = _ref.key;

      if (key != null) {
        // rest properties are null
        storePropertyLookup(objectName, key.name, key);
      }
    });
  }

  function handleProgramExit() {
    allPropertyLookups.forEach(function (lookups, objectName) {
      var fileImport = fileImports.get(objectName);
      if (fileImport == null) return;

      lookups.forEach(function (_ref2) {
        var propName = _ref2.propName;
        var node = _ref2.node;

        // the default import can have a "default" property
        if (propName === 'default') {
          return;
        }
        if (fileImport.exportMap.namespace.has(propName)) {
          context.report({
            node: node,
            message: 'Caution: `' + objectName + '` also has a named export ' + ('`' + propName + '`. Check if you meant to write ') + ('`import {' + propName + '} from \'' + fileImport.sourcePath + '\'` ') + 'instead.'
          });
        }
      });
    });
  }

  return {
    'ImportDefaultSpecifier': handleImportDefault,
    'MemberExpression': handlePropLookup,
    'VariableDeclarator': handleDestructuringAssignment,
    'Program:exit': handleProgramExit
  };
}; /**
    * @fileoverview Rule to warn about potentially confused use of name exports
    * @author Desmond Brand
    * @copyright 2016 Desmond Brand. All rights reserved.
    * See LICENSE in root directory for full license.
    */
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLW5hbWVkLWFzLWRlZmF1bHQtbWVtYmVyLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJjb250ZXh0IiwiZmlsZUltcG9ydHMiLCJhbGxQcm9wZXJ0eUxvb2t1cHMiLCJoYW5kbGVJbXBvcnREZWZhdWx0Iiwibm9kZSIsImRlY2xhcmF0aW9uIiwiZXhwb3J0TWFwIiwiZ2V0Iiwic291cmNlIiwidmFsdWUiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZXBvcnRFcnJvcnMiLCJzZXQiLCJsb2NhbCIsIm5hbWUiLCJzb3VyY2VQYXRoIiwic3RvcmVQcm9wZXJ0eUxvb2t1cCIsIm9iamVjdE5hbWUiLCJwcm9wTmFtZSIsImxvb2t1cHMiLCJwdXNoIiwiaGFuZGxlUHJvcExvb2t1cCIsIm9iamVjdCIsInByb3BlcnR5IiwiaGFuZGxlRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQiLCJpc0Rlc3RydWN0dXJlIiwiaWQiLCJ0eXBlIiwiaW5pdCIsInByb3BlcnRpZXMiLCJmb3JFYWNoIiwia2V5IiwiaGFuZGxlUHJvZ3JhbUV4aXQiLCJmaWxlSW1wb3J0IiwibmFtZXNwYWNlIiwiaGFzIiwicmVwb3J0IiwibWVzc2FnZSJdLCJtYXBwaW5ncyI6Ijs7QUFPQTs7OztBQUVBOzs7O0FBQ0E7Ozs7OztBQUVBO0FBQ0E7QUFDQTs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQixVQUFTQyxPQUFULEVBQWtCOztBQUVqQyxNQUFNQyxjQUFjLHNCQUFwQjtBQUNBLE1BQU1DLHFCQUFxQixzQkFBM0I7O0FBRUEsV0FBU0MsbUJBQVQsQ0FBNkJDLElBQTdCLEVBQW1DO0FBQ2pDLFFBQU1DLGNBQWMsaUNBQWtCTCxPQUFsQixDQUFwQjtBQUNBLFFBQU1NLFlBQVkscUJBQVFDLEdBQVIsQ0FBWUYsWUFBWUcsTUFBWixDQUFtQkMsS0FBL0IsRUFBc0NULE9BQXRDLENBQWxCO0FBQ0EsUUFBSU0sYUFBYSxJQUFqQixFQUF1Qjs7QUFFdkIsUUFBSUEsVUFBVUksTUFBVixDQUFpQkMsTUFBckIsRUFBNkI7QUFDM0JMLGdCQUFVTSxZQUFWLENBQXVCWixPQUF2QixFQUFnQ0ssV0FBaEM7QUFDQTtBQUNEOztBQUVESixnQkFBWVksR0FBWixDQUFnQlQsS0FBS1UsS0FBTCxDQUFXQyxJQUEzQixFQUFpQztBQUMvQlQsMEJBRCtCO0FBRS9CVSxrQkFBWVgsWUFBWUcsTUFBWixDQUFtQkM7QUFGQSxLQUFqQztBQUlEOztBQUVELFdBQVNRLG1CQUFULENBQTZCQyxVQUE3QixFQUF5Q0MsUUFBekMsRUFBbURmLElBQW5ELEVBQXlEO0FBQ3ZELFFBQU1nQixVQUFVbEIsbUJBQW1CSyxHQUFuQixDQUF1QlcsVUFBdkIsS0FBc0MsRUFBdEQ7QUFDQUUsWUFBUUMsSUFBUixDQUFhLEVBQUNqQixVQUFELEVBQU9lLGtCQUFQLEVBQWI7QUFDQWpCLHVCQUFtQlcsR0FBbkIsQ0FBdUJLLFVBQXZCLEVBQW1DRSxPQUFuQztBQUNEOztBQUVELFdBQVNFLGdCQUFULENBQTBCbEIsSUFBMUIsRUFBZ0M7QUFDOUIsUUFBTWMsYUFBYWQsS0FBS21CLE1BQUwsQ0FBWVIsSUFBL0I7QUFDQSxRQUFNSSxXQUFXZixLQUFLb0IsUUFBTCxDQUFjVCxJQUEvQjtBQUNBRSx3QkFBb0JDLFVBQXBCLEVBQWdDQyxRQUFoQyxFQUEwQ2YsSUFBMUM7QUFDRDs7QUFFRCxXQUFTcUIsNkJBQVQsQ0FBdUNyQixJQUF2QyxFQUE2QztBQUMzQyxRQUFNc0IsZ0JBQ0p0QixLQUFLdUIsRUFBTCxDQUFRQyxJQUFSLEtBQWlCLGVBQWpCLElBQ0F4QixLQUFLeUIsSUFBTCxJQUFhLElBRGIsSUFFQXpCLEtBQUt5QixJQUFMLENBQVVELElBQVYsS0FBbUIsWUFIckI7QUFLQSxRQUFJLENBQUNGLGFBQUwsRUFBb0I7O0FBRXBCLFFBQU1SLGFBQWFkLEtBQUt5QixJQUFMLENBQVVkLElBQTdCO0FBQ0FYLFNBQUt1QixFQUFMLENBQVFHLFVBQVIsQ0FBbUJDLE9BQW5CLENBQTJCLGdCQUFXO0FBQUEsVUFBVEMsR0FBUyxRQUFUQSxHQUFTOztBQUNwQyxVQUFJQSxPQUFPLElBQVgsRUFBaUI7QUFBRTtBQUNqQmYsNEJBQW9CQyxVQUFwQixFQUFnQ2MsSUFBSWpCLElBQXBDLEVBQTBDaUIsR0FBMUM7QUFDRDtBQUNGLEtBSkQ7QUFLRDs7QUFFRCxXQUFTQyxpQkFBVCxHQUE2QjtBQUMzQi9CLHVCQUFtQjZCLE9BQW5CLENBQTJCLFVBQUNYLE9BQUQsRUFBVUYsVUFBVixFQUF5QjtBQUNsRCxVQUFNZ0IsYUFBYWpDLFlBQVlNLEdBQVosQ0FBZ0JXLFVBQWhCLENBQW5CO0FBQ0EsVUFBSWdCLGNBQWMsSUFBbEIsRUFBd0I7O0FBRXhCZCxjQUFRVyxPQUFSLENBQWdCLGlCQUFzQjtBQUFBLFlBQXBCWixRQUFvQixTQUFwQkEsUUFBb0I7QUFBQSxZQUFWZixJQUFVLFNBQVZBLElBQVU7O0FBQ3BDO0FBQ0EsWUFBSWUsYUFBYSxTQUFqQixFQUE0QjtBQUMxQjtBQUNEO0FBQ0QsWUFBSWUsV0FBVzVCLFNBQVgsQ0FBcUI2QixTQUFyQixDQUErQkMsR0FBL0IsQ0FBbUNqQixRQUFuQyxDQUFKLEVBQWtEO0FBQ2hEbkIsa0JBQVFxQyxNQUFSLENBQWU7QUFDYmpDLHNCQURhO0FBRWJrQyxxQkFDRSxlQUFjcEIsVUFBZCx5Q0FDS0MsUUFETCx1REFFYUEsUUFGYixpQkFFZ0NlLFdBQVdsQixVQUYzQyxhQUdBO0FBTlcsV0FBZjtBQVNEO0FBQ0YsT0FoQkQ7QUFpQkQsS0FyQkQ7QUFzQkQ7O0FBRUQsU0FBTztBQUNMLDhCQUEwQmIsbUJBRHJCO0FBRUwsd0JBQW9CbUIsZ0JBRmY7QUFHTCwwQkFBc0JHLDZCQUhqQjtBQUlMLG9CQUFnQlE7QUFKWCxHQUFQO0FBTUQsQ0FoRkQsQyxDQWhCQSIsImZpbGUiOiJydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHdhcm4gYWJvdXQgcG90ZW50aWFsbHkgY29uZnVzZWQgdXNlIG9mIG5hbWUgZXhwb3J0c1xuICogQGF1dGhvciBEZXNtb25kIEJyYW5kXG4gKiBAY29weXJpZ2h0IDIwMTYgRGVzbW9uZCBCcmFuZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFNlZSBMSUNFTlNFIGluIHJvb3QgZGlyZWN0b3J5IGZvciBmdWxsIGxpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IE1hcCBmcm9tICdlczYtbWFwJ1xuXG5pbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9jb3JlL2dldEV4cG9ydHMnXG5pbXBvcnQgaW1wb3J0RGVjbGFyYXRpb24gZnJvbSAnLi4vaW1wb3J0RGVjbGFyYXRpb24nXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdWxlIERlZmluaXRpb25cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY29udGV4dCkge1xuXG4gIGNvbnN0IGZpbGVJbXBvcnRzID0gbmV3IE1hcCgpXG4gIGNvbnN0IGFsbFByb3BlcnR5TG9va3VwcyA9IG5ldyBNYXAoKVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUltcG9ydERlZmF1bHQobm9kZSkge1xuICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gaW1wb3J0RGVjbGFyYXRpb24oY29udGV4dClcbiAgICBjb25zdCBleHBvcnRNYXAgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpXG4gICAgaWYgKGV4cG9ydE1hcCA9PSBudWxsKSByZXR1cm5cblxuICAgIGlmIChleHBvcnRNYXAuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgZXhwb3J0TWFwLnJlcG9ydEVycm9ycyhjb250ZXh0LCBkZWNsYXJhdGlvbilcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGZpbGVJbXBvcnRzLnNldChub2RlLmxvY2FsLm5hbWUsIHtcbiAgICAgIGV4cG9ydE1hcCxcbiAgICAgIHNvdXJjZVBhdGg6IGRlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZSxcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcmVQcm9wZXJ0eUxvb2t1cChvYmplY3ROYW1lLCBwcm9wTmFtZSwgbm9kZSkge1xuICAgIGNvbnN0IGxvb2t1cHMgPSBhbGxQcm9wZXJ0eUxvb2t1cHMuZ2V0KG9iamVjdE5hbWUpIHx8IFtdXG4gICAgbG9va3Vwcy5wdXNoKHtub2RlLCBwcm9wTmFtZX0pXG4gICAgYWxsUHJvcGVydHlMb29rdXBzLnNldChvYmplY3ROYW1lLCBsb29rdXBzKVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlUHJvcExvb2t1cChub2RlKSB7XG4gICAgY29uc3Qgb2JqZWN0TmFtZSA9IG5vZGUub2JqZWN0Lm5hbWVcbiAgICBjb25zdCBwcm9wTmFtZSA9IG5vZGUucHJvcGVydHkubmFtZVxuICAgIHN0b3JlUHJvcGVydHlMb29rdXAob2JqZWN0TmFtZSwgcHJvcE5hbWUsIG5vZGUpXG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVEZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlKSB7XG4gICAgY29uc3QgaXNEZXN0cnVjdHVyZSA9IChcbiAgICAgIG5vZGUuaWQudHlwZSA9PT0gJ09iamVjdFBhdHRlcm4nICYmXG4gICAgICBub2RlLmluaXQgIT0gbnVsbCAmJlxuICAgICAgbm9kZS5pbml0LnR5cGUgPT09ICdJZGVudGlmaWVyJ1xuICAgIClcbiAgICBpZiAoIWlzRGVzdHJ1Y3R1cmUpIHJldHVyblxuXG4gICAgY29uc3Qgb2JqZWN0TmFtZSA9IG5vZGUuaW5pdC5uYW1lXG4gICAgbm9kZS5pZC5wcm9wZXJ0aWVzLmZvckVhY2goKHtrZXl9KSA9PiB7XG4gICAgICBpZiAoa2V5ICE9IG51bGwpIHsgLy8gcmVzdCBwcm9wZXJ0aWVzIGFyZSBudWxsXG4gICAgICAgIHN0b3JlUHJvcGVydHlMb29rdXAob2JqZWN0TmFtZSwga2V5Lm5hbWUsIGtleSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlUHJvZ3JhbUV4aXQoKSB7XG4gICAgYWxsUHJvcGVydHlMb29rdXBzLmZvckVhY2goKGxvb2t1cHMsIG9iamVjdE5hbWUpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVJbXBvcnQgPSBmaWxlSW1wb3J0cy5nZXQob2JqZWN0TmFtZSlcbiAgICAgIGlmIChmaWxlSW1wb3J0ID09IG51bGwpIHJldHVyblxuXG4gICAgICBsb29rdXBzLmZvckVhY2goKHtwcm9wTmFtZSwgbm9kZX0pID0+IHtcbiAgICAgICAgLy8gdGhlIGRlZmF1bHQgaW1wb3J0IGNhbiBoYXZlIGEgXCJkZWZhdWx0XCIgcHJvcGVydHlcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsZUltcG9ydC5leHBvcnRNYXAubmFtZXNwYWNlLmhhcyhwcm9wTmFtZSkpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogKFxuICAgICAgICAgICAgICBgQ2F1dGlvbjogXFxgJHtvYmplY3ROYW1lfVxcYCBhbHNvIGhhcyBhIG5hbWVkIGV4cG9ydCBgICtcbiAgICAgICAgICAgICAgYFxcYCR7cHJvcE5hbWV9XFxgLiBDaGVjayBpZiB5b3UgbWVhbnQgdG8gd3JpdGUgYCArXG4gICAgICAgICAgICAgIGBcXGBpbXBvcnQgeyR7cHJvcE5hbWV9fSBmcm9tICcke2ZpbGVJbXBvcnQuc291cmNlUGF0aH0nXFxgIGAgK1xuICAgICAgICAgICAgICAnaW5zdGVhZC4nXG4gICAgICAgICAgICApLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInOiBoYW5kbGVJbXBvcnREZWZhdWx0LFxuICAgICdNZW1iZXJFeHByZXNzaW9uJzogaGFuZGxlUHJvcExvb2t1cCxcbiAgICAnVmFyaWFibGVEZWNsYXJhdG9yJzogaGFuZGxlRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQsXG4gICAgJ1Byb2dyYW06ZXhpdCc6IGhhbmRsZVByb2dyYW1FeGl0LFxuICB9XG59XG4iXX0=