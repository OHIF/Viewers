import apiEndpoints from './apiEndpoints.js';
import axiosInstance from './axiosInstance.js';

class APIClient {
  constructor() {
    this.requestMethods = {
      GET: axiosInstance.get,
      POST: axiosInstance.post,
      PUT: axiosInstance.put,
      PATCH: axiosInstance.patch,
      DELETE: axiosInstance.delete,
    };

    this.badResponse = {
      success: false,
      error: {
        user_friendly_message: 'Server Error.',
      },
    };

    this.tokens = {
      access: '',
      refresh: '',
    };
  }

  async refreshAccessToken() {}

  async makeRequest(method, url, body = undefined, headers = {}, addAuth = false) {
    if (addAuth) {
      // Refresh Access token if required
      // Add Auth header

      const accessToken = localStorage.getItem('accessToken');
      //console.log('access token: ', accessToken);
      headers.Authorization = `Bearer ${accessToken}`;
    }
    //console.log('made it here', headers);
    try {
      console.log('--------------');
      console.log('');
      console.log('');
      console.log('url');
      console.log(url);
      console.log('headers');
      console.log(headers);
      console.log('body');
      console.log(body);
      console.log('');
      console.log('--------------', this.requestMethods[method]);
      let response;
      if (body) {
        response = await this.requestMethods[method](url, body, { headers });
      } else {
        response = await this.requestMethods[method](url, { headers });
      }
      // const ll = await axiosInstance.post(url, body, { headers });
      const responseData = await response.data;

      //console.log('RDATA', responseData);
      return responseData;
    } catch (error) {
      //console.log('ERROR:', error);
      if (!error.response) {
        return this.badResponse;
      }

      const contentType = error.response.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        return this.badResponse;
      }

      const errorResponseData = await error.response.data;

      if (errorResponseData['success'] === undefined) {
        const responseData = {
          success: false,
          error: errorResponseData,
        };
        return responseData;
      }

      return errorResponseData;
    }
  }

  async updateAccess(studyUid, email, role) {
    //console.log(studyUid);
    const requestBody = {
      email: email,
      role: role,
    };
    //console.log('sending share api', apiEndpoints.updateAccess(studyUid));
    const res = await this.makeRequest(
      'POST',
      apiEndpoints.updateAccess(studyUid),
      requestBody,
      {},
      true
    );
    //console.log('RESS', res);
    return res;
  }

  async getAccessList(studyUid) {
    //console.log('sending share list api', apiEndpoints.getAccessList(studyUid));
    return await this.makeRequest('GET', apiEndpoints.getAccessList(studyUid), undefined, {}, true);
  }

  async deleteStudy(studyUid) {
    //console.log('Deleting this study', apiEndpoints.manage(studyUid));
    return await this.makeRequest('DELETE', apiEndpoints.manage(studyUid), undefined, {}, true);
  }

  //groundtruth
  async getGroundTruth(studyUid) {
    // console.log('Getting ground truth for study:', studyUid);
    return await this.makeRequest('GET', apiEndpoints.groundTruth(studyUid), undefined, {}, true);
  }
  //putting ground truth
  async putGroundTruth(studyUid, groundTruthData) {
    // console.log('Updating ground truth for study:', studyUid);
    return await this.makeRequest(
      'PUT',
      apiEndpoints.groundTruth(studyUid),
      groundTruthData,
      {},
      true
    );
  }
  //models api
  async handleMammoModel(studyUid, setToastMessage) {
    //console.log('Starting mammo model processing for study:', studyUid);

    const response = await this.makeRequest(
      'POST',
      apiEndpoints.mammoModel(studyUid),
      {},
      {},
      true
    );
    console.log('Mammo model processing started:', response);
    //console.log(response.result.id);z
    // setToastMessage('Models are running...');
    if (response.result && response.result.id) {
      //console.log('Mammo model processing started:', response);
      setToastMessage('Models are running...');
      // alert('Models are running...');
      this.pollTaskStatus(response.result.id, setToastMessage); // Use response.result.id
    } else {
      alert('Failed to retrieve task ID from the response.');
    }
  }
  // async makeRequest(method, url, body = undefined, headers = {}, addAuth = false)
  async handleGBCModel(studyUid, setToastMessage) {
    //console.log('Starting mammo model processing for study:', studyUid);
    setToastMessage('Starting GBC model processing for study:');
    const response = await this.makeRequest(
      'POST',
      apiEndpoints.model(studyUid),
      {
        model: 'GBC',
      },
      {},
      true
    );
    console.log('GBC model processing started:', response);
    //console.log(response.result.id);
    // setToastMessage('Models are running...');
    if (response.result && response.result.id) {
      //console.log('Mammo model processing started:', response);
      setToastMessage('Models are running...');
      // alert('Models are running...');
      this.pollTaskStatus(response.result.id, setToastMessage); // Use response.result.id
    } else {
      setToastMessage('');
      alert('Failed to retrieve task ID from the response.');
    }
  }

  async handleXRayModel(studyUid, setToastMessage) {
    //console.log('Starting mammo model processing for study:', studyUid);
    setToastMessage('Starting X-Ray model processing for study:');
    const response = await this.makeRequest(
      'POST',
      apiEndpoints.model(studyUid),
      {
        model: 'XRay',
      },
      {},
      true
    );
    console.log('X-Ray model processing started:', response);
    //console.log(response.result.id);
    // setToastMessage('Models are running...');
    if (response.result && response.result.id) {
      //console.log('Mammo model processing started:', response);
      setToastMessage('Models are running...');
      // alert('Models are running...');
      this.pollTaskStatus(response.result.id, setToastMessage); // Use response.result.id
    } else {
      setToastMessage('');
      alert('Failed to retrieve task ID from the response.');
    }
  }

  // return response;

  async pollTaskStatus(taskId, setToastMessage) {
    //console.log('task id is =' + taskId);
    const url = apiEndpoints.taskStatus(taskId);
    let polling = true;

    const poll = async () => {
      try {
        const response = await this.makeRequest('GET', url, undefined, {}, true);

        if (response.status === 'Completed') {
          polling = false;
          setToastMessage('Task completed successfully!');
          // Task is complete, handle the completion
          this.handleTaskCompletion();
        } else {
          setToastMessage('Task still processing...');
          //console.log('Task still processing...');
          // Continue polling
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        polling = false;
        setToastMessage('Error polling task status.');
      }
    };

    poll();
  }

  handleTaskCompletion() {
    // Handle what happens when the task is completed
    // e.g., refresh the window or render the updated data
    // alert('Task completed successfully!');
    window.location.reload(); // Optionally refresh the page
  }
}

const apiClient = new APIClient();
export default apiClient;
