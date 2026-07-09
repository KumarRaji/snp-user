import apiClient from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
  const token = await AsyncStorage.getItem('token');
  return token || '';
};

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

export const cancelTrip = async (id: string) => {
  try {
    const token = await getToken();
    const response = await fetch(`https://drivemate.api.luisant.cloud/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error: any) {
    return { success: false, message: error?.message || 'Unable to cancel trip' };
  }
};

export const rateTrip = async (id: string, rating: number, feedback = '') => {
  try {
    const token = await getToken();
    const response = await fetch(`https://drivemate.api.luisant.cloud/api/bookings/${id}/rate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating, feedback }),
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: response.ok, message: text || 'Rating submitted' };
    }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Unable to submit rating' };
  }
};