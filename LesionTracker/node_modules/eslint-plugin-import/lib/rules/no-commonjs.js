'use strict';

/**
 * @fileoverview Rule to prefer ES6 to CJS
 * @author Jamund Ferguson
 */

var EXPORT_MESSAGE = 'Expected "export" or "export default"',
    IMPORT_MESSAGE = 'Expected "import" instead of "require()"';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = function (context) {

  return {

    'MemberExpression': function MemberExpression(node) {

      // module.exports
      if (node.object.name === 'module' && node.property.name === 'exports') {
        if (allowPrimitive(node, context)) return;
        context.report({ node: node, message: EXPORT_MESSAGE });
      }

      // exports.
      if (node.object.name === 'exports') {
        context.report({ node: node, message: EXPORT_MESSAGE });
      }
    },
    'CallExpression': function CallExpression(call) {
      if (context.getScope().type !== 'module') return;

      if (call.callee.type !== 'Identifier') return;
      if (call.callee.name !== 'require') return;

      if (call.arguments.length !== 1) return;
      var module = call.arguments[0];

      if (module.type !== 'Literal') return;
      if (typeof module.value !== 'string') return;

      // keeping it simple: all 1-string-arg `require` calls are reported
      context.report({
        node: call.callee,
        message: IMPORT_MESSAGE
      });
    }
  };
};

