# Implement the viewport fidelity indicator

**Repository:** `OHIF/Viewers`
**Assignee:** @mbellehumeur
**Funded scope:** OHIF / FU Berlin Set-Aside, task **T6** (Aim 2.3, required)
**Depends on:** Cornerstone3D viewport fidelity state (T3) — required
**Design:** @dan-rukas feature request — *not* a blocker; see "Sequencing" below
**Specification:** the `VF-` identifiers cited here are defined in the feature request

---

## Summary

Implement the per-viewport fidelity indicator and its detail view against the Cornerstone3D
per-viewport fidelity state (T3).

The user-facing model is a state machine over lossiness through time. Yellow = lossy now,
expected to improve. Red = lossy now, and this is as good as it gets. Green = was lossy, is not
any more, shown for about a second and then withdrawn. **No indicator at all** for a viewport
that has never been lossy — its presence is itself information. A viewport with no data
displayed is neither lossy nor lossless and shows nothing.

## Work

### State consumption — `VF-STATE`

- Derive presented fidelity from the T3 per-viewport state; do not infer it from display-set
  metadata (`VF-STATE-1`).
- Subscribe to viewport fidelity events; do not poll (`VF-STATE-3`). Update the indicator and
  any open detail view without a study reload (`VF-STATE-2`).
- Render transient interaction differences from live state **without debouncing**
  (`VF-STATE-5`). T14 degrades fidelity every frame during rotate/zoom/pan by design; the quiet
  visual register carries that, not suppression.
- Tolerate unknown dimensions and causes: present the difference generically rather than
  suppressing it or throwing (`VF-STATE-4`). A Cornerstone3D version carrying a new reason must
  not be able to blank the indicator or crash an overlay.
- Derive the *formerly lossy* and *never lossy* states OHIF-side; T3 supplies only current
  transient/standing. Reset lossiness history when the viewport begins displaying a different
  display set, and only then (`VF-VIS-7`).
- Report the state of the image **currently displayed**, not the worst across the display set
  (`VF-VIS-4a`).

### Reason vocabulary — `VF-VOCAB`

Represent each fidelity reason as a member of an extensible, type-safe set of string keys, each
carrying typed arguments that interpolate into a parameterised translation string
(`VF-VOCAB-1`, `-2`), registrable by an extension without a core change (`VF-VOCAB-3`).

Follow the `AppTypes` declaration-merged registry idiom established by
`AppTypes.Customizations` (`VF-VOCAB-4`) — the seeded registry interface in
`platform/core/src/types/AppTypes.ts`, the `<K extends keyof AppTypes.X>` lookup overload with
a loose-string fallback in `CustomizationService.ts`, and the mapped write type with an
index-signature escape hatch in `CustomizationService/types.ts`.
`AppTypes.CustomizationUpdateCommands` is the smaller "key → typed argument object" variant and
the closer structural match; note its load-bearing `Partial`.

**Forward the arguments to the translation call** (`VF-VOCAB-5`). This is not hypothetical:
`DisplaySetMessage` is the existing untyped version of this same pattern and fails twice over —
`DisplaySetMessageListTooltip.tsx:50` renders `t(message.id)` without forwarding
`message.args`, so its one parameterised string can never interpolate, and no call site passes
`args` at all. Its codes are also numeric, closing the set by construction. Do not converge with
it in this issue, but do not make it impossible later either.

Argument type safety must come from the registry (`VF-VOCAB-6`): there is no i18n type safety in
the repo — no `declare module 'i18next'`, no `CustomTypeOptions`.

### Registration and placement — `VF-REG`

- Register through a viewport surface that renders **independently of hover and active state**
  (`VF-REG-1`, satisfying `VF-VIS-2`/`VF-VIS-3`). The `viewportOverlay.*` customization surface
  satisfies this. `viewportActionMenu.*` does **not** — `OHIFViewportActionCorners.tsx` gates on
  `isHovered || isActive`, which would make the indicator invisible in exactly the steady state
  that matters.
- Repositionable by deployment configuration, alongside the other overlay items (`VF-REG-2`).
- Must not require a mode to enumerate it (`VF-REG-3`). Six separate toolbar customisations and
  mode definitions currently repeat the `viewportActionMenu.topRight` list; an indicator that
  has to be added to each will be missing from some.
