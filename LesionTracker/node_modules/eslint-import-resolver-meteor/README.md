# eslint-import-resolver-meteor

[![Build Status](https://travis-ci.org/clayne11/eslint-import-resolver-meteor.svg?branch=master)](https://travis-ci.org/clayne11/eslint-import-resolver-meteor)

Meteor module resolution plugin for [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import).

[On npm](https://www.npmjs.com/package/eslint-import-resolver-meteor)

## Installation

```javascript
npm install --save-dev eslint eslint-plugin-import eslint-import-resolver-meteor
```

Config is passed directly through to [`resolve`](https://www.npmjs.com/package/resolve#resolve-sync-id-opts) as options:

In your `.eslintrc.yml`:
```yaml
settings:
  import/resolver:
    meteor:
      extensions:
        # if unset, default is just '.js', but it must be re-added explicitly if set
        - .js
        - .jsx
        - .es6
        - .coffee

      paths:
        # an array of absolute paths which will also be searched
        # think NODE_PATH
        - /usr/local/share/global_modules

      # this is technically for identifying `node_modules` alternate names
      moduleDirectory:

        - node_modules # defaults to 'node_modules', but...
        - bower_components

        - project/src  # can add a path segment here that will act like
                       # a source root, for in-project aliasing (i.e.
                       # `import MyStore from 'stores/my-store'`)
```

or to use the default options:

```yaml
settings:
  import/resolver: meteor
```

## Motivations

The resolver handles Meteor specific resolutions:

### Resolve `/` imports

The parent directory of the project's `.meteor` folder is used as the root for any `/` paths.

Example:

```javascript
// foo.js
import bar from '/imports/bar'
```

will import from `PROJECT_ROOT/imports/bar`.

### Ensure client and server files are imported correctly
Files in a `client` folder should only be able to imported into other files in `client` folders. Likewise, files in a `server` folder should only be able to be imported into other `server` folders. This resolver checks for these cases and will not resolve files that don't follow these rules.

See the `test/paths.js` file for tests that show these rules.


### Resolve meteor package imports

The resolver also resolves `import foo from 'meteor/foo:bar`, however this part of the resolver does not work perfectly.

Meteor packages (ie `import foo from 'meteor/foo:bar'`) do not have a reliable way to access
the main export of a package, and in fact some packages do not even have a main module file but
rather rely on the Meteor build system to generate an importable symbol. This happens in the case of
`api.export('Foo')` rather than using the newer `api.mainModule('index.js')`.

The strategy for resolving a Meteor import is as follows:

1. If the package is a Meteor internal package (ie `import {Meteor} from 'meteor/meteor'`) check that the package exists in `.meteor/versions` so that users don't have to import all internal packages such as Mongo and Meteor directly.
1. If it is a user created package (ie `import {SimpleSchema} from 'meteor/aldeed:simple-schema'`) check that the package exists in `.meteor/packages`. For user created packages we enforce that if you want to `import from 'meteor/foo:bar'` a file you must `meteor add foo:bar`

This strategy is imperfect, however it is the best we can do. It leads to the following false positives:

1. If you're linting inside of a Meteor package, that package will only have access to the packages that it imports
in it's `package.js` file. You will get false positives for packages that are required by the project but not by the package.

Even given these limitations, this resolver should still help significantly to lint Meteor projects.
