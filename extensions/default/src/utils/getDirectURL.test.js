import getDirectURL from './getDirectURL';
import getBulkdataValue from './getBulkdataValue';
import createRenderedRetrieve from './createRenderedRetrieve';

jest.mock('./getBulkdataValue');
jest.mock('./createRenderedRetrieve');

describe('getDirectURL', () => {
  const config = {
    singlepart: true,
    defaultType: 'video/mp4',
  };

  const params = {
    tag: 'PixelData',
    defaultPath: '/path/to/pixeldata',
    instance: {
      StudyInstanceUID: 'study-uid',
      SeriesInstanceUID: 'series-uid',
      SOPInstanceUID: 'sop-uid',
    },
  };

  it('should return the provided URL if it exists', () => {
    const url = 'https://example.com/direct-retrieve';

    const result = getDirectURL(config, {
      ...params,
      url: 'https://example.com/direct-retrieve',
    });

    expect(result).toBe(url);
  });

  it('should return the URL from getBulkdataValue if it exists', () => {
    const bulkDataURL = 'https://example.com/bulkdata';

    getBulkdataValue.mockReturnValueOnce(bulkDataURL);

    const result = getDirectURL(config, params);

    expect(getBulkdataValue).toHaveBeenCalledWith(config, params);
    expect(result).toBe(bulkDataURL);
  });

  it('should return the URL from createRenderedRetrieve if getBulkdataValue returns falsy', () => {
    const renderedRetrieveURL = 'https://example.com/rendered-retrieve';

    getBulkdataValue.mockReturnValueOnce(null);
    createRenderedRetrieve.mockReturnValueOnce(renderedRetrieveURL);

    const result = getDirectURL(config, params);

    expect(getBulkdataValue).toHaveBeenCalledWith(config, params);
    expect(createRenderedRetrieve).toHaveBeenCalledWith(config, params);
    expect(result).toBe(renderedRetrieveURL);
  });
});
