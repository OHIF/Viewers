import {
  getDicomJSONImageId,
  getDicomJSONImageIdsForDisplaySet,
  getInstanceMetadata,
} from './index';

jest.mock('@ohif/core', () => ({
  DicomMetadataStore: {},
  IWebApiDataSource: {
    create: jest.fn(implementation => implementation),
  },
  classes: {
    MetadataProvider: {
      addImageIdToUIDs: jest.fn(),
    },
  },
  utils: {
    addAccessors: jest.fn(sequence => sequence),
  },
}));

describe('DicomJSONDataSource helpers', () => {
  const study = {
    StudyInstanceUID: 'study-uid',
    PatientID: 'patient-id',
  };

  const baseSeries = {
    SeriesInstanceUID: 'series-uid',
    Modality: 'XA',
    SeriesNumber: 3,
  };

  const baseMetadata = {
    StudyInstanceUID: 'study-uid',
    SeriesInstanceUID: 'series-uid',
    SOPInstanceUID: 'sop-uid',
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.12.1',
    Rows: 512,
    Columns: 512,
  };

  it('keeps per-frame DICOM JSON instances as single-frame instances', () => {
    const instances = [
      {
        metadata: { ...baseMetadata, InstanceNumber: 1 },
        url: 'wadouri:https://example.com/xray.dcm&frame=1',
      },
      {
        metadata: { ...baseMetadata, InstanceNumber: 2 },
        url: 'wadouri:https://example.com/xray.dcm&frame=2',
      },
    ];
    const series = {
      ...baseSeries,
      NumberOfFrames: 2,
      instances,
    };

    const first = getInstanceMetadata({
      instance: instances[0],
      series,
      study,
      imageId: instances[0].url,
    });
    const second = getInstanceMetadata({
      instance: instances[1],
      series,
      study,
      imageId: instances[1].url,
    });

    expect(first.NumberOfFrames).toBeUndefined();
    expect(second.NumberOfFrames).toBeUndefined();
    expect(first.imageId).toBe('wadouri:https://example.com/xray.dcm&frame=1');
    expect(second.imageId).toBe('wadouri:https://example.com/xray.dcm&frame=2');
  });

  it('preserves series-level NumberOfFrames for a single multiframe instance', () => {
    const instance = {
      metadata: baseMetadata,
      url: 'wadouri:https://example.com/xray.dcm',
    };
    const series = {
      ...baseSeries,
      NumberOfFrames: 2,
      instances: [instance],
    };

    const result = getInstanceMetadata({
      instance,
      series,
      study,
      imageId: instance.url,
    });

    expect(result.NumberOfFrames).toBe(2);
  });

  it('appends a frame query to DICOM JSON instance URLs only when needed', () => {
    expect(
      getDicomJSONImageId({
        instance: { url: 'wadouri:https://example.com/xray.dcm' },
        frame: 0,
      })
    ).toBe('wadouri:https://example.com/xray.dcm&frame=0');

    expect(
      getDicomJSONImageId({
        instance: { url: 'wadouri:https://example.com/xray.dcm&frame=1' },
        frame: 0,
      })
    ).toBe('wadouri:https://example.com/xray.dcm&frame=1');
  });

  it('keeps generated WADO imageIds working when no DICOM JSON url is present', () => {
    expect(
      getDicomJSONImageId({
        instance: baseMetadata,
        frame: 1,
        config: {
          wadoUriRoot: 'https://example.com/wado',
        },
      })
    ).toContain('&frame=1');
  });

  it('returns the current per-frame URL when DICOM JSON repeats a SOPInstanceUID', () => {
    const seriesInstances = [
      {
        metadata: { ...baseMetadata, InstanceNumber: 1 },
        url: 'wadouri:https://example.com/xray.dcm&frame=1',
      },
      {
        metadata: { ...baseMetadata, InstanceNumber: 2 },
        url: 'wadouri:https://example.com/xray.dcm&frame=2',
      },
    ];
    const displaySet = {
      images: [
        { ...baseMetadata, InstanceNumber: 1, url: seriesInstances[0].url },
        { ...baseMetadata, InstanceNumber: 2, url: seriesInstances[1].url },
      ],
    };

    expect(getDicomJSONImageIdsForDisplaySet({ displaySet, seriesInstances })).toEqual([
      'wadouri:https://example.com/xray.dcm&frame=1',
      'wadouri:https://example.com/xray.dcm&frame=2',
    ]);
  });

  it('expands a single DICOM JSON multiframe instance into frame imageIds', () => {
    const seriesInstances = [
      {
        metadata: baseMetadata,
        url: 'wadouri:https://example.com/xray.dcm',
      },
    ];
    const displaySet = {
      images: [
        {
          ...baseMetadata,
          NumberOfFrames: 2,
          url: seriesInstances[0].url,
        },
      ],
    };

    expect(getDicomJSONImageIdsForDisplaySet({ displaySet, seriesInstances })).toEqual([
      'wadouri:https://example.com/xray.dcm&frame=0',
      'wadouri:https://example.com/xray.dcm&frame=1',
    ]);
  });
});
