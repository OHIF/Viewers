import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
// const BASE_URL = 'http://localhost:3000/urography';

export default {
  createUrographySegmentationJobAsync: async function(segmentationBlob) {
    const endpoint = `${BASE_URL}/job/mr-urography-segmentation`;

    let data = new FormData();

    // data.append('name', 'image');
    // data.append('file', segmentationBlob);

    let config = {
      // header: {
      //   'Content-Type': 'multipart/form-data',
      // },
    };

    try {
      // config: {url: "http://localhost:5000/job/mr-urography-segmentation", method: "post", data: FormData, headers: {…}, transformRequest: Array(1), …}
      // data: {jobId: 1, status: "Success"}
      // headers: {content-length: "41", content-type: "application/json"}
      // request: XMLHttpRequest {readyState: 4, timeout: 0, withCredentials: false, upload: XMLHttpRequestUpload, onreadystatechange: ƒ, …}
      // status: 200
      // statusText: "OK"
      const createJobRequest = await axios.post(endpoint, data, config);
      const resultData = createJobRequest.data;
      return resultData.jobId;
    } catch (err) {
      console.log('error', err);
    }
  },
  getJobStatusAsync: async function(jobId) {
    const endpoint = `${BASE_URL}/job/${jobId}`;

    try {
      const jobStatusRequest = await axios.get(endpoint);
      const resultData = jobStatusRequest.data;
      return resultData;
    } catch (err) {
      console.log(err);
    }
  },
  getJobResultsAsync: async function(jobId) {
    const endpoint = `${BASE_URL}/job/${jobId}/results`;

    try {
      const jobResultsRequest = await axios.get(endpoint);
      const resultData = jobResultsRequest.data;

      return resultData;
    } catch (err) {
      console.log(err);
    }
  },
  // `segmentationUrl` from the `getJobResultsAsync` response
  getSegmentationAsync: async function(segmentationUrl) {
    const endpoint = `${BASE_URL}${segmentationUrl}`;

    try {
      const jobResults = await axios.get(endpoint);
      return jobResults;
    } catch (err) {
      console.log(err);
    }
  },
};
