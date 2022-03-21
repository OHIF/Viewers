class GoogleCloudApi {
  setAccessToken(accessToken) {
    if (!accessToken) console.error('Access token is empty');
    this.accessToken = accessToken;
  }

  get fetchConfig() {
    if (!this.accessToken) throw new Error('OIDC access_token is not set');
    return {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + this.accessToken,
      },
    };
  }

  get urlBase() {
    return this.healthcareApiEndpoint || 'https://healthcare.googleapis.com/v1beta1';
  }

  set urlBase(url) {
    this.healthcareApiEndpoint = url;
  }

  get urlBaseProject() {
    return this.urlBase + `/projects`;
  }

  getUrlBaseDicomWeb(project, location, dataset, dicomStore) {
    return (
      this.urlBase +
      `/projects/${project}/locations/${location}/datasets/${dataset}/dicomStores/${dicomStore}/dicomWeb`
    );
  }

  getUrlPath(project, location, dataset, dicomStore) {
    `/projects/${project}/locations/${location}/datasets/${dataset}/dicomStores/${dicomStore}`;
  }

  async doRequest(urlStr, config = {}, params = {}) {
    const url = new URL(urlStr);
    let data = null;
    url.search = new URLSearchParams(params);

    try {
      const response = await fetch(url, { ...this.fetchConfig, config });
      try {
        data = await response.json();
      } catch (err) {}
      if (response.status >= 200 && response.status < 300 && data != null) {
        if (data.nextPageToken != null) {
          params.pageToken = data.nextPageToken;
          let subPage = await this.doRequest(urlStr, config, params);
          for (let key in data) {
            if (data.hasOwnProperty(key)) {
              data[key] = data[key].concat(subPage.data[key]);
            }
          }
        }
        return {
          isError: false,
          status: response.status,
          data,
        };
      } else {
        return {
          isError: true,
          status: response.status,
          message:
            (data && data.error && data.error.message) || 'Unknown error',
        };
      }
    } catch (err) {
      if (data && data.error) {
        return {
          isError: true,
          status: err.status,
          message: err.response.data.error.message || 'Unspecified error',
        };
      }
      return {
        isError: true,
        message: (err && err.message) || 'Oops! Something went wrong',
      };
    }
  }

  async loadProjects() {
    return this.doRequest(
      'https://cloudresourcemanager.googleapis.com/v1/projects'
    );
  }

  async loadLocations(projectId) {
    return this.doRequest(`${this.urlBaseProject}/${projectId}/locations`);
  }

  async loadDatasets(projectId, locationId) {
    return this.doRequest(
      `${this.urlBaseProject}/${projectId}/locations/${locationId}/datasets`
    );
  }

  async loadDicomStores(dataset) {
    return this.doRequest(`${this.urlBase}/${dataset}/dicomStores`);
  }
}

export default new GoogleCloudApi();
