import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
// const BASE_URL = 'http://localhost:3000/urography';

export default {
  createUrographySegmentationJobAsync: async function(segmentationBlob) {
    const endpoint = `${BASE_URL}/job/mr-urography-segmentation`;

    let data = new FormData();

    data.append('name', 'image');
    data.append('file', segmentationBlob);

    let config = {
      header: {
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      const jobId = await axios.post(endpoint, data, config);
      return jobId;
    } catch (err) {
      console.log('error', err);
    }
  },
  getJobStatusAsync: async function(jobId) {
    const endpoint = `${BASE_URL}/job/${jobId}`;

    try {
      const jobStatus = await axios.get(endpoint);
      return jobStatus;
    } catch (err) {
      console.log(err);
    }
  },
  getJobResultsAsync: async function(jobId) {
    const endpoint = `${BASE_URL}/job/${jobId}/results`;

    try {
      const jobResults = await axios.get(endpoint);
      return jobResults;
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
