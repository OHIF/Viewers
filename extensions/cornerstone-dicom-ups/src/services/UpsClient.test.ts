import { UpsClient, WorkitemEvent } from './UpsClient';
import { TAG } from './types';

/** Builds a minimal Response stub with the given status and JSON body. */
function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body ?? '')),
  } as Response;
}

/** Builds an UpsClient wired to the given fetch stub and a mocked WebSocket. */
function makeClient(fetchImpl: typeof fetch) {
  return new UpsClient(
    { baseUrl: 'http://origin/dicomweb/' },
    { fetchImpl, openWebSocket: jest.fn() }
  );
}

describe('UpsClient', () => {
  it('creates a workitem with the SOP Instance UID in the query parameter', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    const uid = await client.createWorkitem('1.2.3', {});

    expect(uid).toBe('1.2.3');
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://origin/dicomweb/workitems?workitem=1.2.3',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('searches workitems with the Referenced Request Sequence study key', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(200, []));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    await client.searchWorkitems({
      studyInstanceUid: '1.2.3',
      patientId: 'P1',
      includeAllFields: true,
    });

    const url = fetchImpl.mock.calls[0][0] as string;
    expect(url).toContain('/workitems?');
    expect(url).toContain('0040A370.0020000D=1.2.3');
    expect(url).toContain('00100020=P1');
    expect(url).toContain('includefield=all');
  });

  it('requests cancellation on the cancelrequest resource', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(200, null));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    await client.cancelWorkitem('1.2.3');

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://origin/dicomweb/workitems/1.2.3/cancelrequest',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws on a non-2xx response', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(404, null));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    await expect(client.retrieveWorkitem('1.2.3')).rejects.toThrow(/404/);
  });

  it('creates the subscription then opens the notification channel and parses the state', async () => {
    const ws: { onmessage?: (event: { data: unknown }) => void; close: () => void } = {
      close: jest.fn(),
    };
    const openWebSocket = jest.fn(() => ws);
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const events: WorkitemEvent[] = [];
    const handle = await client.subscribe('1.2.3', 'OHIF', event => events.push(event));
    ws.onmessage?.({
      data: JSON.stringify({
        '00001000': { vr: 'UI', Value: ['1.2.3'] },
        '00001002': { vr: 'US', Value: [1] },
        '00741000': { vr: 'CS', Value: ['IN PROGRESS'] },
      }),
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://origin/dicomweb/workitems/1.2.3/subscribers/OHIF',
      expect.objectContaining({ method: 'POST' })
    );
    expect(openWebSocket).toHaveBeenCalledWith('ws://origin/dicomweb/subscribers/OHIF');
    expect(events[0].affectedSopInstanceUid).toBe('1.2.3');
    expect(events[0].eventTypeId).toBe(1);
    expect(events[0].dataset[TAG.ProcedureStepState]).toEqual({ vr: 'CS', Value: ['IN PROGRESS'] });
    handle.close();
  });

  it('reports an error when the channel closes without opening', async () => {
    const ws: {
      onopen?: () => void;
      onmessage?: (event: { data: unknown }) => void;
      onerror?: () => void;
      onclose?: () => void;
      close: () => void;
    } = { close: jest.fn() };
    const openWebSocket = jest.fn(() => ws);
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );
    const onError = jest.fn();

    await client.subscribe('1.2.3', 'OHIF', jest.fn(), onError);
    ws.onclose?.();

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('falls back when the subscription POST fails', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(400, null));
    const openWebSocket = jest.fn();
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );
    const onError = jest.fn();

    const handle = await client.subscribe('1.2.3', 'OHIF', jest.fn(), onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(openWebSocket).not.toHaveBeenCalled();
    handle.close();
  });

  it('falls back when opening the WebSocket throws', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const openWebSocket = jest.fn(() => {
      throw new Error('mixed-content ws:// URL');
    });
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );
    const onError = jest.fn();

    const handle = await client.subscribe('1.2.3', 'OHIF', jest.fn(), onError);

    expect(onError).toHaveBeenCalledTimes(1);
    handle.close();
  });

  it('drops notifications for other workitems', async () => {
    const ws: { onmessage?: (event: { data: unknown }) => void; close: () => void } = {
      close: jest.fn(),
    };
    const openWebSocket = jest.fn(() => ws);
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const events: WorkitemEvent[] = [];
    const handle = await client.subscribe('1.2.3', 'OHIF', event => events.push(event));
    ws.onmessage?.({
      data: JSON.stringify({
        '00001000': { vr: 'UI', Value: ['9.9.9'] },
        '00741000': { vr: 'CS', Value: ['IN PROGRESS'] },
      }),
    });

    expect(events).toEqual([]);
    handle.close();
  });

  it('drops a frame that names no workitem', async () => {
    const ws: { onmessage?: (event: { data: unknown }) => void; close: () => void } = {
      close: jest.fn(),
    };
    const openWebSocket = jest.fn(() => ws);
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const events: WorkitemEvent[] = [];
    const handle = await client.subscribe('1.2.3', 'OHIF', event => events.push(event));
    ws.onmessage?.({
      data: JSON.stringify({ '00741000': { vr: 'CS', Value: ['IN PROGRESS'] } }),
    });

    expect(events).toEqual([]);
    handle.close();
  });

  it('drops a malformed notification frame', async () => {
    const ws: { onmessage?: (event: { data: unknown }) => void; close: () => void } = {
      close: jest.fn(),
    };
    const openWebSocket = jest.fn(() => ws);
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const events: WorkitemEvent[] = [];
    const handle = await client.subscribe('1.2.3', 'OHIF', event => events.push(event));
    expect(() => ws.onmessage?.({ data: 'not json' })).not.toThrow();

    expect(events).toEqual([]);
    handle.close();
  });

  it('returns an empty list for a 204 No Content search response', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(204, null));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    const items = await client.searchWorkitems({ studyInstanceUid: '1.2.3' });

    expect(items).toEqual([]);
  });
});
