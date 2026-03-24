import apiClient from './axiosConfig';

export const getProfile = async () => {
  try {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.log('Error fetching profile:', error);
    return null;
  }
};

export const updateProfile = async (profileData: any) => {
  try {
    const response = await apiClient.put('/auth/profile', profileData);
    return { success: true, ...response.data };
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};