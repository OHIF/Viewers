# Proposal: Full-instance prefetch for segmentation (and multiframe) loading

Status: **Draft / for discussion**
Author: (generated assist)
Related: `getSopClassHandlerModule.ts` (SEG load), `@cornerstonejs/adapters`
`labelmapImagesFromBuffer.ts` (`decodeSegPixelDataFromFrameIds`, now bounded by
`concurrency`, default 16).

## Problem

The SEG load path now fetches/decodes frames through the cornerstone image
loader, one loadable `imageId` per frame, parallelized up to `N=16`
(`concurrency`). For a SEG (or any multiframe instance) with **800+ small
frames**, this means 800+ independent HTTP requests, each with its own
request/response overhead. Even at 16-wide concurrency the *per-request* latency
floor dominates: each frame is < 1 KB of payload but pays a full round trip.

Streaming **one large object** (the entire Part 10 / multiframe instance) is far
cheaper than streaming hundreds of tiny ones — a single connection, a single set
of headers, no per-frame TTFB. The whole instance for an 800-frame binary SEG is
typically a few hundred KB to a few MB.

## Goal

Add a **generic data-source capability** that, _just before_ the segmentation
loader runs, optionally fetches the **entire original instance** in one request,
parses it progressively, and **registers the per-frame compressed pixel data**
into the image loader's caches — so the existing per-frame `imageId` fetch path
transparently hits local data instead of the network, while the **cornerstone
decode path stays byte-for-byte identical** (same decompressor, same workers).

Crucially this is **best-effort and non-blocking**:

- It is gated by a **race time in ms**, `loadMultiframeAsPart10RaceTimeMs`. We
  kick off the full-instance fetch and give it up to that long of a head start,
  then proceed on the **normal per-frame path** regardless. Frames already
  registered are served locally; frames not yet registered fall through to their
  normal network fetch.
- If `loadMultiframeAsPart10RaceTimeMs` is `0` / `undefined`, the capability is
  **disabled** — no full-instance fetch is attempted.
- If the full-instance fetch or parse **fails for any reason**, it must **never**
  fail the segmentation decode. We log and fall back to per-frame fetches.

## Why this is safe / transparent

There is **one uniform frame registry: the cornerstone3D core image cache**
(`@cornerstonejs/core` `cache`). We do not invent a new per-scheme registry.

