---
sidebar_position: 17
sidebar_label: dcmjs 1.0
title: dcmjs 1.0
---

# dcmjs 1.0

OHIF 3.14 moves from `dcmjs` 0.52 to dcmjs 1.0. The OHIF source keeps
`import dcmjs from 'dcmjs'`. npm does not have a `dcmjs` 1.x release yet, so
each OHIF package declares `dcmjs` as an alias of the dcmjs 1.0 package:
`"dcmjs": "npm:@dcmjs-org/dcmjs@1.0.2"`. When `dcmjs` 1.x is on npm, the alias
changes to that version, and the source does not change.

## Runtime plugins

The host shares `dcmjs` with runtime plugins, as in OHIF 3.13. The major
version of the shared `dcmjs` changes from 0 to 1.

- A runtime plugin keeps `import dcmjs from 'dcmjs'`.
- Set the peer range of the plugin to `"dcmjs": "^1.0.0"`. Until `dcmjs` 1.x
  is on npm, install dcmjs 1.0 for the plugin build and tests with the alias
  `"dcmjs": "npm:@dcmjs-org/dcmjs@1.0.2"`.
- The plugin build keeps `dcmjs` external. The host gives its copy on
  `window['dcmjs']`.
- A plugin that was built for dcmjs 0.x gets dcmjs 1.0 from the host. dcmjs
  1.0 changes the API and the shapes of naturalized data. Make the changes in
  the dcmjs migration guide, and build the plugin again.
- `create-ohif migrate` moves a `dcmjs` dependency to a peer dependency
  `^1.0.0`.

## Naturalized data shapes

The instance metadata in `DicomMetadataStore` has the dcmjs 1.0 shapes. An
extension that reads instance metadata must read these shapes:

- A sequence with one item is the item object, not an array. Use `asArray`
  from `@cornerstonejs/utils` before an array method such as `map` or `find`.
- A VM `1-n` value is a list, also for one value. A VM 1 value is a scalar, and
  the value is `null` when it is empty.
- A PN value is an object, for example `{ Alphabetic: 'Doe^John' }`.
- The private elements of one reserved block are in one key,
  `` `${gggg}:${creator}` ``. Read a private element with
  `getPrivateTagValue(dataset, group, creator, element)` from
  `@cornerstonejs/utils`.

The dcmjs migration guide gives all API changes:
[`docs/MIGRATION.md`](https://github.com/dcmjs-org/dcmjs/blob/main/docs/MIGRATION.md).
