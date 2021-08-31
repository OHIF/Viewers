import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';
import dicomParser from 'dicom-parser';
import JSZip from 'jszip';

/**
 * Constants
 */

const {
  utils: {
    isDicomUid,
    hierarchicalListUtils,
    progressTrackingUtils: progressUtils,
  },
} = OHIF;

/**
 * Public Methods
 */

/**
 * Download and Zip all DICOM P10 instances from specified DICOM Web Client
 * based on an hierarchical list of UIDs;
 *
 * @param {DICOMwebClient} dicomWebClient A DICOMwebClient instance through
 *  which the referenced instances will be retrieved;
 * @param {Array} listOfUIDs The hierarchical list of UIDs from the instances
 *  that should be retrieved:
 *  A hierarchical list of UIDs is a regular JS Array where the type of the UID
 *  (study, series, instance) is determined by its nasting lavel. For example:
 *    @ The following list instructs the library to download all the instances
 *      from both studies "A" and "B":
 *
 *    ['studyUIDFromA', 'studyUIDFromB']
 *
 *    @ In the previous example both UIDs are treated as STUDY UIDs because both
 *      of them are listed in the same (top) level of the list. If, on the other
 *      hand, only instances from series "I" and "J" from the study "B"
 *      are to be downloaded, the expected hierarchical list would be:
 *
 *    ['studyUIDFromA', ['studyUIDFromB', ['seriesUIDFromI', 'seriesUIDFromJ']]]
 *
 *    @ Which, when prettified, reads like this:
 *
 *    [
 *      'studyUIDFromA',
 *      ['studyUIDFromB', [
 *        'seriesUIDFromI',
 *        'seriesUIDFromJ'
 *      ]]
 *    ]
 *
 *    @ Furthermore, if only instances "X", "Y" and "Z" from series "J" need to
 *      be downloaded (instead of all the instances from that series), the list
 *      could be changed to:
 *
 *    [
 *      'studyUIDFromA',
 *      ['studyUIDFromB', [
 *        'seriesUIDFromI',
 *        ['seriesUIDFromJ', [
 *          'instanceUIDFromX',
 *          'instanceUIDFromY',
 *          'instanceUIDFromZ'
 *        ]]
 *      ]]
 *    ]
 *
 * Please refer to hierarchicalListUtils.js for more information and utilities;
 *
 * @param {Object} options A plain object with options;
 * @param {function} options.progress A callback to retrieve notifications
 * @returns {Promise} A promise that resolves to an URL from which the ZIP file
 *  can be downloaded;
 */

async function downloadAndZip(dicomWebClient, listOfUIDs, options) {
  if (dicomWebClient instanceof api.DICOMwebClient) {
    const settings = buildSettings(listOfUIDs, options);
    const { compression } = settings.tasks;
    const buffers = await downloadBuffers(settings, dicomWebClient);
    compression.deferred.resolve(zipAll(buffers, settings));
    const url = await compression.deferred.promise;
    return url;
  }
  throw new Error('A valid DICOM Web Client instance is expected');
}

async function downloadInstances(dicomWebClient, listOfUIDs, options) {
  if (dicomWebClient instanceof api.DICOMwebClient) {
    const settings = buildSettings(listOfUIDs, options);
    const buffers = await downloadBuffers(settings, dicomWebClient);
    return buffers;
  }
  throw new Error('A valid DICOM Web Client instance is expected');
}

async function downloadBuffers(settings, dicomWebClient) {
  const { compression } = settings.tasks;
  // Register user-provided progress handler as a task list observer
  progressUtils.addObserver(settings.taskList, settings.options.progress);
  const buffers = await downloadAll(dicomWebClient, settings).catch(error => {
    // Reject promise from compression task on download failure
    compression.deferred.reject(error);
    throw error;
  });
  return buffers;
}

/**
 * Utils
 */

