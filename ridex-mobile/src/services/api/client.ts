/**
 * Centralized Axios API Client with Request & Response Interceptors
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '../../config/env';
import { getAuthToken } from '../storage/secureStore';
import { logger } from '../../utils/logger';

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug('API Request', `${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    logger.error('API Request Error', error.message, error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Format Errors User-Friendly
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug('API Response', `${response.status} from ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    let userFriendlyMessage = 'Something went wrong. Please check your connection and try again.';

    if (status === 401) {
      userFriendlyMessage = 'Session expired. Please sign in again.';
    } else if (status === 403) {
      userFriendlyMessage = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      userFriendlyMessage = 'The requested resource was not found.';
    } else if (status && status >= 500) {
      userFriendlyMessage = 'Server error. Our team has been notified.';
    }

    logger.error('API Error', `${status || 'Network'}: ${userFriendlyMessage}`, error.response?.data);
    return Promise.reject(new Error(userFriendlyMessage));
  }
);

export default apiClient;
