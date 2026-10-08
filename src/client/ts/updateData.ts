import axios from 'axios';
import { showAlert } from './alert';

export const updatePassword = async (pw: boolean, ...data: string[]) => {
  try {
    const url = '/api/v1/users/update-password';
    const res = await axios.patch(url, data, {
      withCredentials: true
    });
    if (res.status === 200) {
      showAlert('success', 'Password updated successfully');
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(err);
      showAlert('error', err.response?.data?.message);
    } else {
      showAlert('error', 'unexpected error');
    }
  }
};

export const updateData = async () => {
  try {
    const url = '/api/v1/users/update-me';
    const res = await axios.patch(url, {
      withCredentials: true
    });
    if (res.status === 200) {
      showAlert('success', 'Data updated successfully');
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(err);
      showAlert('error', err.response?.data?.message);
    } else {
      showAlert('error', 'unexpected error');
    }
  }
};
