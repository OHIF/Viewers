import dcmjs from '@dcmjs-org/dcmjs';
import loadRTStruct from './loadRTStruct';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

// An RTSTRUCT with one ROI and one contour, as dcmjs naturalizes DICOMweb JSON.
// A one-item sequence is then the item object, not an array.
function oneRoiRTStruct() {
  return naturalizeDataset({
    '00080016': { vr: 'UI', Value: ['1.2.840.10008.5.1.4.1.1.481.3'] },
    '0020000E': { vr: 'UI', Value: ['1.2.3.4'] },
    '30060002': { vr: 'SH', Value: ['Structures'] },
    '30060020': {
      vr: 'SQ',
      Value: [{ '30060022': { vr: 'IS', Value: [1] }, '30060026': { vr: 'LO', Value: ['GTV'] } }],
    },
    '30060039': {
      vr: 'SQ',
      Value: [
        {
          '30060084': { vr: 'IS', Value: [1] },
          '30060040': {
            vr: 'SQ',
            Value: [
              {
                '30060042': { vr: 'CS', Value: ['CLOSED_PLANAR'] },
                '30060046': { vr: 'IS', Value: [2] },
                '30060050': { vr: 'DS', Value: [0, 0, 0, 1, 1, 0] },
              },
            ],
          },
        },
      ],
    },
  });
}

function makeExtensionManager() {
  const dataSource = {
    getConfig: () => ({ bulkDataURI: { enabled: true } }),
    retrieve: { bulkDataURI: jest.fn() },
  };
  return { getActiveDataSource: () => [dataSource] };
}

describe('loadRTStruct', () => {
  it('loads an RTSTRUCT that has one ROI and one contour', async () => {
    const rtStructDisplaySet = { instance: oneRoiRTStruct() };

    const structureSet = await loadRTStruct(makeExtensionManager(), rtStructDisplaySet, {});

    expect(structureSet.ROIContours).toHaveLength(1);
    const [roi] = structureSet.ROIContours;
    expect(roi.ROIName).toBe('GTV');
    expect(roi.contourPoints).toHaveLength(1);
    expect(roi.contourPoints[0].points).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
    ]);
  });
});
