import { Enums } from '@cornerstonejs/core';

/**
 * The single definition of every projection mode OHIF knows about.
 *
 * Nothing else in the codebase branches on a mode string: hanging protocols,
 * commands, adapters and UI all go through this registry and its two
 * translators (`toEngine` / `fromEngine`). Adding MinIP or AIP to the UI is a
 * one-field change (`uiExposed: true`).
 */

export type ProjectionBlendOp = 'none' | 'max' | 'min' | 'mean';

export type ProjectionModeId = 'none' | 'mip' | 'minip' | 'aip';

export interface ProjectionModeDefinition {
  id: ProjectionModeId;
  blendOp: ProjectionBlendOp;
  /** Key in the `Buttons` i18n namespace. */
  label: string;
  shortLabel: string;
  /** True when the mode is a projection and therefore needs a slab. */
  requiresSlab: boolean;
  /** True when the mode is offered by the UI selector. */
  uiExposed: boolean;
}

/** The projection state as read from, or written to, a rendering lane. */
export interface ProjectionState {
  blendOp: ProjectionBlendOp;
  /** Total slab width in world units (mm); 0 when no projection is active. */
  slabThickness: number;
}

export const PROJECTION_MODES: readonly ProjectionModeDefinition[] = Object.freeze([
  {
    id: 'none',
    blendOp: 'none',
    label: 'Projection off',
    shortLabel: 'Off',
    requiresSlab: false,
    uiExposed: true,
  },
  {
    id: 'mip',
    blendOp: 'max',
    label: 'Maximum intensity projection',
    shortLabel: 'MIP',
    requiresSlab: true,
    uiExposed: true,
  },
  {
    id: 'minip',
    blendOp: 'min',
    label: 'Minimum intensity projection',
    shortLabel: 'MinIP',
    requiresSlab: true,
    uiExposed: false,
  },
  {
    id: 'aip',
    blendOp: 'mean',
    label: 'Average intensity projection',
    shortLabel: 'AIP',
    requiresSlab: true,
    uiExposed: false,
  },
]);

/**
 * Legacy spellings accepted by hanging protocols that are not registry ids or
 * short labels. Kept for backward compatibility with existing protocols.
 */
const MODE_ALIASES: Record<string, ProjectionModeId> = {
  avg: 'aip',
  average: 'aip',
};

/**
 * The ONE table translating a blend operation to the engine enum. Built lazily
 * so it follows `Enums.BlendModes` at call time (unit tests mock the enum).
 */
function blendOpEngineTable(): Record<ProjectionBlendOp, Enums.BlendModes> {
  const { BlendModes } = Enums;
  return {
    none: BlendModes.COMPOSITE,
    max: BlendModes.MAXIMUM_INTENSITY_BLEND,
    min: BlendModes.MINIMUM_INTENSITY_BLEND,
    mean: BlendModes.AVERAGE_INTENSITY_BLEND,
  };
}

export function getProjectionMode(modeId: ProjectionModeId): ProjectionModeDefinition {
  const mode = PROJECTION_MODES.find(m => m.id === modeId);
  if (!mode) {
    throw new Error(`Unknown projection mode id: ${String(modeId)}`);
  }
  return mode;
}

/** Every mode that projects (i.e. needs a slab). */
export function getProjectableModes(): ProjectionModeDefinition[] {
  return PROJECTION_MODES.filter(m => m.requiresSlab);
}

/** Projectable modes the UI offers; its length pins the selector shape (1 = toggle). */
export function getUiExposedProjectableModes(): ProjectionModeDefinition[] {
  return getProjectableModes().filter(m => m.uiExposed);
}

/** Registry blend operation -> engine enum. Throws on an unknown operation. */
export function blendOpToEngine(blendOp: ProjectionBlendOp): Enums.BlendModes {
  const table = blendOpEngineTable();
  if (!(blendOp in table)) {
    throw new Error(`Unknown projection blend operation: ${String(blendOp)}`);
  }
  return table[blendOp];
}

/**
 * Engine enum -> registry blend operation. NON-throwing: returns undefined for
 * engine values the registry does not offer (e.g. LABELMAP_EDGE_PROJECTION_BLEND),
 * because it runs against live engine state that other tools may have set.
 */
export function blendOpFromEngine(engineValue: unknown): ProjectionBlendOp | undefined {
  if (engineValue === undefined || engineValue === null) {
    return undefined;
  }
  const table = blendOpEngineTable();
  const entry = (Object.keys(table) as ProjectionBlendOp[]).find(op => table[op] === engineValue);
  return entry;
}

/** Registry mode id -> engine enum. Throws on an unknown id. */
export function toEngine(modeId: ProjectionModeId): Enums.BlendModes {
  return blendOpToEngine(getProjectionMode(modeId).blendOp);
}

/**
 * Engine enum -> registry mode id. NON-throwing; undefined for values not in the
 * registry.
 */
export function fromEngine(engineValue: unknown): ProjectionModeId | undefined {
  const blendOp = blendOpFromEngine(engineValue);
  if (blendOp === undefined) {
    return undefined;
  }
  return PROJECTION_MODES.find(m => m.blendOp === blendOp)?.id;
}

/**
 * The ONE vocabulary normaliser for configuration strings (hanging protocols,
 * URL/customization input). Case-insensitive; accepts registry ids, short labels
 * and the legacy aliases. `undefined`, `null` and `''` mean "no projection".
 * Throws loudly on anything else so a typo in a protocol is caught immediately.
 */
export function normalizeProjectionModeId(input: string | null | undefined): ProjectionModeId {
  if (input === undefined || input === null || input === '') {
    return 'none';
  }
  if (typeof input !== 'string') {
    throw new Error(`Unsupported blend mode: ${String(input)}`);
  }
  const key = input.trim().toLowerCase();
  const byId = PROJECTION_MODES.find(m => m.id === key);
  if (byId) {
    return byId.id;
  }
  const byShortLabel = PROJECTION_MODES.find(m => m.shortLabel.toLowerCase() === key);
  if (byShortLabel) {
    return byShortLabel.id;
  }
  if (key in MODE_ALIASES) {
    return MODE_ALIASES[key];
  }
  throw new Error(`Unsupported blend mode: ${input}`);
}

/**
 * Bounding diagonal of a volume, sqrt(sum((dim_i * spacing_i)^2)). This is the
 * meaning of the `fullVolume` slab keyword and the upper bound of the slab range.
 */
export function getVolumeDiagonal(volume: {
  dimensions: ArrayLike<number>;
  spacing: ArrayLike<number>;
}): number {
  const { dimensions, spacing } = volume;
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    const extent = (dimensions[i] ?? 0) * (spacing[i] ?? 0);
    sum += extent * extent;
  }
  return Math.sqrt(sum);
}
