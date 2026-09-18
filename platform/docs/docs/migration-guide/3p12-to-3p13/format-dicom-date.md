---
sidebar_position: 5
sidebar_label: formatDICOMDate
title: formatDICOMDate options object
---

# formatDICOMDate options object

`formatDICOMDate` (exported from `@ohif/ui-next`) now takes its optional
arguments as a single options object instead of positional parameters.

**Before (3.12):**

```ts
formatDICOMDate(date, 'YYYY-MM-DD');
```

**After (3.13):**

```ts
formatDICOMDate(date, { strFormat: 'YYYY-MM-DD' });
```

The available options are:

- `strFormat` — explicit output format; overrides the locale's `Common:localDateFormat`.
- `fallbackFormat` — format used only when the active locale doesn't define `Common:localDateFormat` (defaults to `MMM D, YYYY`).
- `invalidFallback` — value returned for empty/unparseable input; when omitted, the prior lenient behavior is preserved.

Callers that passed only the `date` argument (including passing `formatDICOMDate`
directly as a `formatDate` formatter) are unaffected.
