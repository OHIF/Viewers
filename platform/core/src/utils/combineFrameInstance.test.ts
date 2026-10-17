import combineFrameInstance from './combineFrameInstance';

describe('combineFrameInstance', () => {
  it('places each RTDOSE frame at its GridFrameOffsetVector offset along the slice normal', () => {
    const rtDose = {
      Modality: 'RTDOSE',
      NumberOfFrames: 3,
      ImagePositionPatient: [84.9602, 99.4275, -1461.54],
      ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      GridFrameOffsetVector: [0, 4, 8],
    };

    const positions = [1, 2, 3].map(
      frame => combineFrameInstance(frame, rtDose).ImagePositionPatient
    );

    const expected = [
      [84.9602, 99.4275, -1461.54],
      [84.9602, 99.4275, -1457.54],
      [84.9602, 99.4275, -1453.54],
    ];
    positions.forEach((position, frame) => {
      expected[frame].forEach((value, axis) => expect(position[axis]).toBeCloseTo(value));
    });
  });

  it('returns the same RTDOSE frame position when a frame is combined again', () => {
    const rtDose = {
      Modality: 'RTDOSE',
      NumberOfFrames: 3,
      ImagePositionPatient: [84.9602, 99.4275, -1461.54],
      ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      GridFrameOffsetVector: [0, 4, 8],
    };

    combineFrameInstance(2, rtDose);
    const position = combineFrameInstance(2, rtDose).ImagePositionPatient;

    expect(position[2]).toBeCloseTo(-1457.54);
  });

  it('gives a multi-frame image without position or offsets a distinct position per frame', () => {
    const multiFrame = {
      Modality: 'OT',
      NumberOfFrames: 3,
    };

    expect(combineFrameInstance(2, multiFrame).ImagePositionPatient).toEqual([0, 0, 2]);
    expect(combineFrameInstance(3, multiFrame).ImagePositionPatient).toEqual([0, 0, 3]);
  });
});
