import apiClient from './axiosConfig';

export const getMyTrips = async () => {
  try {
    const response = await apiClient.get('/bookings/my-bookings');
    return response.data;
  } catch (error) {
    return { bookings: [] };
  }
};

export const createTrip = async (tripData: any) => {
  try {
    const response = await apiClient.post('/bookings', tripData);
    return { success: true, ...response.data };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.error || 'Failed to create booking' };
  }
};