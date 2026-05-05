# Seed specs by feature area

> When writing a new OHIF test, find the closest feature area below and read the listed spec in full before writing. Playwright's own guidance says the seed test "serves as an example of all the generated tests" — that applies here.
>
> **If a spec listed below has moved or been renamed**, grep `tests/` for a remaining example (e.g. `grep -rn "loadSeriesByModality('RTSTRUCT')" tests/`). The pattern matters more than the exact filename — specs get renamed, the feature area persists.

## Canonical study UIDs

| UID | Mode(s) | What it has |
|-----|---------|-------------|
| `1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5` | `viewer` | CT — default for measurement/annotation tests |
| `1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785` | `viewer` | CT volume for 3D/MPR/crosshairs |
| `1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458` | `viewer` or `segmentation` | CT + SEG for labelmap tests |
| `1.2.840.113619.2.290.3.3767434740.226.1600859119.501` | `viewer` / `segmentation` / `tmtv` | CT + RTSTRUCT + PET, used for contour and TMTV |
| `1.3.6.1.4.1.14519.5.2.1.7695.4007.324475281161490036195179843543` | `viewer` | SR structured report |

Do not invent UIDs — they must exist on the e2e data server.

---

## 1. Simple measurement tools (length, angle, bidirectional, rectangle, ellipse, circle)

**Seed:** [tests/Length.spec.ts](tests/Length.spec.ts), [tests/Angle.spec.ts](tests/Angle.spec.ts)

Pattern: select tool via `mainToolbarPageObject.measurementTools.<tool>.click()`, place N points via `activeViewport.normalizedClickAt([...])`, confirm the tracking prompt, screenshot via `screenShotPaths.<name>.<name>DisplayedCorrectly`.

## 2. Freehand / spline / livewire ROIs

**Seed:** [tests/FreehandROI.spec.ts](tests/FreehandROI.spec.ts), [tests/Livewire.spec.ts](tests/Livewire.spec.ts), [tests/Spline.spec.ts](tests/Spline.spec.ts)

Pattern: `normalizedDragAt({ start, end, config: { steps: 20, delay: 30 } })` for smooth strokes; `subscribeToMeasurementAdded` to assert the event fires; `activeViewport.nthAnnotation(0)` to reference what was drawn.

## 3. Annotations (arrow, probe)

**Seed:** [tests/ArrowAnnotate.spec.ts](tests/ArrowAnnotate.spec.ts), [tests/Probe.spec.ts](tests/Probe.spec.ts)

Arrow annotate opens `DOMOverlayPageObject.dialog.input` for the label. Use `fillAndSave(label)`.

## 4. Measurement panel interactions

**Seed:** [tests/MeasurementPanel.spec.ts](tests/MeasurementPanel.spec.ts)

Panel access: `rightPanelPageObject.toggle()` → `.measurementsPanel.select()` → `.panel.nthMeasurement(i)` → `.actions.rename|delete|toggleLock|duplicate|...`. Also demonstrates `addLengthMeasurement(page)` and panel-row `click()` for jump-to.

## 5. Context menu (right-click on annotation)

**Seed:** [tests/ContextMenu.spec.ts](tests/ContextMenu.spec.ts)

Two ways to open: `activeViewport.normalizedClickAt([{...}], 'right')` on an empty area, or `activeViewport.nthAnnotation(0).contextMenu.open()` on a drawn annotation. Then `DOMOverlayPageObject.viewport.annotationContextMenu.addLabel|delete.click()`.

## 6. Labelmap segmentation (SEG) hydration

**Seed:** [tests/SEGHydration.spec.ts](tests/SEGHydration.spec.ts), [tests/SEGHydrationThenMPR.spec.ts](tests/SEGHydrationThenMPR.spec.ts)

Flow: `leftPanelPageObject.loadSeriesByModality('SEG')` → `waitForTimeout(3000)` → `DOMOverlayPageObject.viewport.segmentationHydration.yes.click()`. Often pokes Cornerstone state directly via `page.evaluate(() => window.cornerstone...)` for zoom/render.

## 7. Contour segmentation (RTSTRUCT) + interactions

**Seeds:**
- Hydration: [tests/RTHydration.spec.ts](tests/RTHydration.spec.ts)
- Rename: [tests/ContourSegmentRename.spec.ts](tests/ContourSegmentRename.spec.ts)
- Navigation between segments: [tests/ContourSegNavigation.spec.ts](tests/ContourSegNavigation.spec.ts)
- Duplicate: [tests/ContourSegmentDuplicate.spec.ts](tests/ContourSegmentDuplicate.spec.ts)
- Visibility: [tests/ContourSegmentToggleVisibility.spec.ts](tests/ContourSegmentToggleVisibility.spec.ts)
- Locking: [tests/ContourSegLocking.spec.ts](tests/ContourSegLocking.spec.ts)

Pattern: load RTSTRUCT series → hydrate → use `rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(i)` / `.segmentByText('Small Sphere')` and their `.actions.rename|delete`, or the segment's `.click()` to jump.

