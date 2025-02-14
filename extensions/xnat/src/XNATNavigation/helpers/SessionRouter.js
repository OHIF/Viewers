import checkSessionJSONExists from './checkSessionJSONExists.js';
import fetchJSON from '../../utils/IO/fetchJSON';
import sessionMap from '../../utils/sessionMap';
//import progressDialog from '../../../../lib/dialogUtils/progressDialog.js';

export default class SessionRouter {
  constructor(
    projectId,
    parentProjectId,
    subjectId,
    experimentId,
    experimentLabel
  ) {
    this.projectId = projectId;
    this.parentProjectId = parentProjectId;
    this.subjectId = subjectId;
    this.experimentId = experimentId;
    this.experimentLabel = experimentLabel;
  }

  go() {
    this._checkJSONandloadRoute();
  }

  _checkJSONandloadRoute() {
    checkSessionJSONExists(this.projectId, this.subjectId, this.experimentId)
      .then(result => {
        if (result === true) {
          this._loadRoute();
        } else {
          this._generateSessionMetadata();
        }
      })
      .catch(err => console.log(err));
  }

  _generateSessionMetadata() {
    // Generate metadata
    // progressDialog.show({
    //   notificationText: `generating metadata for ${this.experimentLabel}...`,
    // });

    fetchJSON(
      `/xapi/viewer/projects/${this.projectId}/experiments/${this.experimentId}`
    )
      .promise.then(result => {
        if (result) {
          this._loadRoute();
        } else {
          //progressDialog.close();
        }
      })
      .catch(err => console.log(err));
  }

  _loadRoute() {
    let params = `?subjectId=${this.subjectId}&projectId=${this.projectId}&experimentId=${this.experimentId}&experimentLabel=${this.experimentLabel}`;

    if (this.parentProjectId !== this.projectId) {
      //Shared Project
      params += `&parentProjectId=${this.parentProjectId}`;
    }

    const { xnatRootUrl } = sessionMap;

    console.log(`${xnatRootUrl}VIEWER/${params}`);

    if (process.env.APP_CONFIG === 'config/xnat-dev.js') {
      window.location.href = `${params}`;
    } else {
      window.location.href = `${xnatRootUrl}VIEWER/${params}`;
    }
  }
}
