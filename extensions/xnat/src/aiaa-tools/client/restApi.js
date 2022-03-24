import axios from 'axios';

function constructFormData(params, file) {
  let formData = new FormData();

  if (file) {
    if (Array.isArray(file)) {
      // DICOM series
      for (let i = 0; i < file.length; i++) {
        formData.append(`image${i}`, file[i].data, file[i].name);
      }
    } else {
      // Nifti file
      formData.append('image', file.data, file.name);
    }
  }

  formData.append('params', JSON.stringify(params));

  return formData;
}

function constructFormOrJsonData(params, file) {
  return (file) ? constructFormData(params, file) : params;
}

function api_get(url) {
  console.info('GET:: ' + url);
  return axios
    .get(url)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return {
        status: 0,
        data: error.message,
      };
    });
}

function api_post_file(url, params, file) {
  console.info('POST:: ' + url);
  let formData = constructFormData(params, file);
  return axios
    .post(url, formData, {
      responseType: 'arraybuffer', // direct receive as buffer array

      headers: {
        accept: 'multipart/form-data',
      },
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return {
        status: 0,
        data: error.message,
      };
    });
}

function api_put(url, params, file) {
  console.info('PUT:: ' + url);
  let data = constructFormOrJsonData(params, file);
  return axios
    .put(url, data, {
      responseType: 'json',
      headers: {
        accept: 'application/json',
      },
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return {
        status: 0,
        data: error.message,
      };
    });
}

export {
  api_get,
  api_post_file,
  api_put,
};