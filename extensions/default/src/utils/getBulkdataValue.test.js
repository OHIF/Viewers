import getBulkdataValue from './getBulkdataValue';

jest.mock('@ohif/core');

global.URL.createObjectURL = jest.fn(() => 'blob:');

describe('getBulkdataValue', () => {
  const config = {
    singlepart: true,
  };

  const params = {
    instance: {
      StudyInstanceUID: 'study-uid',
      SeriesInstanceUID: 'series-uid',
      SOPInstanceUID: 'sop-uid',
    },
  };

  it('should return the BulkDataURI with defaultType if singlepart is true without accept', () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata',
      retrieveBulkData: jest.fn().mockResolvedValueOnce(new Uint8Array([0, 1, 2])),
    };

    const result = getBulkdataValue(config, {
      ...params,
      tag: 'PixelData',
      instance: {
        ...params.instance,
        PixelData: value,
      },
    });

    expect(result).toContain(value.BulkDataURI);
    expect(result).toContain('accept=video/mp4');
    const acceptCount = result.match(/accept=video\/mp4/g)?.length || 0;
    expect(acceptCount).toBe(1);
  });

  it('should return the BulkDataURI with accept', () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata?accept=video/mp4',
    };

    const result = getBulkdataValue(config, {
      ...params,
      tag: 'PixelData',
      instance: {
        ...params.instance,
        PixelData: value,
      },
    });

    expect(result).toContain(value.BulkDataURI);
    expect(result).toContain('accept=video/mp4');
    const acceptCount = result.match(/accept=video\/mp4/g)?.length || 0;
    expect(acceptCount).toBe(1);
  });

  it('should return the BulkDataURI with accept and query params', () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata?test=123',
    };

    const result = getBulkdataValue(config, {
      ...params,
      tag: 'PixelData',
      instance: {
        ...params.instance,
        PixelData: value,
      },
    });

    expect(result).toContain(value.BulkDataURI);
    expect(result).toContain('accept=video/mp4');
    expect(result).toContain('test=123');
    const acceptCount = result.match(/accept=video\/mp4/g)?.length || 0;
    expect(acceptCount).toBe(1);
  });

  it('should return default path with accept', () => {
    const value = {
      BulkDataURI: null,
    };

    const defaultPath = '/testing';
    const defaultURI = `series/${params.instance.SeriesInstanceUID}/instances/${params.instance.SOPInstanceUID}${defaultPath}`;

    const result = getBulkdataValue(config, {
      ...params,
      defaultPath,
      tag: 'PixelData',
      instance: {
        ...params.instance,
        PixelData: value,
      },
    });

    expect(result).toContain(defaultURI);
    expect(result).toContain('accept=video/mp4');
    const acceptCount = result.match(/accept=video\/mp4/g)?.length || 0;
    expect(acceptCount).toBe(1);
  });
});