- Obtain image identity from the viewport, not from overlay item props (`VF-REG-4`) —
  `CustomizableViewportOverlay` does not pass `imageId`.
- Enabled by default wherever Cornerstone viewports render (`VF-VIS-6`); removable by
  configuration (`VF-CFG-1`), with the documentation for that configuration stating the
  consequence of removal (`VF-CFG-2`).

### Detail view — `VF-DET`

Read-only with respect to fidelity (`VF-DET-9`). Three sections: quantified magnitude per
dimension (`VF-DET-2`), cause (`VF-DET-3`), and the interactive performance operating point
(`VF-DET-4`) — marked as a previous measurement where it is one (`VF-DET-7`). Distinguishes
transiently from terminally lossy (`VF-DET-5`), states whether waiting will help (`VF-DET-6`),
and stays open and live while the state changes (`VF-DET-8`).

The existing loading and progress affordances are unchanged and keep answering "how far along
is this load". The detail view is the single place they are reconciled with "can I trust this
yet".

### Presentation constraints from §4

- Never persistently occupy image area to report a state that is no longer lossy
  (`VF-VIS-1e`). Anything resident over the image can hide a finding; on a mammogram the
  corners carry diagnostic content.
- The recovered state is announced for about a second and then withdrawn (`VF-VIS-1c`), and
  must remain re-revealable on demand at the indicator's location (`VF-VIS-1d`) — so the hover
  target has to exist while nothing is drawn there.
- All user-facing text through the translation layer (`VF-LANG-4`), in user-oriented terms with
  no renderer, GPU or retrieval-stage vocabulary (`VF-LANG-1`, `VF-INFO-10`), with help text
  per dimension and cause (`VF-LANG-2`).

### Documentation — `VF-DOC`

Part of the definition of done, not a follow-up. Covers the `VF-VOCAB` registry as a public API
(mirroring `platform/docs/docs/platform/services/customization-service/typing.md`), the
configuration surface including the removal warning, the user-visible lossiness states and
transitions, and the known limitations listed under `VF-DOC-6`. **It also includes updating the
specification itself** (`VF-DOC-1`) — §5 is expected to diverge from what gets built, and a §5
that no longer describes the code is worse than none, because it is read as though it does.

## Sequencing

Depends on T3 landing for real state, but **not** on @dan-rukas's design. `VF-STATE`,
`VF-VOCAB` and `VF-REG` are all buildable and testable against fixture fidelity states with
placeholder visuals — which is what makes the "design edits as pieces land" model workable
rather than a bottleneck. Wire the behaviour first; take the visual treatment as it arrives.

## Out of scope

- Any control that changes fidelity from the indicator. Quality and GPU settings are T5, a
  separate stretch item, which may later be reachable by click-through from the detail view.
- DICOM source lossy compression. Stored pixel data is the reference against which fidelity is
  judged, whatever its provenance — a lossy-compressed source rendered faithfully is full
  fidelity here. `LossyImageCompression` (0028,2110) and the unused `getCompression()` helper
  are not inputs.
- Migrating `DisplaySetMessage` onto the new registry (13 producing call sites of regression
  surface).
- Fidelity of overlay layers such as segmentation labelmaps — acknowledged gap, unfunded, and
  not achievable with the state T3 delivers.
- Series-panel, study-list and exported-artifact disclosure.

## Verification

| Area | Verification |
|---|---|
| `VF-INFO` | Detail-view content assertions against fixture states, one per dimension and cause |
| `VF-VIS` | E2E: indicator present in a non-active, non-hovered viewport with a degraded fixture; absent for a viewport that never went lossy; absent with no data; default-on across modes |
| `VF-DET` | E2E: activate indicator, assert all three sections; assert live update while open |
| `VF-STATE` | Unit: event drives re-render; unknown dimension or cause renders generically; history resets on display-set change and not on scroll/zoom/pan |
| `VF-VOCAB` | Type-level test: a newly registered reason key with wrong argument types fails to compile; runtime test that arguments reach `t()` |
| `VF-REG` | Unit: reposition by configuration; indicator received without mode enumeration |
| `VF-CFG` | Unit: removal by configuration; documentation review for the consequence statement |
| `VF-LANG` | Review: no renderer terms in user-visible strings; all strings translated |
