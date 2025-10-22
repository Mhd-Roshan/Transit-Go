// src/api.js
import axios from 'axios';

// Create a new axios instance
const API = axios.create({
  // The base URL will be prefixed to all requests. 
  // Because of the webpack proxy, this will be correctly forwarded to your backend.
  baseURL: '/api' 
});

// Use an interceptor to automatically add the Authorization header to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Handle 401 Unauthorized errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get a 401, the token is likely expired or invalid.
      // Log the user out and redirect to the login page.
      localStorage.removeItem('token');
      // Use window.location to force a full page refresh and clear any app state.
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export default API;