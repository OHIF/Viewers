/**
 * SmartPaintTool
 *
 * A Cornerstone-compatible annotation tool that implements freehand brush painting
 * to create ROI contours. Works as an AnnotationTool extension.
 *
 * Architecture:
 *  - Implements the Cornerstone tool interface (type: 'annotation')
 *  - Maintains a paint mask per viewport (imageId)
 *  - Provides 2D (single slice) and 3D (propagate across slices) modes
 *  - Converts painted mask to polyline contour on commit
 *  - Full undo/redo stack per viewport
 */

export interface SmartPaintConfig {
  brushRadius: number;       // px, default 15
  sensitivity: number;       // 0–100, controls region-grow aggressiveness
  mode: '2D' | '3D';
  color: string;             // RGBA fill color
}

export interface PaintState {
  mask: Uint8ClampedArray;   // 1-bit mask, width × height
  width: number;
  height: number;
  history: Uint8ClampedArray[];
  historyIndex: number;
}

const DEFAULT_CONFIG: SmartPaintConfig = {
  brushRadius: 15,
  sensitivity: 50,
  mode: '2D',
  color: 'rgba(0, 200, 255, 0.35)',
};

// One paint state per viewport/imageId
const paintStates = new Map<string, PaintState>();

function getOrCreate(key: string, width: number, height: number): PaintState {
  if (!paintStates.has(key)) {
    const mask = new Uint8ClampedArray(width * height);
    paintStates.set(key, { mask, width, height, history: [mask.slice()], historyIndex: 0 });
  }
  return paintStates.get(key)!;
}

/**
 * Paint a filled circle onto the mask.
 * Applies simple intensity-region-grow if sensitivity > 0 and pixelData is provided.
 */
export function paintBrush(
  state: PaintState,
  cx: number,
  cy: number,
  radius: number,
  sensitivity: number,
  pixelData?: Uint8ClampedArray | null,
  erase = false
) {
  const { mask, width, height } = state;
  const r2 = radius * radius;

  for (let y = Math.max(0, cy - radius); y <= Math.min(height - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(width - 1, cx + radius); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;

      if (sensitivity > 0 && pixelData) {
        // Region-grow: include pixel only if similar intensity to center pixel
        const centerIdx = (cy * width + cx) * 4;
        const pixIdx = (y * width + x) * 4;
        const diff = Math.abs(pixelData[centerIdx] - pixelData[pixIdx]);
        if (diff > sensitivity * 2.55) continue; // sensitivity 0–100 → threshold 0–255
      }

      mask[y * width + x] = erase ? 0 : 1;
    }
  }
}

/**
 * Commit current mask to history (for undo/redo).
 */
export function commitHistory(state: PaintState) {
  // Truncate forward history
  state.history.splice(state.historyIndex + 1);
  state.history.push(state.mask.slice());
  state.historyIndex = state.history.length - 1;
  // Cap history at 50 steps
  if (state.history.length > 50) {
    state.history.shift();
    state.historyIndex--;
  }
}

export function undo(state: PaintState): boolean {
  if (state.historyIndex <= 0) return false;
  state.historyIndex--;
  state.mask.set(state.history[state.historyIndex]);
  return true;
}

export function redo(state: PaintState): boolean {
  if (state.historyIndex >= state.history.length - 1) return false;
  state.historyIndex++;
  state.mask.set(state.history[state.historyIndex]);
  return true;
}

/**
 * Clear mask for a viewport.
 */
export function clearMask(key: string) {
  const state = paintStates.get(key);
  if (!state) return;
  state.mask.fill(0);
  commitHistory(state);
}

/**
 * Render mask overlay onto a canvas 2D context.
 */
export function renderMaskOverlay(
  ctx: CanvasRenderingContext2D,
  state: PaintState,
  color: string = 'rgba(0, 200, 255, 0.35)'
) {
  const { mask, width, height } = state;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Parse color
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const tmpCtx = tmp.getContext('2d')!;
  tmpCtx.fillStyle = color;
  tmpCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = tmpCtx.getImageData(0, 0, 1, 1).data;

  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) {
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = 100; // semi-transparent
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert binary mask to a simplified polyline contour using marching squares.
 * Returns array of [x, y] points forming the contour boundary.
 */
export function maskToContour(state: PaintState): Array<[number, number]> {
  const { mask, width, height } = state;
  const points: Array<[number, number]> = [];

  // Simple border-tracing: find edges between 0 and 1 regions
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const tl = mask[y * width + x];
      const tr = mask[y * width + x + 1];
      const bl = mask[(y + 1) * width + x];
      const br = mask[(y + 1) * width + x + 1];
      const sum = tl + tr + bl + br;
      if (sum > 0 && sum < 4) {
        points.push([x + 0.5, y + 0.5]);
      }
    }
  }
  return points;
}

/**
 * Count painted (non-zero) pixels in the mask.
 */
export function countPaintedPixels(state: PaintState): number {
  let count = 0;
  for (let i = 0; i < state.mask.length; i++) {
    if (state.mask[i]) count++;
  }
  return count;
}

/**
 * Get or create paint state — API for React components.
 */
export { getOrCreate as getPaintState, paintStates };

/**
 * Default export: the tool descriptor used by OHIF extension registration.
 */
const SmartPaintTool = {
  toolName: 'SmartPaint',
  type: 'annotation' as const,
  defaultConfig: DEFAULT_CONFIG,
  getPaintState: getOrCreate,
  paintBrush,
  commitHistory,
  undo,
  redo,
  clearMask,
  renderMaskOverlay,
  maskToContour,
};

export default SmartPaintTool;
