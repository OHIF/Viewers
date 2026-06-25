# Full-instance prefetch for segmentation (and multiframe) loading

Status: **Implemented — opt-in (disabled by default)**

Enable per data source by setting `loadMultiframeAsPart10RaceTimeMs` to a positive
number of milliseconds in the data source `configuration` (this is how the static
WADO backends in `config/default.js` and `config/e2e.js` turn it on, value
`3000`). It also falls back to the global customization
`cornerstone.segmentation.loadMultiframeAsPart10RaceTimeMs`. `0`/unset keeps
today's per-frame behaviour. The value is the **max ms to wait** for the
single-instance fetch+parse before proceeding (the load proceeds immediately once
it completes; on timeout it falls back to per-frame and the registration still
benefits later frames).

Implemented across:

- `@cornerstonejs/dicom-image-loader`
  - `imageLoader/prefetchPart10Instance.ts` — registers a Part 10 instance into
    the frame registry (thin wrapper over `addDicomPart10Instance`).
  - `imageLoader/wadors/loadImageFromRegistry.ts` +
    `wadors/loadImage.ts` — WADO-RS loads now consult the registry first.
- `@ohif/extension-default` `DicomWebDataSource` — `retrieve.prefetchInstanceFrames`.
- `@ohif/extension-cornerstone-dicom-seg` `getSopClassHandlerModule.ts` — call
  site + race.

Related: `@cornerstonejs/adapters` `labelmapImagesFromBuffer.ts`
(`decodeSegPixelDataFromFrameIds`, bounded by `concurrency`, default 16).

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
loader runs, optionally fetches the **entire original instance** in one request
and **registers it into the Cornerstone3D frame registry** (the
`@cornerstonejs/metadata` NATURALIZED + `COMPRESSED_FRAME_DATA` framework, parsed
by the dcmjs async reader) — so the existing per-frame `imageId` fetch path
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

There is **one uniform frame registry: the Cornerstone3D `@cornerstonejs/metadata`
NATURALIZED framework**, populated by `addDicomPart10Instance` (which parses the
Part 10 with the dcmjs `AsyncDicomReader`) and read per-frame via the
`COMPRESSED_FRAME_DATA` typed provider. Frame imageIds are normalized to the base
instance by `baseImageIdQueryFilter` (strips `/frames/N`, `?frame=N`, `&frame=N`),
so one registration under the instance serves every frame.

This is the **same registry the WADO-URI / `dicomweb` loader already uses**:
`wadouri/loadImage.ts`'s `loadImageFromNaturalizedMetadata` resolves each frame
from `COMPRESSED_FRAME_DATA` and decodes it with `createImage`. The gap was that
**WADO-RS** (`wadors/loadImage.ts`) always issued a per-frame `/frames/N` request
and never consulted the registry. The adapter closes that gap:

- `wadors/loadImageFromRegistry.ts` — `loadImageFromCompressedFrameRegistry(imageId)`
  looks up `COMPRESSED_FRAME_DATA` for the frame; if present it decodes via the
  **same `createImage`** path and returns the image; if absent it returns
  `undefined`.
- `wadors/loadImage.ts` calls it first and short-circuits when the registry has
  the frame, otherwise falls through to the existing network path.

So once `prefetchPart10Instance` has registered the instance, **both WADO-URI and
WADO-RS** serve every frame from the single registry, with the **same decode
pipeline** (`createImage` → worker decoder). From cornerstone's perspective
nothing changed except the compressed bytes came from the registry instead of the
wire.

> Rejected alternatives: (1) a bespoke `Map<imageId, frame>` registry plus
> `getPixelData` shims — duplicates a registry that already exists; (2) seeding
> the core image cache (`cache.putImageLoadObject`) per frame — works, but the
> per-frame compressed data already lives in the NATURALIZED registry, so basing
> the design on that registry (and teaching WADO-RS to read it) keeps a single
> source of truth instead of copying frames into a second cache.

## API (as implemented)

A generic capability on the data source's `retrieve` namespace (so it works for
any multiframe instance, not just SEG, and alternate data sources can override
it), plus the SEG handler call site that races it.

