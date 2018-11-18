'use strict';

exports.__esModule = true;
var rules = exports.rules = {
  'no-unresolved': require('./rules/no-unresolved'),
  'named': require('./rules/named'),
  'default': require('./rules/default'),
  'namespace': require('./rules/namespace'),
  'no-namespace': require('./rules/no-namespace'),
  'export': require('./rules/export'),
  'no-mutable-exports': require('./rules/no-mutable-exports'),
  'extensions': require('./rules/extensions'),
  'no-restricted-paths': require('./rules/no-restricted-paths'),
  'no-internal-modules': require('./rules/no-internal-modules'),

  'no-named-as-default': require('./rules/no-named-as-default'),
  'no-named-as-default-member': require('./rules/no-named-as-default-member'),

  'no-commonjs': require('./rules/no-commonjs'),
  'no-amd': require('./rules/no-amd'),
  'no-duplicates': require('./rules/no-duplicates'),
  'imports-first': require('./rules/imports-first'),
  'max-dependencies': require('./rules/max-dependencies'),
  'no-extraneous-dependencies': require('./rules/no-extraneous-dependencies'),
  'no-absolute-path': require('./rules/no-absolute-path'),
  'no-nodejs-modules': require('./rules/no-nodejs-modules'),
  'order': require('./rules/order'),
  'newline-after-import': require('./rules/newline-after-import'),
  'prefer-default-export': require('./rules/prefer-default-export'),
  'no-dynamic-require': require('./rules/no-dynamic-require'),

  // metadata-based
  'no-deprecated': require('./rules/no-deprecated')
};

