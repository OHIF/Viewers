import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';

/**
 * Constants
 */

const {
  utils: { isDicomUid },
} = OHIF;

/**
 * Public Methods
 */

/**
 * Upload all DICOM P10 instances to a specified DICOM Web Client
 * from a file selection dialog
 *
 * @param {DICOMwebClient} dicomWebClient A DICOMwebClient instance through
 *  which the referenced instances will be stored;
 * @param {string} studyInstanceUID
 *

 * @param {function} notifications A callback to retrieve notifications

*/

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function uploadInstances(dicomWebClient, studyInstanceUID, status) {
  if (dicomWebClient instanceof api.DICOMwebClient) {
    if (!isDicomUid(studyInstanceUID)) {
      throw new Error('Upload requires at least a "StudyInstanceUID" property');
    }
    let fileHandleArray;
    let datasets = [];

    fileHandleArray = await window.showOpenFilePicker({
      startIn: 'downloads',
    });

    for (const fileHandle of fileHandleArray) {
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      datasets.push(arrayBuffer);
    }

    const options = {
      studyInstanceUID: studyInstanceUID,
      datasets: datasets,
      progressCallback: function(pe) {
        if (pe.lengthComputable) {
          status(
            'uploading',
            formatBytes(pe.loaded) + ' of ' + formatBytes(pe.total)
          );
        } else {
          status('uploading', formatBytes(pe.loaded));
        }
      },
    };

    await dicomWebClient.storeInstances(options);
  } else {
    throw new Error('A valid DICOM Web Client instance is expected');
  }
}

export { uploadInstances as default, uploadInstances };
