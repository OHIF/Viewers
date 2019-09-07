/**
 * Module: seriesLoadQueue.js
 * This module represents a queue of series from a given study to be loaded.
 * It also implements the pub/sub interfaece.
 */

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
  size() {
    return size(this);
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

function size(queue) {
  return queue[SERIES_IDS].length;
}

function isValidId(subject) {
  return typeof subject === 'string' && subject.length > 0;
}

/**
 * Creates a series load queue instance for the given study instance UID
 * @param {api.DICOMwebClient} dicomWebClient The instance of the DICOMWebClient instance which will be used to load the series metadata.
 * @param {string} studyId The Study Instance UID from which the series will be loaded
 * @param {string} givenSeriesIds A list of Series Instance UIDs which will be added to the load queue;
 */
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
