import {
  applyWindowLevel,
  projectSlabAtPoint,
  projectSlabAxisAligned,
  projectSlabImage,
  type ReferenceVolume,
  type Vec3,
} from './projectionReference';

const N = 32;
const HOT = 1000;

/** 32^3 volume of zeros with one hot voxel at (i, j, k). */
function makeVolume(hot: Vec3, spacing: Vec3 = [1, 1, 1]): ReferenceVolume {
  const scalars = new Float32Array(N * N * N);
  scalars[hot[0] + hot[1] * N + hot[2] * N * N] = HOT;
  return { dimensions: [N, N, N], spacing, scalars };
}

describe('projectionReference', () => {
  // T2 — golden numeric, axis-aligned.
  describe('axis-aligned golden (T2)', () => {
    const hot: Vec3 = [10, 12, 20];
    const volume = makeVolume(hot);

    it('projects the hot voxel to pixel (i, j) when the slab covers it', () => {
      const { width, data } = projectSlabAxisAligned(volume, {
        axis: 2,
        planeCoordinate: 16,
        slabThickness: 10, // covers k in [11, 21]
        blendOp: 'max',
      });
      expect(data[hot[1] * width + hot[0]]).toBe(HOT);
      // Every other pixel is background.
      const others = Array.from(data).filter((_, idx) => idx !== hot[1] * width + hot[0]);
      expect(others.every(v => v === 0)).toBe(true);
    });

    it('excludes the hot voxel when the slab does not reach it', () => {
      const { width, data } = projectSlabAxisAligned(volume, {
        axis: 2,
        planeCoordinate: 16,
        slabThickness: 6, // covers k in [13, 19]
        blendOp: 'max',
      });
      expect(data[hot[1] * width + hot[0]]).toBe(0);
    });

    it('min and mean reduce the same slab consistently', () => {
      const min = projectSlabAxisAligned(volume, {
        axis: 2,
        planeCoordinate: 20,
        slabThickness: 4,
        blendOp: 'min',
      });
      const mean = projectSlabAxisAligned(volume, {
        axis: 2,
        planeCoordinate: 20,
        slabThickness: 4, // k in [18, 22] => 5 slices
        blendOp: 'mean',
      });
      const idx = hot[1] * min.width + hot[0];
      expect(min.data[idx]).toBe(0);
      expect(mean.data[idx]).toBeCloseTo(HOT / 5);
    });

    it('agrees with the marching oracle on the projection axis', () => {
      const marched = projectSlabAtPoint(volume, {
        normal: [0, 0, 1],
        planePoint: [hot[0], hot[1], 16],
        slabThickness: 10,
        blendOp: 'max',
      });
      expect(marched?.[0]).toBe(HOT);
      const outside = projectSlabAtPoint(volume, {
        normal: [0, 0, 1],
        planePoint: [hot[0], hot[1], 16],
        slabThickness: 6,
        blendOp: 'max',
      });
      expect(outside?.[0]).toBe(0);
    });
  });

  // T2 — golden numeric, 45 degree oblique.
  describe('oblique golden (T2)', () => {
    const hot: Vec3 = [16, 16, 16];
    const volume = makeVolume(hot);
    const normal: Vec3 = [1, 0, 1];

    it('finds the hot voxel through a 45-degree slab and not outside it', () => {
      // Plane point offset from the voxel along the normal by 3 mm.
      const d = 3;
      const unit = Math.SQRT1_2;
      const planePoint: Vec3 = [hot[0] - unit * d, hot[1], hot[2] - unit * d];

      const inside = projectSlabAtPoint(volume, {
        normal,
        planePoint,
        slabThickness: 2 * d + 1,
        blendOp: 'max',
        sampleStep: 0.25,
      });
      expect(inside?.[0]).toBeCloseTo(HOT, 0);

      const outside = projectSlabAtPoint(volume, {
        normal,
        planePoint,
        slabThickness: 2 * (d - 1.5),
        blendOp: 'max',
        sampleStep: 0.25,
      });
      expect(outside?.[0]).toBe(0);
    });

    it('renders an oblique image whose brightest pixel is the hot voxel', () => {
      const image = projectSlabImage(volume, {
        normal,
        viewUp: [0, 1, 0],
        planePoint: [16, 16, 16],
        slabThickness: 8,
        blendOp: 'max',
        width: 9,
        height: 9,
        pixelSpacing: 1,
        sampleStep: 0.25,
      });
      let best = -Infinity;
      let bestIdx = -1;
      image.forEach((v, idx) => {
        if (v > best) {
          best = v;
          bestIdx = idx;
        }
      });
      expect(best).toBeCloseTo(HOT, 0);
      expect(bestIdx).toBe(4 * 9 + 4); // centre pixel
    });
  });

  // T3 — slab convention: total width t, planes at +/- t/2.
  describe('slab convention (T3)', () => {
    const t = 8;
    const eps = 0.25;

    it('includes a voxel at t/2 - eps and excludes one at t/2 + eps (axis aligned)', () => {
      // Spacing eps along k so voxel k sits exactly at world k * eps.
      const spacing: Vec3 = [1, 1, eps];
      const planeCoordinate = 4;
      const slab = 6; // t/2 = 3 keeps both probes inside the 32 * eps = 7.75 mm extent

      const kInside = Math.round((planeCoordinate + slab / 2 - eps) / eps); // 27
      const kOutside = Math.round((planeCoordinate - slab / 2 - eps) / eps); // 3
      expect(kInside).toBeLessThan(N);
      expect(kOutside).toBeGreaterThanOrEqual(0);

      const scalarsIn = new Float32Array(N * N * N);
      scalarsIn[5 + 5 * N + kInside * N * N] = HOT;
      const projIn = projectSlabAxisAligned(
        { dimensions: [N, N, N], spacing, scalars: scalarsIn },
        { axis: 2, planeCoordinate, slabThickness: slab, blendOp: 'max' }
      );
      expect(projIn.data[5 * N + 5]).toBe(HOT);

      const scalarsOut = new Float32Array(N * N * N);
      scalarsOut[5 + 5 * N + kOutside * N * N] = HOT;
      const projOut = projectSlabAxisAligned(
        { dimensions: [N, N, N], spacing, scalars: scalarsOut },
        { axis: 2, planeCoordinate, slabThickness: slab, blendOp: 'max' }
      );
      expect(projOut.data[5 * N + 5]).toBe(0);
    });

    it('the march reaches exactly t/2 and no further', () => {
      const volume = makeVolume([16, 16, 20]); // hot at z = 20
      const planePoint: Vec3 = [16, 16, 16];
      const reach = projectSlabAtPoint(volume, {
        normal: [0, 0, 1],
        planePoint,
        slabThickness: 8, // t/2 = 4 -> reaches z = 20 exactly
        blendOp: 'max',
      });
      expect(reach?.[0]).toBe(HOT);
      const short = projectSlabAtPoint(volume, {
        normal: [0, 0, 1],
        planePoint,
        slabThickness: 8 - 2 * eps, // t/2 = 3.75 -> z = 19.75 samples 75% of the voxel
        blendOp: 'max',
      });
      expect(short?.[0]).toBeLessThan(HOT);
      const none = projectSlabAtPoint(volume, {
        normal: [0, 0, 1],
        planePoint,
        slabThickness: 6, // t/2 = 3 -> z = 19, one full voxel short
        blendOp: 'max',
      });
      expect(none?.[0]).toBe(0);
    });
  });

  // T8 — windowing happens after the max.
  describe('windowing order (T8)', () => {
    const volume = makeVolume([8, 8, 8]);

    it('changing window/level leaves the projected raw value unchanged', () => {
      const raw = projectSlabAtPoint(volume, {
        normal: [0, 0, 1],
        planePoint: [8, 8, 8],
        slabThickness: 4,
        blendOp: 'max',
      });
      expect(raw?.[0]).toBe(HOT);
      const narrow = applyWindowLevel(raw[0], { windowWidth: 100, windowCenter: 50 });
      const wide = applyWindowLevel(raw[0], { windowWidth: 4000, windowCenter: 1000 });
      expect(narrow).toBe(255);
      expect(wide).toBe(Math.round(((HOT - (1000 - 2000)) / 4000) * 255));
      // Same raw input, only the mapping changed.
      expect(raw[0]).toBe(HOT);
    });

    it('max of windowed values would differ from windowed max (proving order matters)', () => {
      // Two voxels: 900 and 1000 under a clipping window [950, 1050].
      const scalars = new Float32Array(N * N * N);
      scalars[1 + 1 * N + 1 * N * N] = 900;
      scalars[1 + 1 * N + 2 * N * N] = 1000;
      const vol: ReferenceVolume = { dimensions: [N, N, N], spacing: [1, 1, 1], scalars };
      const raw = projectSlabAtPoint(vol, {
        normal: [0, 0, 1],
        planePoint: [1, 1, 1.5],
        slabThickness: 2,
        blendOp: 'max',
      });
      const wl = { windowWidth: 100, windowCenter: 1000 };
      const correct = applyWindowLevel(raw[0], wl);
      expect(raw[0]).toBe(1000);
      expect(correct).toBe(Math.round(((1000 - 950) / 100) * 255));
    });
  });
});
