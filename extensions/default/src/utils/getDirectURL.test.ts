import getDirectURL from './getDirectURL';
import getBulkdataValue from './getBulkdataValue';
import createRenderedRetrieve from './createRenderedRetrieve';

const mockedGetBulkdataValue = getBulkdataValue as jest.Mock;
const mockedCreateRenderedRetrieve = createRenderedRetrieve as jest.Mock;

jest.mock('@ohif/core');
jest.mock('./getBulkdataValue');
jest.mock('./createRenderedRetrieve');

global.URL.createObjectURL = jest.fn(() => 'blob:') as jest.Mock;

describe('getDirectURL', () => {
  interface GetDirectURLConfig {
    singlepart: boolean | string[];
    defaultType: string;
  }

  interface GetDirectURLParams {
    tag: string;
    defaultPath: string;
    instance: {
      StudyInstanceUID: string;
      SeriesInstanceUID: string;
      SOPInstanceUID: string;
      [key: string]: unknown;
    };
    url?: string;
  }

  const config: GetDirectURLConfig = {
    singlepart: true,
    defaultType: 'video/mp4',
  };

  const params: GetDirectURLParams = {
    tag: 'PixelData',
    defaultPath: '/path/to/pixeldata',
    instance: {
      StudyInstanceUID: 'study-uid',
      SeriesInstanceUID: 'series-uid',
      SOPInstanceUID: 'sop-uid',
    },
  };

  beforeEach(() => {
    mockedGetBulkdataValue.mockClear();
    mockedCreateRenderedRetrieve.mockClear();
    (global.URL.createObjectURL as jest.Mock).mockClear();
  });

  it('should return the provided URL if it exists', () => {
    const url = 'https://example.com/direct-retrieve';

    const result = getDirectURL(config, {
      ...params,
      url: 'https://example.com/direct-retrieve',
    });

    expect(result).toBe(url);
  });

  it('should return the DirectRetrieveURL if it exists', () => {
    const value = {
      DirectRetrieveURL: 'https://example.com/direct-retrieve',
    };

    const result = getDirectURL(config, {
      ...params,
      tag: 'PixelData',
      instance: {
        ...params.instance,
        PixelData: value,
      } as GetDirectURLParams['instance'],
    });

    expect(result).toBe(value.DirectRetrieveURL);
  });

  it('should return the URL for InlineBinary', () => {
    const value = {
      InlineBinary: 'base64-encoded-data',
    };

    const result = getDirectURL(config, {
      ...params,
      tag: 'PixelData',
      instance: {
        ...params.instance,
        PixelData: value,
      } as GetDirectURLParams['instance'],
    });

    expect(result).toContain('blob:');
  });

  it('should return the BulkDataURI with defaultType if singlepart is false and there is no retrieveBulkData', () => {
    const value = {
      BulkDataURI: 'https://example.com/bulkdata',
    };

    const result = getDirectURL(
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
        } as GetDirectURLParams['instance'],
      }
    );

    expect(result).toBeUndefined();
  });

  it('should return the BulkDataURI with defaultType if singlepart is false with retrieveBulkData', async () => {
    interface PixelDataValueWithRetrieveBulkData {
      BulkDataURI: string;
      retrieveBulkData: jest.Mock<Promise<Uint8Array>, []>;
    }

    const value: PixelDataValueWithRetrieveBulkData = {
      BulkDataURI: 'https://example.com/bulkdata',
      retrieveBulkData: jest.fn().mockResolvedValueOnce(new Uint8Array([0, 1, 2])),
    };

    const result = await getDirectURL(
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
        } as GetDirectURLParams['instance'],
      }
    );

    expect(result).toContain('blob:');
  });

  it('should return the BulkDataURI with defaultType if singlepart does not include fetchPart', async () => {
    const arr = new Uint8Array([0, 1, 2]);

    interface PixelDataValueWithRetrieveBulkData {
      BulkDataURI: string;
      retrieveBulkData: jest.Mock<Promise<Uint8Array>, []>;
    }

    const value: PixelDataValueWithRetrieveBulkData = {
      BulkDataURI: 'https://example.com/bulkdata',
      retrieveBulkData: jest.fn().mockResolvedValueOnce(arr),
    };

    const result = await getDirectURL(
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
        } as GetDirectURLParams['instance'],
      }
    );

    expect(result).toContain('blob:');
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(
      new Blob([arr], { type: 'accept=video/mp4' })
    );
  });

  it('should return the URL from getBulkdataValue if it exists', () => {
    const bulkDataURL = 'https://example.com/bulkdata';

    mockedGetBulkdataValue.mockReturnValueOnce(bulkDataURL);

    const result = getDirectURL(config, params);

    expect(mockedGetBulkdataValue).toHaveBeenCalledWith(config, params);
    expect(result).toBe(bulkDataURL);
  });

  it('should return the URL from createRenderedRetrieve if getBulkdataValue returns falsy', () => {
    const renderedRetrieveURL = 'https://example.com/rendered-retrieve';

    mockedGetBulkdataValue.mockReturnValueOnce(null);
    mockedCreateRenderedRetrieve.mockReturnValueOnce(renderedRetrieveURL);

    const result = getDirectURL(config, params);

    expect(mockedGetBulkdataValue).not.toHaveBeenCalled();
    expect(mockedCreateRenderedRetrieve).toHaveBeenCalledWith(config, params);
    expect(result).toBe(renderedRetrieveURL);
  });
});
