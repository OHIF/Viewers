import sessionMap from '../../sessionMap';
import fetchCSRFToken from '../fetchCSRFToken.js';

/**
 * @class AIMExporter - Exports an AIM ImageAnnotationCollection to XNAT.
 */
export default class AIMExporter {
  constructor(aimWriter) {
    this._aimString = aimWriter.toString();
    this._seriesInstanceUID = aimWriter.seriesInfo.seriesInstanceUid;
    this._projectID = sessionMap.getProject();

    this._experimentID = sessionMap.getScan(
      this._seriesInstanceUID,
      'experimentId'
    );

    this._label = aimWriter.label;
  }

  get experimentID() {
    return this._experimentID;
  }

  /**
   * exportToXNAT - Exports the AIMExporter's AIM file to XNAT.
   *
   * @returns {null}
   */
  async exportToXNAT() {
    const csrfToken = await fetchCSRFToken();
    const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;
    const { xnatRootUrl } = sessionMap;

    let putFailed = false;
    let message = '';

    const putUrl = `${xnatRootUrl}xapi/roi/projects/${this._projectID}/sessions/${this._experimentID}/collections/${this._label}?type=AIM&overwrite=false&${csrfTokenParameter}`;

    await this._PUTAIM(putUrl).catch(error => {
      putFailed = true;
      message = error;
      console.log(error);
    });

    if (putFailed) {
      throw Error(message);
    }

    console.log('PUT succesful');

    return;
  }

  /**
   * _PUTAIM - PUTs an the AIMExporter's AIM file to XNAT.
   *
   * @param  {string} url The destination url.
   * @returns {Promise}   A promise that resolves on a successful PUT and
   * rejects otherwise.
   */
  _PUTAIM(url) {
    const arraybuffer = this._getArraybuffer();

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
      xhr.send(arraybuffer);
    });
  }

  /**
   * _getArraybuffer - Packs the AIMExporter's AIM file to an ArrayBuffer.
   *
   * @returns {ArrayBuffer} The Binarised AIM file.
   */
  _getArraybuffer() {
    const utf8AimString = unescape(encodeURIComponent(this._aimString));

    const arraybuffer = new ArrayBuffer(utf8AimString.length); // 2 bytes for each char
    const uint8View = new Uint8Array(arraybuffer);
    for (let i = 0; i < utf8AimString.length; i++) {
      uint8View[i] = utf8AimString.charCodeAt(i);
    }
    return arraybuffer;
  }
}
