import axios from 'axios';

class API {
  constructor() {
    const api = axios.create();

    this.api = api;
  }

  GET = async ({ url, options = {} }) => {
    try {
      const response = await this.api.request({
        method: 'get',
        url,
        ...options,
      });

      return response;
    } catch (error) {
      return Promise.reject(error.message || 'Error!');
    }
  };

  PUT = async ({ url, data, options = {} }) => {
    try {
      const response = await this.api.request({
        method: 'put',
        url,
        responseType: 'json',
        data,
        ...options,
      });
      return response;
    } catch (error) {
      return Promise.reject(error.message || 'Error!');
    }
  };

  POST = async ({ url, data, options = {} }) => {
    try {
      const response = await this.api.request({
        method: 'POST',
        url,
        responseType: 'json',
        data,
        ...options,
      });
      return response;
    } catch (error) {
      return Promise.reject(error.message || 'Error!');
    }
  };

  DELETE = async ({ url, data = {}, options = {} }) => {
    try {
      const response = await this.api.request({
        method: 'DELETE',
        url,
        responseType: 'json',
        data,
        ...options,
      });

      return response;
    } catch (error) {
      return Promise.reject(error.message || 'Error!');
    }
  };
}

export default new API();