## 8. Labelmap segmentation editing (brush / eraser / threshold)

**Seed:** [tests/LabelMapSegLocking.spec.ts](tests/LabelMapSegLocking.spec.ts), [tests/SEGDrawingToolsResizing.spec.ts](tests/SEGDrawingToolsResizing.spec.ts)

Pattern: `rightPanelPageObject.labelMapSegmentationPanel.tools.brush.setRadius(n)` / `.click()`, then `activeViewport.normalizedDragAt(...)` to paint.

## 9. TMTV / PET

**Seeds:** [tests/TMTVCSVReport.spec.ts](tests/TMTVCSVReport.spec.ts), [tests/TMTVSUV.spec.ts](tests/TMTVSUV.spec.ts), [tests/TMTVAlignment.spec.ts](tests/TMTVAlignment.spec.ts), [tests/TMTVRendering.spec.ts](tests/TMTVRendering.spec.ts)

Visit `mode: 'tmtv'` with a longer delay (`10000`). `rightPanelPageObject.tmtvPanel` for the side panel. Exporting a report uses `page.waitForEvent('download')` + `downloadAsString(download)`.

## 10. MPR and 3D layouts

**Seeds:** [tests/MPR.spec.ts](tests/MPR.spec.ts), [tests/3DOnly.spec.ts](tests/3DOnly.spec.ts), [tests/3DFourUp.spec.ts](tests/3DFourUp.spec.ts), [tests/3DMain.spec.ts](tests/3DMain.spec.ts), [tests/AxialPrimary.spec.ts](tests/AxialPrimary.spec.ts)

Pattern: `mainToolbarPageObject.layoutSelection.<layoutName>.click()`. For 3D, wrap stabilization with `attemptAction(() => reduce3DViewportSize(page), 10, 100)` and screenshot with `maxDiffPixelRatio: 0.04`.

## 11. Crosshairs

**Seed:** [tests/Crosshairs.spec.ts](tests/Crosshairs.spec.ts)

Pattern: `initializeMousePositionTracker(page)` in `beforeEach`, `mainToolbarPageObject.crosshairs.click()`, then `viewportPageObject.crosshairs.axial.rotate()` / `.increase()`.

## 12. Overlays — data overlay menu, window/level, orientation

**Seeds:** [tests/DataOverlayMenu.spec.ts](tests/DataOverlayMenu.spec.ts), [tests/WindowLevelOverlayText.spec.ts](tests/WindowLevelOverlayText.spec.ts), [tests/MultipleSegmentationDataOverlays.spec.ts](tests/MultipleSegmentationDataOverlays.spec.ts)

Pattern: `viewportPageObject.getById('default').overlayMenu.dataOverlay.toggle()`, then `.addSegmentation(name)` / `.changeSegmentation(from, to)` / `.remove(name)`. For keyboard navigation, remember `press({ page, key, nTimes })` imports from `./utils/keyboardUtils`.

## 13. DICOM Tag Browser

**Seed:** [tests/DicomTagBrowser.spec.ts](tests/DicomTagBrowser.spec.ts)

Open with `mainToolbarPageObject.moreTools.tagBrowser.click()`, then interact via `DOMOverlayPageObject.dialog.dicomTagBrowser.waitVisible()` / `.seriesSelect.selectOption(i)` / `.seriesSelect.getOptionText(i)`.

## 14. Study validation / not-found / worklist

**Seeds:** [tests/StudyValidation.spec.ts](tests/StudyValidation.spec.ts), [tests/Worklist.spec.ts](tests/Worklist.spec.ts)

These are the rare specs that use `page.goto(...)` directly instead of `visitStudy()` — because they test error states or non-study pages. `notFoundStudyPageObject` gives you `errorMessage`, `returnMessage`, `studyListLink`.

## 15. SR (Structured Report) hydration

**Seeds:** [tests/SRHydration.spec.ts](tests/SRHydration.spec.ts), [tests/SRHydrationThenReload.spec.ts](tests/SRHydrationThenReload.spec.ts)

Same shape as SEG hydration but load via `loadSeriesByModality('SR')`.

---

## Advanced patterns worth knowing

- **`subscribeToMeasurementAdded`** ([tests/FreehandROI.spec.ts](tests/FreehandROI.spec.ts)) — for async "was a measurement actually added?" assertions. Always `try { ... } finally { await measurementAdded.unsubscribe() }`.
- **`attemptAction`** ([tests/3DOnly.spec.ts](tests/3DOnly.spec.ts)) — retry flaky setup (3D render, heavy layout change) without silencing real failures.
- **`addOHIFConfiguration`** ([tests/RTHydrationDisableConfirmation.spec.ts](tests/RTHydrationDisableConfirmation.spec.ts)) — pre-load config overrides before `visitStudy`.
- **`page.evaluate(() => window.services...)`** — used in several SEG/SR specs to set customizations or poke viewport state. Treat as an escape hatch, not a default.
- **`expect.toPass({ timeout })`** — wrap flaky assertions (common for jump-to-measurement tests where rendering settles asynchronously).
