import axios from 'axios';

// // const apiBaseUrl = 'http://maverick.cse.iitd.ac.in:8000';

// // console.log('-----> API Base URL');
// // console.log(window.config.apiBaseUrl);

const axiosInstance = axios.create({
  baseURL: window.config.apiBaseUrl,
});

export default axiosInstance;
