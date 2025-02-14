import sessionMap from '../sessionMap';

export default function({ projectId }) {
  const { xnatRootUrl } = sessionMap;
  let url = `${xnatRootUrl}xapi/ohifaiaa/projects/${projectId}/servers`;

  // Get AIAA server URL at project level
  getAiaaServerUrl(url)
    .then(result => {
      const { status, response } = result;
      if (status === 200 && response.length > 0) {
        sessionMap.setAiaaProjectUrl(response[0]);
        console.log(`AIAA server URL (Project) = ${response[0]}`);
      }
      else {
        // Get AIAA server URL at site level
        url = `${xnatRootUrl}xapi/ohifaiaa/servers`;
        getAiaaServerUrl(url)
          .then(result => {
            const { status, response } = result;
            if (status === 200 && response.length > 0) {
              sessionMap.setAiaaSiteUrl(response[0]);
              console.log(`AIAA server URL (site) = ${response[0]}`);
            }
          })
          .catch(error => {
            console.log(`Error while querying AIAA server URL for site: ${error}`);
          });
      }
    })
    .catch(error => {
      console.log(`Error while querying AIAA server URL for project: ${error}`);
    });
}

function getAiaaServerUrl(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.send();
  });
}
