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

  it('should return undefined if the value is falsy', () => {
    const result = getBulkdataValue(config, {
      ...params,
      tag: 'NonExistentTag',
    });

    expect(result).toBeUndefined();
  });

  it('should return the DirectRetrieveURL if it exists', () => {
    const value = {
      DirectRetrieveURL: 'https://example.com/direct-retrieve',
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

    expect(result).toBe(value.DirectRetrieveURL);
  });

  it('should return the URL for InlineBinary', () => {
    const value = {
      InlineBinary: 'base64-encoded-data',
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

    expect(result).toContain('blob:');
  });

  it('should return the BulkDataURI with defaultType if singlepart is false and there is no retrieveBulkData', () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata',
    };

    const result = getBulkdataValue(
      {
        ...config,
        singlepart: false,
      },
      {
        ...params,
        tag: 'PixelData',
        instance: {
          ...params.instance,
          PixelData: value,
        },
      }
    );

    expect(result).toBeUndefined();
  });

  it('should return the BulkDataURI with defaultType if singlepart is false with retrieveBulkData', async () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata',
      retrieveBulkData: jest.fn().mockResolvedValueOnce(new Uint8Array([0, 1, 2])),
    };

    const result = await getBulkdataValue(
      {
        ...config,
        singlepart: false,
      },
      {
        ...params,
        tag: 'PixelData',
        instance: {
          ...params.instance,
          PixelData: value,
        },
      }
    );

    expect(result).toContain('blob:');
  });

  it('should return the BulkDataURI with defaultType if singlepart does not include fetchPart', async () => {
    const arr = new Uint8Array([0, 1, 2]);

    const value = {
      BulkDataURI: 'https://example.com/bulkdata',
      retrieveBulkData: jest.fn().mockResolvedValueOnce(arr),
    };

    const result = await getBulkdataValue(
      {
        ...config,
        singlepart: ['audio'],
      },
      {
        ...params,
        tag: 'PixelData',
        instance: {
          ...params.instance,
          PixelData: value,
        },
      }
    );

    expect(result).toContain('blob:');
    expect(URL.createObjectURL).toHaveBeenCalledWith(new Blob([arr], { type: 'accept=video/mp4' }));
  });

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

  it('should return the BulkDataURI with defaultType if singlepart is true with accept', () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata?accept=video/mp4',
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

  it('should return the BulkDataURI with defaultType if singlepart is true without accept but query params', () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata?test=123',
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
    expect(result).toContain('test=123');
    const acceptCount = result.match(/accept=video\/mp4/g)?.length || 0;
    expect(acceptCount).toBe(1);
  });
});
