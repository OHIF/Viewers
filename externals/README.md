# External Dependencies

This module contains optional dependencies for including in CornerstoneJS, such
as the DICOM Microscopy Viewer component.  The intent is to allow further
dependencies to be added here which are not required at build time.  To add
a default external dependency, edit the package.json file, and use it by adding
it to the copy phase of the deploy.

To add non-default dependencies, add shell scripts of the form:

```bash
npm install --no-save PACKAGE_NAME@VERSION
```

named `local-PACKAGE_NAME.sh` so that they are ignored.

Use the same format for example files, but call them `groupName-PACKAGE_NAME.sh`
for named/default sets of externals.  These can be committed, and will at some
point have additional support for installing groups.

Alternatively, these can be added as script changes to the package.json, to install a
group of related items.