`IWebApiDataSource.create` passes `retrieve` through verbatim, so the capability
is added there (no `@ohif/core` change):

```ts
// On the data source (DicomWebDataSource):
dataSource.retrieve.prefetchInstanceFrames({
  instance,                          // study/series/sop UIDs for retrieveInstance
  imageId,                           // SEG instance imageId (frame qualifiers normalized away)
  loadMultiframeAsPart10RaceTimeMs,  // 0/undefined => no-op
}): {
  done: Promise<boolean>;            // resolves true if fetched+registered, false if skipped/failed
  cancel: () => void;
};
```

The implementation fetches the instance with `wadoDicomWebClient.retrieveInstance`
(which returns the Part 10 as an `ArrayBuffer`, unwrapping `multipart/related`
transparently) and passes a **lazy resolver** to
`dicomImageLoader.prefetchPart10Instance(imageId, resolver)`. All work is wrapped
so any failure resolves `done` to `false` — it never throws into the loader.

### Call site (just before the loader)

In `getSopClassHandlerModule.ts`, immediately before
`createFromDicomSegImageId(...)` (abridged from the actual code):

```ts
const loadMultiframeAsPart10RaceTimeMs =
  (dataSource?.getConfig?.()?.loadMultiframeAsPart10RaceTimeMs as number | undefined) ??
  (customizationService?.getCustomization?.(
    'cornerstone.segmentation.loadMultiframeAsPart10RaceTimeMs'
  ) as number | undefined) ??
  0;

let prefetch;
if (loadMultiframeAsPart10RaceTimeMs > 0) {
  prefetch = dataSource.retrieve?.prefetchInstanceFrames?.({
    instance,
    imageId: segImageIdForMetadata,
    loadMultiframeAsPart10RaceTimeMs,
  });
  if (prefetch?.done) {
    // Give the bulk fetch a head start, then proceed regardless.
    const raceTimer = new Promise(r => setTimeout(r, loadMultiframeAsPart10RaceTimeMs));
    await Promise.race([prefetch.done, raceTimer]);
  }
}

try {
  results = await adaptersSEG.Cornerstone3D.Segmentation.createFromDicomSegImageId(
    imageIds,
    segImageIdForMetadata,
    { metadataProvider: metaData, tolerance, parserType, frameImageIds,
      concurrency: SEG_FRAME_DECODE_CONCURRENCY }
  );
} finally {
  eventTarget.removeEventListener(Enums.Events.SEGMENTATION_LOAD_PROGRESS, onProgress);
  prefetch?.cancel?.();
}
```

The SEG loader and adapter are **unchanged** — the loader still asks the image
loader for each frame. Registered frames resolve from the registry; the rest
fetch normally.

## Mechanism (the 4 requested points)

### 1. Async DICOM reader (dcmjs) to parse the instance

Parsing is done by `@cornerstonejs/metadata`'s `addDicomPart10Instance`, which
uses the dcmjs **`AsyncDicomReader`** (`naturalizePart10Buffer` in
`naturalizedHandlers.ts`) and understands encapsulated PixelData fragmentation,
so the NATURALIZED instance exposes pixel data as an array of per-frame
ArrayBuffer fragments. `COMPRESSED_FRAME_DATA` then slices out the requested
frame. We did not re-implement any parsing — the prefetch just feeds the fetched
Part 10 buffer to this existing reader.

**Implemented as full-buffer v1**: the whole instance is fetched, then parsed.
`addDicomPart10Instance` accepts a lazy resolver, so the fetch is what the race
waits on. Progressive/streaming registration (registering frames as bytes arrive)
is a future optimization — see rollout step 4.

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

**As implemented**, the full-buffer path delegates this to **`dicomweb-client`'s
`retrieveInstance`**, which performs the WADO-RS instance retrieve and returns the
Part 10 as an `ArrayBuffer` with the `multipart/related` envelope already
unwrapped (and returns the single-part body as-is). `prefetchInstanceFrames`
additionally tolerates an `[ArrayBuffer]` or `ArrayBufferView` shape defensively.
So the implemented path is:

```
retrieveInstance() → ArrayBuffer (multipart unwrapped by dicomweb-client)
                   → prefetchPart10Instance → addDicomPart10Instance → dcmjs AsyncDicomReader
```

