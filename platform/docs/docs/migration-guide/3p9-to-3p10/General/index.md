---
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
