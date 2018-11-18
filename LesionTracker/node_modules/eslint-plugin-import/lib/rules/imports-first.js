'use strict';

module.exports = function (context) {
  function isPossibleDirective(node) {
    return node.type === 'ExpressionStatement' && node.expression.type === 'Literal' && typeof node.expression.value === 'string';
  }

  return {
    'Program': function Program(n) {
      var body = n.body,
          absoluteFirst = context.options[0] === 'absolute-first';
      var nonImportCount = 0,
          anyExpressions = false,
          anyRelative = false;
      body.forEach(function (node) {
        if (!anyExpressions && isPossibleDirective(node)) {
          return;
        }

        anyExpressions = true;

        if (node.type === 'ImportDeclaration') {
          if (absoluteFirst) {
            if (/^\./.test(node.source.value)) {
              anyRelative = true;
            } else if (anyRelative) {
              context.report({
                node: node.source,
                message: 'Absolute imports should come before relative imports.'
              });
            }
          }
          if (nonImportCount > 0) {
            context.report({
              node: node,
              message: 'Import in body of module; reorder to top.'
            });
          }
        } else {
          nonImportCount++;
        }
      });
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2ltcG9ydHMtZmlyc3QuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImNvbnRleHQiLCJpc1Bvc3NpYmxlRGlyZWN0aXZlIiwibm9kZSIsInR5cGUiLCJleHByZXNzaW9uIiwidmFsdWUiLCJuIiwiYm9keSIsImFic29sdXRlRmlyc3QiLCJvcHRpb25zIiwibm9uSW1wb3J0Q291bnQiLCJhbnlFeHByZXNzaW9ucyIsImFueVJlbGF0aXZlIiwiZm9yRWFjaCIsInRlc3QiLCJzb3VyY2UiLCJyZXBvcnQiLCJtZXNzYWdlIl0sIm1hcHBpbmdzIjoiOztBQUFBQSxPQUFPQyxPQUFQLEdBQWlCLFVBQVVDLE9BQVYsRUFBbUI7QUFDbEMsV0FBU0MsbUJBQVQsQ0FBOEJDLElBQTlCLEVBQW9DO0FBQ2xDLFdBQU9BLEtBQUtDLElBQUwsS0FBYyxxQkFBZCxJQUNMRCxLQUFLRSxVQUFMLENBQWdCRCxJQUFoQixLQUF5QixTQURwQixJQUVMLE9BQU9ELEtBQUtFLFVBQUwsQ0FBZ0JDLEtBQXZCLEtBQWlDLFFBRm5DO0FBR0Q7O0FBRUQsU0FBTztBQUNMLGVBQVcsaUJBQVVDLENBQVYsRUFBYTtBQUN0QixVQUFNQyxPQUFPRCxFQUFFQyxJQUFmO0FBQUEsVUFDTUMsZ0JBQWdCUixRQUFRUyxPQUFSLENBQWdCLENBQWhCLE1BQXVCLGdCQUQ3QztBQUVBLFVBQUlDLGlCQUFpQixDQUFyQjtBQUFBLFVBQ0lDLGlCQUFpQixLQURyQjtBQUFBLFVBRUlDLGNBQWMsS0FGbEI7QUFHQUwsV0FBS00sT0FBTCxDQUFhLFVBQVVYLElBQVYsRUFBZTtBQUMxQixZQUFJLENBQUNTLGNBQUQsSUFBbUJWLG9CQUFvQkMsSUFBcEIsQ0FBdkIsRUFBa0Q7QUFDaEQ7QUFDRDs7QUFFRFMseUJBQWlCLElBQWpCOztBQUVBLFlBQUlULEtBQUtDLElBQUwsS0FBYyxtQkFBbEIsRUFBdUM7QUFDckMsY0FBSUssYUFBSixFQUFtQjtBQUNqQixnQkFBSSxNQUFNTSxJQUFOLENBQVdaLEtBQUthLE1BQUwsQ0FBWVYsS0FBdkIsQ0FBSixFQUFtQztBQUNqQ08sNEJBQWMsSUFBZDtBQUNELGFBRkQsTUFFTyxJQUFJQSxXQUFKLEVBQWlCO0FBQ3RCWixzQkFBUWdCLE1BQVIsQ0FBZTtBQUNiZCxzQkFBTUEsS0FBS2EsTUFERTtBQUViRSx5QkFBUztBQUZJLGVBQWY7QUFJRDtBQUNGO0FBQ0QsY0FBSVAsaUJBQWlCLENBQXJCLEVBQXdCO0FBQ3RCVixvQkFBUWdCLE1BQVIsQ0FBZTtBQUNiZCx3QkFEYTtBQUViZSx1QkFBUztBQUZJLGFBQWY7QUFJRDtBQUNGLFNBakJELE1BaUJPO0FBQ0xQO0FBQ0Q7QUFDRixPQTNCRDtBQTRCRDtBQW5DSSxHQUFQO0FBcUNELENBNUNEIiwiZmlsZSI6InJ1bGVzL2ltcG9ydHMtZmlyc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGZ1bmN0aW9uIGlzUG9zc2libGVEaXJlY3RpdmUgKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS50eXBlID09PSAnRXhwcmVzc2lvblN0YXRlbWVudCcgJiZcbiAgICAgIG5vZGUuZXhwcmVzc2lvbi50eXBlID09PSAnTGl0ZXJhbCcgJiZcbiAgICAgIHR5cGVvZiBub2RlLmV4cHJlc3Npb24udmFsdWUgPT09ICdzdHJpbmcnXG4gIH1cblxuICByZXR1cm4ge1xuICAgICdQcm9ncmFtJzogZnVuY3Rpb24gKG4pIHtcbiAgICAgIGNvbnN0IGJvZHkgPSBuLmJvZHlcbiAgICAgICAgICAsIGFic29sdXRlRmlyc3QgPSBjb250ZXh0Lm9wdGlvbnNbMF0gPT09ICdhYnNvbHV0ZS1maXJzdCdcbiAgICAgIGxldCBub25JbXBvcnRDb3VudCA9IDBcbiAgICAgICAgLCBhbnlFeHByZXNzaW9ucyA9IGZhbHNlXG4gICAgICAgICwgYW55UmVsYXRpdmUgPSBmYWxzZVxuICAgICAgYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKXtcbiAgICAgICAgaWYgKCFhbnlFeHByZXNzaW9ucyAmJiBpc1Bvc3NpYmxlRGlyZWN0aXZlKG5vZGUpKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBhbnlFeHByZXNzaW9ucyA9IHRydWVcbiAgICAgICAgIFxuICAgICAgICBpZiAobm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nKSB7XG4gICAgICAgICAgaWYgKGFic29sdXRlRmlyc3QpIHtcbiAgICAgICAgICAgIGlmICgvXlxcLi8udGVzdChub2RlLnNvdXJjZS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgYW55UmVsYXRpdmUgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFueVJlbGF0aXZlKSB7XG4gICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgICBub2RlOiBub2RlLnNvdXJjZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnQWJzb2x1dGUgaW1wb3J0cyBzaG91bGQgY29tZSBiZWZvcmUgcmVsYXRpdmUgaW1wb3J0cy4nLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobm9uSW1wb3J0Q291bnQgPiAwKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbXBvcnQgaW4gYm9keSBvZiBtb2R1bGU7IHJlb3JkZXIgdG8gdG9wLicsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub25JbXBvcnRDb3VudCsrXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgfVxufVxuIl19