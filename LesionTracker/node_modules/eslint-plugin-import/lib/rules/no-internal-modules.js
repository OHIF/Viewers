'use strict';

var _lodash = require('lodash.find');

var _lodash2 = _interopRequireDefault(_lodash);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _resolve = require('../core/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _importType = require('../core/importType');

var _importType2 = _interopRequireDefault(_importType);

var _staticRequire = require('../core/staticRequire');

var _staticRequire2 = _interopRequireDefault(_staticRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function noReachingInside(context) {
  var options = context.options[0] || {};
  var allowRegexps = (options.allow || []).map(function (p) {
    return _minimatch2.default.makeRe(p);
  });

  // test if reaching to this destination is allowed
  function reachingAllowed(importPath) {
    return !!(0, _lodash2.default)(allowRegexps, function (re) {
      return re.test(importPath);
    });
  }

  // minimatch patterns are expected to use / path separators, like import
  // statements, so normalize paths to use the same
  function normalizeSep(somePath) {
    return somePath.split('\\').join('/');
  }

  // find a directory that is being reached into, but which shouldn't be
  function isReachViolation(importPath) {
    var steps = normalizeSep(importPath).split('/').reduce(function (acc, step) {
      if (!step || step === '.') {
        return acc;
      } else if (step === '..') {
        return acc.slice(0, -1);
      } else {
        return acc.concat(step);
      }
    }, []);

    if (steps.length <= 1) return false;

    // before trying to resolve, see if the raw import (with relative
    // segments resolved) matches an allowed pattern
    var justSteps = steps.join('/');
    if (reachingAllowed(justSteps) || reachingAllowed('/' + justSteps)) return false;

    // if the import statement doesn't match directly, try to match the
    // resolved path if the import is resolvable
    var resolved = (0, _resolve2.default)(importPath, context);
    if (!resolved || reachingAllowed(normalizeSep(resolved))) return false;

    // this import was not allowed by the allowed paths, and reaches
    // so it is a violation
    return true;
  }

  function checkImportForReaching(importPath, node) {
    var potentialViolationTypes = ['parent', 'index', 'sibling', 'external', 'internal'];
    if (potentialViolationTypes.indexOf((0, _importType2.default)(importPath, context)) !== -1 && isReachViolation(importPath)) {
      context.report({
        node: node,
        message: 'Reaching to "' + importPath + '" is not allowed.'
      });
    }
  }

  return {
    ImportDeclaration: function ImportDeclaration(node) {
      checkImportForReaching(node.source.value, node.source);
    },
    CallExpression: function CallExpression(node) {
      if ((0, _staticRequire2.default)(node)) {
        var _node$arguments = node.arguments;
        var firstArgument = _node$arguments[0];

        checkImportForReaching(firstArgument.value, firstArgument);
      }
    }
  };
};

module.exports.schema = [{
  type: 'object',
  properties: {
    allow: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  additionalProperties: false
}];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWludGVybmFsLW1vZHVsZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm5vUmVhY2hpbmdJbnNpZGUiLCJjb250ZXh0Iiwib3B0aW9ucyIsImFsbG93UmVnZXhwcyIsImFsbG93IiwibWFwIiwibWFrZVJlIiwicCIsInJlYWNoaW5nQWxsb3dlZCIsImltcG9ydFBhdGgiLCJyZSIsInRlc3QiLCJub3JtYWxpemVTZXAiLCJzb21lUGF0aCIsInNwbGl0Iiwiam9pbiIsImlzUmVhY2hWaW9sYXRpb24iLCJzdGVwcyIsInJlZHVjZSIsImFjYyIsInN0ZXAiLCJzbGljZSIsImNvbmNhdCIsImxlbmd0aCIsImp1c3RTdGVwcyIsInJlc29sdmVkIiwiY2hlY2tJbXBvcnRGb3JSZWFjaGluZyIsIm5vZGUiLCJwb3RlbnRpYWxWaW9sYXRpb25UeXBlcyIsImluZGV4T2YiLCJyZXBvcnQiLCJtZXNzYWdlIiwiSW1wb3J0RGVjbGFyYXRpb24iLCJzb3VyY2UiLCJ2YWx1ZSIsIkNhbGxFeHByZXNzaW9uIiwiYXJndW1lbnRzIiwiZmlyc3RBcmd1bWVudCIsInNjaGVtYSIsInR5cGUiLCJwcm9wZXJ0aWVzIiwiaXRlbXMiLCJhZGRpdGlvbmFsUHJvcGVydGllcyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOzs7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQixTQUFTQyxnQkFBVCxDQUEwQkMsT0FBMUIsRUFBbUM7QUFDbEQsTUFBTUMsVUFBVUQsUUFBUUMsT0FBUixDQUFnQixDQUFoQixLQUFzQixFQUF0QztBQUNBLE1BQU1DLGVBQWUsQ0FBQ0QsUUFBUUUsS0FBUixJQUFpQixFQUFsQixFQUFzQkMsR0FBdEIsQ0FBMEI7QUFBQSxXQUFLLG9CQUFVQyxNQUFWLENBQWlCQyxDQUFqQixDQUFMO0FBQUEsR0FBMUIsQ0FBckI7O0FBRUE7QUFDQSxXQUFTQyxlQUFULENBQXlCQyxVQUF6QixFQUFxQztBQUNuQyxXQUFPLENBQUMsQ0FBQyxzQkFBS04sWUFBTCxFQUFtQjtBQUFBLGFBQU1PLEdBQUdDLElBQUgsQ0FBUUYsVUFBUixDQUFOO0FBQUEsS0FBbkIsQ0FBVDtBQUNEOztBQUVEO0FBQ0E7QUFDQSxXQUFTRyxZQUFULENBQXNCQyxRQUF0QixFQUFnQztBQUM5QixXQUFPQSxTQUFTQyxLQUFULENBQWUsSUFBZixFQUFxQkMsSUFBckIsQ0FBMEIsR0FBMUIsQ0FBUDtBQUNEOztBQUVEO0FBQ0EsV0FBU0MsZ0JBQVQsQ0FBMEJQLFVBQTFCLEVBQXNDO0FBQ3BDLFFBQU1RLFFBQVFMLGFBQWFILFVBQWIsRUFDWEssS0FEVyxDQUNMLEdBREssRUFFWEksTUFGVyxDQUVKLFVBQUNDLEdBQUQsRUFBTUMsSUFBTixFQUFlO0FBQ3JCLFVBQUksQ0FBQ0EsSUFBRCxJQUFTQSxTQUFTLEdBQXRCLEVBQTJCO0FBQ3pCLGVBQU9ELEdBQVA7QUFDRCxPQUZELE1BRU8sSUFBSUMsU0FBUyxJQUFiLEVBQW1CO0FBQ3hCLGVBQU9ELElBQUlFLEtBQUosQ0FBVSxDQUFWLEVBQWEsQ0FBQyxDQUFkLENBQVA7QUFDRCxPQUZNLE1BRUE7QUFDTCxlQUFPRixJQUFJRyxNQUFKLENBQVdGLElBQVgsQ0FBUDtBQUNEO0FBQ0YsS0FWVyxFQVVULEVBVlMsQ0FBZDs7QUFZQSxRQUFJSCxNQUFNTSxNQUFOLElBQWdCLENBQXBCLEVBQXVCLE9BQU8sS0FBUDs7QUFFdkI7QUFDQTtBQUNBLFFBQU1DLFlBQVlQLE1BQU1GLElBQU4sQ0FBVyxHQUFYLENBQWxCO0FBQ0EsUUFBSVAsZ0JBQWdCZ0IsU0FBaEIsS0FBOEJoQixzQkFBb0JnQixTQUFwQixDQUFsQyxFQUFvRSxPQUFPLEtBQVA7O0FBRXBFO0FBQ0E7QUFDQSxRQUFNQyxXQUFXLHVCQUFRaEIsVUFBUixFQUFvQlIsT0FBcEIsQ0FBakI7QUFDQSxRQUFJLENBQUN3QixRQUFELElBQWFqQixnQkFBZ0JJLGFBQWFhLFFBQWIsQ0FBaEIsQ0FBakIsRUFBMEQsT0FBTyxLQUFQOztBQUUxRDtBQUNBO0FBQ0EsV0FBTyxJQUFQO0FBQ0Q7O0FBRUQsV0FBU0Msc0JBQVQsQ0FBZ0NqQixVQUFoQyxFQUE0Q2tCLElBQTVDLEVBQWtEO0FBQ2hELFFBQU1DLDBCQUEwQixDQUFDLFFBQUQsRUFBVyxPQUFYLEVBQW9CLFNBQXBCLEVBQStCLFVBQS9CLEVBQTJDLFVBQTNDLENBQWhDO0FBQ0EsUUFBSUEsd0JBQXdCQyxPQUF4QixDQUFnQywwQkFBV3BCLFVBQVgsRUFBdUJSLE9BQXZCLENBQWhDLE1BQXFFLENBQUMsQ0FBdEUsSUFDRmUsaUJBQWlCUCxVQUFqQixDQURGLEVBRUU7QUFDQVIsY0FBUTZCLE1BQVIsQ0FBZTtBQUNiSCxrQkFEYTtBQUViSSxtQ0FBeUJ0QixVQUF6QjtBQUZhLE9BQWY7QUFJRDtBQUNGOztBQUVELFNBQU87QUFDTHVCLHFCQURLLDZCQUNhTCxJQURiLEVBQ21CO0FBQ3RCRCw2QkFBdUJDLEtBQUtNLE1BQUwsQ0FBWUMsS0FBbkMsRUFBMENQLEtBQUtNLE1BQS9DO0FBQ0QsS0FISTtBQUlMRSxrQkFKSywwQkFJVVIsSUFKVixFQUlnQjtBQUNuQixVQUFJLDZCQUFnQkEsSUFBaEIsQ0FBSixFQUEyQjtBQUFBLDhCQUNDQSxLQUFLUyxTQUROO0FBQUEsWUFDakJDLGFBRGlCOztBQUV6QlgsK0JBQXVCVyxjQUFjSCxLQUFyQyxFQUE0Q0csYUFBNUM7QUFDRDtBQUNGO0FBVEksR0FBUDtBQVdELENBckVEOztBQXVFQXZDLE9BQU9DLE9BQVAsQ0FBZXVDLE1BQWYsR0FBd0IsQ0FDdEI7QUFDRUMsUUFBTSxRQURSO0FBRUVDLGNBQVk7QUFDVnBDLFdBQU87QUFDTG1DLFlBQU0sT0FERDtBQUVMRSxhQUFPO0FBQ0xGLGNBQU07QUFERDtBQUZGO0FBREcsR0FGZDtBQVVFRyx3QkFBc0I7QUFWeEIsQ0FEc0IsQ0FBeEIiLCJmaWxlIjoicnVsZXMvbm8taW50ZXJuYWwtbW9kdWxlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmaW5kIGZyb20gJ2xvZGFzaC5maW5kJ1xuaW1wb3J0IG1pbmltYXRjaCBmcm9tICdtaW5pbWF0Y2gnXG5cbmltcG9ydCByZXNvbHZlIGZyb20gJy4uL2NvcmUvcmVzb2x2ZSdcbmltcG9ydCBpbXBvcnRUeXBlIGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSdcbmltcG9ydCBpc1N0YXRpY1JlcXVpcmUgZnJvbSAnLi4vY29yZS9zdGF0aWNSZXF1aXJlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5vUmVhY2hpbmdJbnNpZGUoY29udGV4dCkge1xuICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9XG4gIGNvbnN0IGFsbG93UmVnZXhwcyA9IChvcHRpb25zLmFsbG93IHx8IFtdKS5tYXAocCA9PiBtaW5pbWF0Y2gubWFrZVJlKHApKVxuXG4gIC8vIHRlc3QgaWYgcmVhY2hpbmcgdG8gdGhpcyBkZXN0aW5hdGlvbiBpcyBhbGxvd2VkXG4gIGZ1bmN0aW9uIHJlYWNoaW5nQWxsb3dlZChpbXBvcnRQYXRoKSB7XG4gICAgcmV0dXJuICEhZmluZChhbGxvd1JlZ2V4cHMsIHJlID0+IHJlLnRlc3QoaW1wb3J0UGF0aCkpXG4gIH1cblxuICAvLyBtaW5pbWF0Y2ggcGF0dGVybnMgYXJlIGV4cGVjdGVkIHRvIHVzZSAvIHBhdGggc2VwYXJhdG9ycywgbGlrZSBpbXBvcnRcbiAgLy8gc3RhdGVtZW50cywgc28gbm9ybWFsaXplIHBhdGhzIHRvIHVzZSB0aGUgc2FtZVxuICBmdW5jdGlvbiBub3JtYWxpemVTZXAoc29tZVBhdGgpIHtcbiAgICByZXR1cm4gc29tZVBhdGguc3BsaXQoJ1xcXFwnKS5qb2luKCcvJylcbiAgfVxuXG4gIC8vIGZpbmQgYSBkaXJlY3RvcnkgdGhhdCBpcyBiZWluZyByZWFjaGVkIGludG8sIGJ1dCB3aGljaCBzaG91bGRuJ3QgYmVcbiAgZnVuY3Rpb24gaXNSZWFjaFZpb2xhdGlvbihpbXBvcnRQYXRoKSB7XG4gICAgY29uc3Qgc3RlcHMgPSBub3JtYWxpemVTZXAoaW1wb3J0UGF0aClcbiAgICAgIC5zcGxpdCgnLycpXG4gICAgICAucmVkdWNlKChhY2MsIHN0ZXApID0+IHtcbiAgICAgICAgaWYgKCFzdGVwIHx8IHN0ZXAgPT09ICcuJykge1xuICAgICAgICAgIHJldHVybiBhY2NcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwID09PSAnLi4nKSB7XG4gICAgICAgICAgcmV0dXJuIGFjYy5zbGljZSgwLCAtMSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYWNjLmNvbmNhdChzdGVwKVxuICAgICAgICB9XG4gICAgICB9LCBbXSlcblxuICAgIGlmIChzdGVwcy5sZW5ndGggPD0gMSkgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyBiZWZvcmUgdHJ5aW5nIHRvIHJlc29sdmUsIHNlZSBpZiB0aGUgcmF3IGltcG9ydCAod2l0aCByZWxhdGl2ZVxuICAgIC8vIHNlZ21lbnRzIHJlc29sdmVkKSBtYXRjaGVzIGFuIGFsbG93ZWQgcGF0dGVyblxuICAgIGNvbnN0IGp1c3RTdGVwcyA9IHN0ZXBzLmpvaW4oJy8nKVxuICAgIGlmIChyZWFjaGluZ0FsbG93ZWQoanVzdFN0ZXBzKSB8fCByZWFjaGluZ0FsbG93ZWQoYC8ke2p1c3RTdGVwc31gKSkgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyBpZiB0aGUgaW1wb3J0IHN0YXRlbWVudCBkb2Vzbid0IG1hdGNoIGRpcmVjdGx5LCB0cnkgdG8gbWF0Y2ggdGhlXG4gICAgLy8gcmVzb2x2ZWQgcGF0aCBpZiB0aGUgaW1wb3J0IGlzIHJlc29sdmFibGVcbiAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmUoaW1wb3J0UGF0aCwgY29udGV4dClcbiAgICBpZiAoIXJlc29sdmVkIHx8IHJlYWNoaW5nQWxsb3dlZChub3JtYWxpemVTZXAocmVzb2x2ZWQpKSkgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyB0aGlzIGltcG9ydCB3YXMgbm90IGFsbG93ZWQgYnkgdGhlIGFsbG93ZWQgcGF0aHMsIGFuZCByZWFjaGVzXG4gICAgLy8gc28gaXQgaXMgYSB2aW9sYXRpb25cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gY2hlY2tJbXBvcnRGb3JSZWFjaGluZyhpbXBvcnRQYXRoLCBub2RlKSB7XG4gICAgY29uc3QgcG90ZW50aWFsVmlvbGF0aW9uVHlwZXMgPSBbJ3BhcmVudCcsICdpbmRleCcsICdzaWJsaW5nJywgJ2V4dGVybmFsJywgJ2ludGVybmFsJ11cbiAgICBpZiAocG90ZW50aWFsVmlvbGF0aW9uVHlwZXMuaW5kZXhPZihpbXBvcnRUeXBlKGltcG9ydFBhdGgsIGNvbnRleHQpKSAhPT0gLTEgJiZcbiAgICAgIGlzUmVhY2hWaW9sYXRpb24oaW1wb3J0UGF0aClcbiAgICApIHtcbiAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgbm9kZSxcbiAgICAgICAgbWVzc2FnZTogYFJlYWNoaW5nIHRvIFwiJHtpbXBvcnRQYXRofVwiIGlzIG5vdCBhbGxvd2VkLmAsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgSW1wb3J0RGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgY2hlY2tJbXBvcnRGb3JSZWFjaGluZyhub2RlLnNvdXJjZS52YWx1ZSwgbm9kZS5zb3VyY2UpXG4gICAgfSxcbiAgICBDYWxsRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICBpZiAoaXNTdGF0aWNSZXF1aXJlKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IFsgZmlyc3RBcmd1bWVudCBdID0gbm9kZS5hcmd1bWVudHNcbiAgICAgICAgY2hlY2tJbXBvcnRGb3JSZWFjaGluZyhmaXJzdEFyZ3VtZW50LnZhbHVlLCBmaXJzdEFyZ3VtZW50KVxuICAgICAgfVxuICAgIH0sXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMuc2NoZW1hID0gW1xuICB7XG4gICAgdHlwZTogJ29iamVjdCcsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgYWxsb3c6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2UsXG4gIH0sXG5dXG4iXX0=