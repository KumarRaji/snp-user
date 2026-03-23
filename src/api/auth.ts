import axios from 'axios';

const API = 'https://drivemate.api.luisant.cloud/api/auth';

export const sendOTP = async (phone: string) => {
  const res = await axios.post(`${API}/send-otp`, { phone });
  return res.data;
};

export const verifyOTP = async (phone: string, otp: string) => {
  const res = await axios.post(`${API}/verify-otp`, { phone, otp });
  return res.data;
};