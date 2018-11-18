'use strict';

/**
 * @fileoverview Rule to prefer imports to AMD
 * @author Jamund Ferguson
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  return {

    'CallExpression': function CallExpression(node) {
      if (context.getScope().type !== 'module') return;

      if (node.callee.type !== 'Identifier') return;
      if (node.callee.name !== 'require' && node.callee.name !== 'define') return;

      // todo: capture define((require, module, exports) => {}) form?
      if (node.arguments.length !== 2) return;

      var modules = node.arguments[0];
      if (modules.type !== 'ArrayExpression') return;

      // todo: check second arg type? (identifier or callback)

      context.report(node, 'Expected imports instead of AMD ' + node.callee.name + '().');
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWFtZC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiY29udGV4dCIsIm5vZGUiLCJnZXRTY29wZSIsInR5cGUiLCJjYWxsZWUiLCJuYW1lIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwibW9kdWxlcyIsInJlcG9ydCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7QUFLQTtBQUNBO0FBQ0E7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUIsVUFBVUMsT0FBVixFQUFtQjs7QUFFbkMsU0FBTzs7QUFFTixzQkFBa0Isd0JBQVVDLElBQVYsRUFBZ0I7QUFDOUIsVUFBSUQsUUFBUUUsUUFBUixHQUFtQkMsSUFBbkIsS0FBNEIsUUFBaEMsRUFBMEM7O0FBRTFDLFVBQUlGLEtBQUtHLE1BQUwsQ0FBWUQsSUFBWixLQUFxQixZQUF6QixFQUF1QztBQUN2QyxVQUFJRixLQUFLRyxNQUFMLENBQVlDLElBQVosS0FBcUIsU0FBckIsSUFDQUosS0FBS0csTUFBTCxDQUFZQyxJQUFaLEtBQXFCLFFBRHpCLEVBQ21DOztBQUVuQztBQUNBLFVBQUlKLEtBQUtLLFNBQUwsQ0FBZUMsTUFBZixLQUEwQixDQUE5QixFQUFpQzs7QUFFakMsVUFBTUMsVUFBVVAsS0FBS0ssU0FBTCxDQUFlLENBQWYsQ0FBaEI7QUFDQSxVQUFJRSxRQUFRTCxJQUFSLEtBQWlCLGlCQUFyQixFQUF3Qzs7QUFFeEM7O0FBRUhILGNBQVFTLE1BQVIsQ0FBZVIsSUFBZix1Q0FBd0RBLEtBQUtHLE1BQUwsQ0FBWUMsSUFBcEU7QUFDQTtBQWxCSyxHQUFQO0FBcUJBLENBdkJEIiwiZmlsZSI6InJ1bGVzL25vLWFtZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHByZWZlciBpbXBvcnRzIHRvIEFNRFxuICogQGF1dGhvciBKYW11bmQgRmVyZ3Vzb25cbiAqL1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUnVsZSBEZWZpbml0aW9uXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG5cblx0cmV0dXJuIHtcblxuXHRcdCdDYWxsRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBpZiAoY29udGV4dC5nZXRTY29wZSgpLnR5cGUgIT09ICdtb2R1bGUnKSByZXR1cm5cblxuICAgICAgaWYgKG5vZGUuY2FsbGVlLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG4gICAgICBpZiAobm9kZS5jYWxsZWUubmFtZSAhPT0gJ3JlcXVpcmUnICYmXG4gICAgICAgICAgbm9kZS5jYWxsZWUubmFtZSAhPT0gJ2RlZmluZScpIHJldHVyblxuXG4gICAgICAvLyB0b2RvOiBjYXB0dXJlIGRlZmluZSgocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKSA9PiB7fSkgZm9ybT9cbiAgICAgIGlmIChub2RlLmFyZ3VtZW50cy5sZW5ndGggIT09IDIpIHJldHVyblxuXG4gICAgICBjb25zdCBtb2R1bGVzID0gbm9kZS5hcmd1bWVudHNbMF1cbiAgICAgIGlmIChtb2R1bGVzLnR5cGUgIT09ICdBcnJheUV4cHJlc3Npb24nKSByZXR1cm5cblxuICAgICAgLy8gdG9kbzogY2hlY2sgc2Vjb25kIGFyZyB0eXBlPyAoaWRlbnRpZmllciBvciBjYWxsYmFjaylcblxuXHRcdFx0Y29udGV4dC5yZXBvcnQobm9kZSwgYEV4cGVjdGVkIGltcG9ydHMgaW5zdGVhZCBvZiBBTUQgJHtub2RlLmNhbGxlZS5uYW1lfSgpLmApXG5cdFx0fSxcblx0fVxuXG59XG4iXX0=