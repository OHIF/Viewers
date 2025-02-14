import sessionMap from '../sessionMap';

export default function({ projectId }) {
  const { xnatRootUrl } = sessionMap;
  let url = `${xnatRootUrl}xapi/ohifroicolor/projects/${projectId}/roicolor`;

  fetchRoiColorList(url)
    .then(result => {
      const { status, response } = result;
      if (status === 200 && response.length > 0) {
        console.log(
          `ROI Color List (Project) = ${JSON.stringify(response[0])}`
        );
        sessionMap.setProjectRoiColorList(response);
      }
    })
    .catch(error => {
      console.log(`Error while querying ROI Color List for project: ${error}`);
    });
}

function fetchRoiColorList(url) {
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
