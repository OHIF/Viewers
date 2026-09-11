# Viewport fidelity state and events

**Repository:** `cornerstonejs/cornerstone3D`
**Assignee:** @mbellehumeur
**Funded scope:** OHIF / FU Berlin Set-Aside, task **T3** (Aim 2.3, required)
**Consumed by:** OHIF viewport fidelity indicator (T6) — see the OHIF feature request for the
`VF-` requirement identifiers cited below.

---

## Summary

Cornerstone3D needs to expose, per viewport, what fidelity was requested versus what is
actually being displayed — as a defined interface with viewport events, plus example
implementations wired to the existing progressive loaders.

This is the prerequisite for the OHIF fidelity indicator (T6). It is also read directly by the
T11 measurement harness and the T18 final comparison, both of which record "current viewport
fidelity state", so it must be assertable without going through a UI.

## Scope

1. **A defined class and interface surface** representing viewport fidelity information
   (`VF-CS3D-1`).

2. **Viewport events** emitted when fidelity information changes (`VF-CS3D-2`). A getter alone
   is not sufficient — the OHIF indicator subscribes rather than polls (`VF-STATE-3`), and must
   update without a study reload (`VF-STATE-2`).

3. **The information carries, separately** (`VF-CS3D-3`):
   - the affected **dimension** — data resolution, display resolution, sampling density,
     decoded extent, pixel value quantisation, transform approximation, or rendering path;
   - the **cause** — a device capability limit, a performance target, an incomplete load, or an
     irreversibly lossy decode;
   - the **quantified magnitude** — per-axis decimation factors, decoded bytes, output
     resolution percentage, sampling ratio. Consumers must be able to render
     `Decimated volume x/2, y/2, z/4` or `Progressive decode, 32 kB initial`, not just
     "reduced quality";
   - whether the difference is **transient or standing**.

   Separating dimension from cause is what lets a consumer render "showing less detail"
   alongside "because this GPU cannot hold the full volume" without a combinatorial string
   table.

4. **The transition must be observable, not just the current value.** A progressive load that
   *completes without reaching full resolution* moves from transient to standing, and that
   transition is the single most important thing the indicator reports (`VF-INFO-5a`) — a
   stalled lossy load is visually indistinguishable from one still in flight.

5. **Example implementation for stack progressive loading** (`VF-CS3D-4`).

6. **Example implementation for volume progressive loading** (`VF-CS3D-5`).

7. **Both examples source their settings and values from the existing progressive loaders**
   (`VF-CS3D-6`) rather than introducing a parallel configuration path.

8. **Readable programmatically without a UI** (`VF-CS3D-7`).

## Relationship to `ImageQualityStatus`

`ImageQualityStatus` (`FAR_REPLICATE = 1`, `ADJACENT_REPLICATE = 3`, `SUBRESOLUTION = 6`,
`LOSSY = 7`, `FULL_RESOLUTION = 8`) stays exactly as it is, with its consumers unchanged
(`VF-CS3D-8`). It is internal to progressive image loading: per-**image**, numeric, ordered,
readable via `cache.getImageQuality(imageId)` and carried on `IImage.imageQualityStatus`.

The new state is per-**viewport** and distinguishes requested from displayed — a different
shape, not a replacement. The viewport state may draw on `ImageQualityStatus` as one input
among several.

## Notes for implementation

- `Events.IMAGE_RETRIEVAL_STAGE` fires from `ProgressiveRetrieveImages` with detail
  `{stageId, numberOfFailures, numberOfImages, stageDurationInMS, startDurationInMS}` — no
  fidelity field — and has **no OHIF subscribers today**. Either its detail gains the
  information or a new per-viewport event carries it.
- Contributing sources of state, as those tasks land: **T9** records the pre-allocation
  downsample and its reason; **T14** the active interaction reduction; **T15** the ordered
  fallback reason; **T4** the device-class limits that make a cause explicable. **T13**, if
  delivered, adds rendering-path substitution.
- T14 degrades fidelity every frame during rotate, zoom and pan by design, so the state changes
  at interaction rates. It must be truthful frame-by-frame; the consumer is responsible for
  presenting that unobtrusively (`VF-STATE-5`), not the state for smoothing it.
- Per-image granularity matters to consumers: the OHIF indicator reports the state of the image
  *currently displayed*, not the worst across the display set (`VF-VIS-4a`).

## Out of scope

- Detection, prevention, or recovery from insufficient browser memory (excluded by T9).
- The GPU taxonomy itself (T4), the level binding (T9), and the selection policy (T15).
- Any settable fidelity API. The state is queryable and observable; selection stays a
  deterministic side-effect-free decision of the T15 policy.
- Fidelity of overlay layers such as segmentation labelmaps — acknowledged gap, unfunded.

## Verification

Unit and example-level tests in the Cornerstone3D suite: dimension, cause, magnitude and
persistence populated correctly per fixture; events fire on change; the transient→standing
transition on a load that completes lossy; state assertable without a UI.