async function zipAll(buffers, settings) {
  const zip = new JSZip();
  OHIF.log.info('Adding DICOM P10 files to archive:', buffers.length);
  buffers.forEach((buffer, i) => {
    const path = buildPath(buffer) || `${i}.dcm`;
    zip.file(path, buffer);
  });
  // Set compression task progress to 50%
  progressUtils.update(settings.tasks.compression.task, 0.5);
  const blob = await zip.generateAsync({ type: 'blob' });
  return URL.createObjectURL(blob);
}

function buildSettings(listOfUIDs, options) {
  const taskList = progressUtils.createList();
  const compression = progressUtils.addDeferred(taskList);
  const downloads = [];

  // Build downloads list
  hierarchicalListUtils.forEach(
    listOfUIDs,
    (StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) => {
      if (isDicomUid(StudyInstanceUID)) {
        downloads.push({
          tracking: progressUtils.addDeferred(taskList),
          parameters: [StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID],
        });
      }
    }
  );

  // Print tree of hierarchical references
  OHIF.log.info('Downloading DICOM P10 files for references:');
  OHIF.log.info(hierarchicalListUtils.print(listOfUIDs));

  return {
    options: Object(options),
    taskList,
    tasks: {
      downloads,
      compression,
    },
  };
}

function buildPath(buffer) {
  let path;
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray, {
      // Stop parsing after SeriesInstanceUID is found
      untilTag: 'x0020000e',
    });
    const StudyInstanceUID = dataSet.string('x0020000d');
    const SeriesInstanceUID = dataSet.string('x0020000e');
    const SOPInstanceUID = dataSet.string('x00080018');
    if (StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID) {
      path = `${StudyInstanceUID}/${SeriesInstanceUID}/${SOPInstanceUID}.dcm`;
    }
  } catch (e) {
    OHIF.log.error('Error parsing downloaded DICOM P10 file...', e);
  }
  return path;
}

async function downloadAll(dicomWebClient, settings) {
  const { downloads } = settings.tasks;

  // Make sure at least one download was initiated
  if (downloads.length < 1) {
    throw new Error('No valid reference to be downloaded');
  }

  const promises = downloads.map(item => {
    const {
      parameters,
      tracking: { deferred, task },
    } = item;
    deferred.resolve(download(task, dicomWebClient, ...parameters));
    return deferred.promise;
  });

  // Wait on created download promises
  return Promise.all(promises).then(results => {
    const buffers = [];
    // The "results" array may directly contain buffers (ArrayBuffer instances)
    // or arrays of buffers, depending on the type of downloads initiated on the
    // previous step (retrieveStudy, retrieveSeries or retrieveinstance). Ex:
    // results = [buf1, [buf2, buf3], buf4, [buf5], ...];
    results.forEach(
      function select(nesting, result) {
        if (result instanceof ArrayBuffer) {
          buffers.push(result);
        } else if (nesting && Array.isArray(result)) {
          // "nesting" argument is important to make sure only two levels
          // of arrays are visited. For example, "bufX" should not be visited:
          // [buf1, [buf2, buf3, [bufX]], buf4, [buf5], ...];
          result.forEach(select.bind(null, false));
        }
      }.bind(null, true)
    );
    return buffers;
  });
}

async function download(
  task,
  dicomWebClient,
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID
) {
  // Strict DICOM-formatted variable names COULDN'T be used here because the
  // DICOM Web client interface expects them in this specific format.
  // @TODO: Add support for download progress handler which will use the
  // currently not use "task" param
  if (!isDicomUid(studyInstanceUID)) {
    throw new Error('Download requires at least a "StudyInstanceUID" property');
  }
  if (!isDicomUid(seriesInstanceUID)) {
    // Download entire study
    return dicomWebClient.retrieveStudy({
      studyInstanceUID,
    });
  }
  if (!isDicomUid(sopInstanceUID)) {
    // Download entire series
    return dicomWebClient.retrieveSeries({
      studyInstanceUID,
      seriesInstanceUID,
    });
  }
  // Download specific instance
  return dicomWebClient.retrieveInstance({
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID,
  });
}

/**
 * Exports
 */

export { downloadAndZip as default, downloadAndZip, downloadInstances };
