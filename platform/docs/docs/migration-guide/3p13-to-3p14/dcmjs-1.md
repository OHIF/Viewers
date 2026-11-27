---
sidebar_position: 17
sidebar_label: dcmjs 1.0
title: dcmjs 1.0 (@dcmjs-org/dcmjs)
---

# dcmjs 1.0 (`@dcmjs-org/dcmjs`)

OHIF 3.14 moves from `dcmjs` 0.52 to dcmjs 1.0. The npm package of dcmjs 1.0 is
`@dcmjs-org/dcmjs`. OHIF pins `@dcmjs-org/dcmjs` 1.0.0.

## Runtime plugins

The host shares only `@dcmjs-org/dcmjs` (major version 1) with runtime plugins.
The host does not share the old `dcmjs` package.

- A runtime plugin imports `@dcmjs-org/dcmjs`, not `dcmjs`.
- Set the peer range of the plugin to `"@dcmjs-org/dcmjs": "^1.0.0"`.
- The plugin build keeps `@dcmjs-org/dcmjs` external. The host gives its copy
  on `window['@dcmjs-org/dcmjs']`.
- A plugin that still imports `dcmjs` bundles its own copy of dcmjs 0.x. That
  copy reads data in the 0.x shapes, and it does not share the log root or the
  `registerTag()` registry of the host.
- `create-ohif migrate` moves an `@dcmjs-org/dcmjs` dependency to a peer
  dependency `^1.0.0`. It does not change an import of `dcmjs`. Change each
  import by hand.

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

The dcmjs migration guide gives all changes:
[`docs/MIGRATION.md`](https://github.com/dcmjs-org/dcmjs/blob/main/docs/MIGRATION.md).
