import {
  DentalMeasurementsAuthError,
  createDentalMeasurementsApi,
} from './dentalMeasurementsApi';

function response(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('createDentalMeasurementsApi', () => {
  const measurement = {
    annotationUID: 'annotation-1',
    presetId: 'pa-length',
    label: 'PA length',
    unit: 'mm',
    value: 12,
    toothId: 'permanent-1',
    note: null,
    toolName: 'Length',
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-06-18T00:00:00.000Z',
  } as const;

  it('loads measurements with bearer auth', async () => {
    const fetcher = jest.fn().mockResolvedValue(response(200, { measurements: [measurement] }));
    const api = createDentalMeasurementsApi({
      baseUrl: 'http://localhost:4007/api/dental',
      authToken: 'token',
      fetcher,
    });

    await expect(api.load('study/1')).resolves.toEqual([measurement]);
    expect(fetcher).toHaveBeenCalledWith(
      'http://localhost:4007/api/dental/measurements/study%2F1',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer token' }),
      })
    );
  });

  it('upserts and deletes by annotation UID', async () => {
    const fetcher = jest.fn().mockResolvedValue(response(200));
    const api = createDentalMeasurementsApi({
      baseUrl: 'http://localhost:4007/api/dental',
      authToken: 'token',
      fetcher,
    });

    await api.upsert('study-1', measurement as never);
    await api.remove('study-1', 'annotation/1');

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'http://localhost:4007/api/dental/measurements/study-1',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'http://localhost:4007/api/dental/measurements/study-1/annotation%2F1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('maps auth failures to locked errors', async () => {
    const api = createDentalMeasurementsApi({
      baseUrl: 'http://localhost:4007/api/dental',
      authToken: 'token',
      fetcher: jest.fn().mockResolvedValue(response(403)),
    });

    await expect(api.load('study-1')).rejects.toBeInstanceOf(DentalMeasurementsAuthError);
  });
});
