/*
XNAT authentication
 */
function _isLoggedIn() {
  const XNAT_PROXY = process.env.XNAT_PROXY;
  const url = XNAT_PROXY + 'data/JSESSION?CSRF=true';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`GET ${url}... ${xhr.status}`);

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
    xhr.timeout = 5000;
    xhr.send();
  });
}

function _getSessionID() {
  let value = '';
  if (document.cookie !== '') {
    value = document.cookie
      .split('; ')
      .find(row => row.startsWith('XNAT_JSESSIONID'));
    if (value) {
      value = value.split('=')[1];
    }
  }
  return value;
}

function _getCsrfToken() {
  let value = '';
  if (document.cookie !== '') {
    value = document.cookie
      .split('; ')
      .find(row => row.startsWith('XNAT_CSRF'));
    if (value) {
      value = value.split('=')[1];
    }
  }
  return value;
}

export async function isLoggedIn() {
  const sessionID = _getSessionID();
  let loggedIn = false;
  try {
    let res = await _isLoggedIn();
    res = res.split(';');
    const csrfToken = res.length > 1 ? res[1].trim().split('=')[1] : '';
    document.cookie = `XNAT_CSRF=${csrfToken}`;
    if (sessionID === res[0]) {
      loggedIn = true;
    } else {
      console.warn('Not logged-in XNAT: ' + res);
    }
  } catch (err) {
    console.error(err);
  }
  return loggedIn;
}

function _xnatAuthenticate(csrfToken) {
  const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;
  const XNAT_PROXY = process.env.XNAT_PROXY;
  const url = XNAT_PROXY + `data/JSESSION?${csrfTokenParameter}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`POST ${url}... ${xhr.status}`);

      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject('Error authenticating to XNAT');
      }
    };

    xhr.onerror = () => {
      reject('Error authenticating to XNAT' + xhr.responseText);
    };

    const XNAT_USERNAME = process.env.XNAT_USERNAME;
    const XNAT_PASSWORD = process.env.XNAT_PASSWORD;

    if (!XNAT_USERNAME) {
      reject('No XNAT_USERNAME was provided. Guest access may be enabled.');
      return;
    }

    xhr.open('POST', url);
    // xhr.withCredentials = true;
    xhr.setRequestHeader(
      'Authorization',
      'Basic ' + btoa(`${XNAT_USERNAME}:${XNAT_PASSWORD}`)
    );
    xhr.timeout = 5000;
    xhr.send();
  });
}

export async function xnatAuthenticate() {
  const csrfToken = _getCsrfToken();

  try {
    let res = await _xnatAuthenticate(csrfToken);
    document.cookie = `XNAT_JSESSIONID=${res}`;
    console.warn('Logged-in to XNAT: ' + res);
  } catch (err) {
    console.error(err);
  }
}

export function reassignInstanceUrls(studies) {
  const XNAT_PROXY = process.env.XNAT_PROXY;
  const XNAT_DOMAIN = process.env.XNAT_DOMAIN.replace(/^http(s?):/i, '') + '/';

  studies.forEach(study => {
    study.series.forEach(series => {
      series.instances.forEach(instance => {
        instance.url = instance.url.replace(XNAT_DOMAIN, XNAT_PROXY);
      });
    });
  });
}

export async function saveFile(blob, filename) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  a.addEventListener('click', (e) => {
    setTimeout(() => URL.revokeObjectURL(a.href), 10 * 1000);
  });
  a.click();
}

export async function readFile(readAsText = false) {
  let inFile = null;

  const reader = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          content: reader.result,
        });
      };
      reader.onerror = error => reject(error);
      if (readAsText) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  await new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    const a = document.createElement('a');
    a.addEventListener('click', (e) => {
      input.click();
    });
    a.click();
    input.onchange = () => {
      resolve({
        file: input.files[0],
      });
    }
    input.oncancel = () => {
      reject('User cancelled file dialog');
    }
  }).then(data => {
    const { file } = data;
    inFile = file;
  }).catch(error => {
    console.log(error);
  });

  let arrayBuffer = null;
  if (inFile !== null) {
    await reader(inFile)
      .then(data => {
        const { content } = data;
        arrayBuffer = content;
      }).catch(error => {
        console.log(error);
      });
  }

  return arrayBuffer;
}
