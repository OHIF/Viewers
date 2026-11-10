import type { ProjectionBlendOp } from './projectionRegistry';

/**
 * CPU reference implementation of slab projection.
 *
 * This is the golden oracle for the GPU lanes: it mirrors the vtk.js reslice
 * slab march (symmetric outward from the plane, half-voxel step, clamped last
 * step, early exit when both directions leave the volume) and the ray-cast
 * reduction (component-wise max/min/mean on RAW scalars, transfer function
 * applied once afterwards). Production rendering never calls this; tests do.
 *
 * Conventions:
 *  - `slabThickness` is the TOTAL width; the slab spans [-t/2, +t/2] about the plane.
 *  - Index (i, j, k) maps to world `origin + i*spacing[0]*x + j*spacing[1]*y + k*spacing[2]*z`
 *    (identity direction cosines; the oracle does not model oblique acquisitions).
 *  - A voxel is "inside" when its continuous index lies within [0, dim - 1] on every axis.
 */

export type Vec3 = [number, number, number];

export interface ReferenceVolume {
  dimensions: Vec3;
  spacing: Vec3;
  origin?: Vec3;
  /** Scalars in i-fastest order: index = i + j*nx + k*nx*ny (times numberOfComponents). */
  scalars: ArrayLike<number>;
  numberOfComponents?: number;
}

export interface WindowLevel {
  windowWidth: number;
  windowCenter: number;
}

const EPS = 1e-9;

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < EPS) {
    throw new Error('projectionReference: zero-length normal');
  }
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Reduce one sample into the running value, component-wise, exactly like the shaders. */
export function compositeValue(
  current: number[] | undefined,
  sample: number[],
  blendOp: ProjectionBlendOp
): number[] {
  if (!current) {
    return sample.slice();
  }
  switch (blendOp) {
    case 'max':
      return current.map((c, idx) => Math.max(c, sample[idx]));
    case 'min':
      return current.map((c, idx) => Math.min(c, sample[idx]));
    case 'mean':
      return current.map((c, idx) => c + sample[idx]);
    case 'none':
      return current;
    default:
      throw new Error(`projectionReference: unknown blend op ${String(blendOp)}`);
  }
}

export function worldToIndex(volume: ReferenceVolume, world: Vec3): Vec3 {
  const origin = volume.origin ?? [0, 0, 0];
  return [
    (world[0] - origin[0]) / volume.spacing[0],
    (world[1] - origin[1]) / volume.spacing[1],
    (world[2] - origin[2]) / volume.spacing[2],
  ];
}

export function indexToWorld(volume: ReferenceVolume, index: Vec3): Vec3 {
  const origin = volume.origin ?? [0, 0, 0];
  return [
    origin[0] + index[0] * volume.spacing[0],
    origin[1] + index[1] * volume.spacing[1],
    origin[2] + index[2] * volume.spacing[2],
  ];
}

export function isInside(volume: ReferenceVolume, index: Vec3): boolean {
  const [nx, ny, nz] = volume.dimensions;
  return (
    index[0] >= -EPS &&
    index[0] <= nx - 1 + EPS &&
    index[1] >= -EPS &&
    index[1] <= ny - 1 + EPS &&
    index[2] >= -EPS &&
    index[2] <= nz - 1 + EPS
  );
}

/** Voxel read with component vector output. */
export function getVoxel(volume: ReferenceVolume, i: number, j: number, k: number): number[] {
  const nc = volume.numberOfComponents ?? 1;
  const [nx, ny] = volume.dimensions;
  const base = (i + j * nx + k * nx * ny) * nc;
  const out = new Array(nc);
  for (let c = 0; c < nc; c++) {
    out[c] = volume.scalars[base + c];
  }
  return out;
}