Detection by `Content-Type` and manual unwrapping (the approach `wadors/extractMultipart.ts`
uses: `contentType.indexOf('multipart') === -1` → bytes as-is; else strip the
boundary/part headers) becomes relevant only for the **future streaming path**
(rollout step 4), where these wrinkles must be handled directly:

- The multipart preamble/boundary stripped at the **start** of the stream and the
  terminal boundary detected at the **end**; a boundary token can **straddle chunk
  boundaries**, so the unwrapper must buffer across chunks (the existing
  `findIndexOfString` + `tokenIndex` carry-over in `extractMultipart` is built for
  incremental calls).
- `multipart/related` may contain **multiple parts**; a single-instance retrieve
  yields one — guard for >1.
- A truncated/partial body (no terminal boundary yet) must not be mis-parsed.

### 2. Register the compressed data into the frame registry

The fetched Part 10 buffer is registered **once per instance** via the
`prefetchPart10Instance` adapter (a thin wrapper over `addDicomPart10Instance`):

```ts
// @cornerstonejs/dicom-image-loader: imageLoader/prefetchPart10Instance.ts
import { utilities } from '@cornerstonejs/metadata';
const { addDicomPart10Instance } = utilities;

export function prefetchPart10Instance(baseImageId, part10 /* buffer | resolver */) {
  return addDicomPart10Instance(baseImageId, part10);
}
```

That populates NATURALIZED for the instance; `COMPRESSED_FRAME_DATA` then yields
each frame's compressed bytes + transfer syntax on demand. Frame imageIds
normalize to the instance key automatically (`baseImageIdQueryFilter`), so there
is no per-frame registration loop and no second cache to keep coherent — the
registry **is** the existing NATURALIZED framework.

The "few new adapters" the task calls for:

1. `prefetchPart10Instance(baseImageId, part10)` — entry point to register a
   fetched instance into the registry (exported from
   `@cornerstonejs/dicom-image-loader`).
2. `loadImageFromCompressedFrameRegistry(imageId, options)` in
   `wadors/loadImageFromRegistry.ts` — teaches the **WADO-RS** loader to read the
   registry. It looks up `COMPRESSED_FRAME_DATA` for the frame and, if present,
   decodes via the same `createImage` the network path uses; `wadors/loadImage.ts`
   calls it first and short-circuits on a hit. (WADO-URI already reads the
   registry via `loadImageFromNaturalizedMetadata`.)

Metadata the decoder needs (`imagePixelModule`, transfer syntax) comes from the
same NATURALIZED instance, plus the SEG handler's existing
`_ensureSegInstanceMetadataAvailable` per frame imageId.

### 3. Cornerstone uses its existing decompressor — identical downstream

Both the WADO-URI path and the new WADO-RS registry path decode via
`createImage` (→ the same web-worker decoder used for every network frame), so
encapsulated transfer syntaxes are decompressed exactly as if fetched per-frame
and native/uncompressed frames pass through unchanged. No new decode path, no
codec changes, no divergence in pixel output — the only difference is that the
compressed bytes came from the registry instead of the wire.

### 4. Failure is non-fatal — fall back to per-frame fetches

`prefetchInstanceFrames` wraps the fetch + parse so that **any** failure (network
error, cancel, parse error, unexpected `retrieveInstance` shape) resolves
`done` to `false` and logs a warning — it never throws into the SEG load. When
the registry has no data for a frame, `loadImageFromCompressedFrameRegistry`
returns `undefined` and the WADO-RS loader falls through to its normal
`/frames/N` request. So if the prefetch is slow, disabled, or fails, loading is
exactly today's per-frame behaviour.

Edge cases that degrade gracefully:

- Race timer expires before the parse completes → frames load over the network
  meanwhile; once registration completes, remaining frames hit the registry.
- `cancel()` (viewport closed / segmentation removed mid-load) → the resolver
  throws on its cancelled flag; `done` resolves `false`; any already-registered
  data stays usable.
- A misbehaving metadata provider → the registry lookup is wrapped in try/catch
  and returns `undefined`, so per-frame loading is never broken.

