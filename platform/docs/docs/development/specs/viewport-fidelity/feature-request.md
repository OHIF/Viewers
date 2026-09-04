# [Feature Request] Viewport fidelity indicator

**Assignee:** @dan-rukas (design)
**Labels:** `Community: Request :hand:`
**Funded scope:** OHIF / FU Berlin Set-Aside, task **T6** (Aim 2.3, required)
**Specification:** `platform/docs/docs/development/specs/viewport-fidelity/requirements.md`
**Related:** OHIF implementation issue and Cornerstone3D fidelity-state issue (T3), both
@mbellehumeur

---

## What feature or change would you like to see made?

When OHIF cannot render stored pixel data as requested, it renders something else instead — a
decimated volume, a partially decoded image, a reduced output resolution, a coarser sampling
density. None of that is visible to the user today. The image simply looks the way it looks.

Add **one consistent per-viewport fidelity indicator** that appears when the displayed image is
lossy, plus a detail view saying what was lost, why, and whether it will improve.

The model is a state machine over lossiness *through time*, not a severity scale:

| State | Indicator | Meaning to the user |
|---|---|---|
| Never lossy | *nothing shown* | Nothing has been lost here. |
| No data yet | *nothing shown* | Not a fidelity question. |
| Transiently lossy | Yellow | Lossy now, expected to improve. |
| Terminally lossy | Red | Lossy now, and this is as good as it gets. |
| Formerly lossy | Green, ~1s | Was lossy; is not any more. |

The indicator never appears for a viewport that has never been lossy — its presence is itself
information. A progressive load shows yellow while arriving, then green for about a second on
reaching full resolution, or **red** if it completes without ever getting there.

Clicking the indicator opens a read-only detail view with three sections: how much was lost
(`Decimated volume x/2, y/2, z/4`), why (`This GPU only supports textures up to <n>` versus
`The requested performance target is too slow at this size`), and the interactive performance
operating point (`Output resolution 50% to maintain 30 fps`).

**Design scope (@dan-rukas):** icon, colours and their accessibility treatment, detail-view
container and layout, behaviour at small viewport sizes, and the discoverability problem below.
Plus review of and edits to the user-facing wording as each contributing piece lands, rather
than authoring it up front. Full requirements, with identifiers, are in the specification linked
above — §4 is the user requirements and is the acceptance surface; §5.4 is a starting suggestion
to argue with.

Two problems worth attention before pixels:

1. **Red and yellow differ only in whether waiting helps**, and the image gives the user no
   independent clue which they are looking at. Colour alone carries that entire distinction,
   which argues for separating them by glyph or shape as well.
2. **The recovered state is deliberately hard to see.** Green shows for ~1s and then withdraws
   completely, leaving no mark over the image, because anything resident over the image can
   hide a finding — on a mammogram the corners carry diagnostic content. So the hover target
   that re-reveals it must exist while nothing is drawn there, and a user not looking at that
   viewport during the announcement will not learn it recovered.

## Why should we prioritize this feature?

It is a required, funded deliverable (T6) and a prerequisite for the adaptive rendering work
being safe to enable by default. The point of Aim 2.3 is to substitute lower-fidelity renderings
automatically when a device limit or a performance target demands it — and substituting pixels
silently, with no disclosure, is not something to ship. A user who cannot distinguish "this
lesion is small" from "this rendering discarded three quarters of the z-axis" is being asked to
trust a picture whose provenance is hidden from them.

It interacts with existing features rather than sitting beside them: the existing loading and
progress affordances keep answering "how far along is this load", while the indicator answers
"can I trust what I am seeing yet". The detail view is the single place the two are reconciled.
