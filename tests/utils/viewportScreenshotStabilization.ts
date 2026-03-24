import { expect, type Locator, type Page } from '@playwright/test';

/** Used with live overlay text (`true`) and to derive `minWidth` when not overridden. */
export const DEFAULT_OVERLAY_CHAR_WIDTH_PX = 7;
/** Minimum row height (px) for purple overlay placeholders. */
export const DEFAULT_OVERLAY_MIN_HEIGHT_PX = 22;

const DEFAULT_ANNOTATION_TEXT_BOX_WIDTH = 220;
/** Fixed height (px) for the purple screenshot placeholder `rect` (width still from bbox, capped by `size`). */
const ANNOTATION_SCREENSHOT_RECT_HEIGHT_PX = 4;

const OVERLAY_MARK = 'data-ohif-screenshot-overlay-stabilized';
const ANNOTATION_MARK = 'data-ohif-screenshot-textbox-stabilized';
const CREATED_RECT_MARK = 'data-ohif-screenshot-created-background-rect';

export type ViewportOverlayStabilizeField =
  | true
  | string
  | {
      text?: string;
      minWidth?: number;
      minHeight?: number;
    };

export type ViewportAnnotationStabilizeSpec = {
  type: 'arrowAnnotate' | (string & {});
  text?: true | string | Record<string, unknown>;
  /** Max width (px) for the purple `rect`; height follows measured `text.getBBox()`. */
  size?: number;
  [key: string]: unknown;
};

/**
 * Expected visible text for one viewport’s four titled overlay rows: study date → series
 * description → window/level line → instance/image line (same logical order as the overlay).
 * Viewports are `[data-cy="viewport-pane"]` nodes under `[data-cy="viewport-grid"]` in **DOM
 * order** (usually row‑major). Match the full `innerText` of each `.overlay-item` (e.g. instance
 * rows often include an `I:` prefix when an instance number is present).
 */
export type ViewportOverlayExpectedTextRow = [string, string, string, string];

export type ViewportScreenshotStabilization = {
  /** Top-left demographics: study date (`[title="Study date"]`). */
  seriesDate?: ViewportOverlayStabilizeField;
  /** Top-left: series description (`[title="Series description"]`). */
  seriesDescription?: ViewportOverlayStabilizeField;
  /** Bottom-left: window / level (`[title="Window Level"]`). */
  windowLevel?: ViewportOverlayStabilizeField;
  /** Bottom-right: instance / image index (`[title="Instance Number"]`). */
  imageInfo?: ViewportOverlayStabilizeField;
  /**
   * SVG annotation text boxes under `g[data-annotation-uid]` (document order).
   * `type` is reserved for future filtering; entries map by index to text groups.
   */
  annotations?: ViewportAnnotationStabilizeSpec[];
  /**
   * Assert on-screen overlay text matches each tuple **before** stabilization. One row per
   * viewport pane (same order as panes in the grid). Implies text verification unless
   * {@link verifyOverlayText} is `false`.
   */
  verifyViewports?: ViewportOverlayExpectedTextRow[];
  /**
   * When `false`, skip overlay text assertions entirely. Default: run assertions when
   * {@link verifyViewports} is non-empty or any overlay field is a string / `{ text: string }`.
   */
  verifyOverlayText?: boolean;
};

type SerializedOverlayField =
  | { mode: 'live'; minHeight: number; charWidthPx: number }
  | { mode: 'fixed'; text: string; minWidth: number; minHeight: number };

type SerializedAnnotationField =
  | { mode: 'live'; maxWidth: number }
  | { mode: 'fixed'; maxWidth: number; text: string };

type SerializedStabilization = {
  overlays: Partial<{
    seriesDate: SerializedOverlayField;
    seriesDescription: SerializedOverlayField;
    windowLevel: SerializedOverlayField;
    imageInfo: SerializedOverlayField;
  }>;
  /** `maxWidth` caps rect width; rect height is fixed (4px in browser). */
  annotations: SerializedAnnotationField[];
};

function overlayMinWidthPx(text: string, charWidthPx: number): number {
  return Math.max(1, Math.ceil(charWidthPx * text.length));
}

