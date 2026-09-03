---
sidebar_position: 6
sidebar_label: Study List paging
title: Study list paging and the query limit
---

# Study list paging and the query limit

The study-list data fetch in `DataSourceWrapper` was simplified. This affects **both** the new `WorkList` and the `LegacyWorkList`, since both receive their studies from `DataSourceWrapper`.

## What changed

Previously, for data sources that support `offset`/`limit`, the wrapper derived a server-side `offset` from the current page and re-queried as you paged — a "rolling window" that let you page past the first result window.

Now the wrapper issues a **single query** with `offset: 0` and `limit: queryLimit`, and the study list paginates **client-side** over the returned studies. Changing pages no longer re-queries the server.

That cap was previously a **hard-coded `101`** in the application. It is now the per-data-source `queryLimit` configuration option, still defaulting to `101` — so it can be raised (or lowered) per data source instead of requiring a code change.

On data sources that honor `offset`, this is a deliberate behavior change: studies beyond `queryLimit` are no longer reachable from the study list, whereas previously you could page into them.

## Why the change

The previous, server-paged behavior was difficult to reason about and not consistently accurate:

- **Sorting applied only to the fetched window.** Sorting was performed client-side over the returned results (and only when the total was below the limit), so with large result sets the on-screen order did not represent a true sort across all matching studies — even though the sort controls implied that it did.
- **The study count was approximate.** The total handed to the pager was an estimate rather than the real number of matching studies.
- **Paging across the window boundary was fragile.** It relied on the page size evenly dividing the window and on the server honoring `offset`, so navigating near or beyond the result cap could surface duplicate or empty pages.

The new single-fetch, client-paginated model trades reach (a hard `queryLimit` cap) for predictable, consistent ordering and paging within that capped set.

## What you may need to do

The list can show at most `queryLimit` studies (default **101**). If a deployment needs to reach more studies than that, either:

- **narrow the search** (date range, MRN, accession, modality) so the matching studies fall under the cap, or
- **raise the cap** with the per-data-source `queryLimit` option:

  ```js
  configuration: {
    // ...
    queryLimit: 500,
  },
  ```

`queryLimit` is only honored by servers that support the `limit` query parameter; servers that ignore it return whatever they return. See the [DICOMweb data source options](../../configuration/dataSources/dicom-web.md).
