import axios from 'axios';
import { api_ip } from './config';

const axiosInstance = axios.create();

// Intercept requests and include the CSRF token in the headers
axiosInstance.interceptors.request.use(async config => {
  const csrfToken = await axios.get(`http://${api_ip}/getcsrf/`); // Replace with the actual CSRF token
  config.headers['X-CSRFToken'] = csrfToken.data.csrfToken;
  return config;
});

export default axiosInstance;