function resolveOverlayField(
  value: ViewportOverlayStabilizeField | undefined,
  charWidthPx: number,
  minHeightPx: number
): SerializedOverlayField | null {
  if (value === undefined) {
    return null;
  }
  if (value === true) {
    return { mode: 'live', minHeight: minHeightPx, charWidthPx };
  }
  if (typeof value === 'string') {
    return {
      mode: 'fixed',
      text: value,
      minWidth: overlayMinWidthPx(value, charWidthPx),
      minHeight: minHeightPx,
    };
  }
  const text = value.text;
  if (text === undefined) {
    return null;
  }
  return {
    mode: 'fixed',
    text,
    minWidth: value.minWidth ?? overlayMinWidthPx(text, charWidthPx),
    minHeight: value.minHeight ?? minHeightPx,
  };
}

function resolveAnnotationField(spec: ViewportAnnotationStabilizeSpec): SerializedAnnotationField {
  const maxWidth = spec.size ?? DEFAULT_ANNOTATION_TEXT_BOX_WIDTH;
  const raw = spec.text;
  if (raw === true || raw === undefined) {
    return { mode: 'live', maxWidth };
  }
  if (typeof raw === 'string') {
    return { mode: 'fixed', maxWidth, text: raw };
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (typeof o.value === 'string') {
      return { mode: 'fixed', maxWidth, text: o.value };
    }
    if (typeof o.text === 'string') {
      return { mode: 'fixed', maxWidth, text: o.text };
    }
  }
  return { mode: 'live', maxWidth };
}

function serializeStabilization(
  options: ViewportScreenshotStabilization
): SerializedStabilization | null {
  const cw = DEFAULT_OVERLAY_CHAR_WIDTH_PX;
  const mh = DEFAULT_OVERLAY_MIN_HEIGHT_PX;
  const overlays: SerializedStabilization['overlays'] = {};
  const sd = resolveOverlayField(options.seriesDate, cw, mh);
  if (sd) {
    overlays.seriesDate = sd;
  }
  const sdesc = resolveOverlayField(options.seriesDescription, cw, mh);
  if (sdesc) {
    overlays.seriesDescription = sdesc;
  }
  const wl = resolveOverlayField(options.windowLevel, cw, mh);
  if (wl) {
    overlays.windowLevel = wl;
  }
  const ii = resolveOverlayField(options.imageInfo, cw, mh);
  if (ii) {
    overlays.imageInfo = ii;
  }

  const annotations = (options.annotations ?? []).map(spec => resolveAnnotationField(spec));

  const hasOverlays = Object.keys(overlays).length > 0;
  const hasAnnotations = annotations.length > 0;
  if (!hasOverlays && !hasAnnotations) {
    return null;
  }

  return { overlays, annotations };
}

