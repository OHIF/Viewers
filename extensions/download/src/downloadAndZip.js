import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';
import dicomParser from 'dicom-parser';
import JSZip from 'jszip';

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
 * Download and Zip all DICOM P10 instances from specified DICOM Web Client
 * based on an hierarchical list of UIDs;
 *
 * @param {DICOMwebClient} dicomWebClient A DICOMwebClient instance through
 *  which the referenced instances will be retrieved;
 * @param {string} studyInstanceUID 
 *

 * @param {function} notifications A callback to retrieve notifications

*/

async function downloadAndZip(dicomWebClient, studyInstanceUID, status) {
  if (dicomWebClient instanceof api.DICOMwebClient) {
    if (!isDicomUid(studyInstanceUID)) {
      throw new Error(
        'Download requires at least a "StudyInstanceUID" property'
      );
    }
    let buffers = await dicomWebClient.retrieveStudy({
      studyInstanceUID,
      progressCallback: function(pe) {
        if (pe.lengthComputable) {
          status('downloading', pe.loaded + ' of ' + pe.total);
        } else {
          status('downloading', pe.loaded);
        }
      },
    });
    const zip = new JSZip();
    OHIF.log.info('Adding DICOM P10 files to archive:', buffers.length);
    status('zipping', buffers.length);
    buffers.forEach((buffer, i) => {
      const path = buildPath(buffer) || `${i}.dcm`;
      zip.file(path, buffer);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    return URL.createObjectURL(blob);
  }
  throw new Error('A valid DICOM Web Client instance is expected');
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
    throw new Error('Error parsing downloaded DICOM P10 file...', e);
  }
  return path;
}

/**
 * Exports
 */

export { downloadAndZip as default, downloadAndZip };
