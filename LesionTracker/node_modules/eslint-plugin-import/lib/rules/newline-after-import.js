'use strict';

var _staticRequire = require('../core/staticRequire');

var _staticRequire2 = _interopRequireDefault(_staticRequire);

var _lodash = require('lodash.findindex');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('eslint-plugin-import:rules:newline-after-import');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * @fileoverview Rule to enforce new line after import not followed by another import.
 * @author Radek Benkel
 */

function containsNodeOrEqual(outerNode, innerNode) {
  return outerNode.range[0] <= innerNode.range[0] && outerNode.range[1] >= innerNode.range[1];
}

function getScopeBody(scope) {
  if (scope.block.type === 'SwitchStatement') {
    log('SwitchStatement scopes not supported');
    return null;
  }

  var body = scope.block.body;

  if (body && body.type === 'BlockStatement') {
    return body.body;
  }

  return body;
}

function findNodeIndexInScopeBody(body, nodeToFind) {
  return (0, _lodash2.default)(body, function (node) {
    return containsNodeOrEqual(node, nodeToFind);
  });
}

function getLineDifference(node, nextNode) {
  return nextNode.loc.start.line - node.loc.end.line;
}

module.exports = function (context) {
  var scopes = [];
  var scopeIndex = 0;

  function checkForNewLine(node, nextNode, type) {
    if (getLineDifference(node, nextNode) < 2) {
      var column = node.loc.start.column;

      if (node.loc.start.line !== node.loc.end.line) {
        column = 0;
      }

      context.report({
        loc: {
          line: node.loc.end.line,
          column: column
        },
        message: 'Expected empty line after ' + type + ' statement not followed by another ' + type + '.'
      });
    }
  }

  return {
    ImportDeclaration: function ImportDeclaration(node) {
      var parent = node.parent;

      var nodePosition = parent.body.indexOf(node);
      var nextNode = parent.body[nodePosition + 1];

      if (nextNode && nextNode.type !== 'ImportDeclaration') {
        checkForNewLine(node, nextNode, 'import');
      }
    },
    Program: function Program() {
      scopes.push({ scope: context.getScope(), requireCalls: [] });
    },
    CallExpression: function CallExpression(node) {
      var scope = context.getScope();
      if ((0, _staticRequire2.default)(node)) {
        var currentScope = scopes[scopeIndex];

        if (scope === currentScope.scope) {
          currentScope.requireCalls.push(node);
        } else {
          scopes.push({ scope: scope, requireCalls: [node] });
          scopeIndex += 1;
        }
      }
    },
    'Program:exit': function ProgramExit() {
      log('exit processing for', context.getFilename());
      scopes.forEach(function (_ref) {
        var scope = _ref.scope;
        var requireCalls = _ref.requireCalls;

        var scopeBody = getScopeBody(scope);

        // skip non-array scopes (i.e. arrow function expressions)
        if (!scopeBody || !(scopeBody instanceof Array)) {
          log('invalid scope:', scopeBody);
          return;
        }

        log('got scope:', scopeBody);

        requireCalls.forEach(function (node, index) {
          var nodePosition = findNodeIndexInScopeBody(scopeBody, node);
          log('node position in scope:', nodePosition);

          var statementWithRequireCall = scopeBody[nodePosition];
          var nextStatement = scopeBody[nodePosition + 1];
          var nextRequireCall = requireCalls[index + 1];

          if (nextRequireCall && containsNodeOrEqual(statementWithRequireCall, nextRequireCall)) {
            return;
          }

          if (nextStatement && (!nextRequireCall || !containsNodeOrEqual(nextStatement, nextRequireCall))) {

            checkForNewLine(statementWithRequireCall, nextStatement, 'require');
          }
        });
      });
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25ld2xpbmUtYWZ0ZXItaW1wb3J0LmpzIl0sIm5hbWVzIjpbImxvZyIsImNvbnRhaW5zTm9kZU9yRXF1YWwiLCJvdXRlck5vZGUiLCJpbm5lck5vZGUiLCJyYW5nZSIsImdldFNjb3BlQm9keSIsInNjb3BlIiwiYmxvY2siLCJ0eXBlIiwiYm9keSIsImZpbmROb2RlSW5kZXhJblNjb3BlQm9keSIsIm5vZGVUb0ZpbmQiLCJub2RlIiwiZ2V0TGluZURpZmZlcmVuY2UiLCJuZXh0Tm9kZSIsImxvYyIsInN0YXJ0IiwibGluZSIsImVuZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjb250ZXh0Iiwic2NvcGVzIiwic2NvcGVJbmRleCIsImNoZWNrRm9yTmV3TGluZSIsImNvbHVtbiIsInJlcG9ydCIsIm1lc3NhZ2UiLCJJbXBvcnREZWNsYXJhdGlvbiIsInBhcmVudCIsIm5vZGVQb3NpdGlvbiIsImluZGV4T2YiLCJQcm9ncmFtIiwicHVzaCIsImdldFNjb3BlIiwicmVxdWlyZUNhbGxzIiwiQ2FsbEV4cHJlc3Npb24iLCJjdXJyZW50U2NvcGUiLCJnZXRGaWxlbmFtZSIsImZvckVhY2giLCJzY29wZUJvZHkiLCJBcnJheSIsImluZGV4Iiwic3RhdGVtZW50V2l0aFJlcXVpcmVDYWxsIiwibmV4dFN0YXRlbWVudCIsIm5leHRSZXF1aXJlQ2FsbCJdLCJtYXBwaW5ncyI6Ijs7QUFLQTs7OztBQUNBOzs7O0FBRUE7Ozs7OztBQUVBLElBQU1BLE1BQU0scUJBQU0saURBQU4sQ0FBWjs7QUFFQTtBQUNBO0FBQ0E7O0FBZEE7Ozs7O0FBZ0JBLFNBQVNDLG1CQUFULENBQTZCQyxTQUE3QixFQUF3Q0MsU0FBeEMsRUFBbUQ7QUFDL0MsU0FBT0QsVUFBVUUsS0FBVixDQUFnQixDQUFoQixLQUFzQkQsVUFBVUMsS0FBVixDQUFnQixDQUFoQixDQUF0QixJQUE0Q0YsVUFBVUUsS0FBVixDQUFnQixDQUFoQixLQUFzQkQsVUFBVUMsS0FBVixDQUFnQixDQUFoQixDQUF6RTtBQUNIOztBQUVELFNBQVNDLFlBQVQsQ0FBc0JDLEtBQXRCLEVBQTZCO0FBQ3pCLE1BQUlBLE1BQU1DLEtBQU4sQ0FBWUMsSUFBWixLQUFxQixpQkFBekIsRUFBNEM7QUFDMUNSLFFBQUksc0NBQUo7QUFDQSxXQUFPLElBQVA7QUFDRDs7QUFKd0IsTUFNakJTLElBTmlCLEdBTVJILE1BQU1DLEtBTkUsQ0FNakJFLElBTmlCOztBQU96QixNQUFJQSxRQUFRQSxLQUFLRCxJQUFMLEtBQWMsZ0JBQTFCLEVBQTRDO0FBQ3hDLFdBQU9DLEtBQUtBLElBQVo7QUFDSDs7QUFFRCxTQUFPQSxJQUFQO0FBQ0g7O0FBRUQsU0FBU0Msd0JBQVQsQ0FBa0NELElBQWxDLEVBQXdDRSxVQUF4QyxFQUFvRDtBQUNoRCxTQUFPLHNCQUFVRixJQUFWLEVBQWdCLFVBQUNHLElBQUQ7QUFBQSxXQUFVWCxvQkFBb0JXLElBQXBCLEVBQTBCRCxVQUExQixDQUFWO0FBQUEsR0FBaEIsQ0FBUDtBQUNIOztBQUVELFNBQVNFLGlCQUFULENBQTJCRCxJQUEzQixFQUFpQ0UsUUFBakMsRUFBMkM7QUFDekMsU0FBT0EsU0FBU0MsR0FBVCxDQUFhQyxLQUFiLENBQW1CQyxJQUFuQixHQUEwQkwsS0FBS0csR0FBTCxDQUFTRyxHQUFULENBQWFELElBQTlDO0FBQ0Q7O0FBR0RFLE9BQU9DLE9BQVAsR0FBaUIsVUFBVUMsT0FBVixFQUFtQjtBQUNsQyxNQUFNQyxTQUFTLEVBQWY7QUFDQSxNQUFJQyxhQUFhLENBQWpCOztBQUVBLFdBQVNDLGVBQVQsQ0FBeUJaLElBQXpCLEVBQStCRSxRQUEvQixFQUF5Q04sSUFBekMsRUFBK0M7QUFDN0MsUUFBSUssa0JBQWtCRCxJQUFsQixFQUF3QkUsUUFBeEIsSUFBb0MsQ0FBeEMsRUFBMkM7QUFDekMsVUFBSVcsU0FBU2IsS0FBS0csR0FBTCxDQUFTQyxLQUFULENBQWVTLE1BQTVCOztBQUVBLFVBQUliLEtBQUtHLEdBQUwsQ0FBU0MsS0FBVCxDQUFlQyxJQUFmLEtBQXdCTCxLQUFLRyxHQUFMLENBQVNHLEdBQVQsQ0FBYUQsSUFBekMsRUFBK0M7QUFDN0NRLGlCQUFTLENBQVQ7QUFDRDs7QUFFREosY0FBUUssTUFBUixDQUFlO0FBQ2JYLGFBQUs7QUFDSEUsZ0JBQU1MLEtBQUtHLEdBQUwsQ0FBU0csR0FBVCxDQUFhRCxJQURoQjtBQUVIUTtBQUZHLFNBRFE7QUFLYkUsZ0RBQXNDbkIsSUFBdEMsMkNBQWdGQSxJQUFoRjtBQUxhLE9BQWY7QUFPRDtBQUNGOztBQUVELFNBQU87QUFDTG9CLHVCQUFtQiwyQkFBVWhCLElBQVYsRUFBZ0I7QUFBQSxVQUN6QmlCLE1BRHlCLEdBQ2RqQixJQURjLENBQ3pCaUIsTUFEeUI7O0FBRWpDLFVBQU1DLGVBQWVELE9BQU9wQixJQUFQLENBQVlzQixPQUFaLENBQW9CbkIsSUFBcEIsQ0FBckI7QUFDQSxVQUFNRSxXQUFXZSxPQUFPcEIsSUFBUCxDQUFZcUIsZUFBZSxDQUEzQixDQUFqQjs7QUFFQSxVQUFJaEIsWUFBWUEsU0FBU04sSUFBVCxLQUFrQixtQkFBbEMsRUFBdUQ7QUFDckRnQix3QkFBZ0JaLElBQWhCLEVBQXNCRSxRQUF0QixFQUFnQyxRQUFoQztBQUNEO0FBQ0YsS0FUSTtBQVVMa0IsYUFBUyxtQkFBWTtBQUNuQlYsYUFBT1csSUFBUCxDQUFZLEVBQUUzQixPQUFPZSxRQUFRYSxRQUFSLEVBQVQsRUFBNkJDLGNBQWMsRUFBM0MsRUFBWjtBQUNELEtBWkk7QUFhTEMsb0JBQWdCLHdCQUFTeEIsSUFBVCxFQUFlO0FBQzdCLFVBQU1OLFFBQVFlLFFBQVFhLFFBQVIsRUFBZDtBQUNBLFVBQUksNkJBQWdCdEIsSUFBaEIsQ0FBSixFQUEyQjtBQUN6QixZQUFNeUIsZUFBZWYsT0FBT0MsVUFBUCxDQUFyQjs7QUFFQSxZQUFJakIsVUFBVStCLGFBQWEvQixLQUEzQixFQUFrQztBQUNoQytCLHVCQUFhRixZQUFiLENBQTBCRixJQUExQixDQUErQnJCLElBQS9CO0FBQ0QsU0FGRCxNQUVPO0FBQ0xVLGlCQUFPVyxJQUFQLENBQVksRUFBRTNCLFlBQUYsRUFBUzZCLGNBQWMsQ0FBRXZCLElBQUYsQ0FBdkIsRUFBWjtBQUNBVyx3QkFBYyxDQUFkO0FBQ0Q7QUFDRjtBQUNGLEtBekJJO0FBMEJMLG9CQUFnQix1QkFBWTtBQUMxQnZCLFVBQUkscUJBQUosRUFBMkJxQixRQUFRaUIsV0FBUixFQUEzQjtBQUNBaEIsYUFBT2lCLE9BQVAsQ0FBZSxnQkFBbUM7QUFBQSxZQUF2QmpDLEtBQXVCLFFBQXZCQSxLQUF1QjtBQUFBLFlBQWhCNkIsWUFBZ0IsUUFBaEJBLFlBQWdCOztBQUNoRCxZQUFNSyxZQUFZbkMsYUFBYUMsS0FBYixDQUFsQjs7QUFFQTtBQUNBLFlBQUksQ0FBQ2tDLFNBQUQsSUFBYyxFQUFFQSxxQkFBcUJDLEtBQXZCLENBQWxCLEVBQWlEO0FBQy9DekMsY0FBSSxnQkFBSixFQUFzQndDLFNBQXRCO0FBQ0E7QUFDRDs7QUFFRHhDLFlBQUksWUFBSixFQUFrQndDLFNBQWxCOztBQUVBTCxxQkFBYUksT0FBYixDQUFxQixVQUFVM0IsSUFBVixFQUFnQjhCLEtBQWhCLEVBQXVCO0FBQzFDLGNBQU1aLGVBQWVwQix5QkFBeUI4QixTQUF6QixFQUFvQzVCLElBQXBDLENBQXJCO0FBQ0FaLGNBQUkseUJBQUosRUFBK0I4QixZQUEvQjs7QUFFQSxjQUFNYSwyQkFBMkJILFVBQVVWLFlBQVYsQ0FBakM7QUFDQSxjQUFNYyxnQkFBZ0JKLFVBQVVWLGVBQWUsQ0FBekIsQ0FBdEI7QUFDQSxjQUFNZSxrQkFBa0JWLGFBQWFPLFFBQVEsQ0FBckIsQ0FBeEI7O0FBRUEsY0FBSUcsbUJBQW1CNUMsb0JBQW9CMEMsd0JBQXBCLEVBQThDRSxlQUE5QyxDQUF2QixFQUF1RjtBQUNyRjtBQUNEOztBQUVELGNBQUlELGtCQUNBLENBQUNDLGVBQUQsSUFBb0IsQ0FBQzVDLG9CQUFvQjJDLGFBQXBCLEVBQW1DQyxlQUFuQyxDQURyQixDQUFKLEVBQytFOztBQUU3RXJCLDRCQUFnQm1CLHdCQUFoQixFQUEwQ0MsYUFBMUMsRUFBeUQsU0FBekQ7QUFDRDtBQUNGLFNBakJEO0FBa0JELE9BN0JEO0FBOEJEO0FBMURJLEdBQVA7QUE0REQsQ0FsRkQiLCJmaWxlIjoicnVsZXMvbmV3bGluZS1hZnRlci1pbXBvcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgUnVsZSB0byBlbmZvcmNlIG5ldyBsaW5lIGFmdGVyIGltcG9ydCBub3QgZm9sbG93ZWQgYnkgYW5vdGhlciBpbXBvcnQuXG4gKiBAYXV0aG9yIFJhZGVrIEJlbmtlbFxuICovXG5cbmltcG9ydCBpc1N0YXRpY1JlcXVpcmUgZnJvbSAnLi4vY29yZS9zdGF0aWNSZXF1aXJlJ1xuaW1wb3J0IGZpbmRJbmRleCBmcm9tICdsb2Rhc2guZmluZGluZGV4J1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnXG5cbmNvbnN0IGxvZyA9IGRlYnVnKCdlc2xpbnQtcGx1Z2luLWltcG9ydDpydWxlczpuZXdsaW5lLWFmdGVyLWltcG9ydCcpXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdWxlIERlZmluaXRpb25cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIGNvbnRhaW5zTm9kZU9yRXF1YWwob3V0ZXJOb2RlLCBpbm5lck5vZGUpIHtcbiAgICByZXR1cm4gb3V0ZXJOb2RlLnJhbmdlWzBdIDw9IGlubmVyTm9kZS5yYW5nZVswXSAmJiBvdXRlck5vZGUucmFuZ2VbMV0gPj0gaW5uZXJOb2RlLnJhbmdlWzFdXG59XG5cbmZ1bmN0aW9uIGdldFNjb3BlQm9keShzY29wZSkge1xuICAgIGlmIChzY29wZS5ibG9jay50eXBlID09PSAnU3dpdGNoU3RhdGVtZW50Jykge1xuICAgICAgbG9nKCdTd2l0Y2hTdGF0ZW1lbnQgc2NvcGVzIG5vdCBzdXBwb3J0ZWQnKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBjb25zdCB7IGJvZHkgfSA9IHNjb3BlLmJsb2NrXG4gICAgaWYgKGJvZHkgJiYgYm9keS50eXBlID09PSAnQmxvY2tTdGF0ZW1lbnQnKSB7XG4gICAgICAgIHJldHVybiBib2R5LmJvZHlcbiAgICB9XG5cbiAgICByZXR1cm4gYm9keVxufVxuXG5mdW5jdGlvbiBmaW5kTm9kZUluZGV4SW5TY29wZUJvZHkoYm9keSwgbm9kZVRvRmluZCkge1xuICAgIHJldHVybiBmaW5kSW5kZXgoYm9keSwgKG5vZGUpID0+IGNvbnRhaW5zTm9kZU9yRXF1YWwobm9kZSwgbm9kZVRvRmluZCkpXG59XG5cbmZ1bmN0aW9uIGdldExpbmVEaWZmZXJlbmNlKG5vZGUsIG5leHROb2RlKSB7XG4gIHJldHVybiBuZXh0Tm9kZS5sb2Muc3RhcnQubGluZSAtIG5vZGUubG9jLmVuZC5saW5lXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICBjb25zdCBzY29wZXMgPSBbXVxuICBsZXQgc2NvcGVJbmRleCA9IDBcblxuICBmdW5jdGlvbiBjaGVja0Zvck5ld0xpbmUobm9kZSwgbmV4dE5vZGUsIHR5cGUpIHtcbiAgICBpZiAoZ2V0TGluZURpZmZlcmVuY2Uobm9kZSwgbmV4dE5vZGUpIDwgMikge1xuICAgICAgbGV0IGNvbHVtbiA9IG5vZGUubG9jLnN0YXJ0LmNvbHVtblxuXG4gICAgICBpZiAobm9kZS5sb2Muc3RhcnQubGluZSAhPT0gbm9kZS5sb2MuZW5kLmxpbmUpIHtcbiAgICAgICAgY29sdW1uID0gMFxuICAgICAgfVxuXG4gICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgIGxvYzoge1xuICAgICAgICAgIGxpbmU6IG5vZGUubG9jLmVuZC5saW5lLFxuICAgICAgICAgIGNvbHVtbixcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZTogYEV4cGVjdGVkIGVtcHR5IGxpbmUgYWZ0ZXIgJHt0eXBlfSBzdGF0ZW1lbnQgbm90IGZvbGxvd2VkIGJ5IGFub3RoZXIgJHt0eXBlfS5gLFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIEltcG9ydERlY2xhcmF0aW9uOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgY29uc3QgeyBwYXJlbnQgfSA9IG5vZGVcbiAgICAgIGNvbnN0IG5vZGVQb3NpdGlvbiA9IHBhcmVudC5ib2R5LmluZGV4T2Yobm9kZSlcbiAgICAgIGNvbnN0IG5leHROb2RlID0gcGFyZW50LmJvZHlbbm9kZVBvc2l0aW9uICsgMV1cblxuICAgICAgaWYgKG5leHROb2RlICYmIG5leHROb2RlLnR5cGUgIT09ICdJbXBvcnREZWNsYXJhdGlvbicpIHtcbiAgICAgICAgY2hlY2tGb3JOZXdMaW5lKG5vZGUsIG5leHROb2RlLCAnaW1wb3J0JylcbiAgICAgIH1cbiAgICB9LFxuICAgIFByb2dyYW06IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNjb3Blcy5wdXNoKHsgc2NvcGU6IGNvbnRleHQuZ2V0U2NvcGUoKSwgcmVxdWlyZUNhbGxzOiBbXSB9KVxuICAgIH0sXG4gICAgQ2FsbEV4cHJlc3Npb246IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGNvbnN0IHNjb3BlID0gY29udGV4dC5nZXRTY29wZSgpXG4gICAgICBpZiAoaXNTdGF0aWNSZXF1aXJlKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTY29wZSA9IHNjb3Blc1tzY29wZUluZGV4XVxuXG4gICAgICAgIGlmIChzY29wZSA9PT0gY3VycmVudFNjb3BlLnNjb3BlKSB7XG4gICAgICAgICAgY3VycmVudFNjb3BlLnJlcXVpcmVDYWxscy5wdXNoKG5vZGUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2NvcGVzLnB1c2goeyBzY29wZSwgcmVxdWlyZUNhbGxzOiBbIG5vZGUgXSB9KVxuICAgICAgICAgIHNjb3BlSW5kZXggKz0gMVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICAnUHJvZ3JhbTpleGl0JzogZnVuY3Rpb24gKCkge1xuICAgICAgbG9nKCdleGl0IHByb2Nlc3NpbmcgZm9yJywgY29udGV4dC5nZXRGaWxlbmFtZSgpKVxuICAgICAgc2NvcGVzLmZvckVhY2goZnVuY3Rpb24gKHsgc2NvcGUsIHJlcXVpcmVDYWxscyB9KSB7XG4gICAgICAgIGNvbnN0IHNjb3BlQm9keSA9IGdldFNjb3BlQm9keShzY29wZSlcblxuICAgICAgICAvLyBza2lwIG5vbi1hcnJheSBzY29wZXMgKGkuZS4gYXJyb3cgZnVuY3Rpb24gZXhwcmVzc2lvbnMpXG4gICAgICAgIGlmICghc2NvcGVCb2R5IHx8ICEoc2NvcGVCb2R5IGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgbG9nKCdpbnZhbGlkIHNjb3BlOicsIHNjb3BlQm9keSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZygnZ290IHNjb3BlOicsIHNjb3BlQm9keSlcblxuICAgICAgICByZXF1aXJlQ2FsbHMuZm9yRWFjaChmdW5jdGlvbiAobm9kZSwgaW5kZXgpIHtcbiAgICAgICAgICBjb25zdCBub2RlUG9zaXRpb24gPSBmaW5kTm9kZUluZGV4SW5TY29wZUJvZHkoc2NvcGVCb2R5LCBub2RlKVxuICAgICAgICAgIGxvZygnbm9kZSBwb3NpdGlvbiBpbiBzY29wZTonLCBub2RlUG9zaXRpb24pXG5cbiAgICAgICAgICBjb25zdCBzdGF0ZW1lbnRXaXRoUmVxdWlyZUNhbGwgPSBzY29wZUJvZHlbbm9kZVBvc2l0aW9uXVxuICAgICAgICAgIGNvbnN0IG5leHRTdGF0ZW1lbnQgPSBzY29wZUJvZHlbbm9kZVBvc2l0aW9uICsgMV1cbiAgICAgICAgICBjb25zdCBuZXh0UmVxdWlyZUNhbGwgPSByZXF1aXJlQ2FsbHNbaW5kZXggKyAxXVxuXG4gICAgICAgICAgaWYgKG5leHRSZXF1aXJlQ2FsbCAmJiBjb250YWluc05vZGVPckVxdWFsKHN0YXRlbWVudFdpdGhSZXF1aXJlQ2FsbCwgbmV4dFJlcXVpcmVDYWxsKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG5leHRTdGF0ZW1lbnQgJiZcbiAgICAgICAgICAgICAoIW5leHRSZXF1aXJlQ2FsbCB8fCAhY29udGFpbnNOb2RlT3JFcXVhbChuZXh0U3RhdGVtZW50LCBuZXh0UmVxdWlyZUNhbGwpKSkge1xuXG4gICAgICAgICAgICBjaGVja0Zvck5ld0xpbmUoc3RhdGVtZW50V2l0aFJlcXVpcmVDYWxsLCBuZXh0U3RhdGVtZW50LCAncmVxdWlyZScpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9LFxuICB9XG59XG4iXX0=