## Race semantics (the `loadMultiframeAsPart10RaceTimeMs` knob)

- `loadMultiframeAsPart10RaceTimeMs == 0 || undefined` → **disabled**. Today's
  default. No behavior change until we opt in.
- `loadMultiframeAsPart10RaceTimeMs > 0` → start the full-instance fetch+parse,
  then `Promise.race([prefetch.done, delay(loadMultiframeAsPart10RaceTimeMs)])`
  before handing control to the loader. This gives the bulk transfer a head start
  so frames are already in the registry, while guaranteeing we never stall the
  load longer than the race time if the server is slow. If the timer wins, the
  loader proceeds and frames fetch per-frame meanwhile; once registration
  completes, the remaining frames are served from the registry.

> `addDicomPart10Instance` registers the instance atomically (one parse), so in
> practice registration is all-or-nothing rather than progressive — the race time
> is "how long to wait for the whole fetch+parse before proceeding." Progressive
> registration (rollout step 4) would make the head start matter per-frame.

A sensible starting value once enabled is something like 250–750 ms (enough to
beat per-frame TTFB on most servers), tuned per deployment.

## Where the generic capability lives

- The **registry is the existing `@cornerstonejs/metadata` NATURALIZED framework**
  — no new cache. New code in `@cornerstonejs/dicom-image-loader` is the thin
  adapter `prefetchPart10Instance()` plus the WADO-RS read path
  (`wadors/loadImageFromRegistry.ts`, wired into `wadors/loadImage.ts`).
- The **fetch + register orchestration** lives in the **data source**
  (`extensions/default/.../DicomWebDataSource` → `retrieve.prefetchInstanceFrames`),
  because it knows how to retrieve a full instance (auth headers, `wadoRoot`,
  WADO-RS instance retrieve via `dicomweb-client`, CORS), and so alternate data
  sources can implement/override it.
- The SEG handler only **reads the customization and orchestrates the race**.

This keeps the layering clean: data source = "how to get bytes", image loader =
"how to register/decode bytes", SEG handler = "when to ask".

## Open questions / risks

1. **NATURALIZED registry key alignment.** Both registration
   (`addDicomPart10Instance`) and the WADO-RS read normalize frame imageIds to the
   base instance via `baseImageIdQueryFilter`, so they agree. Worth a sanity check
   per data source that the SEG `imageId` passed to `prefetchInstanceFrames` and
   the frame imageIds the SEG loader requests share the same instance base.
2. **Memory.** Holding the full instance plus the still-compressed frames in the
   registry raises memory for that instance until it is evicted. Compressed frames
   are small and decode is on-demand. Registry/cache eviction lifecycle for
   prefetched instances should be verified (especially repeated SEG loads).
3. **Streaming availability.** v1 uses a single full-buffer `retrieveInstance`. A
   future streaming path (step 4) would register frames as bytes arrive.
4. **Auth / headers.** Handled — the resolver sets
   `wadoDicomWebClient.headers = getAuthorizationHeader()` before retrieve, reusing
   the data source's existing decoration.
5. **Per-frame overhead.** Every WADO-RS load now does one cheap
   `COMPRESSED_FRAME_DATA` lookup (a Map get after base normalization) before
   falling through. Negligible, and only short-circuits when an instance was
   actually prefetched.

## Incremental rollout

1. ✅ `prefetchPart10Instance` adapter + WADO-RS registry read
   (`wadors/loadImageFromRegistry.ts`) in dicom-image-loader. No behaviour change
   until something registers an instance.
2. ✅ `retrieve.prefetchInstanceFrames` in DicomWebDataSource (full-buffer v1 via
   `retrieveInstance`) behind `loadMultiframeAsPart10RaceTimeMs` default `0`.
3. ✅ SEG handler call site + race. **Next:** enable with a small
   `loadMultiframeAsPart10RaceTimeMs` in a test deployment and measure 800-frame
   SEG load time before defaulting it on.
4. ⏳ Progressive (streaming) parse to register frames as they arrive (handle the
   `multipart/related` unwrap + boundary-straddle directly).
5. ⏳ Extend to other multiframe loaders (the registry path is generic).
