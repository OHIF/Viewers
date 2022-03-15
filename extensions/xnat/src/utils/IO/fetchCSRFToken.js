import sessionMap from '../sessionMap';

/**
 * fetchCSRFToken - Fetches the users CSRFToken from the XNAT backend. Required
 * for PUT events.
 *
 * @returns {Promise} A promise that resolves to the token.
 */
export default function fetchCSRFToken() {
  const { xnatRootUrl } = sessionMap;

  return new Promise((resolve, reject) => {
    const url = `${xnatRootUrl}`;
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      const childNodes = xhr.response.childNodes;

      let htmlNode;
      for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i] instanceof HTMLElement) {
          htmlNode = childNodes[i];
          break;
        }
      }

      const csrfToken = htmlNode.innerHTML
        .split("csrfToken = '")[1]
        .split("'")[0];

      resolve(csrfToken);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.responseType = 'document';
    xhr.send();
  });
}
