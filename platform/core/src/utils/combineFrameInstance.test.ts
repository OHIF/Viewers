import dcmjs from '@dcmjs-org/dcmjs';
import combineFrameInstance from './combineFrameInstance';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

const frameGroup = value => ({
  vr: 'SQ',
  Value: [
    {
      '20050010': { vr: 'LO', Value: ['Philips MR Imaging DD 005'] },
      '2005100D': { vr: 'DS', Value: [value] },
    },
  ],
});

const axial = [1, 0, 0, 0, 1, 0];

describe('combineFrameInstance', () => {
  // The API must do this.
  it('keeps the private tag aliases of the root and of the private frame macros', () => {
    const instance = naturalizeDataset({
      '00280008': { vr: 'IS', Value: [2] },
      '70530010': { vr: 'LO', Value: ['Philips PET Private Group'] },
      '70531009': { vr: 'DS', Value: [1.88] },
      '52009229': { vr: 'SQ', Value: [{}] },
      '52009230': {
        vr: 'SQ',
        Value: [{ '00211001': frameGroup(1) }, { '00211001': frameGroup(2) }],
      },
    });

    const frame1 = combineFrameInstance(1, instance);
    const frame2 = combineFrameInstance(2, instance);

    expect(frame1['70531009']).toEqual([1.88]);
    expect(frame2['70531009']).toEqual([1.88]);
    expect(frame1['2005100D']).toEqual([1]);
    expect(frame2['2005100D']).toEqual([2]);
  });

  // The API must do this.
  it('gives a cached frame view with the per-frame position and a non-enumerable frameNumber', () => {
    const instance = {
      NumberOfFrames: 2,
      ImagePositionPatient: [9, 9, 9],
      SharedFunctionalGroupsSequence: [{ PixelMeasuresSequence: [{ PixelSpacing: [2, 2] }] }],
      PerFrameFunctionalGroupsSequence: [
        { PlanePositionSequence: [{ ImagePositionPatient: [0, 0, 1] }] },
        { PlanePositionSequence: [{ ImagePositionPatient: [0, 0, 2] }] },
      ],
    };

    const frame2 = combineFrameInstance('2', instance);

    expect(frame2.ImagePositionPatient).toEqual([0, 0, 2]);
    expect(frame2.PixelSpacing).toEqual([2, 2]);
    expect(frame2.frameNumber).toBe(2);
    expect(Object.keys(frame2)).not.toContain('frameNumber');
    expect(combineFrameInstance(2, instance)).toBe(frame2);
  });

  // The user experience must have this: NM and RTDOSE frames show at their own positions.
  it('computes the NM and RTDOSE frame positions', () => {
    const nm = {
      NumberOfFrames: 3,
      SpacingBetweenSlices: 5,
      DetectorInformationSequence: [
        { ImagePositionPatient: [0, 0, 10], ImageOrientationPatient: axial },
      ],
    };
    const rtdose = {
      NumberOfFrames: 3,
      ImagePositionPatient: [0, 0, 10],
      ImageOrientationPatient: axial,
      GridFrameOffsetVector: [0, 2, 4],
    };

    expect(combineFrameInstance(3, nm).ImagePositionPatient).toEqual([0, 0, 20]);
    expect(combineFrameInstance(3, nm).ImageOrientationPatient).toEqual(axial);
    expect(combineFrameInstance(3, rtdose).ImagePositionPatient).toEqual([0, 0, 14]);
    expect(combineFrameInstance(3, { NumberOfFrames: 3 }).ImagePositionPatient).toEqual([0, 0, 3]);
  });
});
