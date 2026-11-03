import { Enums } from '@cornerstonejs/core';
import { normalizeProjectionModeId, toEngine } from '../projection/projectionRegistry';

/**
 * Hanging-protocol / display-set-option entry point for blend modes.
 *
 * Thin adapter over the projection registry: the string vocabulary ('MIP',
 * 'MinIP', 'AIP', legacy 'avg') is normalised by `normalizeProjectionModeId`
 * (the one place that knows the spellings) and translated by `toEngine`.
 * Unknown strings throw. Absent values resolve to COMPOSITE (no projection).
 */
export default function getCornerstoneBlendMode(blendMode: string): Enums.BlendModes {
  return toEngine(normalizeProjectionModeId(blendMode));
}