export async function applyViewportScreenshotStabilization(
  page: Page,
  options: ViewportScreenshotStabilization | undefined
): Promise<void> {
  const payload = options ? serializeStabilization(options) : null;
  if (!payload) {
    return;
  }

  await page.evaluate(
    ([serialized, om, am, crm, rectHeightPx]) => {
      const grid = document.querySelector('[data-cy="viewport-grid"]');
      if (!grid) {
        return;
      }

      const overlaySelectors: Array<{
        key: keyof SerializedStabilization['overlays'];
        title: string;
      }> = [
        { key: 'seriesDate', title: 'Study date' },
        { key: 'seriesDescription', title: 'Series description' },
        { key: 'windowLevel', title: 'Window Level' },
        { key: 'imageInfo', title: 'Instance Number' },
      ];

      const normalizeOverlayVisibleText = (s: string) => s.replace(/\s+/g, ' ').trim();

      overlaySelectors.forEach(({ key, title }) => {
        const field = serialized.overlays[key];
        if (!field) {
          return;
        }

        grid.querySelectorAll<HTMLElement>(`.overlay-item[title="${title}"]`).forEach(el => {
          if (!el.hasAttribute(om)) {
            el.setAttribute(om, '1');
            el.setAttribute('data-ohif-prev-innerHTML', el.innerHTML);
            el.setAttribute('data-ohif-prev-style', el.getAttribute('style') ?? '');
          }

          let text: string;
          let minW: number;
          let minH: number;
          if (field.mode === 'live') {
            text = normalizeOverlayVisibleText(el.innerText);
            minW = Math.max(1, Math.ceil(field.charWidthPx * text.length));
            minH = field.minHeight;
          } else {
            text = field.text;
            minW = field.minWidth;
            minH = field.minHeight;
          }

          const span = document.createElement('span');
          span.style.cssText = [
            'color:transparent',
            '-webkit-text-fill-color:transparent',
            'text-shadow:none',
            'background:#800080',
            'display:inline-block',
            `min-width:${minW}px`,
            `min-height:${minH}px`,
            'box-sizing:border-box',
          ].join(';');
          span.textContent = text;
          el.innerHTML = '';
          el.appendChild(span);
        });
      });

      const textGroups = Array.from(
        grid.querySelectorAll<SVGGElement>('svg.svg-layer g[data-annotation-uid]')
      ).filter(g => g.querySelector('text'));

      serialized.annotations.forEach((ann, index) => {
        const g = textGroups[index];
        if (!g) {
          return;
        }

        const textEl = g.querySelector('text');
        if (!textEl) {
          return;
        }

        if (!g.hasAttribute(am)) {
          g.setAttribute(am, '1');
          textEl.setAttribute('data-ohif-prev-innerXML', textEl.innerHTML);

          const existingRect = g.querySelector('rect.background');
          if (existingRect) {
            ['x', 'y', 'width', 'height', 'fill', 'rx', 'ry'].forEach(attr => {
              existingRect.setAttribute(
                `data-ohif-prev-${attr}`,
                existingRect.getAttribute(attr) ?? ''
              );
            });
          }
        }

        textEl.removeAttribute('filter');

        const labelText =
          ann.mode === 'live' ? textEl.textContent ?? '' : ann.text;

        textEl.textContent = '';
        const lines = labelText.split('\n');
        lines.forEach(lineText => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', '0');
          tspan.setAttribute('dy', '1.2em');
          tspan.textContent = lineText;
          tspan.setAttribute('fill', 'transparent');
          textEl.appendChild(tspan);
        });
        textEl.setAttribute('fill', 'transparent');

        const bbox = textEl.getBBox();
        let rw = Math.max(1, Math.ceil(bbox.width));
        if (ann.maxWidth > 0 && rw > ann.maxWidth) {
          rw = ann.maxWidth;
        }

        let bg = g.querySelector('rect.background');
        if (!bg) {
          bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bg.setAttribute('class', 'background');
          g.insertBefore(bg, g.firstChild);
          g.setAttribute(crm, '1');
        }

        bg.setAttribute('x', String(bbox.x));
        bg.setAttribute('y', String(bbox.y));
        bg.setAttribute('width', String(rw));
        bg.setAttribute('height', String(rectHeightPx));
        bg.setAttribute('fill', '#800080');
      });
    },
    [
      payload,
      OVERLAY_MARK,
      ANNOTATION_MARK,
      CREATED_RECT_MARK,
      ANNOTATION_SCREENSHOT_RECT_HEIGHT_PX,
    ] as const
  );
}

export async function restoreViewportScreenshotStabilization(page: Page): Promise<void> {
  await page.evaluate(
    ([om, am, crm]) => {
      const grid = document.querySelector('[data-cy="viewport-grid"]');
      if (!grid) {
        return;
      }

      grid.querySelectorAll<HTMLElement>(`.overlay-item[${om}]`).forEach(el => {
        const prevHtml = el.getAttribute('data-ohif-prev-innerHTML');
        const prevStyle = el.getAttribute('data-ohif-prev-style');
        if (prevHtml !== null) {
          el.innerHTML = prevHtml;
        }
        if (prevStyle !== null) {
          if (prevStyle === '') {
            el.removeAttribute('style');
          } else {
            el.setAttribute('style', prevStyle);
          }
        }
        el.removeAttribute('data-ohif-prev-innerHTML');
        el.removeAttribute('data-ohif-prev-style');
        el.removeAttribute(om);
      });

      grid.querySelectorAll('svg.svg-layer g[data-annotation-uid]').forEach(g => {
        if (!g.hasAttribute(am)) {
          return;
        }
        const textEl = g.querySelector('text');
        if (textEl) {
          const prevXml = textEl.getAttribute('data-ohif-prev-innerXML');
          if (prevXml !== null) {
            textEl.innerHTML = prevXml;
            textEl.removeAttribute('data-ohif-prev-innerXML');
          }
        }

        const rect = g.querySelector('rect.background');
        if (g.getAttribute(crm) === '1' && rect) {
          rect.remove();
        } else if (rect) {
          ['x', 'y', 'width', 'height', 'fill', 'rx', 'ry'].forEach(attr => {
            const prev = rect.getAttribute(`data-ohif-prev-${attr}`);
            if (prev === '') {
              rect.removeAttribute(attr);
            } else if (prev !== null) {
              rect.setAttribute(attr, prev);
            }
            rect.removeAttribute(`data-ohif-prev-${attr}`);
          });
        }

        g.removeAttribute(crm);
        g.removeAttribute(am);
      });
    },
    [OVERLAY_MARK, ANNOTATION_MARK, CREATED_RECT_MARK] as const
  );
}

