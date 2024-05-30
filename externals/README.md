# External Dependencies

This module contains optional dependencies for including in OHIF, such
as the DICOM Microscopy Viewer component.  The intent is to allow both
runtime and compiled/built external components, with the naming distinguishing
between default externals and custom externals.

* `external-<NAME>` is used for default externals.  These are included in git/core deploy
* `local-<NAME>` is used for local deployments.  These are in .gitignore, but can be added manually to git to a local deployment.
* `example-<NAME>` is used for example deployments, and are COPIED to `local-<NAME>` by the `yarn example:add <NAME>` script

Currently, the public and dist directories are added for externals when declared in the app config.

TODO: Add app-config specific support for externals to auto-add `external-` and `local-` configurations.
