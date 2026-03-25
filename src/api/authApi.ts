import apiClient from './axiosConfig';

export const getProfile = async () => {
  try {
    const response = await apiClient.get('https://drivemate.api.luisant.cloud/api/auth/profile');
    return response.data;
  } catch (error) {
    console.log('Error fetching profile:', error);
    return null;
  }
};

export const updateProfile = async (profileData: any) => {
  try {
    const response = await apiClient.put('https://drivemate.api.luisant.cloud/api/auth/profile', profileData);
    return { success: true, ...response.data };
  } catch (error: any) {
    console.log('Update profile error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Network error' };
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