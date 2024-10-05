import axios from 'axios';

// const apiBaseUrl = 'http://maverick.cse.iitd.ac.in:8000';

const axiosInstance = axios.create({
  baseURL: window.config.apiBaseUrl,
});

export default axiosInstance;
