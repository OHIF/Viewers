import sessionMap from '../sessionMap';

export default function({ projectId }) {
  const { xnatRootUrl } = sessionMap;
  let url = `${xnatRootUrl}xapi/viewerConfig/projects/${projectId}/roipreset`;

  fetchRoiPresets(url)
    .then(result => {
      const { status, response } = result;
      if (status === 200 && response) {
        console.log(`ROI Presets (Project) = ${JSON.stringify(response)}`);
        sessionMap.setProjectRoiPresets(response);
      }
    })
    .catch(error => {
      console.log(`Error while querying the ROI Presets: ${error}`);
    });
}

function fetchRoiPresets(url) {
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