The reason this works with zero loader changes is that the core image loader
**already consults the cache above the scheme layer**. `imageLoader.loadImage`
(which the SEG decoder's `defaultDecodeFrameImageData` calls) goes through
`loadImageFromImageLoader`, which — before dispatching to the wadors/wadouri
loader — checks, in order (see `core/src/loaders/imageLoader.ts`):

```ts
const cachedImageLoadObject = !options.ignoreCache && cache.getImageLoadObject(imageId);
if (cachedImageLoadObject) { return cachedImageLoadObject; }      // <-- our seam
const cachedImage = !options.ignoreCache && cache.getImage(imageId, qualityStatus);
if (cachedImage) { return { promise: Promise.resolve(cachedImage) }; }
// ...only now pick a scheme loader (wadors/wadouri) and hit the network
```

So if the prefetch **pre-seeds the core cache** with an `IImageLoadObject` keyed
by each frame `imageId`, then `loadImage(frameImageId)` returns it immediately and
**never touches the network** — and this is **identical for WADO-RS and WADO-URI**
because the cache check happens before the scheme is even examined. One registry,
both schemes, no per-scheme hooks, no `getPixelData` patches.

We register the **compressed** frame (encapsulated transfer syntaxes) or the
**uncompressed** frame bytes (native) wrapped in a load object whose promise runs
the **existing decode pipeline** — so cornerstone's normal decompressor produces
the pixels exactly as a per-frame fetch would have. From cornerstone's
perspective nothing changed except the bytes came from memory.

> Rejected alternative: a bespoke `Map<imageId, frame>` registry plus
> `getPixelData` shims in each of `wadors` and `wadouri`. That duplicates a cache
> that already exists, diverges the two schemes, and adds a second cache to keep
> coherent with the core one. Standardizing on the core image cache is the single
> uniform registry the design should use.

## Proposed API

A generic capability on the data source (so it works for any multiframe
instance, not just SEG), plus a thin orchestrator the SEG handler calls.

```ts
// Generic, data-source-level. Returns a handle that resolves/settles in the
// background; callers do not await full completion.
interface PrefetchInstanceOptions {
  /**
   * Head-start window in ms. We start the full-instance (Part 10) fetch and wait
   * up to this long for it (or for the first frames) to be ready before returning
   * control to the caller, which then proceeds on the normal per-frame path.
   * 0 or undefined => disabled (no full-instance fetch attempted).
   */
  loadMultiframeAsPart10RaceTimeMs?: number;
  /** The per-frame imageIds the caller will load (used to key the registry). */
  frameImageIds?: string[];
  signal?: AbortSignal;
}

interface PrefetchHandle {
  /** Resolves true if the full instance was fetched+registered, false if skipped/failed. */
  readonly done: Promise<boolean>;
  /** True once at least one frame has been registered (frames are usable). */
  readonly started: Promise<void>;
  cancel(): void;
}

// On the data source:
dataSource.prefetchInstanceFrames(
  segInstanceImageId: string,
  options: PrefetchInstanceOptions
): PrefetchHandle;
```

### Call site (just before the loader)

In `getSopClassHandlerModule.ts`, immediately before
`createFromDicomSegImageId(...)`:

```ts
// Comes from config/customization; 0/undefined disables prefetch.
const loadMultiframeAsPart10RaceTimeMs = getSegPrefetchRaceMs(customizationService); // default 0 for now
const prefetch = dataSource.prefetchInstanceFrames?.(segImageIdForMetadata, {
  loadMultiframeAsPart10RaceTimeMs,
  frameImageIds,
});

// Give the bulk fetch its head-start window, then proceed regardless.
if (prefetch) {
  await Promise.race([prefetch.started, delay(loadMultiframeAsPart10RaceTimeMs)]);
}

try {
  results = await adaptersSEG.Cornerstone3D.Segmentation.createFromDicomSegImageId(
    imageIds,
    segImageIdForMetadata,
    { metadataProvider: metaData, tolerance, parserType, frameImageIds,
      concurrency: SEG_FRAME_DECODE_CONCURRENCY }
  );
} finally {
  prefetch?.cancel(); // stop any in-flight background work tied to this load
}
```

The loader is **unchanged** — it still asks the image loader for each frame.
Registered frames resolve instantly from memory; the rest fetch normally.

## Mechanism (the 4 requested points)

### 1. Async DICOM reader (dcmjs) to parse the streamed data

Fetch the instance as a stream and parse **progressively** with dcmjs so we can
register frames *as they arrive* rather than after the whole file lands. dcmjs
understands encapsulated PixelData fragmentation (Basic Offset Table / fragment
boundaries), which is what lets us slice out per-frame compressed fragments
correctly.

- Fetch via the data source's existing retrieve (e.g. `retrieve.directURL` /
  `retrieve.bulkDataURI` / a WADO-RS instance request), getting a `ReadableStream`
  where available.
- Feed bytes to an async/streaming dcmjs read. As soon as the header + transfer
  syntax + (for encapsulated data) the offset table and each fragment are
  available, emit per-frame compressed byte ranges.

> Note: dcmjs's classic `DicomMessage.readFile` is synchronous over a full
> buffer. The "async reader" here means either dcmjs's streaming/iterative read
> if available in our pinned version, or a thin wrapper that parses incrementally
> as chunks arrive. If progressive parse proves fiddly, a v1 can parse once the
> full buffer is in memory and still win big (one request vs 800).

#### Response envelope: `multipart/related` vs raw DICOM

The full-instance fetch can come back in **two shapes**, and the parser must
handle both before any DICOM parsing happens:

- **`multipart/related`** — a WADO-RS instance retrieve
  (`GET …/instances/{sop}` with `Accept: multipart/related; type="application/dicom"`)
  wraps the Part 10 object(s) in a MIME multipart envelope: leading part headers,
  a `--boundary` marker, the DICOM bytes, then a terminal `--boundary--`. The
  inner DICOM byte offsets are **shifted** by the MIME header length, so dcmjs
  must be fed the *unwrapped* inner part, never the raw response.
- **raw DICOM** — WADO-URI, a direct file/object URL, or a `bulkDataURI` that
  returns a single `application/dicom` body: the response **is** the Part 10
  bytes, no envelope.

