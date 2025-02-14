import sessionMap from '../../../utils/sessionMap';

export default function(projectId, subjectId, experimentId) {
  const { xnatRootUrl } = sessionMap;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${xnatRootUrl}xapi/viewer/projects/${projectId}/experiments/${experimentId}/exists`;

    console.log(`fetching: ${url}`);

    xhr.onload = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      if (xhr.status === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    xhr.onerror = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      reject(xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.send();
  });
}
