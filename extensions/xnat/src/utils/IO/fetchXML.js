import makeCancelable from '../makeCancelable';
import sessionMap from '../sessionMap';

export default function fetchXML(route, updateProgress) {
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

      if (updateProgress) {
        xhr.onprogress = evt => {
          const percentComplete = Math.floor((evt.loaded / evt.total) * 100);
          updateProgress(`Downloading File: ${percentComplete}%`);
        };
      }

      xhr.open('GET', url);
      xhr.responseType = 'document';
      xhr.send();
    })
  );
}
