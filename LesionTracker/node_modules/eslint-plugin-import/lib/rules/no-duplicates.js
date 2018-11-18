'use strict';

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _es6Set = require('es6-set');

var _es6Set2 = _interopRequireDefault(_es6Set);

var _resolve = require('../core/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function checkImports(imported, context) {
  imported.forEach(function (nodes, module) {
    if (nodes.size > 1) {
      nodes.forEach(function (node) {
        context.report(node, '\'' + module + '\' imported multiple times.');
      });
    }
  });
}

module.exports = function (context) {
  var imported = new _es6Map2.default();
  var typesImported = new _es6Map2.default();
  return {
    'ImportDeclaration': function ImportDeclaration(n) {
      // resolved path will cover aliased duplicates
      var resolvedPath = (0, _resolve2.default)(n.source.value, context) || n.source.value;
      var importMap = n.importKind === 'type' ? typesImported : imported;

      if (importMap.has(resolvedPath)) {
        importMap.get(resolvedPath).add(n.source);
      } else {
        importMap.set(resolvedPath, new _es6Set2.default([n.source]));
      }
    },

    'Program:exit': function ProgramExit() {
      checkImports(imported, context);
      checkImports(typesImported, context);
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWR1cGxpY2F0ZXMuanMiXSwibmFtZXMiOlsiY2hlY2tJbXBvcnRzIiwiaW1wb3J0ZWQiLCJjb250ZXh0IiwiZm9yRWFjaCIsIm5vZGVzIiwibW9kdWxlIiwic2l6ZSIsIm5vZGUiLCJyZXBvcnQiLCJleHBvcnRzIiwidHlwZXNJbXBvcnRlZCIsIm4iLCJyZXNvbHZlZFBhdGgiLCJzb3VyY2UiLCJ2YWx1ZSIsImltcG9ydE1hcCIsImltcG9ydEtpbmQiLCJoYXMiLCJnZXQiLCJhZGQiLCJzZXQiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7OztBQUVBOzs7Ozs7QUFFQSxTQUFTQSxZQUFULENBQXNCQyxRQUF0QixFQUFnQ0MsT0FBaEMsRUFBeUM7QUFDdkNELFdBQVNFLE9BQVQsQ0FBaUIsVUFBQ0MsS0FBRCxFQUFRQyxNQUFSLEVBQW1CO0FBQ2xDLFFBQUlELE1BQU1FLElBQU4sR0FBYSxDQUFqQixFQUFvQjtBQUNsQkYsWUFBTUQsT0FBTixDQUFjLFVBQUNJLElBQUQsRUFBVTtBQUN0QkwsZ0JBQVFNLE1BQVIsQ0FBZUQsSUFBZixTQUF5QkYsTUFBekI7QUFDRCxPQUZEO0FBR0Q7QUFDRixHQU5EO0FBT0Q7O0FBRURBLE9BQU9JLE9BQVAsR0FBaUIsVUFBVVAsT0FBVixFQUFtQjtBQUNsQyxNQUFNRCxXQUFXLHNCQUFqQjtBQUNBLE1BQU1TLGdCQUFnQixzQkFBdEI7QUFDQSxTQUFPO0FBQ0wseUJBQXFCLDJCQUFVQyxDQUFWLEVBQWE7QUFDaEM7QUFDQSxVQUFNQyxlQUFlLHVCQUFRRCxFQUFFRSxNQUFGLENBQVNDLEtBQWpCLEVBQXdCWixPQUF4QixLQUFvQ1MsRUFBRUUsTUFBRixDQUFTQyxLQUFsRTtBQUNBLFVBQU1DLFlBQVlKLEVBQUVLLFVBQUYsS0FBaUIsTUFBakIsR0FBMEJOLGFBQTFCLEdBQTBDVCxRQUE1RDs7QUFFQSxVQUFJYyxVQUFVRSxHQUFWLENBQWNMLFlBQWQsQ0FBSixFQUFpQztBQUMvQkcsa0JBQVVHLEdBQVYsQ0FBY04sWUFBZCxFQUE0Qk8sR0FBNUIsQ0FBZ0NSLEVBQUVFLE1BQWxDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xFLGtCQUFVSyxHQUFWLENBQWNSLFlBQWQsRUFBNEIscUJBQVEsQ0FBQ0QsRUFBRUUsTUFBSCxDQUFSLENBQTVCO0FBQ0Q7QUFDRixLQVhJOztBQWFMLG9CQUFnQix1QkFBWTtBQUMxQmIsbUJBQWFDLFFBQWIsRUFBdUJDLE9BQXZCO0FBQ0FGLG1CQUFhVSxhQUFiLEVBQTRCUixPQUE1QjtBQUNEO0FBaEJJLEdBQVA7QUFrQkQsQ0FyQkQiLCJmaWxlIjoicnVsZXMvbm8tZHVwbGljYXRlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNYXAgZnJvbSAnZXM2LW1hcCdcbmltcG9ydCBTZXQgZnJvbSAnZXM2LXNldCdcblxuaW1wb3J0IHJlc29sdmUgZnJvbSAnLi4vY29yZS9yZXNvbHZlJ1xuXG5mdW5jdGlvbiBjaGVja0ltcG9ydHMoaW1wb3J0ZWQsIGNvbnRleHQpIHtcbiAgaW1wb3J0ZWQuZm9yRWFjaCgobm9kZXMsIG1vZHVsZSkgPT4ge1xuICAgIGlmIChub2Rlcy5zaXplID4gMSkge1xuICAgICAgbm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICBjb250ZXh0LnJlcG9ydChub2RlLCBgJyR7bW9kdWxlfScgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXMuYClcbiAgICAgIH0pXG4gICAgfVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGNvbnN0IGltcG9ydGVkID0gbmV3IE1hcCgpXG4gIGNvbnN0IHR5cGVzSW1wb3J0ZWQgPSBuZXcgTWFwKClcbiAgcmV0dXJuIHtcbiAgICAnSW1wb3J0RGVjbGFyYXRpb24nOiBmdW5jdGlvbiAobikge1xuICAgICAgLy8gcmVzb2x2ZWQgcGF0aCB3aWxsIGNvdmVyIGFsaWFzZWQgZHVwbGljYXRlc1xuICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShuLnNvdXJjZS52YWx1ZSwgY29udGV4dCkgfHwgbi5zb3VyY2UudmFsdWVcbiAgICAgIGNvbnN0IGltcG9ydE1hcCA9IG4uaW1wb3J0S2luZCA9PT0gJ3R5cGUnID8gdHlwZXNJbXBvcnRlZCA6IGltcG9ydGVkXG5cbiAgICAgIGlmIChpbXBvcnRNYXAuaGFzKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgaW1wb3J0TWFwLmdldChyZXNvbHZlZFBhdGgpLmFkZChuLnNvdXJjZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltcG9ydE1hcC5zZXQocmVzb2x2ZWRQYXRoLCBuZXcgU2V0KFtuLnNvdXJjZV0pKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAnUHJvZ3JhbTpleGl0JzogZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2tJbXBvcnRzKGltcG9ydGVkLCBjb250ZXh0KVxuICAgICAgY2hlY2tJbXBvcnRzKHR5cGVzSW1wb3J0ZWQsIGNvbnRleHQpXG4gICAgfSxcbiAgfVxufVxuIl19