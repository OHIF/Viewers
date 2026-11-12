import type { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';
import type { IViewportPageObject } from '../pages/ViewportPageObject';
import type { RightPanelPageObject } from '../pages/RightPanelPageObject';
import { getAnnotationStats, type AnnotationStats, type TargetStats } from './getAnnotationStats';

type ExpectAnnotationStatsTextOptions = {
  page: Page;
  activeViewport: IViewportPageObject;
  rightPanelPageObject: RightPanelPageObject;
  toolName: string;
  /**
   * Panel row index. Defaults to 0. When `annotationUID` is set, this still
   * selects which panel row to assert (they may differ if multiple annotations exist).
   */
  measurementIndex?: number;
  /**
   * When set, resolves the annotation by UID instead of `measurementIndex`
   * in the cornerstone annotation list.
   */
  annotationUID?: string;
  /**
   * Expected panel primary detail lines.
   * Order must match the panel's `stats.primary.lines`.
   */
  expectedPanelPrimaryLines: string[];
  /**
   * Expected SVG tspan lines.
   * Order must match `getSvgAnnotationStatTextLines`.
   */
  expectedSvgLines: string[];
  /**
   * Expected optional panel secondary detail lines (e.g. series/instance info).
   */
  expectedPanelSecondaryLines?: string[];
  /**
   * Extra assertions on the raw cachedStats / annotation state.
   */
  assertStats?: (stats: TargetStats, annotation: AnnotationStats) => void;
};

function resolveAnnotation(
  annotations: AnnotationStats[],
  {
    toolName,
    measurementIndex,
    annotationUID,
  }: {
    toolName: string;
    measurementIndex: number;
    annotationUID?: string;
  }
): AnnotationStats {
  if (annotationUID !== undefined) {
    const annotation = annotations.find(a => a.annotationUID === annotationUID);
    expect(annotation, `Expected annotation ${annotationUID} for tool ${toolName}`).toBeDefined();
    return annotation!;
  }

  expect(annotations.length).toBeGreaterThan(measurementIndex);
  return annotations[measurementIndex];
}

/**
 * Asserts user-defined annotation label text across every surface that should reflect it:
 *  - the tracked measurements side panel row title,
 *  - the DOM SVG linked text box rendered in the viewport, and
 *  - the source-of-truth cornerstone annotation state (`data.label`).
 *
 * Caller must open the measurements panel before calling this helper:
 *   await rightPanelPageObject.measurementsPanel.select();
 */
export async function expectAnnotationLabelText({
  page,
  activeViewport,
  rightPanelPageObject,
  toolName,
  annotationUID,
  expectedText,
  measurementIndex = 0,
}: {
  page: Page;
  activeViewport: IViewportPageObject;
  rightPanelPageObject: RightPanelPageObject;
  toolName: string;
  annotationUID: string;
  expectedText: string;
  measurementIndex?: number;
}) {
  await expect(
    rightPanelPageObject.measurementsPanel.panel.nthMeasurement(measurementIndex).title
  ).toHaveText(expectedText);

  const svgTextLines = activeViewport.getSvgAnnotationStatTextLines(annotationUID);
  await expect(svgTextLines).toHaveCount(1);
  await expect(svgTextLines.nth(0)).toHaveText(expectedText);

  // Source-of-truth annotation state. (e.g. ArrowAnnotate stores its text on
  // `data.label` rather than computed `cachedStats`, so read with requireStats: false.)
  const annotations = await getAnnotationStats(page, {
    toolName,
    requireStats: false,
  });
  const annotation = annotations.find(a => a.annotationUID === annotationUID);
  expect(annotation, `Expected annotation ${annotationUID} for tool ${toolName}`).toBeDefined();
  expect(annotation!.label).toBe(expectedText);
}

/**
 * Asserts computed measurement stat text across the panel detail lines and the
 * viewport SVG text rendered from cachedStats.
 *
 * Caller must open the measurements panel before calling this helper:
 *   await rightPanelPageObject.measurementsPanel.select();
 */
export async function expectAnnotationStatsText({
  page,
  activeViewport,
  rightPanelPageObject,
  toolName,
  measurementIndex = 0,
  annotationUID,
  expectedPanelPrimaryLines,
  expectedSvgLines,
  expectedPanelSecondaryLines,
  assertStats,
}: ExpectAnnotationStatsTextOptions): Promise<AnnotationStats> {
  const annotations = await getAnnotationStats(page, { toolName });
  const annotation = resolveAnnotation(annotations, {
    toolName,
    measurementIndex,
    annotationUID,
  });

  const stats = annotation.firstTargetStats;
  expect(stats, `Expected cachedStats on annotation ${annotation.annotationUID}`).toBeDefined();

  const measurementRow =
    rightPanelPageObject.measurementsPanel.panel.nthMeasurement(measurementIndex);
  const svgLines = activeViewport.getSvgAnnotationStatTextLines(annotation.annotationUID);

  // 1. Side panel primary lines
  await expect(measurementRow.stats.primary.lines).toHaveCount(expectedPanelPrimaryLines.length);
  for (let i = 0; i < expectedPanelPrimaryLines.length; i++) {
    await expect(measurementRow.stats.primary.lines.nth(i)).toHaveText(
      expectedPanelPrimaryLines[i]
    );
  }

  // 2. Optional side panel secondary lines
  if (expectedPanelSecondaryLines) {
    await expect(measurementRow.stats.secondary.lines).toHaveCount(
      expectedPanelSecondaryLines.length
    );
    for (let i = 0; i < expectedPanelSecondaryLines.length; i++) {
      await expect(measurementRow.stats.secondary.lines.nth(i)).toHaveText(
        expectedPanelSecondaryLines[i]
      );
    }
  }

  // 3. Viewport SVG text lines
  await expect(svgLines).toHaveCount(expectedSvgLines.length);
  for (let i = 0; i < expectedSvgLines.length; i++) {
    await expect(svgLines.nth(i)).toHaveText(expectedSvgLines[i]);
  }

  // 4. Optional extra assertions on raw stats
  if (assertStats) {
    assertStats(stats!, annotation);
  }

  return annotation;
}

/**
 * Reusable formatters for common measurement tools.
 * Each formatter adds labels and units around a display-ready value string (as shown in the UI).
 * Pass exact UI tokens — e.g. `'-68.0'`, not `-68.0` — so trailing zeros and decimal places are preserved.
 * These formatters do not round and do not read `cachedStats`.
 *
 * Naming convention:
 *   - No suffix  → identical format in both panel and SVG (e.g. `lengthLine`)
 *   - PanelLine  → panel-only format (no label prefix, e.g. `areaPanelLine`)
 *   - SvgLine    → SVG-only format  (with label prefix, e.g. `areaSvgLine`)
 */
export const measurementTextFormatters = {
  lengthLine: (value: string, unit = 'mm') => `${value} ${unit}`,

  bidirectionalLengthLine: (value: string, unit = 'mm') => `L: ${value} ${unit}`,
  bidirectionalWidthLine: (value: string, unit = 'mm') => `W: ${value} ${unit}`,

  angleLine: (value: string) => `${value} \u00B0`,

  /** Panel primary line for area-based tools (no "Area:" prefix). */
  areaPanelLine: (value: string, unit = 'mm\u00B2') => `${value} ${unit}`,
  /** SVG line for area-based tools (includes "Area:" prefix). */
  areaSvgLine: (value: string, unit = 'mm\u00B2') => `Area: ${value} ${unit}`,

  /**
   * "Max: X unit" – rendered by getStatisticDisplayString on the panel and
   * directly by cornerstone-tools in the SVG; format is identical for both.
   */
  maxLine: (value: string, unit = 'HU') => `Max: ${value} ${unit}`,
  meanSvgLine: (value: string, unit = 'HU') => `Mean: ${value} ${unit}`,
  minSvgLine: (value: string, unit = 'HU') => `Min: ${value} ${unit}`,
  stdDevSvgLine: (value: string, unit = 'HU') => `Std Dev: ${value} ${unit}`,

  /** CircleROI SVG line 0: computed circle radius. */
  circleRadiusSvgLine: (value: string, unit = 'mm') => `Radius: ${value} ${unit}`,

  /** Panel primary line and SVG value line for Probe. */
  probeValueLine: (value: string, unit = 'HU') => `${value} ${unit}`,
  /** Probe SVG line 0: the voxel index coordinates "(i, j, k)". */
  probeIndexSvgLine: (index: number[]) => `(${index.join(', ')})`,
};
