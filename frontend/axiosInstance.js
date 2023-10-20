import axios from 'axios';

const axiosInstance = axios.create();

// Intercept requests and include the CSRF token in the headers
axiosInstance.interceptors.request.use(async (config) => {
    const csrfToken = await axios.get('http://192.168.8.7:8000/getcsrf/'); // Replace with the actual CSRF token
    config.headers['X-CSRFToken'] = csrfToken.data.csrfToken;
    return config;
});

export default axiosInstance;
