'use strict';

var _es6Set = require('es6-set');

var _es6Set2 = _interopRequireDefault(_es6Set);

var _staticRequire = require('../core/staticRequire');

var _staticRequire2 = _interopRequireDefault(_staticRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_MAX = 10;

var countDependencies = function countDependencies(dependencies, lastNode, context) {
  var _ref = context.options[0] || { max: DEFAULT_MAX };

  var max = _ref.max;


  if (dependencies.size > max) {
    context.report(lastNode, 'Maximum number of dependencies (' + max + ') exceeded.');
  }
};

module.exports = function (context) {
  var dependencies = new _es6Set2.default(); // keep track of dependencies
  var lastNode = void 0; // keep track of the last node to report on

  return {
    ImportDeclaration: function ImportDeclaration(node) {
      dependencies.add(node.source.value);
      lastNode = node.source;
    },
    CallExpression: function CallExpression(node) {
      if ((0, _staticRequire2.default)(node)) {
        var _node$arguments = node.arguments;
        var requirePath = _node$arguments[0];

        dependencies.add(requirePath.value);
        lastNode = node;
      }
    },


    'Program:exit': function ProgramExit() {
      countDependencies(dependencies, lastNode, context);
    }
  };
};

module.exports.schema = [{
  'type': 'object',
  'properties': {
    'max': { 'type': 'number' }
  },
  'additionalProperties': false
}];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL21heC1kZXBlbmRlbmNpZXMuanMiXSwibmFtZXMiOlsiREVGQVVMVF9NQVgiLCJjb3VudERlcGVuZGVuY2llcyIsImRlcGVuZGVuY2llcyIsImxhc3ROb2RlIiwiY29udGV4dCIsIm9wdGlvbnMiLCJtYXgiLCJzaXplIiwicmVwb3J0IiwibW9kdWxlIiwiZXhwb3J0cyIsIkltcG9ydERlY2xhcmF0aW9uIiwibm9kZSIsImFkZCIsInNvdXJjZSIsInZhbHVlIiwiQ2FsbEV4cHJlc3Npb24iLCJhcmd1bWVudHMiLCJyZXF1aXJlUGF0aCIsInNjaGVtYSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOzs7Ozs7QUFFQSxJQUFNQSxjQUFjLEVBQXBCOztBQUVBLElBQU1DLG9CQUFvQixTQUFwQkEsaUJBQW9CLENBQUNDLFlBQUQsRUFBZUMsUUFBZixFQUF5QkMsT0FBekIsRUFBcUM7QUFBQSxhQUMvQ0EsUUFBUUMsT0FBUixDQUFnQixDQUFoQixLQUFzQixFQUFFQyxLQUFLTixXQUFQLEVBRHlCOztBQUFBLE1BQ3RETSxHQURzRCxRQUN0REEsR0FEc0Q7OztBQUc3RCxNQUFJSixhQUFhSyxJQUFiLEdBQW9CRCxHQUF4QixFQUE2QjtBQUMzQkYsWUFBUUksTUFBUixDQUNFTCxRQURGLHVDQUVxQ0csR0FGckM7QUFJRDtBQUNGLENBVEQ7O0FBV0FHLE9BQU9DLE9BQVAsR0FBaUIsbUJBQVc7QUFDMUIsTUFBTVIsZUFBZSxzQkFBckIsQ0FEMEIsQ0FDSztBQUMvQixNQUFJQyxpQkFBSixDQUYwQixDQUViOztBQUViLFNBQU87QUFDTFEscUJBREssNkJBQ2FDLElBRGIsRUFDbUI7QUFDdEJWLG1CQUFhVyxHQUFiLENBQWlCRCxLQUFLRSxNQUFMLENBQVlDLEtBQTdCO0FBQ0FaLGlCQUFXUyxLQUFLRSxNQUFoQjtBQUNELEtBSkk7QUFNTEUsa0JBTkssMEJBTVVKLElBTlYsRUFNZ0I7QUFDbkIsVUFBSSw2QkFBZ0JBLElBQWhCLENBQUosRUFBMkI7QUFBQSw4QkFDREEsS0FBS0ssU0FESjtBQUFBLFlBQ2pCQyxXQURpQjs7QUFFekJoQixxQkFBYVcsR0FBYixDQUFpQkssWUFBWUgsS0FBN0I7QUFDQVosbUJBQVdTLElBQVg7QUFDRDtBQUNGLEtBWkk7OztBQWNMLG9CQUFnQix1QkFBWTtBQUMxQlgsd0JBQWtCQyxZQUFsQixFQUFnQ0MsUUFBaEMsRUFBMENDLE9BQTFDO0FBQ0Q7QUFoQkksR0FBUDtBQWtCRCxDQXRCRDs7QUF3QkFLLE9BQU9DLE9BQVAsQ0FBZVMsTUFBZixHQUF3QixDQUN0QjtBQUNFLFVBQVEsUUFEVjtBQUVFLGdCQUFjO0FBQ1osV0FBTyxFQUFFLFFBQVEsUUFBVjtBQURLLEdBRmhCO0FBS0UsMEJBQXdCO0FBTDFCLENBRHNCLENBQXhCIiwiZmlsZSI6InJ1bGVzL21heC1kZXBlbmRlbmNpZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgU2V0IGZyb20gJ2VzNi1zZXQnXG5pbXBvcnQgaXNTdGF0aWNSZXF1aXJlIGZyb20gJy4uL2NvcmUvc3RhdGljUmVxdWlyZSdcblxuY29uc3QgREVGQVVMVF9NQVggPSAxMFxuXG5jb25zdCBjb3VudERlcGVuZGVuY2llcyA9IChkZXBlbmRlbmNpZXMsIGxhc3ROb2RlLCBjb250ZXh0KSA9PiB7XG4gIGNvbnN0IHttYXh9ID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHsgbWF4OiBERUZBVUxUX01BWCB9XG5cbiAgaWYgKGRlcGVuZGVuY2llcy5zaXplID4gbWF4KSB7XG4gICAgY29udGV4dC5yZXBvcnQoXG4gICAgICBsYXN0Tm9kZSxcbiAgICAgIGBNYXhpbXVtIG51bWJlciBvZiBkZXBlbmRlbmNpZXMgKCR7bWF4fSkgZXhjZWVkZWQuYFxuICAgIClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnRleHQgPT4ge1xuICBjb25zdCBkZXBlbmRlbmNpZXMgPSBuZXcgU2V0KCkgLy8ga2VlcCB0cmFjayBvZiBkZXBlbmRlbmNpZXNcbiAgbGV0IGxhc3ROb2RlIC8vIGtlZXAgdHJhY2sgb2YgdGhlIGxhc3Qgbm9kZSB0byByZXBvcnQgb25cblxuICByZXR1cm4ge1xuICAgIEltcG9ydERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgIGRlcGVuZGVuY2llcy5hZGQobm9kZS5zb3VyY2UudmFsdWUpXG4gICAgICBsYXN0Tm9kZSA9IG5vZGUuc291cmNlXG4gICAgfSxcblxuICAgIENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgIGlmIChpc1N0YXRpY1JlcXVpcmUobm9kZSkpIHtcbiAgICAgICAgY29uc3QgWyByZXF1aXJlUGF0aCBdID0gbm9kZS5hcmd1bWVudHNcbiAgICAgICAgZGVwZW5kZW5jaWVzLmFkZChyZXF1aXJlUGF0aC52YWx1ZSlcbiAgICAgICAgbGFzdE5vZGUgPSBub2RlXG4gICAgICB9XG4gICAgfSxcblxuICAgICdQcm9ncmFtOmV4aXQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBjb3VudERlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXMsIGxhc3ROb2RlLCBjb250ZXh0KVxuICAgIH0sXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMuc2NoZW1hID0gW1xuICB7XG4gICAgJ3R5cGUnOiAnb2JqZWN0JyxcbiAgICAncHJvcGVydGllcyc6IHtcbiAgICAgICdtYXgnOiB7ICd0eXBlJzogJ251bWJlcicgfSxcbiAgICB9LFxuICAgICdhZGRpdGlvbmFsUHJvcGVydGllcyc6IGZhbHNlLFxuICB9LFxuXVxuIl19