/** Trilinear sample at a continuous index; undefined when outside the volume. */
export function sampleTrilinear(volume: ReferenceVolume, index: Vec3): number[] | undefined {
  if (!isInside(volume, index)) {
    return undefined;
  }
  const [nx, ny, nz] = volume.dimensions;
  const clampIdx = (v: number, n: number) => Math.min(Math.max(v, 0), n - 1);
  const x = clampIdx(index[0], nx);
  const y = clampIdx(index[1], ny);
  const z = clampIdx(index[2], nz);
  const i0 = Math.floor(x);
  const j0 = Math.floor(y);
  const k0 = Math.floor(z);
  const i1 = Math.min(i0 + 1, nx - 1);
  const j1 = Math.min(j0 + 1, ny - 1);
  const k1 = Math.min(k0 + 1, nz - 1);
  const fx = x - i0;
  const fy = y - j0;
  const fz = z - k0;

  const nc = volume.numberOfComponents ?? 1;
  const out = new Array(nc).fill(0);
  const corners: Array<[number, number, number, number]> = [
    [i0, j0, k0, (1 - fx) * (1 - fy) * (1 - fz)],
    [i1, j0, k0, fx * (1 - fy) * (1 - fz)],
    [i0, j1, k0, (1 - fx) * fy * (1 - fz)],
    [i1, j1, k0, fx * fy * (1 - fz)],
    [i0, j0, k1, (1 - fx) * (1 - fy) * fz],
    [i1, j0, k1, fx * (1 - fy) * fz],
    [i0, j1, k1, (1 - fx) * fy * fz],
    [i1, j1, k1, fx * fy * fz],
  ];
  for (const [i, j, k, w] of corners) {
    if (w === 0) {
      continue;
    }
    const v = getVoxel(volume, i, j, k);
    for (let c = 0; c < nc; c++) {
      out[c] += w * v[c];
    }
  }
  return out;
}

export interface SlabMarchOptions {
  /** Unit (or any non-zero) slab normal in world space. */
  normal: Vec3;
  /** World point on the focal plane through which the march runs. */
  planePoint: Vec3;
  /** Total slab width in world units. */
  slabThickness: number;
  blendOp: ProjectionBlendOp;
  /** Step length; defaults to 0.5 * min(spacing), as in vtkImageResliceMapper. */
  sampleStep?: number;
}

/**
 * Reslice-style slab march at one point: samples the plane point, then marches
 * symmetrically outward along the normal until distTraveled reaches t/2,
 * clamping the last step to the slab boundary and stopping early once both
 * directions have exited the volume. Returns the reduced RAW value (per
 * component), or undefined when the plane point itself is outside the volume.
 */
export function projectSlabAtPoint(
  volume: ReferenceVolume,
  options: SlabMarchOptions
): number[] | undefined {
  const { planePoint, slabThickness, blendOp } = options;
  const n = normalize(options.normal);
  const step =
    options.sampleStep ?? 0.5 * Math.min(volume.spacing[0], volume.spacing[1], volume.spacing[2]);

  const centerSample = sampleTrilinear(volume, worldToIndex(volume, planePoint));
  if (!centerSample) {
    return undefined;
  }
  if (blendOp === 'none' || slabThickness <= 0) {
    return centerSample;
  }

  let value = compositeValue(undefined, centerSample, blendOp);
  let count = 1;
  const halfWidth = slabThickness / 2;
  let distTraveled = 0;
  let negExited = false;
  let posExited = false;

  while (distTraveled < halfWidth - EPS) {
    distTraveled = Math.min(distTraveled + step, halfWidth); // clamp the last step
    const offset: Vec3 = [n[0] * distTraveled, n[1] * distTraveled, n[2] * distTraveled];

    const pNeg: Vec3 = [
      planePoint[0] - offset[0],
      planePoint[1] - offset[1],
      planePoint[2] - offset[2],
    ];
    const sNeg = sampleTrilinear(volume, worldToIndex(volume, pNeg));
    if (sNeg) {
      value = compositeValue(value, sNeg, blendOp);
      count++;
    } else {
      negExited = true;
    }

    const pPos: Vec3 = [
      planePoint[0] + offset[0],
      planePoint[1] + offset[1],
      planePoint[2] + offset[2],
    ];
    const sPos = sampleTrilinear(volume, worldToIndex(volume, pPos));
    if (sPos) {
      value = compositeValue(value, sPos, blendOp);
      count++;
    } else {
      posExited = true;
    }

    if (negExited && posExited) {
      break;
    }
  }

  if (blendOp === 'mean') {
    value = value.map(v => v / count);
  }
  return value;
}

export interface AxisAlignedSlabOptions {
  /** Projection axis: 0 = i (x), 1 = j (y), 2 = k (z). */
  axis: 0 | 1 | 2;
  /** World coordinate of the focal plane along the projection axis. */
  planeCoordinate: number;
  slabThickness: number;
  blendOp: ProjectionBlendOp;
}

