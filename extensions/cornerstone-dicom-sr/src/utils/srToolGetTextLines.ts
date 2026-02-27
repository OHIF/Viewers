/**
 * getTextLines for SR subtypes (SRProbe, SRRectangleROI). Shows semantic label from Finding concept
 * (e.g. "Lesion") instead of intensity/coordinates or area/stats. Sub-types per maintainer so
 * base Probe/RectangleROI remain unchanged.
 */
export function getSRProbeTextLines(data: { label?: string; cachedStats?: Record<string, unknown> }, _targetId: string): string[] | undefined {
  if (data.label && typeof data.label === 'string') {
    return [data.label];
  }
  return undefined;
}

export function getSRRectangleROITextLines(data: { label?: string; cachedStats?: Record<string, unknown> }, _targetId: string): string[] | undefined {
  if (data.label && typeof data.label === 'string') {
    return [data.label];
  }
  return undefined;
}
