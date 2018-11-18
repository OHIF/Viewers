'use strict';

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

var _importDeclaration = require('../importDeclaration');

var _importDeclaration2 = _interopRequireDefault(_importDeclaration);

var _declaredScope = require('../core/declaredScope');

var _declaredScope2 = _interopRequireDefault(_declaredScope);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.meta = {
  schema: [{
    'type': 'object',
    'properties': {
      'allowComputed': {
        'description': 'If `false`, will report computed (and thus, un-lintable) references ' + 'to namespace members.',
        'type': 'boolean',
        'default': false
      }
    },
    'additionalProperties': false
  }]
};

exports.create = function namespaceRule(context) {

  // read options
  var _ref = context.options[0] || {};

  var _ref$allowComputed = _ref.allowComputed;
  var allowComputed = _ref$allowComputed === undefined ? false : _ref$allowComputed;


  var namespaces = new _es6Map2.default();

  function makeMessage(last, namepath) {
    return '\'' + last.name + '\' not found in' + (namepath.length > 1 ? ' deeply ' : ' ') + ('imported namespace \'' + namepath.join('.') + '\'.');
  }

  return {

    // pick up all imports at body entry time, to properly respect hoisting
    'Program': function Program(_ref2) {
      var body = _ref2.body;

      function processBodyStatement(declaration) {
        if (declaration.type !== 'ImportDeclaration') return;

        if (declaration.specifiers.length === 0) return;

        var imports = _getExports2.default.get(declaration.source.value, context);
        if (imports == null) return null;

        if (imports.errors.length) {
          imports.reportErrors(context, declaration);
          return;
        }

        declaration.specifiers.forEach(function (specifier) {
          switch (specifier.type) {
            case 'ImportNamespaceSpecifier':
              if (!imports.size) {
                context.report(specifier, 'No exported names found in module \'' + declaration.source.value + '\'.');
              }
              namespaces.set(specifier.local.name, imports);
              break;
            case 'ImportDefaultSpecifier':
            case 'ImportSpecifier':
              {
                var meta = imports.get(
                // default to 'default' for default http://i.imgur.com/nj6qAWy.jpg
                specifier.imported ? specifier.imported.name : 'default');
                if (!meta || !meta.namespace) break;
                namespaces.set(specifier.local.name, meta.namespace);
                break;
              }
          }
        });
      }
      body.forEach(processBodyStatement);
    },

    // same as above, but does not add names to local map
    'ExportNamespaceSpecifier': function ExportNamespaceSpecifier(namespace) {
      var declaration = (0, _importDeclaration2.default)(context);

      var imports = _getExports2.default.get(declaration.source.value, context);
      if (imports == null) return null;

      if (imports.errors.length) {
        imports.reportErrors(context, declaration);
        return;
      }

      if (!imports.size) {
        context.report(namespace, 'No exported names found in module \'' + declaration.source.value + '\'.');
      }
    },

    // todo: check for possible redefinition

    'MemberExpression': function MemberExpression(dereference) {
      if (dereference.object.type !== 'Identifier') return;
      if (!namespaces.has(dereference.object.name)) return;

      if (dereference.parent.type === 'AssignmentExpression' && dereference.parent.left === dereference) {
        context.report(dereference.parent, 'Assignment to member of namespace \'' + dereference.object.name + '\'.');
      }

      // go deep
      var namespace = namespaces.get(dereference.object.name);
      var namepath = [dereference.object.name];
      // while property is namespace and parent is member expression, keep validating
      while (namespace instanceof _getExports2.default && dereference.type === 'MemberExpression') {

        if (dereference.computed) {
          if (!allowComputed) {
            context.report(dereference.property, 'Unable to validate computed reference to imported namespace \'' + dereference.object.name + '\'.');
          }
          return;
        }

        if (!namespace.has(dereference.property.name)) {
          context.report(dereference.property, makeMessage(dereference.property, namepath));
          break;
        }

        var exported = namespace.get(dereference.property.name);
        if (exported == null) return;

        // stash and pop
        namepath.push(dereference.property.name);
        namespace = exported.namespace;
        dereference = dereference.parent;
      }
    },

    'VariableDeclarator': function VariableDeclarator(_ref3) {
      var id = _ref3.id;
      var init = _ref3.init;

      if (init == null) return;
      if (init.type !== 'Identifier') return;
      if (!namespaces.has(init.name)) return;

      // check for redefinition in intermediate scopes
      if ((0, _declaredScope2.default)(context, init.name) !== 'module') return;

      // DFS traverse child namespaces
      function testKey(pattern, namespace) {
        var path = arguments.length <= 2 || arguments[2] === undefined ? [init.name] : arguments[2];

        if (!(namespace instanceof _getExports2.default)) return;

        if (pattern.type !== 'ObjectPattern') return;

        pattern.properties.forEach(function (property) {
          if (property.key.type !== 'Identifier') {
            context.report({
              node: property,
              message: 'Only destructure top-level names.'
            });
          } else if (!namespace.has(property.key.name)) {
            context.report({
              node: property,
              message: makeMessage(property.key, path)
            });
          } else {
            path.push(property.key.name);
            testKey(property.value, namespace.get(property.key.name).namespace, path);
            path.pop();
          }
        });
      }

      testKey(id, namespaces.get(init.name));
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25hbWVzcGFjZS5qcyJdLCJuYW1lcyI6WyJleHBvcnRzIiwibWV0YSIsInNjaGVtYSIsImNyZWF0ZSIsIm5hbWVzcGFjZVJ1bGUiLCJjb250ZXh0Iiwib3B0aW9ucyIsImFsbG93Q29tcHV0ZWQiLCJuYW1lc3BhY2VzIiwibWFrZU1lc3NhZ2UiLCJsYXN0IiwibmFtZXBhdGgiLCJuYW1lIiwibGVuZ3RoIiwiam9pbiIsImJvZHkiLCJwcm9jZXNzQm9keVN0YXRlbWVudCIsImRlY2xhcmF0aW9uIiwidHlwZSIsInNwZWNpZmllcnMiLCJpbXBvcnRzIiwiZ2V0Iiwic291cmNlIiwidmFsdWUiLCJlcnJvcnMiLCJyZXBvcnRFcnJvcnMiLCJmb3JFYWNoIiwic3BlY2lmaWVyIiwic2l6ZSIsInJlcG9ydCIsInNldCIsImxvY2FsIiwiaW1wb3J0ZWQiLCJuYW1lc3BhY2UiLCJkZXJlZmVyZW5jZSIsIm9iamVjdCIsImhhcyIsInBhcmVudCIsImxlZnQiLCJjb21wdXRlZCIsInByb3BlcnR5IiwiZXhwb3J0ZWQiLCJwdXNoIiwiaWQiLCJpbml0IiwidGVzdEtleSIsInBhdHRlcm4iLCJwYXRoIiwicHJvcGVydGllcyIsImtleSIsIm5vZGUiLCJtZXNzYWdlIiwicG9wIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQUEsUUFBUUMsSUFBUixHQUFlO0FBQ2JDLFVBQVEsQ0FDTjtBQUNFLFlBQVEsUUFEVjtBQUVFLGtCQUFjO0FBQ1osdUJBQWlCO0FBQ2YsdUJBQ0UseUVBQ0EsdUJBSGE7QUFJZixnQkFBUSxTQUpPO0FBS2YsbUJBQVc7QUFMSTtBQURMLEtBRmhCO0FBV0UsNEJBQXdCO0FBWDFCLEdBRE07QUFESyxDQUFmOztBQWtCQUYsUUFBUUcsTUFBUixHQUFpQixTQUFTQyxhQUFULENBQXVCQyxPQUF2QixFQUFnQzs7QUFFL0M7QUFGK0MsYUFLM0NBLFFBQVFDLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsRUFMcUI7O0FBQUEsZ0NBSTdDQyxhQUo2QztBQUFBLE1BSTdDQSxhQUo2QyxzQ0FJN0IsS0FKNkI7OztBQU8vQyxNQUFNQyxhQUFhLHNCQUFuQjs7QUFFQSxXQUFTQyxXQUFULENBQXFCQyxJQUFyQixFQUEyQkMsUUFBM0IsRUFBcUM7QUFDbEMsV0FBTyxPQUFJRCxLQUFLRSxJQUFULHdCQUNDRCxTQUFTRSxNQUFULEdBQWtCLENBQWxCLEdBQXNCLFVBQXRCLEdBQW1DLEdBRHBDLCtCQUV1QkYsU0FBU0csSUFBVCxDQUFjLEdBQWQsQ0FGdkIsU0FBUDtBQUdGOztBQUVELFNBQU87O0FBRUw7QUFDQSxlQUFXLHdCQUFvQjtBQUFBLFVBQVJDLElBQVEsU0FBUkEsSUFBUTs7QUFDN0IsZUFBU0Msb0JBQVQsQ0FBOEJDLFdBQTlCLEVBQTJDO0FBQ3pDLFlBQUlBLFlBQVlDLElBQVosS0FBcUIsbUJBQXpCLEVBQThDOztBQUU5QyxZQUFJRCxZQUFZRSxVQUFaLENBQXVCTixNQUF2QixLQUFrQyxDQUF0QyxFQUF5Qzs7QUFFekMsWUFBTU8sVUFBVSxxQkFBUUMsR0FBUixDQUFZSixZQUFZSyxNQUFaLENBQW1CQyxLQUEvQixFQUFzQ2xCLE9BQXRDLENBQWhCO0FBQ0EsWUFBSWUsV0FBVyxJQUFmLEVBQXFCLE9BQU8sSUFBUDs7QUFFckIsWUFBSUEsUUFBUUksTUFBUixDQUFlWCxNQUFuQixFQUEyQjtBQUN6Qk8sa0JBQVFLLFlBQVIsQ0FBcUJwQixPQUFyQixFQUE4QlksV0FBOUI7QUFDQTtBQUNEOztBQUVEQSxvQkFBWUUsVUFBWixDQUF1Qk8sT0FBdkIsQ0FBK0IsVUFBQ0MsU0FBRCxFQUFlO0FBQzVDLGtCQUFRQSxVQUFVVCxJQUFsQjtBQUNFLGlCQUFLLDBCQUFMO0FBQ0Usa0JBQUksQ0FBQ0UsUUFBUVEsSUFBYixFQUFtQjtBQUNqQnZCLHdCQUFRd0IsTUFBUixDQUFlRixTQUFmLDJDQUN3Q1YsWUFBWUssTUFBWixDQUFtQkMsS0FEM0Q7QUFFRDtBQUNEZix5QkFBV3NCLEdBQVgsQ0FBZUgsVUFBVUksS0FBVixDQUFnQm5CLElBQS9CLEVBQXFDUSxPQUFyQztBQUNBO0FBQ0YsaUJBQUssd0JBQUw7QUFDQSxpQkFBSyxpQkFBTDtBQUF3QjtBQUN0QixvQkFBTW5CLE9BQU9tQixRQUFRQyxHQUFSO0FBQ1g7QUFDQU0sMEJBQVVLLFFBQVYsR0FBcUJMLFVBQVVLLFFBQVYsQ0FBbUJwQixJQUF4QyxHQUErQyxTQUZwQyxDQUFiO0FBR0Esb0JBQUksQ0FBQ1gsSUFBRCxJQUFTLENBQUNBLEtBQUtnQyxTQUFuQixFQUE4QjtBQUM5QnpCLDJCQUFXc0IsR0FBWCxDQUFlSCxVQUFVSSxLQUFWLENBQWdCbkIsSUFBL0IsRUFBcUNYLEtBQUtnQyxTQUExQztBQUNBO0FBQ0Q7QUFoQkg7QUFrQkQsU0FuQkQ7QUFvQkQ7QUFDRGxCLFdBQUtXLE9BQUwsQ0FBYVYsb0JBQWI7QUFDRCxLQXZDSTs7QUF5Q0w7QUFDQSxnQ0FBNEIsa0NBQVVpQixTQUFWLEVBQXFCO0FBQy9DLFVBQUloQixjQUFjLGlDQUFrQlosT0FBbEIsQ0FBbEI7O0FBRUEsVUFBSWUsVUFBVSxxQkFBUUMsR0FBUixDQUFZSixZQUFZSyxNQUFaLENBQW1CQyxLQUEvQixFQUFzQ2xCLE9BQXRDLENBQWQ7QUFDQSxVQUFJZSxXQUFXLElBQWYsRUFBcUIsT0FBTyxJQUFQOztBQUVyQixVQUFJQSxRQUFRSSxNQUFSLENBQWVYLE1BQW5CLEVBQTJCO0FBQ3pCTyxnQkFBUUssWUFBUixDQUFxQnBCLE9BQXJCLEVBQThCWSxXQUE5QjtBQUNBO0FBQ0Q7O0FBRUQsVUFBSSxDQUFDRyxRQUFRUSxJQUFiLEVBQW1CO0FBQ2pCdkIsZ0JBQVF3QixNQUFSLENBQWVJLFNBQWYsMkNBQ3dDaEIsWUFBWUssTUFBWixDQUFtQkMsS0FEM0Q7QUFFRDtBQUNGLEtBekRJOztBQTJETDs7QUFFQSx3QkFBb0IsMEJBQVVXLFdBQVYsRUFBdUI7QUFDekMsVUFBSUEsWUFBWUMsTUFBWixDQUFtQmpCLElBQW5CLEtBQTRCLFlBQWhDLEVBQThDO0FBQzlDLFVBQUksQ0FBQ1YsV0FBVzRCLEdBQVgsQ0FBZUYsWUFBWUMsTUFBWixDQUFtQnZCLElBQWxDLENBQUwsRUFBOEM7O0FBRTlDLFVBQUlzQixZQUFZRyxNQUFaLENBQW1CbkIsSUFBbkIsS0FBNEIsc0JBQTVCLElBQ0FnQixZQUFZRyxNQUFaLENBQW1CQyxJQUFuQixLQUE0QkosV0FEaEMsRUFDNkM7QUFDekM3QixnQkFBUXdCLE1BQVIsQ0FBZUssWUFBWUcsTUFBM0IsMkNBQzBDSCxZQUFZQyxNQUFaLENBQW1CdkIsSUFEN0Q7QUFFSDs7QUFFRDtBQUNBLFVBQUlxQixZQUFZekIsV0FBV2EsR0FBWCxDQUFlYSxZQUFZQyxNQUFaLENBQW1CdkIsSUFBbEMsQ0FBaEI7QUFDQSxVQUFJRCxXQUFXLENBQUN1QixZQUFZQyxNQUFaLENBQW1CdkIsSUFBcEIsQ0FBZjtBQUNBO0FBQ0EsYUFBT3FCLDZDQUNBQyxZQUFZaEIsSUFBWixLQUFxQixrQkFENUIsRUFDZ0Q7O0FBRTlDLFlBQUlnQixZQUFZSyxRQUFoQixFQUEwQjtBQUN4QixjQUFJLENBQUNoQyxhQUFMLEVBQW9CO0FBQ2xCRixvQkFBUXdCLE1BQVIsQ0FBZUssWUFBWU0sUUFBM0IsRUFDRSxtRUFDQU4sWUFBWUMsTUFBWixDQUFtQnZCLElBRG5CLEdBQzBCLEtBRjVCO0FBR0Q7QUFDRDtBQUNEOztBQUVELFlBQUksQ0FBQ3FCLFVBQVVHLEdBQVYsQ0FBY0YsWUFBWU0sUUFBWixDQUFxQjVCLElBQW5DLENBQUwsRUFBK0M7QUFDN0NQLGtCQUFRd0IsTUFBUixDQUNFSyxZQUFZTSxRQURkLEVBRUUvQixZQUFZeUIsWUFBWU0sUUFBeEIsRUFBa0M3QixRQUFsQyxDQUZGO0FBR0E7QUFDRDs7QUFFRCxZQUFNOEIsV0FBV1IsVUFBVVosR0FBVixDQUFjYSxZQUFZTSxRQUFaLENBQXFCNUIsSUFBbkMsQ0FBakI7QUFDQSxZQUFJNkIsWUFBWSxJQUFoQixFQUFzQjs7QUFFdEI7QUFDQTlCLGlCQUFTK0IsSUFBVCxDQUFjUixZQUFZTSxRQUFaLENBQXFCNUIsSUFBbkM7QUFDQXFCLG9CQUFZUSxTQUFTUixTQUFyQjtBQUNBQyxzQkFBY0EsWUFBWUcsTUFBMUI7QUFDRDtBQUVGLEtBdkdJOztBQXlHTCwwQkFBc0IsbUNBQXdCO0FBQUEsVUFBWk0sRUFBWSxTQUFaQSxFQUFZO0FBQUEsVUFBUkMsSUFBUSxTQUFSQSxJQUFROztBQUM1QyxVQUFJQSxRQUFRLElBQVosRUFBa0I7QUFDbEIsVUFBSUEsS0FBSzFCLElBQUwsS0FBYyxZQUFsQixFQUFnQztBQUNoQyxVQUFJLENBQUNWLFdBQVc0QixHQUFYLENBQWVRLEtBQUtoQyxJQUFwQixDQUFMLEVBQWdDOztBQUVoQztBQUNBLFVBQUksNkJBQWNQLE9BQWQsRUFBdUJ1QyxLQUFLaEMsSUFBNUIsTUFBc0MsUUFBMUMsRUFBb0Q7O0FBRXBEO0FBQ0EsZUFBU2lDLE9BQVQsQ0FBaUJDLE9BQWpCLEVBQTBCYixTQUExQixFQUF5RDtBQUFBLFlBQXBCYyxJQUFvQix5REFBYixDQUFDSCxLQUFLaEMsSUFBTixDQUFhOztBQUN2RCxZQUFJLEVBQUVxQix5Q0FBRixDQUFKLEVBQXFDOztBQUVyQyxZQUFJYSxRQUFRNUIsSUFBUixLQUFpQixlQUFyQixFQUFzQzs7QUFFdEM0QixnQkFBUUUsVUFBUixDQUFtQnRCLE9BQW5CLENBQTJCLFVBQUNjLFFBQUQsRUFBYztBQUN2QyxjQUFJQSxTQUFTUyxHQUFULENBQWEvQixJQUFiLEtBQXNCLFlBQTFCLEVBQXdDO0FBQ3RDYixvQkFBUXdCLE1BQVIsQ0FBZTtBQUNicUIsb0JBQU1WLFFBRE87QUFFYlcsdUJBQVM7QUFGSSxhQUFmO0FBSUQsV0FMRCxNQUtPLElBQUksQ0FBQ2xCLFVBQVVHLEdBQVYsQ0FBY0ksU0FBU1MsR0FBVCxDQUFhckMsSUFBM0IsQ0FBTCxFQUF1QztBQUM1Q1Asb0JBQVF3QixNQUFSLENBQWU7QUFDYnFCLG9CQUFNVixRQURPO0FBRWJXLHVCQUFTMUMsWUFBWStCLFNBQVNTLEdBQXJCLEVBQTBCRixJQUExQjtBQUZJLGFBQWY7QUFJRCxXQUxNLE1BS0E7QUFDTEEsaUJBQUtMLElBQUwsQ0FBVUYsU0FBU1MsR0FBVCxDQUFhckMsSUFBdkI7QUFDQWlDLG9CQUFRTCxTQUFTakIsS0FBakIsRUFBd0JVLFVBQVVaLEdBQVYsQ0FBY21CLFNBQVNTLEdBQVQsQ0FBYXJDLElBQTNCLEVBQWlDcUIsU0FBekQsRUFBb0VjLElBQXBFO0FBQ0FBLGlCQUFLSyxHQUFMO0FBQ0Q7QUFDRixTQWhCRDtBQWlCRDs7QUFFRFAsY0FBUUYsRUFBUixFQUFZbkMsV0FBV2EsR0FBWCxDQUFldUIsS0FBS2hDLElBQXBCLENBQVo7QUFDRDtBQTNJSSxHQUFQO0FBNklELENBNUpEIiwiZmlsZSI6InJ1bGVzL25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNYXAgZnJvbSAnZXM2LW1hcCdcblxuaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vY29yZS9nZXRFeHBvcnRzJ1xuaW1wb3J0IGltcG9ydERlY2xhcmF0aW9uIGZyb20gJy4uL2ltcG9ydERlY2xhcmF0aW9uJ1xuaW1wb3J0IGRlY2xhcmVkU2NvcGUgZnJvbSAnLi4vY29yZS9kZWNsYXJlZFNjb3BlJ1xuXG5leHBvcnRzLm1ldGEgPSB7XG4gIHNjaGVtYTogW1xuICAgIHtcbiAgICAgICd0eXBlJzogJ29iamVjdCcsXG4gICAgICAncHJvcGVydGllcyc6IHtcbiAgICAgICAgJ2FsbG93Q29tcHV0ZWQnOiB7XG4gICAgICAgICAgJ2Rlc2NyaXB0aW9uJzpcbiAgICAgICAgICAgICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBjb21wdXRlZCAoYW5kIHRodXMsIHVuLWxpbnRhYmxlKSByZWZlcmVuY2VzICcgK1xuICAgICAgICAgICAgJ3RvIG5hbWVzcGFjZSBtZW1iZXJzLicsXG4gICAgICAgICAgJ3R5cGUnOiAnYm9vbGVhbicsXG4gICAgICAgICAgJ2RlZmF1bHQnOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAnYWRkaXRpb25hbFByb3BlcnRpZXMnOiBmYWxzZSxcbiAgICB9LFxuICBdLFxufVxuXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIG5hbWVzcGFjZVJ1bGUoY29udGV4dCkge1xuXG4gIC8vIHJlYWQgb3B0aW9uc1xuICBjb25zdCB7XG4gICAgYWxsb3dDb21wdXRlZCA9IGZhbHNlLFxuICB9ID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9XG5cbiAgY29uc3QgbmFtZXNwYWNlcyA9IG5ldyBNYXAoKVxuXG4gIGZ1bmN0aW9uIG1ha2VNZXNzYWdlKGxhc3QsIG5hbWVwYXRoKSB7XG4gICAgIHJldHVybiBgJyR7bGFzdC5uYW1lfScgbm90IGZvdW5kIGluYCArXG4gICAgICAgICAgICAobmFtZXBhdGgubGVuZ3RoID4gMSA/ICcgZGVlcGx5ICcgOiAnICcpICtcbiAgICAgICAgICAgIGBpbXBvcnRlZCBuYW1lc3BhY2UgJyR7bmFtZXBhdGguam9pbignLicpfScuYFxuICB9XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vIHBpY2sgdXAgYWxsIGltcG9ydHMgYXQgYm9keSBlbnRyeSB0aW1lLCB0byBwcm9wZXJseSByZXNwZWN0IGhvaXN0aW5nXG4gICAgJ1Byb2dyYW0nOiBmdW5jdGlvbiAoeyBib2R5IH0pIHtcbiAgICAgIGZ1bmN0aW9uIHByb2Nlc3NCb2R5U3RhdGVtZW50KGRlY2xhcmF0aW9uKSB7XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbi50eXBlICE9PSAnSW1wb3J0RGVjbGFyYXRpb24nKSByZXR1cm5cblxuICAgICAgICBpZiAoZGVjbGFyYXRpb24uc3BlY2lmaWVycy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGltcG9ydHMgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpXG4gICAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgICAgICAgaWYgKGltcG9ydHMuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIGRlY2xhcmF0aW9uKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgZGVjbGFyYXRpb24uc3BlY2lmaWVycy5mb3JFYWNoKChzcGVjaWZpZXIpID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKHNwZWNpZmllci50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInOlxuICAgICAgICAgICAgICBpZiAoIWltcG9ydHMuc2l6ZSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHNwZWNpZmllcixcbiAgICAgICAgICAgICAgICAgIGBObyBleHBvcnRlZCBuYW1lcyBmb3VuZCBpbiBtb2R1bGUgJyR7ZGVjbGFyYXRpb24uc291cmNlLnZhbHVlfScuYClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBuYW1lc3BhY2VzLnNldChzcGVjaWZpZXIubG9jYWwubmFtZSwgaW1wb3J0cylcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInOlxuICAgICAgICAgICAgY2FzZSAnSW1wb3J0U3BlY2lmaWVyJzoge1xuICAgICAgICAgICAgICBjb25zdCBtZXRhID0gaW1wb3J0cy5nZXQoXG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCB0byAnZGVmYXVsdCcgZm9yIGRlZmF1bHQgaHR0cDovL2kuaW1ndXIuY29tL25qNnFBV3kuanBnXG4gICAgICAgICAgICAgICAgc3BlY2lmaWVyLmltcG9ydGVkID8gc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUgOiAnZGVmYXVsdCcpXG4gICAgICAgICAgICAgIGlmICghbWV0YSB8fCAhbWV0YS5uYW1lc3BhY2UpIGJyZWFrXG4gICAgICAgICAgICAgIG5hbWVzcGFjZXMuc2V0KHNwZWNpZmllci5sb2NhbC5uYW1lLCBtZXRhLm5hbWVzcGFjZSlcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBib2R5LmZvckVhY2gocHJvY2Vzc0JvZHlTdGF0ZW1lbnQpXG4gICAgfSxcblxuICAgIC8vIHNhbWUgYXMgYWJvdmUsIGJ1dCBkb2VzIG5vdCBhZGQgbmFtZXMgdG8gbG9jYWwgbWFwXG4gICAgJ0V4cG9ydE5hbWVzcGFjZVNwZWNpZmllcic6IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcbiAgICAgIHZhciBkZWNsYXJhdGlvbiA9IGltcG9ydERlY2xhcmF0aW9uKGNvbnRleHQpXG5cbiAgICAgIHZhciBpbXBvcnRzID0gRXhwb3J0cy5nZXQoZGVjbGFyYXRpb24uc291cmNlLnZhbHVlLCBjb250ZXh0KVxuICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICAgICAgaWYgKGltcG9ydHMuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBpbXBvcnRzLnJlcG9ydEVycm9ycyhjb250ZXh0LCBkZWNsYXJhdGlvbilcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICghaW1wb3J0cy5zaXplKSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KG5hbWVzcGFjZSxcbiAgICAgICAgICBgTm8gZXhwb3J0ZWQgbmFtZXMgZm91bmQgaW4gbW9kdWxlICcke2RlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZX0nLmApXG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIHRvZG86IGNoZWNrIGZvciBwb3NzaWJsZSByZWRlZmluaXRpb25cblxuICAgICdNZW1iZXJFeHByZXNzaW9uJzogZnVuY3Rpb24gKGRlcmVmZXJlbmNlKSB7XG4gICAgICBpZiAoZGVyZWZlcmVuY2Uub2JqZWN0LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG4gICAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGRlcmVmZXJlbmNlLm9iamVjdC5uYW1lKSkgcmV0dXJuXG5cbiAgICAgIGlmIChkZXJlZmVyZW5jZS5wYXJlbnQudHlwZSA9PT0gJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyAmJlxuICAgICAgICAgIGRlcmVmZXJlbmNlLnBhcmVudC5sZWZ0ID09PSBkZXJlZmVyZW5jZSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KGRlcmVmZXJlbmNlLnBhcmVudCxcbiAgICAgICAgICAgICAgYEFzc2lnbm1lbnQgdG8gbWVtYmVyIG9mIG5hbWVzcGFjZSAnJHtkZXJlZmVyZW5jZS5vYmplY3QubmFtZX0nLmApXG4gICAgICB9XG5cbiAgICAgIC8vIGdvIGRlZXBcbiAgICAgIHZhciBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzLmdldChkZXJlZmVyZW5jZS5vYmplY3QubmFtZSlcbiAgICAgIHZhciBuYW1lcGF0aCA9IFtkZXJlZmVyZW5jZS5vYmplY3QubmFtZV1cbiAgICAgIC8vIHdoaWxlIHByb3BlcnR5IGlzIG5hbWVzcGFjZSBhbmQgcGFyZW50IGlzIG1lbWJlciBleHByZXNzaW9uLCBrZWVwIHZhbGlkYXRpbmdcbiAgICAgIHdoaWxlIChuYW1lc3BhY2UgaW5zdGFuY2VvZiBFeHBvcnRzICYmXG4gICAgICAgICAgICAgZGVyZWZlcmVuY2UudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nKSB7XG5cbiAgICAgICAgaWYgKGRlcmVmZXJlbmNlLmNvbXB1dGVkKSB7XG4gICAgICAgICAgaWYgKCFhbGxvd0NvbXB1dGVkKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydChkZXJlZmVyZW5jZS5wcm9wZXJ0eSxcbiAgICAgICAgICAgICAgJ1VuYWJsZSB0byB2YWxpZGF0ZSBjb21wdXRlZCByZWZlcmVuY2UgdG8gaW1wb3J0ZWQgbmFtZXNwYWNlIFxcJycgK1xuICAgICAgICAgICAgICBkZXJlZmVyZW5jZS5vYmplY3QubmFtZSArICdcXCcuJylcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5hbWVzcGFjZS5oYXMoZGVyZWZlcmVuY2UucHJvcGVydHkubmFtZSkpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChcbiAgICAgICAgICAgIGRlcmVmZXJlbmNlLnByb3BlcnR5LFxuICAgICAgICAgICAgbWFrZU1lc3NhZ2UoZGVyZWZlcmVuY2UucHJvcGVydHksIG5hbWVwYXRoKSlcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhwb3J0ZWQgPSBuYW1lc3BhY2UuZ2V0KGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpXG4gICAgICAgIGlmIChleHBvcnRlZCA9PSBudWxsKSByZXR1cm5cblxuICAgICAgICAvLyBzdGFzaCBhbmQgcG9wXG4gICAgICAgIG5hbWVwYXRoLnB1c2goZGVyZWZlcmVuY2UucHJvcGVydHkubmFtZSlcbiAgICAgICAgbmFtZXNwYWNlID0gZXhwb3J0ZWQubmFtZXNwYWNlXG4gICAgICAgIGRlcmVmZXJlbmNlID0gZGVyZWZlcmVuY2UucGFyZW50XG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgJ1ZhcmlhYmxlRGVjbGFyYXRvcic6IGZ1bmN0aW9uICh7IGlkLCBpbml0IH0pIHtcbiAgICAgIGlmIChpbml0ID09IG51bGwpIHJldHVyblxuICAgICAgaWYgKGluaXQudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm5cbiAgICAgIGlmICghbmFtZXNwYWNlcy5oYXMoaW5pdC5uYW1lKSkgcmV0dXJuXG5cbiAgICAgIC8vIGNoZWNrIGZvciByZWRlZmluaXRpb24gaW4gaW50ZXJtZWRpYXRlIHNjb3Blc1xuICAgICAgaWYgKGRlY2xhcmVkU2NvcGUoY29udGV4dCwgaW5pdC5uYW1lKSAhPT0gJ21vZHVsZScpIHJldHVyblxuXG4gICAgICAvLyBERlMgdHJhdmVyc2UgY2hpbGQgbmFtZXNwYWNlc1xuICAgICAgZnVuY3Rpb24gdGVzdEtleShwYXR0ZXJuLCBuYW1lc3BhY2UsIHBhdGggPSBbaW5pdC5uYW1lXSkge1xuICAgICAgICBpZiAoIShuYW1lc3BhY2UgaW5zdGFuY2VvZiBFeHBvcnRzKSkgcmV0dXJuXG5cbiAgICAgICAgaWYgKHBhdHRlcm4udHlwZSAhPT0gJ09iamVjdFBhdHRlcm4nKSByZXR1cm5cblxuICAgICAgICBwYXR0ZXJuLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHkpID0+IHtcbiAgICAgICAgICBpZiAocHJvcGVydHkua2V5LnR5cGUgIT09ICdJZGVudGlmaWVyJykge1xuICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgICBub2RlOiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ09ubHkgZGVzdHJ1Y3R1cmUgdG9wLWxldmVsIG5hbWVzLicsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0gZWxzZSBpZiAoIW5hbWVzcGFjZS5oYXMocHJvcGVydHkua2V5Lm5hbWUpKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgIG5vZGU6IHByb3BlcnR5LFxuICAgICAgICAgICAgICBtZXNzYWdlOiBtYWtlTWVzc2FnZShwcm9wZXJ0eS5rZXksIHBhdGgpLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGF0aC5wdXNoKHByb3BlcnR5LmtleS5uYW1lKVxuICAgICAgICAgICAgdGVzdEtleShwcm9wZXJ0eS52YWx1ZSwgbmFtZXNwYWNlLmdldChwcm9wZXJ0eS5rZXkubmFtZSkubmFtZXNwYWNlLCBwYXRoKVxuICAgICAgICAgICAgcGF0aC5wb3AoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgdGVzdEtleShpZCwgbmFtZXNwYWNlcy5nZXQoaW5pdC5uYW1lKSlcbiAgICB9LFxuICB9XG59XG4iXX0=