import { Enums } from '@cornerstonejs/core';
import {
  PROJECTION_MODES,
  blendOpFromEngine,
  blendOpToEngine,
  fromEngine,
  getProjectableModes,
  getUiExposedProjectableModes,
  getVolumeDiagonal,
  normalizeProjectionModeId,
  toEngine,
} from './projectionRegistry';

// T1 — registry round-trip and vocabulary.
describe('projectionRegistry (T1)', () => {
  it('round-trips every row through toEngine/fromEngine', () => {
    for (const mode of PROJECTION_MODES) {
      const engine = toEngine(mode.id);
      expect(fromEngine(engine)).toBe(mode.id);
      expect(blendOpFromEngine(blendOpToEngine(mode.blendOp))).toBe(mode.blendOp);
    }
  });

  it('maps blend operations onto the cornerstone enum values', () => {
    expect(toEngine('none')).toBe(Enums.BlendModes.COMPOSITE);
    expect(toEngine('mip')).toBe(Enums.BlendModes.MAXIMUM_INTENSITY_BLEND);
    expect(toEngine('minip')).toBe(Enums.BlendModes.MINIMUM_INTENSITY_BLEND);
    expect(toEngine('aip')).toBe(Enums.BlendModes.AVERAGE_INTENSITY_BLEND);
  });

  it('fromEngine is non-throwing and returns undefined for engine values not offered', () => {
    expect(fromEngine(Enums.BlendModes.LABELMAP_EDGE_PROJECTION_BLEND)).toBeUndefined();
    expect(fromEngine(4)).toBeUndefined(); // vtk ADDITIVE_INTENSITY_BLEND
    expect(fromEngine(5)).toBeUndefined(); // vtk RADON_TRANSFORM_BLEND
    expect(fromEngine(undefined)).toBeUndefined();
    expect(fromEngine(null)).toBeUndefined();
    expect(fromEngine('garbage')).toBeUndefined();
    expect(blendOpFromEngine(99)).toBeUndefined();
  });

  it('throws on unknown mode ids and blend ops (config-time errors are loud)', () => {
    expect(() => toEngine('nope' as never)).toThrow();
    expect(() => blendOpToEngine('nope' as never)).toThrow();
  });

  it('pins the UI shape: exactly one UI-exposed projectable mode (on/off toggle)', () => {
    expect(getUiExposedProjectableModes().map(m => m.id)).toEqual(['mip']);
    expect(getProjectableModes().map(m => m.id)).toEqual(['mip', 'minip', 'aip']);
    expect(PROJECTION_MODES.find(m => m.id === 'none')?.requiresSlab).toBe(false);
  });

  it('normalises configuration vocabulary in one place', () => {
    expect(normalizeProjectionModeId(undefined)).toBe('none');
    expect(normalizeProjectionModeId(null)).toBe('none');
    expect(normalizeProjectionModeId('')).toBe('none');
    expect(normalizeProjectionModeId('MIP')).toBe('mip');
    expect(normalizeProjectionModeId('mip')).toBe('mip');
    expect(normalizeProjectionModeId('MiP')).toBe('mip');
    expect(normalizeProjectionModeId('MinIP')).toBe('minip');
    expect(normalizeProjectionModeId('AIP')).toBe('aip');
    expect(normalizeProjectionModeId('avg')).toBe('aip');
    expect(normalizeProjectionModeId('AVG')).toBe('aip');
    expect(normalizeProjectionModeId('none')).toBe('none');
    expect(() => normalizeProjectionModeId('invalid')).toThrow('Unsupported blend mode: invalid');
  });

  it('computes the volume diagonal used by fullVolume and the slab range', () => {
    expect(getVolumeDiagonal({ dimensions: [3, 4, 0], spacing: [1, 1, 1] })).toBe(5);
    expect(getVolumeDiagonal({ dimensions: [32, 32, 32], spacing: [1, 1, 1] })).toBeCloseTo(
      Math.sqrt(3) * 32
    );
    expect(getVolumeDiagonal({ dimensions: [10, 10, 10], spacing: [0.5, 0.5, 2] })).toBeCloseTo(
      Math.sqrt(25 + 25 + 400)
    );
  });
});

describe('projectionRegistry prototype-chain safety', () => {
  it('rejects inherited object property names as vocabulary', () => {
    for (const name of ['constructor', 'toString', 'valueOf', '__proto__', 'hasOwnProperty']) {
      expect(() => normalizeProjectionModeId(name)).toThrow(`Unsupported blend mode: ${name}`);
      expect(() => blendOpToEngine(name as never)).toThrow();
    }
  });
});