Detection is by the response **`Content-Type`** header — exactly what the
existing `wadors/extractMultipart.ts` already does (`if (contentType.indexOf('multipart') === -1)` → return bytes as-is; otherwise find the boundary, strip the part headers, and return the inner bytes). The prefetch **reuses
`extractMultipart`** (or a shared extraction of it) to normalize either shape to
raw Part 10 *before* handing bytes to dcmjs. So:

```
fetch → Content-Type?
  ├─ multipart/related → extractMultipart() → inner Part 10 bytes → dcmjs
  └─ application/dicom  → bytes as-is                              → dcmjs
```

Streaming wrinkles to handle (these are why this needs to be called out, not
assumed):

- In **progressive** mode the multipart preamble/boundary must be stripped at the
  **start** of the stream, and the terminal boundary detected at the **end**; the
  dcmjs reader operates on the *inner* stream. A boundary token can **straddle
  chunk boundaries**, so the unwrapper must buffer across chunks (the existing
  `findIndexOfString` + `options`/`tokenIndex` carry-over in `extractMultipart`
  is built for incremental calls and can be leveraged).
- `multipart/related` may, per spec, contain **multiple parts**. A single-instance
  retrieve yields one; we should guard for >1 (use the first DICOM part, or treat
  unexpected multiplicity as a reason to fall back per point 4).
- A truncated/partial multipart body (no terminal boundary yet) must not be
  mis-parsed — only register frames whose fragments are fully present, exactly as
  the non-fatal fallback (point 4) requires.

### 2. Register the compressed data as it arrives (into the core image cache)

As each frame's compressed bytes become available, register them keyed by the
frame's loadable `imageId`. We already compute `frameImageIds` in the SEG handler,
so we map frame index → `imageId` → load object → `cache.putImageLoadObject`:

```ts
// new adapter in @cornerstonejs/dicomImageLoader, e.g.
// imageLoader/registerCompressedFrame.ts
import { cache } from '@cornerstonejs/core';
import createImage from './createImage';

export function registerCompressedFrame(
  imageId: string,
  pixelData: Uint8Array,     // compressed fragment, or uncompressed frame bytes
  transferSyntaxUID: string,
  options?
) {
  if (cache.getImageLoadObject(imageId) || cache.getImage(imageId)) {
    return; // already present (e.g. a per-frame fetch beat us) — leave it
  }
  // Lazy: decode only runs if/when the seg loader actually pulls this frame.
  let promise: Promise<IImage> | undefined;
  const loadObject: IImageLoadObject = {
    get promise() {
      promise ||= createImage(imageId, pixelData, transferSyntaxUID, options);
      return promise;
    },
    decache: () => { promise = undefined; },
  };
  cache.putImageLoadObject(imageId, loadObject);
}
```

`createImage(imageId, pixelData, transferSyntax, options)` is the **same function
both `wadors/loadImage` and `wadouri/loadImage` already call** after they obtain
compressed pixel data — i.e. we reuse the existing decode pipeline verbatim and
just feed it bytes from the prefetch instead of from the network.

This is the "few new adapters" the task calls for:

1. `registerCompressedFrame(imageId, pixelData, transferSyntaxUID, options)` —
   wraps prefetched compressed bytes into an `IImageLoadObject` via `createImage`
   and puts it in the core cache. (Exposes the *post-`getPixelData`* half of the
   loader for externally-supplied bytes.)
2. A metadata shim so the frame `imageId` has the `imagePixelModule` / transfer
   syntax that `createImage` + the worker decoder need (reuse
   `wadors/metaDataManager` / `genericMetadataProvider`; the SEG handler already
   calls `_ensureSegInstanceMetadataAvailable` per frame imageId).

Nothing is registered in a second, parallel cache — the registry **is** the core
image cache, so it stays coherent with everything else cornerstone loads.

### 3. Cornerstone uses its existing decompressor — identical downstream

Because the registered load object decodes via `createImage` (→ the same
web-worker decoder used for every wadors/wadouri frame), encapsulated transfer
syntaxes are decompressed exactly as if fetched per-frame, and native/uncompressed
frames pass through unchanged. No new decode path, no codec changes, no divergence
in pixel output — the only difference is the compressed bytes' origin.

### 4. Failure is non-fatal — fall back to per-frame fetches

The whole capability is wrapped so that **any** failure (network error, abort,
parse error, unexpected transfer syntax, partial/truncated stream, registry
error) results in: log a warning, register nothing further, resolve
`handle.done` as `false`. The SEG loader then simply fetches the frames it
didn't get from the registry over the network — the current behavior. The
prefetch can never throw into the load path.

