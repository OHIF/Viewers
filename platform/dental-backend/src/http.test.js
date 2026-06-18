const fs = require('fs');
const os = require('os');
const path = require('path');

const { handleDentalRequest } = require('./http');
const { DentalSQLiteStore } = require('./sqliteStore');

const config = {
  authToken: 'test-token',
  userId: 'user-a',
};

function request(store, options) {
  return handleDentalRequest(
    {
      method: options.method || 'GET',
      url: options.url,
      headers: {
        authorization: options.authorization || 'Bearer test-token',
      },
      body: options.body ? JSON.stringify(options.body) : '',
    },
    { store, config: { ...config, userId: options.userId || config.userId } }
  );
}

function parse(response) {
  return JSON.parse(response.body);
}

describe('Dental backend API', () => {
  let dir;
  let store;

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohif-dental-backend-'));
    store = await DentalSQLiteStore.create({ databasePath: path.join(dir, 'dental.sqlite') });
  });

  afterEach(() => {
    store.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects missing and invalid bearer auth', async () => {
    const missing = await handleDentalRequest(
      { method: 'GET', url: '/api/dental/state/1.2.3', headers: {}, body: '' },
      { store, config }
    );
    const invalid = await request(store, {
      url: '/api/dental/state/1.2.3',
      authorization: 'Bearer wrong-token',
    });

    expect(missing.statusCode).toBe(401);
    expect(invalid.statusCode).toBe(403);
  });

  it('allows browser CORS preflight without auth', async () => {
    const preflight = await handleDentalRequest(
      { method: 'OPTIONS', url: '/api/dental/state/1.2.3', headers: {}, body: '' },
      { store, config }
    );

    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('*');
    expect(preflight.headers['access-control-allow-headers']).toContain('authorization');
  });

  it('persists viewer state per user and study', async () => {
    const saved = await request(store, {
      method: 'PUT',
      url: '/api/dental/state/study-a',
      body: {
        state: {
          selectedToothId: 'FDI-46',
          numberingSystem: 'FDI',
          dentalTheme: true,
        },
      },
    });
    const sameUserSameStudy = await request(store, { url: '/api/dental/state/study-a' });
    const sameUserOtherStudy = await request(store, { url: '/api/dental/state/study-b' });
    const otherUserSameStudy = await request(store, {
      url: '/api/dental/state/study-a',
      userId: 'user-b',
    });

    expect(saved.statusCode).toBe(200);
    expect(parse(sameUserSameStudy).state.selectedToothId).toBe('FDI-46');
    expect(parse(sameUserOtherStudy).state).toBeNull();
    expect(parse(otherUserSameStudy).state).toBeNull();
  });

  it('creates, lists, and deletes measurements per user and study', async () => {
    const created = await request(store, {
      method: 'POST',
      url: '/api/dental/measurements/study-a',
      body: {
        label: 'PA length',
        value: 12.5,
        unit: 'mm',
        toolName: 'Length',
        annotationUID: 'annotation-1',
        presetId: 'pa-length',
        toothId: 'permanent-1',
        note: 'Distal root',
        viewportId: 'dental-current',
        displaySetInstanceUID: 'display-set-1',
        referenceSeriesUID: 'series-1',
        points: [[1, 2, 3], [4, 5, 6]],
        metadata: { source: 'preset' },
      },
    });
    const listed = await request(store, { url: '/api/dental/measurements/study-a' });
    const otherStudy = await request(store, { url: '/api/dental/measurements/study-b' });
    const otherUser = await request(store, {
      url: '/api/dental/measurements/study-a',
      userId: 'user-b',
    });
    const measurementId = parse(created).measurement.id;
    const deleted = await request(store, {
      method: 'DELETE',
      url: `/api/dental/measurements/study-a/${measurementId}`,
    });
    const afterDelete = await request(store, { url: '/api/dental/measurements/study-a' });

    expect(created.statusCode).toBe(201);
    expect(parse(created).measurement.label).toBe('PA length');
    expect(parse(created).measurement).toEqual(
      expect.objectContaining({
        presetId: 'pa-length',
        toothId: 'permanent-1',
        note: 'Distal root',
        viewportId: 'dental-current',
        displaySetInstanceUID: 'display-set-1',
        referenceSeriesUID: 'series-1',
        points: [[1, 2, 3], [4, 5, 6]],
      })
    );
    expect(parse(listed).measurements).toHaveLength(1);
    expect(parse(otherStudy).measurements).toHaveLength(0);
    expect(parse(otherUser).measurements).toHaveLength(0);
    expect(deleted.statusCode).toBe(200);
    expect(parse(afterDelete).measurements).toHaveLength(0);
  });

  it('upserts measurements by annotation UID', async () => {
    const create = body =>
      request(store, {
        method: 'POST',
        url: '/api/dental/measurements/study-a',
        body: {
          annotationUID: 'annotation-1',
          presetId: 'pa-length',
          label: 'PA length',
          unit: 'mm',
          toothId: 'permanent-1',
          ...body,
        },
      });

    await create({ value: 12 });
    await create({ value: 14.5 });
    const listed = await request(store, { url: '/api/dental/measurements/study-a' });

    expect(parse(listed).measurements).toHaveLength(1);
    expect(parse(listed).measurements[0].value).toBe(14.5);
  });

  it('persists state and measurements to the SQLite file', async () => {
    const databasePath = path.join(dir, 'persistent.sqlite');
    const persistentStore = await DentalSQLiteStore.create({ databasePath });

    await request(persistentStore, {
      method: 'PUT',
      url: '/api/dental/state/study-a',
      body: { state: { selectedToothId: 'FDI-11' } },
    });
    await request(persistentStore, {
      method: 'POST',
      url: '/api/dental/measurements/study-a',
      body: {
        label: 'Root length',
        value: 18,
        unit: 'mm',
      },
    });
    persistentStore.close();

    const reopenedStore = await DentalSQLiteStore.create({ databasePath });
    const state = await request(reopenedStore, { url: '/api/dental/state/study-a' });
    const measurements = await request(reopenedStore, { url: '/api/dental/measurements/study-a' });

    expect(parse(state).state.selectedToothId).toBe('FDI-11');
    expect(parse(measurements).measurements[0].label).toBe('Root length');

    reopenedStore.close();
  });

  it('returns 404 when deleting another user measurement', async () => {
    await request(store, {
      method: 'POST',
      url: '/api/dental/measurements/study-a',
      body: {
        label: 'Canal angle',
        value: 37,
        unit: 'deg',
      },
    });

    const listed = await request(store, { url: '/api/dental/measurements/study-a' });
    const measurementId = parse(listed).measurements[0].id;
    const deleted = await request(store, {
      method: 'DELETE',
      url: `/api/dental/measurements/study-a/${measurementId}`,
      userId: 'user-b',
    });

    expect(deleted.statusCode).toBe(404);
  });
});
