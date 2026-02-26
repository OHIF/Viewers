jest.mock('@ohif/core', () => ({
  utils: {
    guid: jest.fn(() => 'mock-guid'),
  },
}), { virtual: true });

jest.mock('@cornerstonejs/core', () => ({
  Enums: {
    ViewportType: {
      ECG: 'ecg',
    },
  },
}), { virtual: true });

const getSopClassHandlerModule = require('../getSopClassHandlerModule').default;

const makeInstance = (overrides = {}) => ({
  Modality: 'ECG',
  SOPInstanceUID: '1.2.3.4',
  SeriesInstanceUID: '1.2.3',
  StudyInstanceUID: '1.2',
  SOPClassUID: '1.2.840.10008.5.1.4.1.1.9.1.1',
  SeriesNumber: 1,
  SeriesDate: '20240101',
  SeriesDescription: '12 Lead ECG',
  imageId: 'wadors:http://example.com/instances/1.2.3.4/frames/1',
  WaveformSequence: [{ NumberOfWaveformChannels: 12 }],
  ...overrides,
});

describe('getSopClassHandlerModule', () => {
  let getDisplaySetsFromSeries;

  beforeEach(() => {
    const [handler] = getSopClassHandlerModule({
      servicesManager: {},
      extensionManager: {},
    });
    getDisplaySetsFromSeries = handler.getDisplaySetsFromSeries;
  });

  it('returns a single handler named dicom-ecg', () => {
    const result = getSopClassHandlerModule({ servicesManager: {}, extensionManager: {} });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('dicom-ecg');
  });

  it('registers all 5 ECG SOP class UIDs', () => {
    const [handler] = getSopClassHandlerModule({ servicesManager: {}, extensionManager: {} });
    const expected = [
      '1.2.840.10008.5.1.4.1.1.9.1.1',
      '1.2.840.10008.5.1.4.1.1.9.1.2',
      '1.2.840.10008.5.1.4.1.1.9.1.3',
      '1.2.840.10008.5.1.4.1.1.9.2.1',
      '1.2.840.10008.5.1.4.1.1.9.3.1',
    ];
    expect(handler.sopClassUids).toEqual(expect.arrayContaining(expected));
    expect(handler.sopClassUids).toHaveLength(5);
  });

  it('creates one display set per instance', () => {
    const instances = [makeInstance(), makeInstance({ SOPInstanceUID: '1.2.3.5' })];
    const displaySets = getDisplaySetsFromSeries(instances);
    expect(displaySets).toHaveLength(2);
  });

  it('includes correct fields in the display set', () => {
    const instance = makeInstance();
    const [ds] = getDisplaySetsFromSeries([instance]);

    expect(ds.Modality).toBe('ECG');
    expect(ds.SeriesDescription).toBe('12 Lead ECG');
    expect(ds.SOPInstanceUID).toBe('1.2.3.4');
    expect(ds.SeriesInstanceUID).toBe('1.2.3');
    expect(ds.StudyInstanceUID).toBe('1.2');
    expect(ds.SOPClassUID).toBe('1.2.840.10008.5.1.4.1.1.9.1.1');
    expect(ds.viewportType).toBe('ecg');
    expect(ds.isDerivedDisplaySet).toBe(false);
    expect(ds.numInstances).toBe(1);
    expect(ds.numImageFrames).toBe(0);
    expect(ds.supportsWindowLevel).toBe(false);
  });

  it('sets imageIds from instance.imageId when present', () => {
    const instance = makeInstance({ imageId: 'wadors:http://example.com/1' });
    const [ds] = getDisplaySetsFromSeries([instance]);
    expect(ds.imageIds).toEqual(['wadors:http://example.com/1']);
  });

  it('sets imageIds to empty array when instance.imageId is absent', () => {
    const instance = makeInstance({ imageId: undefined });
    const [ds] = getDisplaySetsFromSeries([instance]);
    expect(ds.imageIds).toEqual([]);
  });

  it('uses "ECG" as label fallback when SeriesDescription is absent', () => {
    const instance = makeInstance({ SeriesDescription: undefined });
    const [ds] = getDisplaySetsFromSeries([instance]);
    expect(ds.label).toBe('ECG');
  });

  it('uses SeriesDescription as label when present', () => {
    const instance = makeInstance({ SeriesDescription: '12 Lead ECG' });
    const [ds] = getDisplaySetsFromSeries([instance]);
    expect(ds.label).toBe('12 Lead ECG');
  });

  it('uses "ECG" as label when SeriesDescription is an empty string', () => {
    const instance = makeInstance({ SeriesDescription: '' });
    const [ds] = getDisplaySetsFromSeries([instance]);
    expect(ds.label).toBe('ECG');
  });

  it('exposes the original instance object', () => {
    const instance = makeInstance();
    const [ds] = getDisplaySetsFromSeries([instance]);
    expect(ds.instance).toBe(instance);
    expect(ds.instances).toEqual([instance]);
  });

  it('assigns a unique displaySetInstanceUID', () => {
    const [ds] = getDisplaySetsFromSeries([makeInstance()]);
    expect(ds.displaySetInstanceUID).toBe('mock-guid');
  });
});
