import { api } from 'dicomweb-client';
import { makePubSub } from '../../../lib/pubSub';

const STUDY_ID = Symbol('StudyId');
const SERIES_IDS = Symbol('SeriesIds');
const DICOM_WEB_CLIENT = Symbol('DicomWebClient');
const EVENT_SERIES_LOADED = 'seriesLoaded';
const EVENT_SERIES_LOAD_ERROR = 'seriesLoadError';

const seriesLoadQueueProto = makePubSub({
  EVENT_SERIES_LOADED,
  EVENT_SERIES_LOAD_ERROR,
  enqueue(entry) {
    return enqueue(this, entry);
  },
  dequeue() {
    return dequeue(this);
  },
});

function enqueue(queue, seriesId) {
  if (isValidId(seriesId)) {
    queue[SERIES_IDS].unshift(seriesId);
    return true;
  }
  return false;
}

function dequeue(queue) {
  const seriesId = queue[SERIES_IDS].pop();
  if (seriesId) {
    const promise = queue[DICOM_WEB_CLIENT].retrieveSeriesMetadata({
      studyInstanceUID: queue[STUDY_ID],
      seriesInstanceUID: seriesId,
    }).then(result => ({ seriesInstanceUID: seriesId, instances: result }));
    promise.then(
      result => void queue.publish(EVENT_SERIES_LOADED, result),
      error => void queue.publish(EVENT_SERIES_LOAD_ERROR, error)
    );
    return promise;
  }
}

function isValidId(subject) {
  return typeof subject === 'string' && subject.length > 0;
}

function makeSeriesLoadQueue(dicomWebClient, studyId, givenSeriesIds) {
  if (
    dicomWebClient instanceof api.DICOMwebClient &&
    isValidId(studyId) &&
    Array.isArray(givenSeriesIds)
  ) {
    const queue = Object.create(seriesLoadQueueProto);
    const seriesIds = [];
    for (let i = givenSeriesIds.length - 1; i >= 0; --i) {
      const seriesId = givenSeriesIds[i];
      if (isValidId(seriesId)) {
        seriesIds.push(seriesId);
      }
    }
    Object.defineProperty(queue, STUDY_ID, { value: studyId });
    Object.defineProperty(queue, SERIES_IDS, { value: seriesIds });
    Object.defineProperty(queue, DICOM_WEB_CLIENT, { value: dicomWebClient });
    return queue;
  }
  return null;
}

export { makeSeriesLoadQueue };
