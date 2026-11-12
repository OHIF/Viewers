import { drawing } from '@cornerstonejs/tools';
import type { Types as ToolsTypes } from '@cornerstonejs/tools';

/** Half the length of each arm of the cross, in canvas pixels. */
export const CROSS_SIZE = 6;

/** The style of the cross, as the annotation style gives it. */
type CrossOptions = {
  color?: unknown;
  lineWidth?: unknown;
  lineDash?: unknown;
};

/**
 * Draws a cross (plus) marker centred on a canvas point, the usual marker for an SR point.
 */
export default function drawCross(
  svgDrawingHelper: ToolsTypes.SVGDrawingHelper,
  annotationUID: string,
  crossUID: string,
  center: [number, number] | number[],
  size: number = CROSS_SIZE,
  { color, lineWidth, lineDash }: CrossOptions = {}
): void {
  const cx = Number(center[0]);
  const cy = Number(center[1]);
  const crossPaths: [number, number][][] = [
    [
      [cx, cy - size],
      [cx, cy + size],
    ],
    [
      [cx - size, cy],
      [cx + size, cy],
    ],
  ];
  drawing.drawPath(svgDrawingHelper, annotationUID, crossUID, crossPaths, {
    color: color as string,
    lineWidth: (lineWidth as number) || 2,
    lineDash: lineDash as string,
  });
}
