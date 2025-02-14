import sessionMap from './sessionMap.js';
import { showSessionTimeoutModal } from '../Components/common/sessionTimeoutModal';

const getSessionID = () => {
  const { xnatRootUrl } = sessionMap;
  const url = xnatRootUrl + 'data/JSESSION';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject('Error checking logged-in to XNAT');
      }
    };

    xhr.onerror = () => {
      reject('Error checking logged-in to XNAT' + xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.timeout = 15000;
    xhr.send();
  });
};

const getXNATSessionTimeout = () => {
  let timeout = 1000 * 60 * 15; // Default to 15 minutes
  const SESSION_EXPIRATION_TIME = document.cookie
    .replace(
    /(?:(?:^|.*;\s*)SESSION_EXPIRATION_TIME\s*\=\s*([^;]*).*$)|^.*$/,
    '$1'
    )
    .replace(/\"/g, '');

  if (SESSION_EXPIRATION_TIME && SESSION_EXPIRATION_TIME.indexOf(',') > 0) {
    const parsedTimeout = parseInt(SESSION_EXPIRATION_TIME.split(',')[1]);
    if (parsedTimeout) {
      timeout = parsedTimeout;
    }
  }

  return timeout;
};

const logUserOut = () => {
  showSessionTimeoutModal();
}

const userManagement = {
  getSessionID,
  getXNATSessionTimeout,
  logUserOut,
};

export { userManagement };
