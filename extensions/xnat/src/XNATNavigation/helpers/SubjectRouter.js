import checkSessionJSONExists from './checkSessionJSONExists.js';
import fetchJSON from '../../../utils/IO/fetchJSON';
import sessionMap from '../../../utils/sessionMap';
//import progressDialog from '../../../../lib/dialogUtils/progressDialog.js';

/**
 * @class SubjectRouter - Routes to the desired subject view, generating
 * server side metadata if needbe.
 */
export default class SubjectRouter {
  constructor(projectId, parentProjectId, subjectId, subjectLabel, sessions) {
    this.projectId = projectId;
    this.parentProjectId = parentProjectId;
    this.subjectId = subjectId;
    this.subjectLabel = subjectLabel;
    this.sessions = sessions;
  }

  /**
   * go - Changes route based on properties passed to the SubjectRouter's
   * constructor.
   *
   * @returns {null}
   */
  go() {
    this._checkJSONandloadRoute();
  }

  /**
   * _checkJSONandloadRoute - Check that each session's JSON metadata exists.
   * If so -> Open the route.
   * If not -> Generate the missing metadata and then open the route.
   *
   * @returns {null}
   */
  _checkJSONandloadRoute() {
    const promises = [];

    for (let i = 0; i < this.sessions.length; i++) {
      const promise = checkSessionJSONExists(
        this.projectId,
        this.subjectId,
        this.sessions[i].ID
      );

      promises.push(promise);
    }

    Promise.all(promises).then(results => {
      if (results.some(result => !result)) {
        this._generateSessionMetadata(results);
      } else {
        this._loadRoute();
      }
    });
  }

  /**
   * _generateSessionMetadata - generates missing metadata for
   *
   * @param  {Boolean[]} sessionsWithMetadata An array of which indicies in
   *                     this.sessions have metadata.
   * @returns {null}
   */
  _generateSessionMetadata(sessionsWithMetadata) {
    const sessionJSONToGenerate = [];

    for (let i = 0; i < sessionsWithMetadata.length; i++) {
      if (!sessionsWithMetadata[i]) {
        sessionJSONToGenerate.push(this.sessions[i].ID);
      }
    }

    let jsonGenerated = 0;

    // Generate metadata
    // progressDialog.show({
    //   notificationText: `generating metadata for ${this.subjectLabel}...`,
    //   progressText: `${jsonGenerated}/${sessionJSONToGenerate.length} <i class="fa fa-spin fa-circle-o-notch fa-fw">`,
    // });

    const promises = [];

    for (let i = 0; i < sessionJSONToGenerate.length; i++) {
      const cancelablePromise = fetchJSON(
        `xapi/viewer/projects/${this.projectId}/experiments/${sessionJSONToGenerate[i]}`
      );

      promises.push(cancelablePromise.promise);

      cancelablePromise.promise.then(() => {
        jsonGenerated++;
        // progressDialog.update({
        //   notificationText: `generating metadata for ${this.subjectLabel}...`,
        //   progressText: `${jsonGenerated}/${sessionJSONToGenerate.length} <i class="fa fa-spin fa-circle-o-notch fa-fw">`,
        // });
      });
    }

    Promise.all(promises).then(() => {
      this._loadRoute();
    });
  }

  _loadRoute() {
    let params = `?subjectId=${this.subjectId}&projectId=${this.projectId}`;

    if (this.parentProjectId !== this.projectId) {
      params += `&parentProjectId=${this.parentProjectId}`;
    }

    const { xnatRootUrl } = sessionMap;

    console.log(`${xnatRootUrl}VIEWER${params}`);

    window.location.href = `${xnatRootUrl}VIEWER${params}`;
  }
}