/**
 * Axis-aligned reference: out = reduce(volume[slab slices], axis). A slice at
 * index s is inside the slab when |world(s) - planeCoordinate| <= t/2. Returns
 * the projected image (component 0) with dimensions of the two remaining axes.
 */
export function projectSlabAxisAligned(
  volume: ReferenceVolume,
  options: AxisAlignedSlabOptions
): { width: number; height: number; data: Float64Array } {
  const { axis, planeCoordinate, slabThickness, blendOp } = options;
  const dims = volume.dimensions;
  const origin = volume.origin ?? [0, 0, 0];
  const halfWidth = slabThickness / 2;

  const inSlab: number[] = [];
  for (let s = 0; s < dims[axis]; s++) {
    const w = origin[axis] + s * volume.spacing[axis];
    if (blendOp === 'none') {
      // no projection: the single nearest slice
      continue;
    }
    if (Math.abs(w - planeCoordinate) <= halfWidth + EPS) {
      inSlab.push(s);
    }
  }
  if (blendOp === 'none' || inSlab.length === 0) {
    const nearest = Math.round((planeCoordinate - origin[axis]) / volume.spacing[axis]);
    inSlab.length = 0;
    inSlab.push(Math.min(Math.max(nearest, 0), dims[axis] - 1));
  }

  const otherAxes = [0, 1, 2].filter(a => a !== axis) as [number, number];
  const width = dims[otherAxes[0]];
  const height = dims[otherAxes[1]];
  const data = new Float64Array(width * height);

  for (let v = 0; v < height; v++) {
    for (let u = 0; u < width; u++) {
      let acc: number[] | undefined;
      for (const s of inSlab) {
        const idx: Vec3 = [0, 0, 0];
        idx[otherAxes[0]] = u;
        idx[otherAxes[1]] = v;
        idx[axis] = s;
        acc = compositeValue(acc, getVoxel(volume, idx[0], idx[1], idx[2]), blendOp);
      }
      let out = acc?.[0] ?? 0;
      if (blendOp === 'mean') {
        out /= inSlab.length;
      }
      data[v * width + u] = out;
    }
  }
  return { width, height, data };
}

export interface ObliqueImageOptions extends SlabMarchOptions {
  /** View-up direction (any non-zero vector not parallel to the normal). */
  viewUp: Vec3;
  width: number;
  height: number;
  /** Output pixel size in world units. */
  pixelSpacing: number;
}

/**
 * Oblique reference image: a width x height grid of rays on the focal plane
 * centred on `planePoint`, each reduced with `projectSlabAtPoint`. Component 0
 * is returned; pixels whose plane point lies outside the volume are NaN.
 */
export function projectSlabImage(
  volume: ReferenceVolume,
  options: ObliqueImageOptions
): Float64Array {
  const n = normalize(options.normal);
  const up = normalize(options.viewUp);
  const right = normalize(cross(up, n));
  const trueUp = normalize(cross(n, right));
  const { width, height, pixelSpacing, planePoint } = options;
  const data = new Float64Array(width * height);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const du = (col - (width - 1) / 2) * pixelSpacing;
      const dv = (row - (height - 1) / 2) * pixelSpacing;
      const p: Vec3 = [
        planePoint[0] + right[0] * du + trueUp[0] * dv,
        planePoint[1] + right[1] * du + trueUp[1] * dv,
        planePoint[2] + right[2] * du + trueUp[2] * dv,
      ];
      const value = projectSlabAtPoint(volume, { ...options, planePoint: p });
      data[row * width + col] = value ? value[0] : NaN;
    }
  }
  return data;
}

/**
 * Linear window/level transfer applied AFTER the projection: maps the winning
 * raw value to [0, 255] the way a VOI LUT would. Kept separate on purpose so
 * tests can prove the reduction happens on raw values.
 */
export function applyWindowLevel(value: number, wl: WindowLevel): number {
  const { windowWidth, windowCenter } = wl;
  if (windowWidth <= 0) {
    throw new Error('projectionReference: windowWidth must be positive');
  }
  const lower = windowCenter - windowWidth / 2;
  const t = (value - lower) / windowWidth;
  return Math.round(Math.min(Math.max(t, 0), 1) * 255);
}
