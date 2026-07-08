import type { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';
import type { IViewportPageObject } from '../pages/ViewportPageObject';
import type { RightPanelPageObject } from '../pages/RightPanelPageObject';
import { getAnnotationStats, type AnnotationStats, type TargetStats } from './getAnnotationStats';

type FormatLine = (stats: TargetStats) => string;

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
   * Build expected panel primary detail lines from cachedStats.
   * Order must match the panel's `stats.primary.lines`.
   */
  formatPanelPrimaryLines: FormatLine[];
  /**
   * Build expected SVG tspan lines from cachedStats.
   * Order must match `getSvgAnnotationStatTextLines`.
   */
  formatSvgLines: FormatLine[];
  /**
   * Optional panel secondary detail lines (e.g. series/instance info).
   */
  formatPanelSecondaryLines?: FormatLine[];
  /**
   * Extra assertions on the raw cachedStats / annotation state.
   */
  assertStats?: (stats: TargetStats, annotation: AnnotationStats) => void;
};

/**
 * Vendored copy of `roundNumber` from `platform/core/src/utils/roundNumber.js`
 * (identical to `@cornerstonejs/core`’s implementation).
 *
 * The Playwright E2E harness runs in Node and does not resolve `@ohif/core`
 * workspace imports, so we cannot import this helper directly. Keep this copy
 * in sync with core if the algorithm changes.
 */
function roundNumber(value, precision = 2) {
  if (Array.isArray(value)) {
    return (value as unknown[]).map(v => roundNumber(v, precision)).join(', ');
  }
  if (value === undefined || value === null || value === '') return 'NaN';
  value = Number(value);
  const absValue = Math.abs(value);
  if (absValue < 0.0001) {
    return `${value}`;
  }
  const fixedPrecision =
    absValue >= 100
      ? precision - 2
      : absValue >= 10
        ? precision - 1
        : absValue >= 1
          ? precision
          : absValue >= 0.1
            ? precision + 1
            : absValue >= 0.01
              ? precision + 2
              : absValue >= 0.001
                ? precision + 3
                : precision + 4;
  return value.toFixed(fixedPrecision);
}

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
  formatPanelPrimaryLines,
  formatSvgLines,
  formatPanelSecondaryLines,
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
  await expect(measurementRow.stats.primary.lines).toHaveCount(formatPanelPrimaryLines.length);
  for (let i = 0; i < formatPanelPrimaryLines.length; i++) {
    await expect(measurementRow.stats.primary.lines.nth(i)).toHaveText(
      formatPanelPrimaryLines[i](stats!)
    );
  }

  // 2. Optional side panel secondary lines
  if (formatPanelSecondaryLines) {
    await expect(measurementRow.stats.secondary.lines).toHaveCount(
      formatPanelSecondaryLines.length
    );
    for (let i = 0; i < formatPanelSecondaryLines.length; i++) {
      await expect(measurementRow.stats.secondary.lines.nth(i)).toHaveText(
        formatPanelSecondaryLines[i](stats!)
      );
    }
  }

  // 3. Viewport SVG text lines
  await expect(svgLines).toHaveCount(formatSvgLines.length);
  for (let i = 0; i < formatSvgLines.length; i++) {
    await expect(svgLines.nth(i)).toHaveText(formatSvgLines[i](stats!));
  }

  // 4. Optional extra assertions on raw stats
  if (assertStats) {
    assertStats(stats!, annotation);
  }

  return annotation;
}

/**
 * Reusable formatters for common measurement tools.
 * Each formatter mirrors exactly the text that production code renders so
 * that specs can assert both the panel detail lines and the SVG tspans
 * without hardcoding numbers.
 *
 * Naming convention:
 *   - No suffix  → identical format in both panel and SVG (e.g. lengthLine)
 *   - PanelLine  → panel-only format (no label prefix, e.g. areaPanelLine)
 *   - SvgLine    → SVG-only format  (with label prefix, e.g. areaSvgLine)
 *
 * CobbAngle is a notable exception: its SVG uses `angle.toFixed(2)` instead
 * of `roundNumber`, so `cobbAngleSvgLine` differs from `angleLine`.
 */
export const measurementTextFormatters = {
  lengthLine: (stats: TargetStats) =>
    `${roundNumber(stats.length as number, 2)} ${stats.unit as string}`,

  bidirectionalLengthLine: (stats: TargetStats) =>
    `L: ${roundNumber(stats.length as number, 2)} ${stats.unit as string}`,
  bidirectionalWidthLine: (stats: TargetStats) =>
    `W: ${roundNumber(stats.width as number, 2)} ${stats.unit as string}`,

  angleLine: (stats: TargetStats) => `${roundNumber(stats.angle as number, 2)} \u00B0`,

  /**
   * CobbAngle SVG uses `angle.toFixed(2)` (always 2 d.p.) instead of
   * roundNumber, so the SVG text can differ from the panel for angles
   * outside the 1–9.9° range. Use angleLine for the CobbAngle panel line.
   */
  cobbAngleSvgLine: (stats: TargetStats) => `${(stats.angle as number).toFixed(2)} \u00B0`,

  // ROI area
  /** Panel primary line for area-based tools (no "Area:" prefix). */
  areaPanelLine: (stats: TargetStats) =>
    `${roundNumber(stats.area as number, 2)} ${stats.areaUnit as string}`,
  /** SVG line for area-based tools (includes "Area:" prefix). */
  areaSvgLine: (stats: TargetStats) =>
    `Area: ${roundNumber(stats.area as number, 2)} ${stats.areaUnit as string}`,

  // ROI statistics
  /**
   * "Max: X unit" – rendered by getStatisticDisplayString on the panel and
   * directly by cornerstone-tools in the SVG; format is identical for both.
   */
  maxLine: (stats: TargetStats) =>
    `Max: ${roundNumber(stats.max as number, 2)} ${stats.modalityUnit as string}`,
  meanSvgLine: (stats: TargetStats) =>
    `Mean: ${roundNumber(stats.mean as number, 2)} ${stats.modalityUnit as string}`,
  minSvgLine: (stats: TargetStats) =>
    `Min: ${roundNumber(stats.min as number, 2)} ${stats.modalityUnit as string}`,
  stdDevSvgLine: (stats: TargetStats) =>
    `Std Dev: ${roundNumber(stats.stdDev as number, 2)} ${stats.modalityUnit as string}`,

  /** CircleROI SVG line 0: computed circle radius. */
  circleRadiusSvgLine: (stats: TargetStats) =>
    `Radius: ${roundNumber(stats.radius as number, 2)} ${stats.radiusUnit as string}`,

  /** Panel primary line and SVG value line for Probe. */
  probePanelLine: (stats: TargetStats) =>
    `${roundNumber(stats.value as number, 2)} ${stats.modalityUnit as string}`,
  /** Probe SVG line 0: the voxel index coordinates "(i, j, k)". */
  probeIndexSvgLine: (stats: TargetStats) => `(${(stats.index as number[]).join(', ')})`,
};