Edge cases that must degrade gracefully:

- Transfer syntax we can't fragment correctly → skip registration for that
  instance.
- Frame count mismatch between parsed instance and expected `frameImageIds` →
  register only the frames we can confidently map; fetch the rest.
- `AbortSignal` fired (viewport closed / segmentation removed mid-load) →
  `cancel()` aborts the fetch; already-registered frames stay usable, nothing
  breaks.

## Race semantics (the `loadMultiframeAsPart10RaceTimeMs` knob)

- `loadMultiframeAsPart10RaceTimeMs == 0 || undefined` → **disabled**. Today's
  default. No behavior change until we opt in.
- `loadMultiframeAsPart10RaceTimeMs > 0` → start the full-instance fetch, then
  `Promise.race([prefetch.started, delay(loadMultiframeAsPart10RaceTimeMs)])`
  before handing control to the loader. This gives the bulk transfer a head start
  so the *first* frames are already local, while guaranteeing we never stall the
  load longer than the race time if the server is slow. The background fetch keeps
  registering later frames while the loader is already churning through early
  ones — so even a partial head start helps.

A sensible starting value once enabled is something like 250–750 ms (enough to
beat per-frame TTFB on most servers), tuned per deployment.

## Where the generic capability lives

- The **registry is the existing core image cache** (`@cornerstonejs/core`
  `cache`) — no new cache. The only new code in
  `@cornerstonejs/dicomImageLoader` is the thin **adapter(s)**:
  `registerCompressedFrame()` (wrap compressed bytes → `IImageLoadObject` via the
  existing `createImage`) plus the metadata shim. No `getPixelData` patches, no
  per-scheme hooks.
- The **fetch + dcmjs progressive parse + registration orchestration** belongs in
  the **data source** (`extensions/default/.../DicomWebDataSource`) as
  `prefetchInstanceFrames`, because it knows how to retrieve a full instance
  (auth headers, `wadoRoot`, `bulkDataURI`, WADO-RS vs WADO-URI, CORS), and so
  alternate data sources can implement/override it.
- The SEG handler only **orchestrates the race** and passes `frameImageIds`.

This keeps the layering clean: data source = "how to get bytes", image loader =
"how to cache/decode bytes", SEG handler = "when to ask".

## Open questions / risks

1. **dcmjs vs dicom-parser compatibility — sidestepped.** Because the registry is
   the core image cache and we register *compressed frame bytes* (fed to
   `createImage`), we never need to materialize a dicom-parser `DataSet`. dcmjs is
   used only to parse the fetched instance and slice out per-frame compressed
   fragments; its object model never has to interoperate with the wadouri
   `dataSetCacheManager`. This is a key reason the core-cache design is cleaner
   than the rejected per-scheme registry.
2. **Memory.** Holding the full instance plus the registered (still-compressed)
   frames briefly raises memory for that instance. Compressed frames are small;
   the lazy load object means decoded buffers are only created when the seg loader
   pulls a frame. Cache eviction is already handled by the core `cache` (shared
   accounting), and `cancel()`/`decache` releases anything left over.
3. **Streaming availability.** Not all servers/CORS configs expose a streamable
   body or range requests. The capability must work (less optimally) with a
   single full-buffer fetch too.
4. **Auth / headers.** Must reuse the data source's existing request decoration
   (`UserAuthenticationService` token injection) — another reason it lives in the
   data source.
5. **Metadata.** Frames need enough metadata registered (`metaDataManager`) for
   decode; the SEG handler already calls `_ensureSegInstanceMetadataAvailable`
   for each frame imageId, so this should be covered, but verify for WADO-RS.

## Incremental rollout

1. Land the **`registerCompressedFrame` adapter** (+ metadata shim) in
   dicomImageLoader. It only writes to the existing core image cache, so there is
   no behavior change until the prefetch calls it.
2. Implement `prefetchInstanceFrames` in DicomWebDataSource (full-buffer v1, no
   progressive parse) behind `loadMultiframeAsPart10RaceTimeMs` default `0`.
3. Wire the SEG handler call site; enable with a small
   `loadMultiframeAsPart10RaceTimeMs` in a test deployment; measure 800-frame SEG
   load time.
4. Add progressive (streaming) dcmjs parse to register frames as they arrive.
5. Extend to other multiframe loaders (it's generic) if the win holds.
