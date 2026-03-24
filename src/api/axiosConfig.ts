import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://drivemate.api.luisant.cloud';

const apiClient = axios.create({
  baseURL: API_BASE_URL + '/api',
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Let the UI handle the 401 redirect to avoid circular dependencies in RN
    return Promise.reject(error);
  }
);

export default apiClient;