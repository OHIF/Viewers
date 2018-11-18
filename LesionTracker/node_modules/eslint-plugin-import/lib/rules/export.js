'use strict';

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _es6Set = require('es6-set');

var _es6Set2 = _interopRequireDefault(_es6Set);

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (context) {
  var named = new _es6Map2.default();

  function addNamed(name, node) {
    var nodes = named.get(name);

    if (nodes == null) {
      nodes = new _es6Set2.default();
      named.set(name, nodes);
    }

    nodes.add(node);
  }

  return {
    'ExportDefaultDeclaration': function ExportDefaultDeclaration(node) {
      return addNamed('default', node);
    },

    'ExportSpecifier': function ExportSpecifier(node) {
      addNamed(node.exported.name, node.exported);
    },

    'ExportNamedDeclaration': function ExportNamedDeclaration(node) {
      if (node.declaration == null) return;

      if (node.declaration.id != null) {
        addNamed(node.declaration.id.name, node.declaration.id);
      }

      if (node.declaration.declarations == null) return;

      node.declaration.declarations.forEach(function (declaration) {
        (0, _getExports.recursivePatternCapture)(declaration.id, function (v) {
          return addNamed(v.name, v);
        });
      });
    },

    'ExportAllDeclaration': function ExportAllDeclaration(node) {
      if (node.source == null) return; // not sure if this is ever true

      var remoteExports = _getExports2.default.get(node.source.value, context);
      if (remoteExports == null) return;

      if (remoteExports.errors.length) {
        remoteExports.reportErrors(context, node);
        return;
      }
      var any = false;
      remoteExports.forEach(function (v, name) {
        return name !== 'default' && (any = true) && // poor man's filter
        addNamed(name, node);
      });

      if (!any) {
        context.report(node.source, 'No named exports found in module \'' + node.source.value + '\'.');
      }
    },

    'Program:exit': function ProgramExit() {
      named.forEach(function (nodes, name) {
        if (nodes.size <= 1) return;

        nodes.forEach(function (node) {
          if (name === 'default') {
            context.report(node, 'Multiple default exports.');
          } else context.report(node, 'Multiple exports of name \'' + name + '\'.');
        });
      });
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2V4cG9ydC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiY29udGV4dCIsIm5hbWVkIiwiYWRkTmFtZWQiLCJuYW1lIiwibm9kZSIsIm5vZGVzIiwiZ2V0Iiwic2V0IiwiYWRkIiwiZXhwb3J0ZWQiLCJkZWNsYXJhdGlvbiIsImlkIiwiZGVjbGFyYXRpb25zIiwiZm9yRWFjaCIsInYiLCJzb3VyY2UiLCJyZW1vdGVFeHBvcnRzIiwidmFsdWUiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZXBvcnRFcnJvcnMiLCJhbnkiLCJyZXBvcnQiLCJzaXplIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7QUFFQTs7Ozs7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUIsVUFBVUMsT0FBVixFQUFtQjtBQUNsQyxNQUFNQyxRQUFRLHNCQUFkOztBQUVBLFdBQVNDLFFBQVQsQ0FBa0JDLElBQWxCLEVBQXdCQyxJQUF4QixFQUE4QjtBQUM1QixRQUFJQyxRQUFRSixNQUFNSyxHQUFOLENBQVVILElBQVYsQ0FBWjs7QUFFQSxRQUFJRSxTQUFTLElBQWIsRUFBbUI7QUFDakJBLGNBQVEsc0JBQVI7QUFDQUosWUFBTU0sR0FBTixDQUFVSixJQUFWLEVBQWdCRSxLQUFoQjtBQUNEOztBQUVEQSxVQUFNRyxHQUFOLENBQVVKLElBQVY7QUFDRDs7QUFFRCxTQUFPO0FBQ0wsZ0NBQTRCLGtDQUFDQSxJQUFEO0FBQUEsYUFBVUYsU0FBUyxTQUFULEVBQW9CRSxJQUFwQixDQUFWO0FBQUEsS0FEdkI7O0FBR0wsdUJBQW1CLHlCQUFVQSxJQUFWLEVBQWdCO0FBQ2pDRixlQUFTRSxLQUFLSyxRQUFMLENBQWNOLElBQXZCLEVBQTZCQyxLQUFLSyxRQUFsQztBQUNELEtBTEk7O0FBT0wsOEJBQTBCLGdDQUFVTCxJQUFWLEVBQWdCO0FBQ3hDLFVBQUlBLEtBQUtNLFdBQUwsSUFBb0IsSUFBeEIsRUFBOEI7O0FBRTlCLFVBQUlOLEtBQUtNLFdBQUwsQ0FBaUJDLEVBQWpCLElBQXVCLElBQTNCLEVBQWlDO0FBQy9CVCxpQkFBU0UsS0FBS00sV0FBTCxDQUFpQkMsRUFBakIsQ0FBb0JSLElBQTdCLEVBQW1DQyxLQUFLTSxXQUFMLENBQWlCQyxFQUFwRDtBQUNEOztBQUVELFVBQUlQLEtBQUtNLFdBQUwsQ0FBaUJFLFlBQWpCLElBQWlDLElBQXJDLEVBQTJDOztBQUUzQ1IsV0FBS00sV0FBTCxDQUFpQkUsWUFBakIsQ0FBOEJDLE9BQTlCLENBQXNDLHVCQUFlO0FBQ25ELGlEQUF3QkgsWUFBWUMsRUFBcEMsRUFBd0M7QUFBQSxpQkFBS1QsU0FBU1ksRUFBRVgsSUFBWCxFQUFpQlcsQ0FBakIsQ0FBTDtBQUFBLFNBQXhDO0FBQ0QsT0FGRDtBQUdELEtBbkJJOztBQXFCTCw0QkFBd0IsOEJBQVVWLElBQVYsRUFBZ0I7QUFDdEMsVUFBSUEsS0FBS1csTUFBTCxJQUFlLElBQW5CLEVBQXlCLE9BRGEsQ0FDTjs7QUFFaEMsVUFBTUMsZ0JBQWdCLHFCQUFVVixHQUFWLENBQWNGLEtBQUtXLE1BQUwsQ0FBWUUsS0FBMUIsRUFBaUNqQixPQUFqQyxDQUF0QjtBQUNBLFVBQUlnQixpQkFBaUIsSUFBckIsRUFBMkI7O0FBRTNCLFVBQUlBLGNBQWNFLE1BQWQsQ0FBcUJDLE1BQXpCLEVBQWlDO0FBQy9CSCxzQkFBY0ksWUFBZCxDQUEyQnBCLE9BQTNCLEVBQW9DSSxJQUFwQztBQUNBO0FBQ0Q7QUFDRCxVQUFJaUIsTUFBTSxLQUFWO0FBQ0FMLG9CQUFjSCxPQUFkLENBQXNCLFVBQUNDLENBQUQsRUFBSVgsSUFBSjtBQUFBLGVBQ3BCQSxTQUFTLFNBQVQsS0FDQ2tCLE1BQU0sSUFEUCxLQUNnQjtBQUNoQm5CLGlCQUFTQyxJQUFULEVBQWVDLElBQWYsQ0FIb0I7QUFBQSxPQUF0Qjs7QUFLQSxVQUFJLENBQUNpQixHQUFMLEVBQVU7QUFDUnJCLGdCQUFRc0IsTUFBUixDQUFlbEIsS0FBS1csTUFBcEIsMENBQ3VDWCxLQUFLVyxNQUFMLENBQVlFLEtBRG5EO0FBRUQ7QUFDRixLQXpDSTs7QUEyQ0wsb0JBQWdCLHVCQUFZO0FBQzFCaEIsWUFBTVksT0FBTixDQUFjLFVBQUNSLEtBQUQsRUFBUUYsSUFBUixFQUFpQjtBQUM3QixZQUFJRSxNQUFNa0IsSUFBTixJQUFjLENBQWxCLEVBQXFCOztBQUVyQmxCLGNBQU1RLE9BQU4sQ0FBYyxnQkFBUTtBQUNwQixjQUFJVixTQUFTLFNBQWIsRUFBd0I7QUFDdEJILG9CQUFRc0IsTUFBUixDQUFlbEIsSUFBZixFQUFxQiwyQkFBckI7QUFDRCxXQUZELE1BRU9KLFFBQVFzQixNQUFSLENBQWVsQixJQUFmLGtDQUFrREQsSUFBbEQ7QUFDUixTQUpEO0FBS0QsT0FSRDtBQVNEO0FBckRJLEdBQVA7QUF1REQsQ0FyRUQiLCJmaWxlIjoicnVsZXMvZXhwb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE1hcCBmcm9tICdlczYtbWFwJ1xuaW1wb3J0IFNldCBmcm9tICdlczYtc2V0J1xuXG5pbXBvcnQgRXhwb3J0TWFwLCB7IHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlIH0gZnJvbSAnLi4vY29yZS9nZXRFeHBvcnRzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGNvbnN0IG5hbWVkID0gbmV3IE1hcCgpXG5cbiAgZnVuY3Rpb24gYWRkTmFtZWQobmFtZSwgbm9kZSkge1xuICAgIGxldCBub2RlcyA9IG5hbWVkLmdldChuYW1lKVxuXG4gICAgaWYgKG5vZGVzID09IG51bGwpIHtcbiAgICAgIG5vZGVzID0gbmV3IFNldCgpXG4gICAgICBuYW1lZC5zZXQobmFtZSwgbm9kZXMpXG4gICAgfVxuXG4gICAgbm9kZXMuYWRkKG5vZGUpXG4gIH1cblxuICByZXR1cm4ge1xuICAgICdFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24nOiAobm9kZSkgPT4gYWRkTmFtZWQoJ2RlZmF1bHQnLCBub2RlKSxcblxuICAgICdFeHBvcnRTcGVjaWZpZXInOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgYWRkTmFtZWQobm9kZS5leHBvcnRlZC5uYW1lLCBub2RlLmV4cG9ydGVkKVxuICAgIH0sXG5cbiAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBpZiAobm9kZS5kZWNsYXJhdGlvbiA9PSBudWxsKSByZXR1cm5cblxuICAgICAgaWYgKG5vZGUuZGVjbGFyYXRpb24uaWQgIT0gbnVsbCkge1xuICAgICAgICBhZGROYW1lZChub2RlLmRlY2xhcmF0aW9uLmlkLm5hbWUsIG5vZGUuZGVjbGFyYXRpb24uaWQpXG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucyA9PSBudWxsKSByZXR1cm5cblxuICAgICAgbm9kZS5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICAgIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKGRlY2xhcmF0aW9uLmlkLCB2ID0+IGFkZE5hbWVkKHYubmFtZSwgdikpXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAnRXhwb3J0QWxsRGVjbGFyYXRpb24nOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgaWYgKG5vZGUuc291cmNlID09IG51bGwpIHJldHVybiAvLyBub3Qgc3VyZSBpZiB0aGlzIGlzIGV2ZXIgdHJ1ZVxuXG4gICAgICBjb25zdCByZW1vdGVFeHBvcnRzID0gRXhwb3J0TWFwLmdldChub2RlLnNvdXJjZS52YWx1ZSwgY29udGV4dClcbiAgICAgIGlmIChyZW1vdGVFeHBvcnRzID09IG51bGwpIHJldHVyblxuXG4gICAgICBpZiAocmVtb3RlRXhwb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIHJlbW90ZUV4cG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgbGV0IGFueSA9IGZhbHNlXG4gICAgICByZW1vdGVFeHBvcnRzLmZvckVhY2goKHYsIG5hbWUpID0+XG4gICAgICAgIG5hbWUgIT09ICdkZWZhdWx0JyAmJlxuICAgICAgICAoYW55ID0gdHJ1ZSkgJiYgLy8gcG9vciBtYW4ncyBmaWx0ZXJcbiAgICAgICAgYWRkTmFtZWQobmFtZSwgbm9kZSkpXG5cbiAgICAgIGlmICghYW55KSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUuc291cmNlLFxuICAgICAgICAgIGBObyBuYW1lZCBleHBvcnRzIGZvdW5kIGluIG1vZHVsZSAnJHtub2RlLnNvdXJjZS52YWx1ZX0nLmApXG4gICAgICB9XG4gICAgfSxcblxuICAgICdQcm9ncmFtOmV4aXQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBuYW1lZC5mb3JFYWNoKChub2RlcywgbmFtZSkgPT4ge1xuICAgICAgICBpZiAobm9kZXMuc2l6ZSA8PSAxKSByZXR1cm5cblxuICAgICAgICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgICAgIGlmIChuYW1lID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUsICdNdWx0aXBsZSBkZWZhdWx0IGV4cG9ydHMuJylcbiAgICAgICAgICB9IGVsc2UgY29udGV4dC5yZXBvcnQobm9kZSwgYE11bHRpcGxlIGV4cG9ydHMgb2YgbmFtZSAnJHtuYW1lfScuYClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSxcbiAgfVxufVxuIl19