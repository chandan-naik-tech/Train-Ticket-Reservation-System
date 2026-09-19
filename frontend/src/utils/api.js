import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'http://localhost:5000/api' : '/api');

// Create Axios Instance
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('railverse_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