const OVERLAY_TITLE_ORDER = [
  'Study date',
  'Series description',
  'Window Level',
  'Instance Number',
] as const;

/** Each titled row lives under one corner wrapper (`data-cy` on ViewportOverlay). */
const OVERLAY_TITLE_TO_CORNER_TESTID: Record<
  (typeof OVERLAY_TITLE_ORDER)[number],
  string
> = {
  'Study date': 'viewport-overlay-top-left',
  'Series description': 'viewport-overlay-top-left',
  'Window Level': 'viewport-overlay-bottom-left',
  'Instance Number': 'viewport-overlay-bottom-right',
};

function normalizeVisibleText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function overlayFieldExpectedString(
  field: ViewportOverlayStabilizeField | undefined
): string | null {
  if (field === undefined || field === true) {
    return null;
  }
  if (typeof field === 'string') {
    return field;
  }
  if (typeof field === 'object' && field !== null && typeof field.text === 'string') {
    return field.text;
  }
  return null;
}

function hasExplicitOverlayTextExpectations(s: ViewportScreenshotStabilization): boolean {
  return (
    overlayFieldExpectedString(s.seriesDate) !== null ||
    overlayFieldExpectedString(s.seriesDescription) !== null ||
    overlayFieldExpectedString(s.windowLevel) !== null ||
    overlayFieldExpectedString(s.imageInfo) !== null
  );
}

/** Whether {@link assertViewportOverlayText} will run non-trivial checks. */
export function shouldAssertViewportOverlayText(
  stabilization: ViewportScreenshotStabilization
): boolean {
  if (stabilization.verifyOverlayText === false) {
    return false;
  }
  if (stabilization.verifyViewports?.length) {
    return true;
  }
  return hasExplicitOverlayTextExpectations(stabilization);
}

async function expectOverlayRowText(
  pane: Locator,
  title: (typeof OVERLAY_TITLE_ORDER)[number],
  expected: string
): Promise<void> {
  const corner = pane.getByTestId(OVERLAY_TITLE_TO_CORNER_TESTID[title]);
  const row = corner.locator(`div.overlay-item[title="${title}"]`);
  await expect(row, `overlay "${title}"`).toBeVisible();
  await expect(normalizeVisibleText(await row.innerText())).toBe(normalizeVisibleText(expected));
}

/**
 * Asserts live overlay text before stabilization mutates the DOM. Uses
 * {@link verifyViewports} when set; otherwise checks explicit string / `{ text }` fields on
 * the **first** viewport pane only.
 */
export async function assertViewportOverlayText(
  page: Page,
  stabilization: ViewportScreenshotStabilization
): Promise<void> {
  if (!shouldAssertViewportOverlayText(stabilization)) {
    return;
  }

  const grid = page.locator('[data-cy="viewport-grid"]');
  const panes = grid.getByTestId('viewport-pane');

  if (stabilization.verifyViewports?.length) {
    const count = await panes.count();
    expect(
      stabilization.verifyViewports.length,
      'verifyViewports has one row per viewport you want to assert (≤ pane count)'
    ).toBeLessThanOrEqual(count);

    for (let i = 0; i < stabilization.verifyViewports.length; i++) {
      const tuple = stabilization.verifyViewports[i];
      const pane = panes.nth(i);
      for (let j = 0; j < OVERLAY_TITLE_ORDER.length; j++) {
        await expectOverlayRowText(pane, OVERLAY_TITLE_ORDER[j], tuple[j]);
      }
    }
    return;
  }

  const pane = panes.first();
  const sd = overlayFieldExpectedString(stabilization.seriesDate);
  if (sd !== null) {
    await expectOverlayRowText(pane, 'Study date', sd);
  }
  const sdesc = overlayFieldExpectedString(stabilization.seriesDescription);
  if (sdesc !== null) {
    await expectOverlayRowText(pane, 'Series description', sdesc);
  }
  const wl = overlayFieldExpectedString(stabilization.windowLevel);
  if (wl !== null) {
    await expectOverlayRowText(pane, 'Window Level', wl);
  }
  const ii = overlayFieldExpectedString(stabilization.imageInfo);
  if (ii !== null) {
    await expectOverlayRowText(pane, 'Instance Number', ii);
  }
}