var configs = exports.configs = {
  'errors': require('../config/errors'),
  'warnings': require('../config/warnings'),

  // shhhh... work in progress "secret" rules
  'stage-0': require('../config/stage-0'),

  // useful stuff for folks using various environments
  'react': require('../config/react'),
  'react-native': require('../config/react-native'),
  'electron': require('../config/electron')
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbInJ1bGVzIiwicmVxdWlyZSIsImNvbmZpZ3MiXSwibWFwcGluZ3MiOiI7OztBQUFPLElBQU1BLHdCQUFRO0FBQ25CLG1CQUFpQkMsUUFBUSx1QkFBUixDQURFO0FBRW5CLFdBQVNBLFFBQVEsZUFBUixDQUZVO0FBR25CLGFBQVdBLFFBQVEsaUJBQVIsQ0FIUTtBQUluQixlQUFhQSxRQUFRLG1CQUFSLENBSk07QUFLbkIsa0JBQWdCQSxRQUFRLHNCQUFSLENBTEc7QUFNbkIsWUFBVUEsUUFBUSxnQkFBUixDQU5TO0FBT25CLHdCQUFzQkEsUUFBUSw0QkFBUixDQVBIO0FBUW5CLGdCQUFjQSxRQUFRLG9CQUFSLENBUks7QUFTbkIseUJBQXVCQSxRQUFRLDZCQUFSLENBVEo7QUFVbkIseUJBQXVCQSxRQUFRLDZCQUFSLENBVko7O0FBWW5CLHlCQUF1QkEsUUFBUSw2QkFBUixDQVpKO0FBYW5CLGdDQUE4QkEsUUFBUSxvQ0FBUixDQWJYOztBQWVuQixpQkFBZUEsUUFBUSxxQkFBUixDQWZJO0FBZ0JuQixZQUFVQSxRQUFRLGdCQUFSLENBaEJTO0FBaUJuQixtQkFBaUJBLFFBQVEsdUJBQVIsQ0FqQkU7QUFrQm5CLG1CQUFpQkEsUUFBUSx1QkFBUixDQWxCRTtBQW1CbkIsc0JBQW9CQSxRQUFRLDBCQUFSLENBbkJEO0FBb0JuQixnQ0FBOEJBLFFBQVEsb0NBQVIsQ0FwQlg7QUFxQm5CLHNCQUFvQkEsUUFBUSwwQkFBUixDQXJCRDtBQXNCbkIsdUJBQXFCQSxRQUFRLDJCQUFSLENBdEJGO0FBdUJuQixXQUFTQSxRQUFRLGVBQVIsQ0F2QlU7QUF3Qm5CLDBCQUF3QkEsUUFBUSw4QkFBUixDQXhCTDtBQXlCbkIsMkJBQXlCQSxRQUFRLCtCQUFSLENBekJOO0FBMEJuQix3QkFBc0JBLFFBQVEsNEJBQVIsQ0ExQkg7O0FBNEJuQjtBQUNBLG1CQUFpQkEsUUFBUSx1QkFBUjtBQTdCRSxDQUFkOztBQWdDQSxJQUFNQyw0QkFBVTtBQUNyQixZQUFVRCxRQUFRLGtCQUFSLENBRFc7QUFFckIsY0FBWUEsUUFBUSxvQkFBUixDQUZTOztBQUlyQjtBQUNBLGFBQVdBLFFBQVEsbUJBQVIsQ0FMVTs7QUFPckI7QUFDQSxXQUFTQSxRQUFRLGlCQUFSLENBUlk7QUFTckIsa0JBQWdCQSxRQUFRLHdCQUFSLENBVEs7QUFVckIsY0FBWUEsUUFBUSxvQkFBUjtBQVZTLENBQWhCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IHJ1bGVzID0ge1xuICAnbm8tdW5yZXNvbHZlZCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tdW5yZXNvbHZlZCcpLFxuICAnbmFtZWQnOiByZXF1aXJlKCcuL3J1bGVzL25hbWVkJyksXG4gICdkZWZhdWx0JzogcmVxdWlyZSgnLi9ydWxlcy9kZWZhdWx0JyksXG4gICduYW1lc3BhY2UnOiByZXF1aXJlKCcuL3J1bGVzL25hbWVzcGFjZScpLFxuICAnbm8tbmFtZXNwYWNlJzogcmVxdWlyZSgnLi9ydWxlcy9uby1uYW1lc3BhY2UnKSxcbiAgJ2V4cG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvZXhwb3J0JyksXG4gICduby1tdXRhYmxlLWV4cG9ydHMnOiByZXF1aXJlKCcuL3J1bGVzL25vLW11dGFibGUtZXhwb3J0cycpLFxuICAnZXh0ZW5zaW9ucyc6IHJlcXVpcmUoJy4vcnVsZXMvZXh0ZW5zaW9ucycpLFxuICAnbm8tcmVzdHJpY3RlZC1wYXRocyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tcmVzdHJpY3RlZC1wYXRocycpLFxuICAnbm8taW50ZXJuYWwtbW9kdWxlcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8taW50ZXJuYWwtbW9kdWxlcycpLFxuXG4gICduby1uYW1lZC1hcy1kZWZhdWx0JzogcmVxdWlyZSgnLi9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0JyksXG4gICduby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlcic6IHJlcXVpcmUoJy4vcnVsZXMvbm8tbmFtZWQtYXMtZGVmYXVsdC1tZW1iZXInKSxcblxuICAnbm8tY29tbW9uanMnOiByZXF1aXJlKCcuL3J1bGVzL25vLWNvbW1vbmpzJyksXG4gICduby1hbWQnOiByZXF1aXJlKCcuL3J1bGVzL25vLWFtZCcpLFxuICAnbm8tZHVwbGljYXRlcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tZHVwbGljYXRlcycpLFxuICAnaW1wb3J0cy1maXJzdCc6IHJlcXVpcmUoJy4vcnVsZXMvaW1wb3J0cy1maXJzdCcpLFxuICAnbWF4LWRlcGVuZGVuY2llcyc6IHJlcXVpcmUoJy4vcnVsZXMvbWF4LWRlcGVuZGVuY2llcycpLFxuICAnbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXMnOiByZXF1aXJlKCcuL3J1bGVzL25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzJyksXG4gICduby1hYnNvbHV0ZS1wYXRoJzogcmVxdWlyZSgnLi9ydWxlcy9uby1hYnNvbHV0ZS1wYXRoJyksXG4gICduby1ub2RlanMtbW9kdWxlcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tbm9kZWpzLW1vZHVsZXMnKSxcbiAgJ29yZGVyJzogcmVxdWlyZSgnLi9ydWxlcy9vcmRlcicpLFxuICAnbmV3bGluZS1hZnRlci1pbXBvcnQnOiByZXF1aXJlKCcuL3J1bGVzL25ld2xpbmUtYWZ0ZXItaW1wb3J0JyksXG4gICdwcmVmZXItZGVmYXVsdC1leHBvcnQnOiByZXF1aXJlKCcuL3J1bGVzL3ByZWZlci1kZWZhdWx0LWV4cG9ydCcpLFxuICAnbm8tZHluYW1pYy1yZXF1aXJlJzogcmVxdWlyZSgnLi9ydWxlcy9uby1keW5hbWljLXJlcXVpcmUnKSxcblxuICAvLyBtZXRhZGF0YS1iYXNlZFxuICAnbm8tZGVwcmVjYXRlZCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tZGVwcmVjYXRlZCcpLFxufVxuXG5leHBvcnQgY29uc3QgY29uZmlncyA9IHtcbiAgJ2Vycm9ycyc6IHJlcXVpcmUoJy4uL2NvbmZpZy9lcnJvcnMnKSxcbiAgJ3dhcm5pbmdzJzogcmVxdWlyZSgnLi4vY29uZmlnL3dhcm5pbmdzJyksXG5cbiAgLy8gc2hoaGguLi4gd29yayBpbiBwcm9ncmVzcyBcInNlY3JldFwiIHJ1bGVzXG4gICdzdGFnZS0wJzogcmVxdWlyZSgnLi4vY29uZmlnL3N0YWdlLTAnKSxcblxuICAvLyB1c2VmdWwgc3R1ZmYgZm9yIGZvbGtzIHVzaW5nIHZhcmlvdXMgZW52aXJvbm1lbnRzXG4gICdyZWFjdCc6IHJlcXVpcmUoJy4uL2NvbmZpZy9yZWFjdCcpLFxuICAncmVhY3QtbmF0aXZlJzogcmVxdWlyZSgnLi4vY29uZmlnL3JlYWN0LW5hdGl2ZScpLFxuICAnZWxlY3Ryb24nOiByZXF1aXJlKCcuLi9jb25maWcvZWxlY3Ryb24nKSxcbn1cbiJdfQ==