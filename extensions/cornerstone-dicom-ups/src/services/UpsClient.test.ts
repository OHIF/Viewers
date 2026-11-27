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

    // The origin subscription is deleted BEFORE the fallback callback fires, so
    // a retry cannot race the cleanup; flush the delete -> signal chain.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2); // POST (subscribe) + DELETE
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

  it('shares one subscription and one channel between watchers of the same pair', async () => {
    const ws: { onmessage?: (event: { data: unknown }) => void; close: () => void } = {
      close: jest.fn(),
    };
    const openWebSocket = jest.fn(() => ws);
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const eventsA: WorkitemEvent[] = [];
    const eventsB: WorkitemEvent[] = [];
    const handleA = await client.subscribe('1.2.3', 'OHIF', event => eventsA.push(event));
    const handleB = await client.subscribe('1.2.3', 'OHIF', event => eventsB.push(event));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(openWebSocket).toHaveBeenCalledTimes(1);

    ws.onmessage?.({
      data: JSON.stringify({
        '00001000': { vr: 'UI', Value: ['1.2.3'] },
        '00741000': { vr: 'CS', Value: ['IN PROGRESS'] },
      }),
    });
    expect(eventsA).toHaveLength(1);
    expect(eventsB).toHaveLength(1);

    handleA.close();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(fetchImpl).toHaveBeenCalledTimes(1); // no DELETE while B still watches
    expect(ws.close).not.toHaveBeenCalled();

    handleB.close();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(ws.close).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2); // POST + the single DELETE
    expect(fetchImpl).toHaveBeenLastCalledWith(
      'http://origin/dicomweb/workitems/1.2.3/subscribers/OHIF',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('joins a subscription whose setup is still in flight', async () => {
    const ws: { close: () => void } = { close: jest.fn() };
    const openWebSocket = jest.fn(() => ws);
    let settlePost: (response: Response) => void = () => {};
    const fetchImpl = jest.fn(
      () =>
        new Promise<Response>(resolve => {
          settlePost = resolve;
        })
    );
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const pendingA = client.subscribe('1.2.3', 'OHIF', jest.fn());
    const pendingB = client.subscribe('1.2.3', 'OHIF', jest.fn());
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    settlePost(jsonResponse(201, null));
    const [handleA, handleB] = await Promise.all([pendingA, pendingB]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(openWebSocket).toHaveBeenCalledTimes(1);
    handleA.close();
    handleB.close();
  });

  it('notifies every watcher of the pair when the channel drops', async () => {
    const ws: { onclose?: () => void; close: () => void } = { close: jest.fn() };
    const openWebSocket = jest.fn(() => ws);
    const fetchImpl = jest.fn(async () => jsonResponse(201, null));
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const onErrorA = jest.fn();
    const onErrorB = jest.fn();
    await client.subscribe('1.2.3', 'OHIF', jest.fn(), onErrorA);
    await client.subscribe('1.2.3', 'OHIF', jest.fn(), onErrorB);

    ws.onclose?.();

    expect(onErrorA).toHaveBeenCalledTimes(1);
    expect(onErrorB).toHaveBeenCalledTimes(1);
    // An unexpected drop leaves the origin subscription alone.
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // The entry is gone, so the next watcher subscribes again.
    await client.subscribe('1.2.3', 'OHIF', jest.fn());
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(openWebSocket).toHaveBeenCalledTimes(2);
  });

  it('reports a failed setup to a watcher that joined before the POST settled', async () => {
    const openWebSocket = jest.fn();
    let settlePost: (response: Response) => void = () => {};
    const fetchImpl = jest.fn(
      () =>
        new Promise<Response>(resolve => {
          settlePost = resolve;
        })
    );
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: fetchImpl as unknown as typeof fetch, openWebSocket }
    );

    const onErrorA = jest.fn();
    const onErrorB = jest.fn();
    const pendingA = client.subscribe('1.2.3', 'OHIF', jest.fn(), onErrorA);
    const pendingB = client.subscribe('1.2.3', 'OHIF', jest.fn(), onErrorB);
    await new Promise(resolve => setTimeout(resolve, 0));

    settlePost(jsonResponse(400, null));
    const handleA = await pendingA;
    const handleB = await pendingB;

    expect(onErrorA).toHaveBeenCalledTimes(1);
    expect(onErrorB).toHaveBeenCalledTimes(1);
    expect(openWebSocket).not.toHaveBeenCalled();
    // Nothing was subscribed, so nothing is deleted.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    handleA.close();
    handleB.close();
  });
});
