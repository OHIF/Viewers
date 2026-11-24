import { utilities, Types } from '@cornerstonejs/core';
import { getViewportAdapter } from '../services/ViewportService/adapter';

type VOIRange = { lower: number; upper: number };

/**
 * The VOI LUT Function in effect for a viewport binding (the application value,
 * else the file value), or undefined when the viewport does not report it.
 * Undefined converts as LINEAR. Pass it to `toWindowLevel` / `toLowHighRange`
 * so that a range -> window -> range round trip is exact for LINEAR_EXACT.
 */
export function getVOILUTFunction(viewport: Types.IViewport, dataId?: string): string | undefined {
  const fromPresentation = getViewportAdapter(viewport).getPresentation(dataId)?.VOILUTFunction;
  return (fromPresentation ??
    (viewport as unknown as { getProperties?: () => { VOILUTFunction?: string } }).getProperties?.()
      ?.VOILUTFunction) as string | undefined;
}

/** The W/L readout of a VOI range, or null values when there is no range. */
export function getWindowLevelReadout(
  voiRange: VOIRange | undefined,
  VOILUTFunction?: string
): { windowWidth: number | null; windowCenter: number | null } {
  return voiRange
    ? utilities.windowLevel.toWindowLevel(voiRange.lower, voiRange.upper, VOILUTFunction)
    : { windowCenter: null, windowWidth: null };
}

/**
 * The short label that the W/L overlay shows before `W:`, or undefined for LINEAR.
 * A VOI LUT Sequence wins: the W/L numbers then do not describe the display.
 */
export function getVOILUTLabel(
  VOILUTFunction?: string,
  voiLUTSequenceApplied?: boolean
): string | undefined {
  if (voiLUTSequenceApplied) {
    return 'VOI LUT';
  }
  switch (VOILUTFunction) {
    case 'LINEAR_EXACT':
      return 'Exact';
    case 'SIGMOID':
    case 'SAMPLED_SIGMOID':
      return 'Sigmoid';
    default:
      return undefined;
  }
}
