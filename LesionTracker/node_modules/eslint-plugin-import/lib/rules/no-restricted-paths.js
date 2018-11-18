'use strict';

var _containsPath = require('contains-path');

var _containsPath2 = _interopRequireDefault(_containsPath);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _resolve = require('../core/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _staticRequire = require('../core/staticRequire');

var _staticRequire2 = _interopRequireDefault(_staticRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function noRestrictedPaths(context) {
  var options = context.options[0] || {};
  var restrictedPaths = options.zones || [];
  var basePath = options.basePath || process.cwd();
  var currentFilename = context.getFilename();
  var matchingZones = restrictedPaths.filter(function (zone) {
    var targetPath = _path2.default.resolve(basePath, zone.target);

    return (0, _containsPath2.default)(currentFilename, targetPath);
  });

  function checkForRestrictedImportPath(importPath, node) {
    var absoluteImportPath = (0, _resolve2.default)(importPath, context);

    if (!absoluteImportPath) {
      return;
    }

    matchingZones.forEach(function (zone) {
      var absoluteFrom = _path2.default.resolve(basePath, zone.from);

      if ((0, _containsPath2.default)(absoluteImportPath, absoluteFrom)) {
        context.report({
          node: node,
          message: 'Unexpected path "' + importPath + '" imported in restricted zone.'
        });
      }
    });
  }

  return {
    ImportDeclaration: function ImportDeclaration(node) {
      checkForRestrictedImportPath(node.source.value, node.source);
    },
    CallExpression: function CallExpression(node) {
      if ((0, _staticRequire2.default)(node)) {
        var _node$arguments = node.arguments;
        var firstArgument = _node$arguments[0];


        checkForRestrictedImportPath(firstArgument.value, firstArgument);
      }
    }
  };
};

module.exports.schema = [{
  type: 'object',
  properties: {
    zones: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          target: { type: 'string' },
          from: { type: 'string' }
        },
        additionalProperties: false
      }
    },
    basePath: { type: 'string' }
  },
  additionalProperties: false
}];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLXJlc3RyaWN0ZWQtcGF0aHMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm5vUmVzdHJpY3RlZFBhdGhzIiwiY29udGV4dCIsIm9wdGlvbnMiLCJyZXN0cmljdGVkUGF0aHMiLCJ6b25lcyIsImJhc2VQYXRoIiwicHJvY2VzcyIsImN3ZCIsImN1cnJlbnRGaWxlbmFtZSIsImdldEZpbGVuYW1lIiwibWF0Y2hpbmdab25lcyIsImZpbHRlciIsInpvbmUiLCJ0YXJnZXRQYXRoIiwicmVzb2x2ZSIsInRhcmdldCIsImNoZWNrRm9yUmVzdHJpY3RlZEltcG9ydFBhdGgiLCJpbXBvcnRQYXRoIiwibm9kZSIsImFic29sdXRlSW1wb3J0UGF0aCIsImZvckVhY2giLCJhYnNvbHV0ZUZyb20iLCJmcm9tIiwicmVwb3J0IiwibWVzc2FnZSIsIkltcG9ydERlY2xhcmF0aW9uIiwic291cmNlIiwidmFsdWUiLCJDYWxsRXhwcmVzc2lvbiIsImFyZ3VtZW50cyIsImZpcnN0QXJndW1lbnQiLCJzY2hlbWEiLCJ0eXBlIiwicHJvcGVydGllcyIsIm1pbkl0ZW1zIiwiaXRlbXMiLCJhZGRpdGlvbmFsUHJvcGVydGllcyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOzs7O0FBRUE7Ozs7QUFDQTs7Ozs7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUIsU0FBU0MsaUJBQVQsQ0FBMkJDLE9BQTNCLEVBQW9DO0FBQ25ELE1BQU1DLFVBQVVELFFBQVFDLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsRUFBdEM7QUFDQSxNQUFNQyxrQkFBa0JELFFBQVFFLEtBQVIsSUFBaUIsRUFBekM7QUFDQSxNQUFNQyxXQUFXSCxRQUFRRyxRQUFSLElBQW9CQyxRQUFRQyxHQUFSLEVBQXJDO0FBQ0EsTUFBTUMsa0JBQWtCUCxRQUFRUSxXQUFSLEVBQXhCO0FBQ0EsTUFBTUMsZ0JBQWdCUCxnQkFBZ0JRLE1BQWhCLENBQXVCLFVBQUNDLElBQUQsRUFBVTtBQUNyRCxRQUFNQyxhQUFhLGVBQUtDLE9BQUwsQ0FBYVQsUUFBYixFQUF1Qk8sS0FBS0csTUFBNUIsQ0FBbkI7O0FBRUEsV0FBTyw0QkFBYVAsZUFBYixFQUE4QkssVUFBOUIsQ0FBUDtBQUNELEdBSnFCLENBQXRCOztBQU1BLFdBQVNHLDRCQUFULENBQXNDQyxVQUF0QyxFQUFrREMsSUFBbEQsRUFBd0Q7QUFDcEQsUUFBTUMscUJBQXFCLHVCQUFRRixVQUFSLEVBQW9CaEIsT0FBcEIsQ0FBM0I7O0FBRUEsUUFBSSxDQUFDa0Isa0JBQUwsRUFBeUI7QUFDdkI7QUFDRDs7QUFFRFQsa0JBQWNVLE9BQWQsQ0FBc0IsVUFBQ1IsSUFBRCxFQUFVO0FBQzlCLFVBQU1TLGVBQWUsZUFBS1AsT0FBTCxDQUFhVCxRQUFiLEVBQXVCTyxLQUFLVSxJQUE1QixDQUFyQjs7QUFFQSxVQUFJLDRCQUFhSCxrQkFBYixFQUFpQ0UsWUFBakMsQ0FBSixFQUFvRDtBQUNsRHBCLGdCQUFRc0IsTUFBUixDQUFlO0FBQ2JMLG9CQURhO0FBRWJNLHlDQUE2QlAsVUFBN0I7QUFGYSxTQUFmO0FBSUQ7QUFDRixLQVREO0FBVUg7O0FBRUQsU0FBTztBQUNMUSxxQkFESyw2QkFDYVAsSUFEYixFQUNtQjtBQUN0QkYsbUNBQTZCRSxLQUFLUSxNQUFMLENBQVlDLEtBQXpDLEVBQWdEVCxLQUFLUSxNQUFyRDtBQUNELEtBSEk7QUFJTEUsa0JBSkssMEJBSVVWLElBSlYsRUFJZ0I7QUFDbkIsVUFBSSw2QkFBZ0JBLElBQWhCLENBQUosRUFBMkI7QUFBQSw4QkFDQ0EsS0FBS1csU0FETjtBQUFBLFlBQ2pCQyxhQURpQjs7O0FBR3pCZCxxQ0FBNkJjLGNBQWNILEtBQTNDLEVBQWtERyxhQUFsRDtBQUNEO0FBQ0Y7QUFWSSxHQUFQO0FBWUQsQ0ExQ0Q7O0FBNENBaEMsT0FBT0MsT0FBUCxDQUFlZ0MsTUFBZixHQUF3QixDQUN0QjtBQUNFQyxRQUFNLFFBRFI7QUFFRUMsY0FBWTtBQUNWN0IsV0FBTztBQUNMNEIsWUFBTSxPQUREO0FBRUxFLGdCQUFVLENBRkw7QUFHTEMsYUFBTztBQUNMSCxjQUFNLFFBREQ7QUFFTEMsb0JBQVk7QUFDVmxCLGtCQUFRLEVBQUVpQixNQUFNLFFBQVIsRUFERTtBQUVWVixnQkFBTSxFQUFFVSxNQUFNLFFBQVI7QUFGSSxTQUZQO0FBTUxJLDhCQUFzQjtBQU5qQjtBQUhGLEtBREc7QUFhVi9CLGNBQVUsRUFBRTJCLE1BQU0sUUFBUjtBQWJBLEdBRmQ7QUFpQkVJLHdCQUFzQjtBQWpCeEIsQ0FEc0IsQ0FBeEIiLCJmaWxlIjoicnVsZXMvbm8tcmVzdHJpY3RlZC1wYXRocy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjb250YWluc1BhdGggZnJvbSAnY29udGFpbnMtcGF0aCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbmltcG9ydCByZXNvbHZlIGZyb20gJy4uL2NvcmUvcmVzb2x2ZSdcbmltcG9ydCBpc1N0YXRpY1JlcXVpcmUgZnJvbSAnLi4vY29yZS9zdGF0aWNSZXF1aXJlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5vUmVzdHJpY3RlZFBhdGhzKGNvbnRleHQpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbnRleHQub3B0aW9uc1swXSB8fCB7fVxuICBjb25zdCByZXN0cmljdGVkUGF0aHMgPSBvcHRpb25zLnpvbmVzIHx8IFtdXG4gIGNvbnN0IGJhc2VQYXRoID0gb3B0aW9ucy5iYXNlUGF0aCB8fCBwcm9jZXNzLmN3ZCgpXG4gIGNvbnN0IGN1cnJlbnRGaWxlbmFtZSA9IGNvbnRleHQuZ2V0RmlsZW5hbWUoKVxuICBjb25zdCBtYXRjaGluZ1pvbmVzID0gcmVzdHJpY3RlZFBhdGhzLmZpbHRlcigoem9uZSkgPT4ge1xuICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLnJlc29sdmUoYmFzZVBhdGgsIHpvbmUudGFyZ2V0KVxuXG4gICAgcmV0dXJuIGNvbnRhaW5zUGF0aChjdXJyZW50RmlsZW5hbWUsIHRhcmdldFBhdGgpXG4gIH0pXG5cbiAgZnVuY3Rpb24gY2hlY2tGb3JSZXN0cmljdGVkSW1wb3J0UGF0aChpbXBvcnRQYXRoLCBub2RlKSB7XG4gICAgICBjb25zdCBhYnNvbHV0ZUltcG9ydFBhdGggPSByZXNvbHZlKGltcG9ydFBhdGgsIGNvbnRleHQpXG5cbiAgICAgIGlmICghYWJzb2x1dGVJbXBvcnRQYXRoKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBtYXRjaGluZ1pvbmVzLmZvckVhY2goKHpvbmUpID0+IHtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVGcm9tID0gcGF0aC5yZXNvbHZlKGJhc2VQYXRoLCB6b25lLmZyb20pXG5cbiAgICAgICAgaWYgKGNvbnRhaW5zUGF0aChhYnNvbHV0ZUltcG9ydFBhdGgsIGFic29sdXRlRnJvbSkpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogYFVuZXhwZWN0ZWQgcGF0aCBcIiR7aW1wb3J0UGF0aH1cIiBpbXBvcnRlZCBpbiByZXN0cmljdGVkIHpvbmUuYCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBJbXBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICBjaGVja0ZvclJlc3RyaWN0ZWRJbXBvcnRQYXRoKG5vZGUuc291cmNlLnZhbHVlLCBub2RlLnNvdXJjZSlcbiAgICB9LFxuICAgIENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgIGlmIChpc1N0YXRpY1JlcXVpcmUobm9kZSkpIHtcbiAgICAgICAgY29uc3QgWyBmaXJzdEFyZ3VtZW50IF0gPSBub2RlLmFyZ3VtZW50c1xuXG4gICAgICAgIGNoZWNrRm9yUmVzdHJpY3RlZEltcG9ydFBhdGgoZmlyc3RBcmd1bWVudC52YWx1ZSwgZmlyc3RBcmd1bWVudClcbiAgICAgIH1cbiAgICB9LFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLnNjaGVtYSA9IFtcbiAge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHpvbmVzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIG1pbkl0ZW1zOiAxLFxuICAgICAgICBpdGVtczoge1xuICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIHRhcmdldDogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgZnJvbTogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGJhc2VQYXRoOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgfSxcbiAgICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2UsXG4gIH0sXG5dXG4iXX0=