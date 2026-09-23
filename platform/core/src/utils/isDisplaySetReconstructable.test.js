import isDisplaySetReconstructable, {
  hasSingleSpatialLocation,
  getPerFramePositions,
} from './isDisplaySetReconstructable';

const singleFrameInstance = imagePositionPatient => ({
  NumberOfFrames: 1,
  Rows: 256,
  Columns: 256,
  SamplesPerPixel: 1,
  ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
  ImagePositionPatient: imagePositionPatient,
});

const multiFrameInstance = framePositions => ({
  NumberOfFrames: framePositions.length,
  Modality: 'MR',
  PixelSpacing: [1, 1],
  SliceThickness: 5,
  ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
  ImagePositionPatient: framePositions[0],
  PerFrameFunctionalGroupsSequence: framePositions.map(position => ({
    PlanePositionSequence: [{ ImagePositionPatient: position }],
  })),
});

describe('isDisplaySetReconstructable — single spatial location (cine / multi-time)', () => {
  describe('hasSingleSpatialLocation', () => {
    test('true when every position collapses within tolerance', () => {
      expect(
        hasSingleSpatialLocation([
          [0, 0, 0],
          [0, 0, 0.005],
          [0.001, 0, 0],
        ])
      ).toBe(true);
    });

    test('false when positions span a real through-plane extent', () => {
      expect(
        hasSingleSpatialLocation([
          [0, 0, 0],
          [0, 0, 2],
          [0, 0, 4],
        ])
      ).toBe(false);
    });

    test('false when fewer than two positions are known (cannot decide)', () => {
      expect(hasSingleSpatialLocation([[0, 0, 0]])).toBe(false);
      expect(hasSingleSpatialLocation([])).toBe(false);
    });

    test('ignores malformed positions before deciding', () => {
      expect(hasSingleSpatialLocation([[0, 0, 0], undefined, [Number.NaN, 0, 0]])).toBe(false);
    });
  });

  describe('getPerFramePositions', () => {
    test('reads ImagePositionPatient from the per-frame functional groups', () => {
      const instance = multiFrameInstance([
        [0, 0, 0],
        [0, 0, 1],
      ]);
      expect(getPerFramePositions(instance)).toEqual([
        [0, 0, 0],
        [0, 0, 1],
      ]);
    });

    test('empty when the per-frame sequence is absent', () => {
      expect(getPerFramePositions({})).toEqual([]);
    });

    test('falls back to the shared functional group broadcast to the frame count', () => {
      const sharedLocationCine = {
        NumberOfFrames: 3,
        SharedFunctionalGroupsSequence: [
          { PlanePositionSequence: [{ ImagePositionPatient: [0, 0, 0] }] },
        ],
        PerFrameFunctionalGroupsSequence: [{}, {}, {}],
      };
      expect(getPerFramePositions(sharedLocationCine)).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    });

    test('empty when neither per-frame nor shared groups carry a position', () => {
      expect(getPerFramePositions({ PerFrameFunctionalGroupsSequence: [{}, {}] })).toEqual([]);
    });

    test('falls back to the shared group when the per-frame groups are too sparse to judge', () => {
      // A lone per-frame position can't establish an extent either way, so it
      // must not shadow a shared position that shows the frames are co-located.
      const sparsePerFrameCine = {
        NumberOfFrames: 3,
        SharedFunctionalGroupsSequence: [
          { PlanePositionSequence: [{ ImagePositionPatient: [0, 0, 0] }] },
        ],
        PerFrameFunctionalGroupsSequence: [
          { PlanePositionSequence: [{ ImagePositionPatient: [0, 0, 0] }] },
          {},
          {},
        ],
      };
      expect(getPerFramePositions(sparsePerFrameCine)).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    });
  });

  describe('multi-frame instances', () => {
    test('not reconstructable when every frame shares one location', () => {
      const cine = multiFrameInstance([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
      expect(isDisplaySetReconstructable([cine]).value).toBe(false);
    });

    test('not reconstructable when the constant location lives in the shared group', () => {
      const sharedLocationCine = {
        NumberOfFrames: 3,
        Modality: 'MR',
        PixelSpacing: [1, 1],
        SliceThickness: 5,
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
        ImagePositionPatient: [0, 0, 0],
        SharedFunctionalGroupsSequence: [
          { PlanePositionSequence: [{ ImagePositionPatient: [0, 0, 0] }] },
        ],
        PerFrameFunctionalGroupsSequence: [{}, {}, {}],
      };
      expect(isDisplaySetReconstructable([sharedLocationCine]).value).toBe(false);
    });

    test('reconstructable when frames span multiple locations', () => {
      const volume = multiFrameInstance([
        [0, 0, 0],
        [0, 0, 2],
        [0, 0, 4],
      ]);
      expect(isDisplaySetReconstructable([volume]).value).toBe(true);
    });
  });

  describe('single-frame instances', () => {
    test('not reconstructable when every instance shares one location', () => {
      const instances = [
        singleFrameInstance([0, 0, 0]),
        singleFrameInstance([0, 0, 0]),
        singleFrameInstance([0, 0, 0]),
      ];
      expect(isDisplaySetReconstructable(instances).value).toBe(false);
    });

    test('reconstructable for a real volume with through-plane extent', () => {
      const instances = [
        singleFrameInstance([0, 0, 0]),
        singleFrameInstance([0, 0, 2]),
        singleFrameInstance([0, 0, 4]),
      ];
      expect(isDisplaySetReconstructable(instances).value).toBe(true);
    });

    test('not reconstructable when exactly two instances share one location', () => {
      // The spacing check only runs for more than two instances, so this pair is
      // caught by the single-location guard alone.
      const instances = [singleFrameInstance([0, 0, 0]), singleFrameInstance([0, 0, 0])];
      expect(isDisplaySetReconstructable(instances).value).toBe(false);
    });
  });
});
