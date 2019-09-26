import { api } from 'dicomweb-client';
import { makeSeriesLoadQueue } from './seriesLoadQueue';

describe('seriesLoadQueue.js', function() {
  let seriesLoadQueue;
  const studyId = '1.2.3.4';
  const seriesIds = ['1.2.3.4.1', '1.2.3.4.2'];
  const dicomWebClient = new api.DICOMwebClient();

  beforeEach(function() {
    seriesLoadQueue = makeSeriesLoadQueue(dicomWebClient, studyId, seriesIds);
  });

  it('should create a series load queue instance', function() {
    expect(seriesLoadQueue).toBeInstanceOf(Object);
    expect(seriesLoadQueue.enqueue).toBeInstanceOf(Function);
    expect(seriesLoadQueue.dequeue).toBeInstanceOf(Function);
    expect(seriesLoadQueue.size).toBeInstanceOf(Function);
  });

  it('should have event names defined as constants', function() {
    expect(seriesLoadQueue.EVENT_SERIES_LOADED).toBeDefined();
    expect(seriesLoadQueue.EVENT_SERIES_LOAD_ERROR).toBeDefined();
  });

  it('should support retrieving the current size of the queue', async function() {
    expect(seriesLoadQueue.size()).toBe(2);
    const item = await seriesLoadQueue.dequeue();
    expect(item).toEqual(expectedResult(studyId, seriesIds[0]));
    expect(seriesLoadQueue.size()).toBe(1);
  });

  it('should support loading queued series', async function() {
    const items = [];
    items.push(await seriesLoadQueue.dequeue());
    items.push(await seriesLoadQueue.dequeue());
    expect(items).toEqual([
      expectedResult(studyId, seriesIds[0]),
      expectedResult(studyId, seriesIds[1]),
    ]);
  });

  it('should support dynamic inclusion of series in the queue', async function() {
    const additionalSeries = '1.2.3.4.3';
    const items = [];
    expect(seriesLoadQueue.size()).toBe(2);
    items.push(await seriesLoadQueue.dequeue());
    expect(seriesLoadQueue.size()).toBe(1);
    expect(seriesLoadQueue.enqueue(additionalSeries)).toBe(true);
    expect(seriesLoadQueue.size()).toBe(2);
    items.push(await seriesLoadQueue.dequeue());
    items.push(await seriesLoadQueue.dequeue());
    expect(items).toEqual([
      expectedResult(studyId, seriesIds[0]),
      expectedResult(studyId, seriesIds[1]),
      expectedResult(studyId, additionalSeries),
    ]);
  });

  it('should notify subscribers when a series is successfully dequeued', async function() {
    const handler = jest.fn();
    seriesLoadQueue.subscribe(seriesLoadQueue.EVENT_SERIES_LOADED, handler);
    await seriesLoadQueue.dequeue();
    expect(handler.mock.calls.length).toBe(1);
    expect(handler.mock.calls[0]).toEqual([
      expectedResult(studyId, seriesIds[0]),
      seriesLoadQueue,
      seriesLoadQueue.EVENT_SERIES_LOADED,
    ]);
  });

  it('should notify subscribers when a series dequeue fails', async function() {
    const error = new Error('Oops!');
    const handler = jest.fn();
    dicomWebClient.retrieveSeriesMetadata.mockRejectedValueOnce(error);
    seriesLoadQueue.subscribe(seriesLoadQueue.EVENT_SERIES_LOAD_ERROR, handler);
    try {
      await seriesLoadQueue.dequeue();
    } catch (e) {
      expect(e).toBe(error);
      expect(handler.mock.calls.length).toBe(1);
      expect(handler.mock.calls[0]).toEqual([
        error,
        seriesLoadQueue,
        seriesLoadQueue.EVENT_SERIES_LOAD_ERROR,
      ]);
    }
  });
});

function expectedResult(studyInstanceUID, seriesInstanceUID) {
  return {
    seriesInstanceUID,
    instances: [{ studyInstanceUID, seriesInstanceUID }],
  };
}
