import axios from "axios";
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const nlApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  withCredentials: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.includes("http://localhost") : true,
});

export default nlApi;
