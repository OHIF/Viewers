import mockAxios from 'axios';
import { API } from '.';

describe('API', () => {
  const url = 'fakeUrl';

  afterEach(() => {
    mockAxios.reset();
    mockAxios.request.mockReset();
  });

  it('GET: should retrieve expected data', async () => {
    const stubResponse = { status: 200, data: {} };

    mockAxios.request.mockResolvedValueOnce(stubResponse);

    const response = await API.GET({ url });

    expect(mockAxios.request).toHaveBeenCalled();
    expect(response).toEqual(stubResponse);
  });

  it('GET: should return error message', async () => {
    const errorMessage = 'error!';
    mockAxios.request.mockRejectedValue(new Error(errorMessage));

    try {
      await API.GET({ url: 'invalidUrl' });
    } catch (err) {
      expect(mockAxios.request).toHaveBeenCalled();
      expect(err).toEqual(errorMessage);
    }
  });

  it('PUT: should successfuly update data', async () => {
    const stubResponse = {
      name: 'test',
      updatedAt: 'date',
    };

    mockAxios.request.mockResolvedValueOnce(stubResponse);

    const response = await API.PUT({ url, data: {} });

    expect(mockAxios.request).toHaveBeenCalled();
    expect(response).toEqual(stubResponse);
  });

  it('POST: should successfuly create data', async () => {
    const stubResponse = {
      name: 'test',
      id: 1,
    };

    mockAxios.request.mockResolvedValueOnce(stubResponse);

    const response = await API.PUT({ url, data: {} });

    expect(mockAxios.request).toHaveBeenCalled();
    expect(response).toEqual(stubResponse);
  });

  it('DELETE: should successfuly delete data', async () => {
    const stubResponse = { status: 200 };

    mockAxios.request.mockResolvedValueOnce(stubResponse);

    const response = await API.DELETE({ url });

    expect(mockAxios.request).toHaveBeenCalled();
    expect(response).toEqual(stubResponse);
  });
});