// allow non-objects as module.exports
function allowPrimitive(node, context) {
  if (context.options.indexOf('allow-primitive-modules') < 0) return false;
  if (node.parent.type !== 'AssignmentExpression') return false;
  return node.parent.right.type !== 'ObjectExpression';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWNvbW1vbmpzLmpzIl0sIm5hbWVzIjpbIkVYUE9SVF9NRVNTQUdFIiwiSU1QT1JUX01FU1NBR0UiLCJtb2R1bGUiLCJleHBvcnRzIiwiY29udGV4dCIsIm5vZGUiLCJvYmplY3QiLCJuYW1lIiwicHJvcGVydHkiLCJhbGxvd1ByaW1pdGl2ZSIsInJlcG9ydCIsIm1lc3NhZ2UiLCJjYWxsIiwiZ2V0U2NvcGUiLCJ0eXBlIiwiY2FsbGVlIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwidmFsdWUiLCJvcHRpb25zIiwiaW5kZXhPZiIsInBhcmVudCIsInJpZ2h0Il0sIm1hcHBpbmdzIjoiOztBQUFBOzs7OztBQUtBLElBQU1BLGlCQUFpQix1Q0FBdkI7QUFBQSxJQUNNQyxpQkFBaUIsMENBRHZCOztBQUdBO0FBQ0E7QUFDQTs7O0FBR0FDLE9BQU9DLE9BQVAsR0FBaUIsVUFBVUMsT0FBVixFQUFtQjs7QUFFbEMsU0FBTzs7QUFFTCx3QkFBb0IsMEJBQVVDLElBQVYsRUFBZ0I7O0FBRWxDO0FBQ0EsVUFBSUEsS0FBS0MsTUFBTCxDQUFZQyxJQUFaLEtBQXFCLFFBQXJCLElBQWlDRixLQUFLRyxRQUFMLENBQWNELElBQWQsS0FBdUIsU0FBNUQsRUFBdUU7QUFDckUsWUFBSUUsZUFBZUosSUFBZixFQUFxQkQsT0FBckIsQ0FBSixFQUFtQztBQUNuQ0EsZ0JBQVFNLE1BQVIsQ0FBZSxFQUFFTCxVQUFGLEVBQVFNLFNBQVNYLGNBQWpCLEVBQWY7QUFDRDs7QUFFRDtBQUNBLFVBQUlLLEtBQUtDLE1BQUwsQ0FBWUMsSUFBWixLQUFxQixTQUF6QixFQUFvQztBQUNsQ0gsZ0JBQVFNLE1BQVIsQ0FBZSxFQUFFTCxVQUFGLEVBQVFNLFNBQVNYLGNBQWpCLEVBQWY7QUFDRDtBQUVGLEtBZkk7QUFnQkwsc0JBQWtCLHdCQUFVWSxJQUFWLEVBQWdCO0FBQ2hDLFVBQUlSLFFBQVFTLFFBQVIsR0FBbUJDLElBQW5CLEtBQTRCLFFBQWhDLEVBQTBDOztBQUUxQyxVQUFJRixLQUFLRyxNQUFMLENBQVlELElBQVosS0FBcUIsWUFBekIsRUFBdUM7QUFDdkMsVUFBSUYsS0FBS0csTUFBTCxDQUFZUixJQUFaLEtBQXFCLFNBQXpCLEVBQW9DOztBQUVwQyxVQUFJSyxLQUFLSSxTQUFMLENBQWVDLE1BQWYsS0FBMEIsQ0FBOUIsRUFBaUM7QUFDakMsVUFBSWYsU0FBU1UsS0FBS0ksU0FBTCxDQUFlLENBQWYsQ0FBYjs7QUFFQSxVQUFJZCxPQUFPWSxJQUFQLEtBQWdCLFNBQXBCLEVBQStCO0FBQy9CLFVBQUksT0FBT1osT0FBT2dCLEtBQWQsS0FBd0IsUUFBNUIsRUFBc0M7O0FBRXRDO0FBQ0FkLGNBQVFNLE1BQVIsQ0FBZTtBQUNiTCxjQUFNTyxLQUFLRyxNQURFO0FBRWJKLGlCQUFTVjtBQUZJLE9BQWY7QUFJRDtBQWpDSSxHQUFQO0FBb0NELENBdENEOztBQXdDRTtBQUNGLFNBQVNRLGNBQVQsQ0FBd0JKLElBQXhCLEVBQThCRCxPQUE5QixFQUF1QztBQUNyQyxNQUFJQSxRQUFRZSxPQUFSLENBQWdCQyxPQUFoQixDQUF3Qix5QkFBeEIsSUFBcUQsQ0FBekQsRUFBNEQsT0FBTyxLQUFQO0FBQzVELE1BQUlmLEtBQUtnQixNQUFMLENBQVlQLElBQVosS0FBcUIsc0JBQXpCLEVBQWlELE9BQU8sS0FBUDtBQUNqRCxTQUFRVCxLQUFLZ0IsTUFBTCxDQUFZQyxLQUFaLENBQWtCUixJQUFsQixLQUEyQixrQkFBbkM7QUFDRCIsImZpbGUiOiJydWxlcy9uby1jb21tb25qcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHByZWZlciBFUzYgdG8gQ0pTXG4gKiBAYXV0aG9yIEphbXVuZCBGZXJndXNvblxuICovXG5cbmNvbnN0IEVYUE9SVF9NRVNTQUdFID0gJ0V4cGVjdGVkIFwiZXhwb3J0XCIgb3IgXCJleHBvcnQgZGVmYXVsdFwiJ1xuICAgICwgSU1QT1JUX01FU1NBR0UgPSAnRXhwZWN0ZWQgXCJpbXBvcnRcIiBpbnN0ZWFkIG9mIFwicmVxdWlyZSgpXCInXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdWxlIERlZmluaXRpb25cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuXG4gIHJldHVybiB7XG5cbiAgICAnTWVtYmVyRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChub2RlKSB7XG5cbiAgICAgIC8vIG1vZHVsZS5leHBvcnRzXG4gICAgICBpZiAobm9kZS5vYmplY3QubmFtZSA9PT0gJ21vZHVsZScgJiYgbm9kZS5wcm9wZXJ0eS5uYW1lID09PSAnZXhwb3J0cycpIHtcbiAgICAgICAgaWYgKGFsbG93UHJpbWl0aXZlKG5vZGUsIGNvbnRleHQpKSByZXR1cm5cbiAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBFWFBPUlRfTUVTU0FHRSB9KVxuICAgICAgfVxuXG4gICAgICAvLyBleHBvcnRzLlxuICAgICAgaWYgKG5vZGUub2JqZWN0Lm5hbWUgPT09ICdleHBvcnRzJykge1xuICAgICAgICBjb250ZXh0LnJlcG9ydCh7IG5vZGUsIG1lc3NhZ2U6IEVYUE9SVF9NRVNTQUdFIH0pXG4gICAgICB9XG5cbiAgICB9LFxuICAgICdDYWxsRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChjYWxsKSB7XG4gICAgICBpZiAoY29udGV4dC5nZXRTY29wZSgpLnR5cGUgIT09ICdtb2R1bGUnKSByZXR1cm5cblxuICAgICAgaWYgKGNhbGwuY2FsbGVlLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG4gICAgICBpZiAoY2FsbC5jYWxsZWUubmFtZSAhPT0gJ3JlcXVpcmUnKSByZXR1cm5cblxuICAgICAgaWYgKGNhbGwuYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkgcmV0dXJuXG4gICAgICB2YXIgbW9kdWxlID0gY2FsbC5hcmd1bWVudHNbMF1cblxuICAgICAgaWYgKG1vZHVsZS50eXBlICE9PSAnTGl0ZXJhbCcpIHJldHVyblxuICAgICAgaWYgKHR5cGVvZiBtb2R1bGUudmFsdWUgIT09ICdzdHJpbmcnKSByZXR1cm5cblxuICAgICAgLy8ga2VlcGluZyBpdCBzaW1wbGU6IGFsbCAxLXN0cmluZy1hcmcgYHJlcXVpcmVgIGNhbGxzIGFyZSByZXBvcnRlZFxuICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICBub2RlOiBjYWxsLmNhbGxlZSxcbiAgICAgICAgbWVzc2FnZTogSU1QT1JUX01FU1NBR0UsXG4gICAgICB9KVxuICAgIH0sXG4gIH1cblxufVxuXG4gIC8vIGFsbG93IG5vbi1vYmplY3RzIGFzIG1vZHVsZS5leHBvcnRzXG5mdW5jdGlvbiBhbGxvd1ByaW1pdGl2ZShub2RlLCBjb250ZXh0KSB7XG4gIGlmIChjb250ZXh0Lm9wdGlvbnMuaW5kZXhPZignYWxsb3ctcHJpbWl0aXZlLW1vZHVsZXMnKSA8IDApIHJldHVybiBmYWxzZVxuICBpZiAobm9kZS5wYXJlbnQudHlwZSAhPT0gJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJykgcmV0dXJuIGZhbHNlXG4gIHJldHVybiAobm9kZS5wYXJlbnQucmlnaHQudHlwZSAhPT0gJ09iamVjdEV4cHJlc3Npb24nKVxufVxuIl19