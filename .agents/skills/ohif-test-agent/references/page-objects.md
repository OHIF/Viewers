# OHIF Page Object guide

> This file documents the **stable structural rules** of the page object system. For the current list of methods and properties on any class, **read the source under `tests/pages/`** — it is always authoritative, and it evolves as the product does. A static method table in a reference file goes stale the moment someone refactors; the source does not.

## How to discover the API of a page object

1. Find the relevant class in `tests/pages/`. File names match class names.
2. Read it end-to-end once — most are under a few hundred lines.
3. Some classes compose sub-objects (e.g. `RightPanelPageObject` holds a measurementsPanel, contourSegmentationPanel, labelMapSegmentationPanel, tmtvPanel, etc.). Those sub-objects usually live in the same file or a sibling under `tests/pages/`.
4. To see how a method is actually used, grep `tests/` or open the seed spec listed in [patterns-by-feature.md](patterns-by-feature.md). Real usage beats a synthesized signature every time.

Do not try to memorize a method surface from this file — it intentionally does not list one. It lists only the rules you cannot derive from the source by reading a single file.

---

## Stable rules

### Fixture keys (case-sensitive)

These are injected via `tests/utils/fixture.ts`. Destructure them from the test function's first argument — do not `new` them, because the fixture wires sub-objects to the correct `page` and hand-constructed instances skip that wiring.

- `viewportPageObject`
- `mainToolbarPageObject`
- `leftPanelPageObject`
- `rightPanelPageObject`
- `DOMOverlayPageObject` — **capital D**. A silent `undefined` destructure is almost always a casing typo here.
- `notFoundStudyPageObject`

If the fixture file is updated and new keys are added, they will show up there first — check it if something feels missing.

### Non-fixture page objects

Some page object classes are not fixture-injected. They are reached through an injected fixture:

- `DicomTagBrowserPageObject` → via `DOMOverlayPageObject.dialog.dicomTagBrowser`
- `DataOverlayPageObject` → via `viewportPageObject.getById(viewportId).overlayMenu.dataOverlay`

Both can be constructed manually (`new DataOverlayPageObject(page)`) if a test really needs a fresh instance, but the accessor path is the idiomatic one.

### Viewport wrapper vs. viewport instance

`viewportPageObject` is a **wrapper**. You almost always want a specific viewport out of it first:

- `await viewportPageObject.active` — the currently focused viewport
- `viewportPageObject.getAll()` — every viewport in the grid
- `viewportPageObject.getNth(i)` — zero-indexed
- `viewportPageObject.getById(cornerstoneViewportId)` — e.g. `'default'`, `'ctAXIAL'`

The object these return is the one with `normalizedClickAt`, `normalizedDragAt`, `overlayText`, `nthAnnotation`, etc. Reach for the viewport instance first, then call methods on it.

### Panel access order

Every `rightPanelPageObject` sub-panel follows the same three-step idiom: **open the side panel, `.select()` the sub-panel tab, then interact with `.panel.*`**. Skipping either of the first two is the most common cause of "element not found".

```ts
await rightPanelPageObject.toggle();
await rightPanelPageObject.measurementsPanel.select();
const count = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
```

The exact row/action methods vary by panel — check the source file for the one you need.

### Layout identifiers are camelCase JS properties

`mainToolbarPageObject.layoutSelection.<layout>.click()` — access layouts by camelCase property name (e.g. `threeDFourUp`, `axialPrimary`), not with bracket-escaped DICOM-ish strings like `['3DFourUp']`. This is a convention enforced by how the class exposes its tools.

### Sub-tools auto-open their dropdown

Tools nested inside a toolbar dropdown (measurement tools, more tools, layouts) each expose a `.click()` that opens the parent menu for you. You almost never need to open the menu first. `await mainToolbarPageObject.measurementTools.length.click()` does both the expand and the select.

### When the control you need isn't covered yet — create or augment

The page objects here cover what the suite currently exercises. When your test needs a
control that isn't exposed, **extend the page object system rather than dropping a raw
`page.getByTestId(...)` into the spec.** A raw selector in a spec is the clearest tell
that the author didn't read the existing tests — it duplicates a locator that should
live in one place and bypasses the fixture wiring.

| What you need | Where it goes | Precedent to copy |
|---|---|---|
| A toolbar button/tool (Zoom, Pan) | a getter on `MainToolbarPageObject` | `crosshairs`, `measurementTools` |
| A menu / prompt / context menu / small dialog | `DOMOverlayPageObject` | `viewport.measurementTracking`, `dialog.input` |
| A large dialog with its own fields (User Preferences) | a **new** page object class reached via `DOMOverlayPageObject` | `DicomTagBrowserPageObject` (`DOMOverlayPageObject.dialog.dicomTagBrowser`) |
| Individual fields/rows in that dialog | methods/sub-objects on the dialog's page object | `DicomTagBrowserPageObject.seriesSelect` |
| Side-panel controls | `LeftPanelPageObject` / `RightPanelPageObject` | existing sub-panels |

Two more expectations:

- **Missing `data-cy`?** Add it to the source component and target it; don't fall back
  to `getByRole`/text. `testIdAttribute` is `data-cy`, so `getByTestId('Zoom')` resolves
  `[data-cy="Zoom"]`. Mention any attribute you added so it ships in the same PR.
- **Mirror the existing shape.** A new getter should look like its neighbors (return a
  locator, or a small object with `.click()` etc.) so the new surface is
  indistinguishable from what was already there.

Example — a "set the Zoom hotkey" test should make `mainToolbarPageObject.zoom`, an
options-menu accessor on `DOMOverlayPageObject`, and a `userPreferences` dialog page
object (with a per-hotkey field accessor) exist — then the spec reads as steps, not
selectors.

---

## Page object map — what each class is *for*

This table exists to help you pick the right file to open, not to enumerate methods. Source of truth for any specific method remains the `.ts` file.

| Class | File | Covers |
|-------|------|--------|
| ViewportPageObject | `tests/pages/ViewportPageObject.ts` | Cornerstone viewports — clicks, drags, overlays, annotations, crosshairs |
| MainToolbarPageObject | `tests/pages/MainToolbarPageObject.ts` | Top toolbar — measurement tools, more tools, layouts, crosshairs, pan |
| LeftPanelPageObject | `tests/pages/LeftPanelPageObject.ts` | Study browser — thumbnails, load by modality or description |
| RightPanelPageObject | `tests/pages/RightPanelPageObject.ts` | Side panels — measurements, contour seg, labelmap seg, TMTV, microscopy |
| DOMOverlayPageObject | `tests/pages/DOMOverlayPageObject.ts` | DOM overlays — dialogs, hydration/tracking prompts, context menus, tag-browser accessor |
| NotFoundStudyPageObject | `tests/pages/NotFoundStudyPageObject.ts` | Study-not-found error page |
| DicomTagBrowserPageObject | `tests/pages/DicomTagBrowserPageObject.ts` | Tag-browser dialog (non-fixture; reach via `DOMOverlayPageObject.dialog`) |
| DataOverlayPageObject | `tests/pages/DataOverlayPageObject.ts` | Data-overlay menu (non-fixture; reach via `viewport.overlayMenu`) |

If the directory adds or renames a file, that diff is your first clue and this table is your second — trust the directory.

For live usage, the seed spec in [patterns-by-feature.md](patterns-by-feature.md) shows how a class is actually called; the source file tells you everything else that's on it.
