import { UpsClient } from './UpsClient';
import { TAG } from './types';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body ?? '')),
  } as Response;
}

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

  it('subscribes over a WebSocket and parses the event report', () => {
    const ws: { onmessage?: (event: { data: unknown }) => void; close: () => void } = {
      close: jest.fn(),
    };
    const openWebSocket = jest.fn(() => ws);
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: jest.fn(), openWebSocket }
    );

    const events: number[] = [];
    client.subscribe('1.2.3', 'OHIF', event => events.push(event.eventTypeId));
    ws.onmessage?.({ data: JSON.stringify({ [TAG.EventTypeID]: { vr: 'US', Value: [1] } }) });

    expect(openWebSocket).toHaveBeenCalledWith(
      'ws://origin/dicomweb/workitems/1.2.3/subscribers/OHIF'
    );
    expect(events).toEqual([1]);
  });

  it('reports an error when the channel closes without opening', () => {
    const ws: {
      onopen?: () => void;
      onmessage?: (event: { data: unknown }) => void;
      onerror?: () => void;
      onclose?: () => void;
      close: () => void;
    } = { close: jest.fn() };
    const openWebSocket = jest.fn(() => ws);
    const client = new UpsClient(
      { baseUrl: 'http://origin/dicomweb' },
      { fetchImpl: jest.fn(), openWebSocket }
    );
    const onError = jest.fn();

    client.subscribe('1.2.3', 'OHIF', jest.fn(), onError);
    ws.onclose?.();

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
