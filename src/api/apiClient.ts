import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://drivemate.api.luisant.cloud/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;