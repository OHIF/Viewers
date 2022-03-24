import fetchMockJSON from '../../components/XNATNavigation/testJSON/fetchMockJSON';
import makeCancelable from '../makeCancelable.js';
import sessionMap from '../sessionMap';

let fetchJSON;

if (
  process.env.NODE_ENV === 'production' ||
  process.env.APP_CONFIG === 'config/xnat-dev.js'
) {
  fetchJSON = function(route) {
    const { xnatRootUrl } = sessionMap;

    return makeCancelable(
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        const url = `${xnatRootUrl}${route}`;

        console.log(`fetching: ${url}`);

        xhr.onload = () => {
          console.log(`Request returned, status: ${xhr.status}`);
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            resolve(null);
          }
        };

        xhr.onerror = () => {
          console.log(`Request returned, status: ${xhr.status}`);
          reject(xhr.responseText);
        };

        xhr.open('GET', url);
        xhr.responseType = 'json';
        xhr.send();
      })
    );
  };
} else {
  sessionMap.setView('session');
  sessionMap.setProject('ITCRdemo');
  sessionMap.setParentProject('ITCRdemo');
  sessionMap.setSubject('XNAT_JPETTS_S00011');

  sessionMap.setSession(
    { studies: [] },
    {
      experimentId: 'XNAT_JPETTS_E00014',
      experimentLabel: 'Patient2',
      subjectId: 'XNAT_JPETTS_S00011',
      projectId: 'ITCRdemo',
      parentProjectId: 'ITCRdemo',
    }
  );

  fetchJSON = fetchMockJSON;
}

export default fetchJSON;
