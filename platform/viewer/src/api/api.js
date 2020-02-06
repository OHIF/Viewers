import axios from 'axios';

class API {
  constructor() {
    const api = axios.create();
    api.interceptors.response.use(this.handleSuccess, this.handleError);
    this.api = api;
  }

  handleSuccess = response => {
    return response;
  };

  handleError = error => {
    // maybe we can use error.response.status to return/call specific actions depending on the error status
    return Promise.reject(error.message || 'Error!');
  };

  get = async (path, options = {}) => {
    const response = await this.api.request({
      method: 'get',
      url: path,
      ...options,
    });
    return response;
  };

  put = async (path, data, options = {}) => {
    const response = await this.api.request({
      method: 'put',
      url: path,
      responseType: 'json',
      data,
      ...options,
    });
    return response;
  };

  post = async (path, data, options = {}) => {
    const response = await this.api.request({
      method: 'POST',
      url: path,
      responseType: 'json',
      data,
      ...options,
    });

    return response;
  };

  delete = async (path, data, options = {}) => {
    const response = await this.api.request({
      method: 'POST',
      url: path,
      responseType: 'json',
      data,
      ...options,
    });

    return response;
  };
}

export default new API();
