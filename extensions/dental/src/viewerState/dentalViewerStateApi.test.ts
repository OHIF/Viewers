import {
  DentalViewerStateAuthError,
  DentalViewerStateUnavailableError,
  createDentalViewerStateApi,
} from './dentalViewerStateApi';
import { DEFAULT_DENTAL_VIEWER_STATE } from './dentalViewerState';

function response(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('createDentalViewerStateApi', () => {
  it('loads persisted Dental Viewer State with bearer auth', () => {
    const fetcher = jest.fn().mockResolvedValue(
      response(200, {
        state: {
          selectedToothId: 'FDI-46',
          numberingSystem: 'FDI',
          theme: 'dental',
        },
      })
    );
    const api = createDentalViewerStateApi({
      baseUrl: 'http://localhost:4007/api/dental',
      authToken: 'token',
      fetcher,
    });

    return expect(api.load('1.2.3')).resolves.toMatchObject({
      selectedToothId: 'FDI-46',
    }).then(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'http://localhost:4007/api/dental/state/1.2.3',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ authorization: 'Bearer token' }),
        })
      );
    });
  });

  it('saves Dental Viewer State', () => {
    const fetcher = jest.fn().mockResolvedValue(response(200, { state: DEFAULT_DENTAL_VIEWER_STATE }));
    const api = createDentalViewerStateApi({
      baseUrl: 'http://localhost:4007/api/dental/',
      authToken: 'token',
      fetcher,
    });

    return api.save('study uid', DEFAULT_DENTAL_VIEWER_STATE).then(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'http://localhost:4007/api/dental/state/study%20uid',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ state: DEFAULT_DENTAL_VIEWER_STATE }),
        })
      );
    });
  });

  it('maps 401 and 403 responses to locked-state auth errors', () => {
    const fetcher = jest.fn().mockResolvedValue(response(403));
    const api = createDentalViewerStateApi({
      baseUrl: 'http://localhost:4007/api/dental',
      authToken: 'token',
      fetcher,
    });

    return expect(api.load('1.2.3')).rejects.toBeInstanceOf(DentalViewerStateAuthError);
  });

  it('maps network failures to unavailable errors', () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network down'));
    const api = createDentalViewerStateApi({
      baseUrl: 'http://localhost:4007/api/dental',
      authToken: 'token',
      fetcher,
    });

    return expect(api.load('1.2.3')).rejects.toBeInstanceOf(
      DentalViewerStateUnavailableError
    );
  });
});
