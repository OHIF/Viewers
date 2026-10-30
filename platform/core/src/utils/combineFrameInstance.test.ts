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

describe('combineFrameInstance', () => {
  it('keeps the private tag aliases on the shared copy and on each frame', () => {
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
});
