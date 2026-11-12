# Next-viewport dispatch: how legacy-vs-native is decided

The `useNextViewports` opt-in routes OHIF onto cornerstone3D's native
("next" / GenericViewport) API. This document is the single description of
where and how the two lanes are selected. If you are adding a new legacy/native
divergence, one of the homes below is the right place — never an inline
`isGenericViewport` / flag check at the call site (enforced by
`scripts/check-next-viewport-boundaries.sh`).

## The three homes for divergence

| Home | What belongs there |
|---|---|
| `../adapter/` (`IViewportAdapter`) | API-surface bridging on a live viewport: reads/writes that exist on both lanes with different spellings (camera vs view state, properties vs display-set presentation, volumeId vs dataId, classification). The contract is next-shaped; the legacy adapter does the adapting. |
| `./` (`IViewportBackend`, `IViewportOperations`, and the segmentation twins in `../../SegmentationService/backends/`) | Lifecycle and interaction bodies: mount/re-mount, presentation capture/restore, dataId registration, per-command operations (flip/rotate/W-L/...), labelmap add/assembly. |
| `../../../utils/nextViewportPolicies.ts` | Behavioral policy: appearance defaults and workflow rules that differ by choice, not by API (fusion opacity flattening, overlay opacity, RTSTRUCT hydrate stack-pin). |

Pre-mount classification of `viewportData` (no live viewport yet) lives in
`../../../utils/viewportDataShape.ts`; the persisted `dataShapeType` field set
by `CornerstoneCacheService` is the sanctioned way to survive the native
type collapse (stack/volume/MPR all report `PLANAR_NEXT` at runtime).

## Two dispatch strategies (deliberately different)

- **Session flag, selected once** — `isNextViewportsEnabled()`. Used where no
  viewport exists yet, or for per-session lifecycle:
  `IViewportBackend` (the `get backend()` getter on CornerstoneViewportService),
  `getCornerstoneViewportType` (viewport-type resolution), the SEG assembly
  path, and the policies module.
- **Per-viewport predicate** — `isNextViewport(viewport)` (the adapter module's
  wrapper around `csUtils.isGenericViewport`). Used where a self-describing
  viewport is in hand, because a flag-on session can hold BOTH native and
  legacy viewports: `getViewportAdapter`, `viewportOperations`, and the
  segmentation backend twins.

Do not "unify" these: lifecycle genuinely is per-session; everything else
genuinely is per-viewport.

## Sanctioned flag reads (`isNextViewportsEnabled`) — the exhaustive list

1. `utils/getCornerstoneViewportType.ts` — maps requested OHIF viewport types
   to native types.
2. `services/ViewportService/CornerstoneViewportService.ts` — the lazy
   `get backend()` selection.
3. `services/SegmentationService/SegmentationService.ts` —
   `assembleSegmentationDataForSEG` (dispatched at SEG-load time, before any
   target viewport exists).
4. `utils/nextViewportPolicies.ts` — policy rules that apply before viewports
   exist (e.g. the RTSTRUCT hydrate stack-pin).
5. `extensions/tmtv/src/getHangingProtocolModule.ts` — applies the
   `NEXT_FUSION_PT_OPACITY` policy when the HP module is gathered (the flag is
   settled by then; the legacy ramp in `hpViewports` stays untouched).

Adding a sixth read requires updating this list AND the whitelist in
`scripts/check-next-viewport-boundaries.sh` — if you can express the change as
an adapter capability, a backend method, or a policy entry instead, do that.

## Sanctioned `csUtils.isGenericViewport` calls

Only `../adapter/getViewportAdapter.ts` (which also exports the
`isNextViewport` predicate for the dispatchers above). Everyone else consumes
`IViewportAdapter` methods.
