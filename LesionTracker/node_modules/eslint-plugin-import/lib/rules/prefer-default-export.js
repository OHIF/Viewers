'use strict';

module.exports = function (context) {
  var specifierExportCount = 0;
  var hasDefaultExport = false;
  var hasStarExport = false;
  var namedExportNode = null;

  return {
    'ExportSpecifier': function ExportSpecifier(node) {
      if (node.exported.name === 'default') {
        hasDefaultExport = true;
      } else {
        specifierExportCount++;
        namedExportNode = node;
      }
    },

    'ExportNamedDeclaration': function ExportNamedDeclaration(node) {
      // if there are specifiers, node.declaration should be null
      if (!node.declaration) return;

      function captureDeclaration(identifierOrPattern) {
        if (identifierOrPattern.type === 'ObjectPattern') {
          // recursively capture
          identifierOrPattern.properties.forEach(function (property) {
            captureDeclaration(property.value);
          });
        } else {
          // assume it's a single standard identifier
          specifierExportCount++;
        }
      }

      if (node.declaration.declarations) {
        node.declaration.declarations.forEach(function (declaration) {
          captureDeclaration(declaration.id);
        });
      } else {
        // captures 'export function foo() {}' syntax
        specifierExportCount++;
      }

      namedExportNode = node;
    },

    'ExportDefaultDeclaration': function ExportDefaultDeclaration() {
      hasDefaultExport = true;
    },

    'ExportAllDeclaration': function ExportAllDeclaration() {
      hasStarExport = true;
    },

    'Program:exit': function ProgramExit() {
      if (specifierExportCount === 1 && !hasDefaultExport && !hasStarExport) {
        context.report(namedExportNode, 'Prefer default export.');
      }
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL3ByZWZlci1kZWZhdWx0LWV4cG9ydC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiY29udGV4dCIsInNwZWNpZmllckV4cG9ydENvdW50IiwiaGFzRGVmYXVsdEV4cG9ydCIsImhhc1N0YXJFeHBvcnQiLCJuYW1lZEV4cG9ydE5vZGUiLCJub2RlIiwiZXhwb3J0ZWQiLCJuYW1lIiwiZGVjbGFyYXRpb24iLCJjYXB0dXJlRGVjbGFyYXRpb24iLCJpZGVudGlmaWVyT3JQYXR0ZXJuIiwidHlwZSIsInByb3BlcnRpZXMiLCJmb3JFYWNoIiwicHJvcGVydHkiLCJ2YWx1ZSIsImRlY2xhcmF0aW9ucyIsImlkIiwicmVwb3J0Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQixVQUFTQyxPQUFULEVBQWtCO0FBQ2pDLE1BQUlDLHVCQUF1QixDQUEzQjtBQUNBLE1BQUlDLG1CQUFtQixLQUF2QjtBQUNBLE1BQUlDLGdCQUFnQixLQUFwQjtBQUNBLE1BQUlDLGtCQUFrQixJQUF0Qjs7QUFFQSxTQUFPO0FBQ0wsdUJBQW1CLHlCQUFTQyxJQUFULEVBQWU7QUFDaEMsVUFBSUEsS0FBS0MsUUFBTCxDQUFjQyxJQUFkLEtBQXVCLFNBQTNCLEVBQXNDO0FBQ3BDTCwyQkFBbUIsSUFBbkI7QUFDRCxPQUZELE1BRU87QUFDTEQ7QUFDQUcsMEJBQWtCQyxJQUFsQjtBQUNEO0FBQ0YsS0FSSTs7QUFVTCw4QkFBMEIsZ0NBQVNBLElBQVQsRUFBZTtBQUN2QztBQUNBLFVBQUksQ0FBQ0EsS0FBS0csV0FBVixFQUF1Qjs7QUFFdkIsZUFBU0Msa0JBQVQsQ0FBNEJDLG1CQUE1QixFQUFpRDtBQUMvQyxZQUFJQSxvQkFBb0JDLElBQXBCLEtBQTZCLGVBQWpDLEVBQWtEO0FBQ2hEO0FBQ0FELDhCQUFvQkUsVUFBcEIsQ0FDR0MsT0FESCxDQUNXLFVBQVNDLFFBQVQsRUFBbUI7QUFDMUJMLCtCQUFtQkssU0FBU0MsS0FBNUI7QUFDRCxXQUhIO0FBSUQsU0FORCxNQU1PO0FBQ1A7QUFDRWQ7QUFDRDtBQUNGOztBQUVELFVBQUlJLEtBQUtHLFdBQUwsQ0FBaUJRLFlBQXJCLEVBQW1DO0FBQ2pDWCxhQUFLRyxXQUFMLENBQWlCUSxZQUFqQixDQUE4QkgsT0FBOUIsQ0FBc0MsVUFBU0wsV0FBVCxFQUFzQjtBQUMxREMsNkJBQW1CRCxZQUFZUyxFQUEvQjtBQUNELFNBRkQ7QUFHRCxPQUpELE1BS0s7QUFDSDtBQUNBaEI7QUFDRDs7QUFFREcsd0JBQWtCQyxJQUFsQjtBQUNELEtBdENJOztBQXdDTCxnQ0FBNEIsb0NBQVc7QUFDckNILHlCQUFtQixJQUFuQjtBQUNELEtBMUNJOztBQTRDTCw0QkFBd0IsZ0NBQVc7QUFDakNDLHNCQUFnQixJQUFoQjtBQUNELEtBOUNJOztBQWdETCxvQkFBZ0IsdUJBQVc7QUFDekIsVUFBSUYseUJBQXlCLENBQXpCLElBQThCLENBQUNDLGdCQUEvQixJQUFtRCxDQUFDQyxhQUF4RCxFQUF1RTtBQUNyRUgsZ0JBQVFrQixNQUFSLENBQWVkLGVBQWYsRUFBZ0Msd0JBQWhDO0FBQ0Q7QUFDRjtBQXBESSxHQUFQO0FBc0RELENBNUREIiwiZmlsZSI6InJ1bGVzL3ByZWZlci1kZWZhdWx0LWV4cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgbGV0IHNwZWNpZmllckV4cG9ydENvdW50ID0gMFxuICBsZXQgaGFzRGVmYXVsdEV4cG9ydCA9IGZhbHNlXG4gIGxldCBoYXNTdGFyRXhwb3J0ID0gZmFsc2VcbiAgbGV0IG5hbWVkRXhwb3J0Tm9kZSA9IG51bGxcblxuICByZXR1cm4ge1xuICAgICdFeHBvcnRTcGVjaWZpZXInOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAobm9kZS5leHBvcnRlZC5uYW1lID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgaGFzRGVmYXVsdEV4cG9ydCA9IHRydWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWNpZmllckV4cG9ydENvdW50KytcbiAgICAgICAgbmFtZWRFeHBvcnROb2RlID0gbm9kZVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIC8vIGlmIHRoZXJlIGFyZSBzcGVjaWZpZXJzLCBub2RlLmRlY2xhcmF0aW9uIHNob3VsZCBiZSBudWxsXG4gICAgICBpZiAoIW5vZGUuZGVjbGFyYXRpb24pIHJldHVyblxuXG4gICAgICBmdW5jdGlvbiBjYXB0dXJlRGVjbGFyYXRpb24oaWRlbnRpZmllck9yUGF0dGVybikge1xuICAgICAgICBpZiAoaWRlbnRpZmllck9yUGF0dGVybi50eXBlID09PSAnT2JqZWN0UGF0dGVybicpIHtcbiAgICAgICAgICAvLyByZWN1cnNpdmVseSBjYXB0dXJlXG4gICAgICAgICAgaWRlbnRpZmllck9yUGF0dGVybi5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICBjYXB0dXJlRGVjbGFyYXRpb24ocHJvcGVydHkudmFsdWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhc3N1bWUgaXQncyBhIHNpbmdsZSBzdGFuZGFyZCBpZGVudGlmaWVyXG4gICAgICAgICAgc3BlY2lmaWVyRXhwb3J0Q291bnQrK1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucykge1xuICAgICAgICBub2RlLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgY2FwdHVyZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9uLmlkKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIGNhcHR1cmVzICdleHBvcnQgZnVuY3Rpb24gZm9vKCkge30nIHN5bnRheFxuICAgICAgICBzcGVjaWZpZXJFeHBvcnRDb3VudCsrXG4gICAgICB9XG5cbiAgICAgIG5hbWVkRXhwb3J0Tm9kZSA9IG5vZGVcbiAgICB9LFxuXG4gICAgJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic6IGZ1bmN0aW9uKCkge1xuICAgICAgaGFzRGVmYXVsdEV4cG9ydCA9IHRydWVcbiAgICB9LFxuXG4gICAgJ0V4cG9ydEFsbERlY2xhcmF0aW9uJzogZnVuY3Rpb24oKSB7XG4gICAgICBoYXNTdGFyRXhwb3J0ID0gdHJ1ZVxuICAgIH0sXG5cbiAgICAnUHJvZ3JhbTpleGl0JzogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc3BlY2lmaWVyRXhwb3J0Q291bnQgPT09IDEgJiYgIWhhc0RlZmF1bHRFeHBvcnQgJiYgIWhhc1N0YXJFeHBvcnQpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQobmFtZWRFeHBvcnROb2RlLCAnUHJlZmVyIGRlZmF1bHQgZXhwb3J0LicpXG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuIl19