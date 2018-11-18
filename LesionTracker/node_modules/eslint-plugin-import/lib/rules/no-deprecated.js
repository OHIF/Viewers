'use strict';

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

var _declaredScope = require('../core/declaredScope');

var _declaredScope2 = _interopRequireDefault(_declaredScope);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (context) {
  var deprecated = new _es6Map2.default(),
      namespaces = new _es6Map2.default();

  function checkSpecifiers(node) {
    if (node.type !== 'ImportDeclaration') return;
    if (node.source == null) return; // local export, ignore

    var imports = _getExports2.default.get(node.source.value, context);
    if (imports == null) return;

    var moduleDeprecation = void 0;
    if (imports.doc && imports.doc.tags.some(function (t) {
      return t.title === 'deprecated' && (moduleDeprecation = t);
    })) {
      context.report({ node: node, message: message(moduleDeprecation) });
    }

    if (imports.errors.length) {
      imports.reportErrors(context, node);
      return;
    }

    node.specifiers.forEach(function (im) {
      var imported = void 0,
          local = void 0;
      switch (im.type) {

        case 'ImportNamespaceSpecifier':
          {
            if (!imports.size) return;
            namespaces.set(im.local.name, imports);
            return;
          }

        case 'ImportDefaultSpecifier':
          imported = 'default';
          local = im.local.name;
          break;

        case 'ImportSpecifier':
          imported = im.imported.name;
          local = im.local.name;
          break;

        default:
          return; // can't handle this one
      }

      // unknown thing can't be deprecated
      var exported = imports.get(imported);
      if (exported == null) return;

      // capture import of deep namespace
      if (exported.namespace) namespaces.set(local, exported.namespace);

      var deprecation = getDeprecation(imports.get(imported));
      if (!deprecation) return;

      context.report({ node: im, message: message(deprecation) });

      deprecated.set(local, deprecation);
    });
  }

  return {
    'Program': function Program(_ref) {
      var body = _ref.body;
      return body.forEach(checkSpecifiers);
    },

    'Identifier': function Identifier(node) {
      if (node.parent.type === 'MemberExpression' && node.parent.property === node) {
        return; // handled by MemberExpression
      }

      // ignore specifier identifiers
      if (node.parent.type.slice(0, 6) === 'Import') return;

      if (!deprecated.has(node.name)) return;

      if ((0, _declaredScope2.default)(context, node.name) !== 'module') return;
      context.report({
        node: node,
        message: message(deprecated.get(node.name))
      });
    },

    'MemberExpression': function MemberExpression(dereference) {
      if (dereference.object.type !== 'Identifier') return;
      if (!namespaces.has(dereference.object.name)) return;

      if ((0, _declaredScope2.default)(context, dereference.object.name) !== 'module') return;

      // go deep
      var namespace = namespaces.get(dereference.object.name);
      var namepath = [dereference.object.name];
      // while property is namespace and parent is member expression, keep validating
      while (namespace instanceof _getExports2.default && dereference.type === 'MemberExpression') {

        // ignore computed parts for now
        if (dereference.computed) return;

        var metadata = namespace.get(dereference.property.name);

        if (!metadata) break;
        var deprecation = getDeprecation(metadata);

        if (deprecation) {
          context.report({ node: dereference.property, message: message(deprecation) });
        }

        // stash and pop
        namepath.push(dereference.property.name);
        namespace = metadata.namespace;
        dereference = dereference.parent;
      }
    }
  };
};

function message(deprecation) {
  return 'Deprecated' + (deprecation.description ? ': ' + deprecation.description : '.');
}

function getDeprecation(metadata) {
  if (!metadata || !metadata.doc) return;

  var deprecation = void 0;
  if (metadata.doc.tags.some(function (t) {
    return t.title === 'deprecated' && (deprecation = t);
  })) {
    return deprecation;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWRlcHJlY2F0ZWQuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImNvbnRleHQiLCJkZXByZWNhdGVkIiwibmFtZXNwYWNlcyIsImNoZWNrU3BlY2lmaWVycyIsIm5vZGUiLCJ0eXBlIiwic291cmNlIiwiaW1wb3J0cyIsImdldCIsInZhbHVlIiwibW9kdWxlRGVwcmVjYXRpb24iLCJkb2MiLCJ0YWdzIiwic29tZSIsInQiLCJ0aXRsZSIsInJlcG9ydCIsIm1lc3NhZ2UiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZXBvcnRFcnJvcnMiLCJzcGVjaWZpZXJzIiwiZm9yRWFjaCIsImltIiwiaW1wb3J0ZWQiLCJsb2NhbCIsInNpemUiLCJzZXQiLCJuYW1lIiwiZXhwb3J0ZWQiLCJuYW1lc3BhY2UiLCJkZXByZWNhdGlvbiIsImdldERlcHJlY2F0aW9uIiwiYm9keSIsInBhcmVudCIsInByb3BlcnR5Iiwic2xpY2UiLCJoYXMiLCJkZXJlZmVyZW5jZSIsIm9iamVjdCIsIm5hbWVwYXRoIiwiY29tcHV0ZWQiLCJtZXRhZGF0YSIsInB1c2giLCJkZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUVBOzs7O0FBQ0E7Ozs7OztBQUVBQSxPQUFPQyxPQUFQLEdBQWlCLFVBQVVDLE9BQVYsRUFBbUI7QUFDbEMsTUFBTUMsYUFBYSxzQkFBbkI7QUFBQSxNQUNNQyxhQUFhLHNCQURuQjs7QUFHQSxXQUFTQyxlQUFULENBQXlCQyxJQUF6QixFQUErQjtBQUM3QixRQUFJQSxLQUFLQyxJQUFMLEtBQWMsbUJBQWxCLEVBQXVDO0FBQ3ZDLFFBQUlELEtBQUtFLE1BQUwsSUFBZSxJQUFuQixFQUF5QixPQUZJLENBRUc7O0FBRWhDLFFBQU1DLFVBQVUscUJBQVFDLEdBQVIsQ0FBWUosS0FBS0UsTUFBTCxDQUFZRyxLQUF4QixFQUErQlQsT0FBL0IsQ0FBaEI7QUFDQSxRQUFJTyxXQUFXLElBQWYsRUFBcUI7O0FBRXJCLFFBQUlHLDBCQUFK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d0JVLFFBQXhCLEVBQWtDO0FBQ2hDLE1BQUksQ0FBQ0EsUUFBRCxJQUFhLENBQUNBLFNBQVMvQixHQUEzQixFQUFnQzs7QUFFaEMsTUFBSW9CLG9CQUFKO0FBQ0EsTUFBSVcsU0FBUy9CLEdBQVQsQ0FBYUMsSUFBYixDQUFrQkMsSUFBbEIsQ0FBdUI7QUFBQSxXQUFLQyxFQUFFQyxLQUFGLEtBQVksWUFBWixLQUE2QmdCLGNBQWNqQixDQUEzQyxDQUFMO0FBQUEsR0FBdkIsQ0FBSixFQUFnRjtBQUM5RSxXQUFPaUIsV0FBUDtBQUNEO0FBQ0YiLCJmaWxlIjoicnVsZXMvbm8tZGVwcmVjYXRlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNYXAgZnJvbSAnZXM2LW1hcCdcblxuaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vY29yZS9nZXRFeHBvcnRzJ1xuaW1wb3J0IGRlY2xhcmVkU2NvcGUgZnJvbSAnLi4vY29yZS9kZWNsYXJlZFNjb3BlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGNvbnN0IGRlcHJlY2F0ZWQgPSBuZXcgTWFwKClcbiAgICAgICwgbmFtZXNwYWNlcyA9IG5ldyBNYXAoKVxuXG4gIGZ1bmN0aW9uIGNoZWNrU3BlY2lmaWVycyhub2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSAhPT0gJ0ltcG9ydERlY2xhcmF0aW9uJykgcmV0dXJuXG4gICAgaWYgKG5vZGUuc291cmNlID09IG51bGwpIHJldHVybiAvLyBsb2NhbCBleHBvcnQsIGlnbm9yZVxuXG4gICAgY29uc3QgaW1wb3J0cyA9IEV4cG9ydHMuZ2V0KG5vZGUuc291cmNlLnZhbHVlLCBjb250ZXh0KVxuICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVyblxuXG4gICAgbGV0IG1vZHVsZURlcHJlY2F0aW9uXG4gICAgaWYgKGltcG9ydHMuZG9jICYmXG4gICAgICAgIGltcG9ydHMuZG9jLnRhZ3Muc29tZSh0ID0+IHQudGl0bGUgPT09ICdkZXByZWNhdGVkJyAmJiAobW9kdWxlRGVwcmVjYXRpb24gPSB0KSkpIHtcbiAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZTogbWVzc2FnZShtb2R1bGVEZXByZWNhdGlvbikgfSlcbiAgICB9XG5cbiAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICBpbXBvcnRzLnJlcG9ydEVycm9ycyhjb250ZXh0LCBub2RlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgbm9kZS5zcGVjaWZpZXJzLmZvckVhY2goZnVuY3Rpb24gKGltKSB7XG4gICAgICBsZXQgaW1wb3J0ZWQsIGxvY2FsXG4gICAgICBzd2l0Y2ggKGltLnR5cGUpIHtcblxuXG4gICAgICAgIGNhc2UgJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcic6e1xuICAgICAgICAgIGlmICghaW1wb3J0cy5zaXplKSByZXR1cm5cbiAgICAgICAgICBuYW1lc3BhY2VzLnNldChpbS5sb2NhbC5uYW1lLCBpbXBvcnRzKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcic6XG4gICAgICAgICAgaW1wb3J0ZWQgPSAnZGVmYXVsdCdcbiAgICAgICAgICBsb2NhbCA9IGltLmxvY2FsLm5hbWVcbiAgICAgICAgICBicmVha1xuXG4gICAgICAgIGNhc2UgJ0ltcG9ydFNwZWNpZmllcic6XG4gICAgICAgICAgaW1wb3J0ZWQgPSBpbS5pbXBvcnRlZC5uYW1lXG4gICAgICAgICAgbG9jYWwgPSBpbS5sb2NhbC5uYW1lXG4gICAgICAgICAgYnJlYWtcblxuICAgICAgICBkZWZhdWx0OiByZXR1cm4gLy8gY2FuJ3QgaGFuZGxlIHRoaXMgb25lXG4gICAgICB9XG5cbiAgICAgIC8vIHVua25vd24gdGhpbmcgY2FuJ3QgYmUgZGVwcmVjYXRlZFxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBpbXBvcnRzLmdldChpbXBvcnRlZClcbiAgICAgIGlmIChleHBvcnRlZCA9PSBudWxsKSByZXR1cm5cblxuICAgICAgLy8gY2FwdHVyZSBpbXBvcnQgb2YgZGVlcCBuYW1lc3BhY2VcbiAgICAgIGlmIChleHBvcnRlZC5uYW1lc3BhY2UpIG5hbWVzcGFjZXMuc2V0KGxvY2FsLCBleHBvcnRlZC5uYW1lc3BhY2UpXG5cbiAgICAgIGNvbnN0IGRlcHJlY2F0aW9uID0gZ2V0RGVwcmVjYXRpb24oaW1wb3J0cy5nZXQoaW1wb3J0ZWQpKVxuICAgICAgaWYgKCFkZXByZWNhdGlvbikgcmV0dXJuXG5cbiAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZTogaW0sIG1lc3NhZ2U6IG1lc3NhZ2UoZGVwcmVjYXRpb24pIH0pXG5cbiAgICAgIGRlcHJlY2F0ZWQuc2V0KGxvY2FsLCBkZXByZWNhdGlvbilcblxuICAgIH0pXG4gIH1cblxuICByZXR1cm4ge1xuICAgICdQcm9ncmFtJzogKHsgYm9keSB9KSA9PiBib2R5LmZvckVhY2goY2hlY2tTcGVjaWZpZXJzKSxcblxuICAgICdJZGVudGlmaWVyJzogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgIGlmIChub2RlLnBhcmVudC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicgJiYgbm9kZS5wYXJlbnQucHJvcGVydHkgPT09IG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIC8vIGhhbmRsZWQgYnkgTWVtYmVyRXhwcmVzc2lvblxuICAgICAgfVxuXG4gICAgICAvLyBpZ25vcmUgc3BlY2lmaWVyIGlkZW50aWZpZXJzXG4gICAgICBpZiAobm9kZS5wYXJlbnQudHlwZS5zbGljZSgwLCA2KSA9PT0gJ0ltcG9ydCcpIHJldHVyblxuXG4gICAgICBpZiAoIWRlcHJlY2F0ZWQuaGFzKG5vZGUubmFtZSkpIHJldHVyblxuXG4gICAgICBpZiAoZGVjbGFyZWRTY29wZShjb250ZXh0LCBub2RlLm5hbWUpICE9PSAnbW9kdWxlJykgcmV0dXJuXG4gICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UoZGVwcmVjYXRlZC5nZXQobm9kZS5uYW1lKSksXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAnTWVtYmVyRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChkZXJlZmVyZW5jZSkge1xuICAgICAgaWYgKGRlcmVmZXJlbmNlLm9iamVjdC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVyblxuICAgICAgaWYgKCFuYW1lc3BhY2VzLmhhcyhkZXJlZmVyZW5jZS5vYmplY3QubmFtZSkpIHJldHVyblxuXG4gICAgICBpZiAoZGVjbGFyZWRTY29wZShjb250ZXh0LCBkZXJlZmVyZW5jZS5vYmplY3QubmFtZSkgIT09ICdtb2R1bGUnKSByZXR1cm5cblxuICAgICAgLy8gZ28gZGVlcFxuICAgICAgdmFyIG5hbWVzcGFjZSA9IG5hbWVzcGFjZXMuZ2V0KGRlcmVmZXJlbmNlLm9iamVjdC5uYW1lKVxuICAgICAgdmFyIG5hbWVwYXRoID0gW2RlcmVmZXJlbmNlLm9iamVjdC5uYW1lXVxuICAgICAgLy8gd2hpbGUgcHJvcGVydHkgaXMgbmFtZXNwYWNlIGFuZCBwYXJlbnQgaXMgbWVtYmVyIGV4cHJlc3Npb24sIGtlZXAgdmFsaWRhdGluZ1xuICAgICAgd2hpbGUgKG5hbWVzcGFjZSBpbnN0YW5jZW9mIEV4cG9ydHMgJiZcbiAgICAgICAgICAgICBkZXJlZmVyZW5jZS50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcblxuICAgICAgICAvLyBpZ25vcmUgY29tcHV0ZWQgcGFydHMgZm9yIG5vd1xuICAgICAgICBpZiAoZGVyZWZlcmVuY2UuY29tcHV0ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gbmFtZXNwYWNlLmdldChkZXJlZmVyZW5jZS5wcm9wZXJ0eS5uYW1lKVxuXG4gICAgICAgIGlmICghbWV0YWRhdGEpIGJyZWFrXG4gICAgICAgIGNvbnN0IGRlcHJlY2F0aW9uID0gZ2V0RGVwcmVjYXRpb24obWV0YWRhdGEpXG5cbiAgICAgICAgaWYgKGRlcHJlY2F0aW9uKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlOiBkZXJlZmVyZW5jZS5wcm9wZXJ0eSwgbWVzc2FnZTogbWVzc2FnZShkZXByZWNhdGlvbikgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0YXNoIGFuZCBwb3BcbiAgICAgICAgbmFtZXBhdGgucHVzaChkZXJlZmVyZW5jZS5wcm9wZXJ0eS5uYW1lKVxuICAgICAgICBuYW1lc3BhY2UgPSBtZXRhZGF0YS5uYW1lc3BhY2VcbiAgICAgICAgZGVyZWZlcmVuY2UgPSBkZXJlZmVyZW5jZS5wYXJlbnRcbiAgICAgIH1cbiAgICB9LFxuICB9XG59XG5cbmZ1bmN0aW9uIG1lc3NhZ2UoZGVwcmVjYXRpb24pIHtcbiAgcmV0dXJuICdEZXByZWNhdGVkJyArIChkZXByZWNhdGlvbi5kZXNjcmlwdGlvbiA/ICc6ICcgKyBkZXByZWNhdGlvbi5kZXNjcmlwdGlvbiA6ICcuJylcbn1cblxuZnVuY3Rpb24gZ2V0RGVwcmVjYXRpb24obWV0YWRhdGEpIHtcbiAgaWYgKCFtZXRhZGF0YSB8fCAhbWV0YWRhdGEuZG9jKSByZXR1cm5cblxuICBsZXQgZGVwcmVjYXRpb25cbiAgaWYgKG1ldGFkYXRhLmRvYy50YWdzLnNvbWUodCA9PiB0LnRpdGxlID09PSAnZGVwcmVjYXRlZCcgJiYgKGRlcHJlY2F0aW9uID0gdCkpKSB7XG4gICAgcmV0dXJuIGRlcHJlY2F0aW9uXG4gIH1cbn1cbiJdfQ==