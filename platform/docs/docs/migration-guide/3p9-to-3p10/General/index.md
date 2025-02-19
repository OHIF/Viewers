---
sidebar_position: 1
title: General
---

## HTML Template Update
We have modified the `template.html` file so if you are using a custom template, you will need to update it.

Here are the key changes needed in the migration:

1. Added `window.PUBLIC_URL` declaration:
```javascript
window.PUBLIC_URL = '<%= PUBLIC_URL %>';
```

Was added before the `<!-- EXTENSIONS -->` comment block.


## OHIF Docs

OHIF platform/docs is no longer part of the workspace.

-  Builds are faster for 99.99% of users since only maintainers need to run the docs development.

If you need to run the docs website locally, you must install it first, as it is not installed by default.

Before:
```bash
yarn run dev
```

After:
```bash
yarn install
yarn run dev
```
