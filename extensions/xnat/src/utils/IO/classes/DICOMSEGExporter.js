import sessionMap from '../../sessionMap';
import fetchCSRFToken from '../fetchCSRFToken.js';

/**
 * @class DICOMSEGExporter - Exports a DICOM seg file to an XNAT ROICollection.
 */
export default class DICOMSEGExporter {
  constructor(segBlob, seriesInstanceUid, label) {
    this._payload = segBlob;
    this._seriesInstanceUID = seriesInstanceUid;

    this._projectID = sessionMap.getProject();
    this._experimentID = sessionMap.getScan(
      this._seriesInstanceUID,
      'experimentId'
    );

    this._label = label;
  }

  get experimentID() {
    return this._experimentID;
  }

  /**
   * exportToXNAT - Exports the DICOMSEG to XNAT.
   *
   * @returns {null}
   */
  async exportToXNAT() {
    const csrfToken = await fetchCSRFToken();
    const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;
    const { xnatRootUrl } = sessionMap;
    let putFailed = false;
    let message = '';

    const putSegUrl =
      `${xnatRootUrl}xapi/roi/projects/${this._projectID}` +
      `/sessions/${this._experimentID}/collections/${this._label}?type=SEG&overwrite=false&${csrfTokenParameter}`;
    await this._PUT_uploadSeg(putSegUrl, this._payload).catch(error => {
      putFailed = true;
      message = error;
      console.log(error);
    });

    if (putFailed) {
      throw Error(message);
    }

    console.log('PUT successful');

    return;
  }

  /**
   * _PUT_uploadSeg - PUTs the DICOM SEG object to the given url.
   *
   * @param  {string} url The url to PUT the DICOM SEG.
   * @param  {Blob} seg A Blob containing the DICOM SEG.
   * @returns {Promise} A promise that resolves on a successful PUT, and rejects
   *                    otherwise.
   */
  _PUT_uploadSeg(url, seg) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if (xhr.status === 200 || xhr.status === 201) {
          resolve();
        } else {
          reject(xhr.responseText || xhr.statusText);
        }
      };

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText || xhr.statusText);
      };

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.send(seg);
    });
  }
}
