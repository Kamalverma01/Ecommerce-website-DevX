/**
 * Axios Interceptor Setup
 * Handles automatic token refresh and adds Authorization headers
 */

import axios from 'axios';
import { getAccessToken, setAccessToken, clearAllTokens, isTokenExpiringSoon } from '@/utils/token';

let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 * 
 * @param {Error} error - Error object if refresh failed
 * @param {string} token - New token if refresh succeeded
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Setup request interceptor
 * Adds access token to Authorization header
 */
export const setupRequestInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

/**
 * Setup response interceptor
 * Handles token refresh on 401 and TOKEN_EXPIRED errors
 */
export const setupResponseInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle token expired error
      if (
        error.response?.status === 401 &&
        (error.response?.data?.code === 'TOKEN_EXPIRED' || error.response?.status === 401) &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          // Queue the request if already refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh token
          const response = await axiosInstance.post('/auth/refresh');

          if (response.data.success) {
            const { accessToken } = response.data;
            setAccessToken(accessToken);

            // Update original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            // Process queued requests
            processQueue(null, accessToken);

            // Retry original request
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          clearAllTokens();
          processQueue(refreshError, null);

          // Trigger logout event
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: 'Session expired' }));

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Other errors - clear auth on REFRESH_TOKEN_EXPIRED or NO_REFRESH_TOKEN
      if (error.response?.data?.code === 'REFRESH_TOKEN_EXPIRED' || 
          error.response?.data?.code === 'NO_REFRESH_TOKEN') {
        clearAllTokens();
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: 'Please login again' }));
      }

      return Promise.reject(error);
    }
  );
};

/**
 * Create axios instance with interceptors configured
 * 
 * @param {string} baseURL - Base URL for API
 * @returns {Object} Configured axios instance
 */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || `${API_ORIGIN}/api`;

export const createAxiosInstance = (baseURL = DEFAULT_API_URL) => {
  const instance = axios.create({
    baseURL,
    withCredentials: true, // Include cookies in requests
  });

  setupRequestInterceptor(instance);
  setupResponseInterceptor(instance);

  return instance;
};

/**
 * Global axios instance for the app
 */
const apiClient = createAxiosInstance();

export default apiClient;
