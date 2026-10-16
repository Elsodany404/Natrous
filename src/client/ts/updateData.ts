import axios from 'axios';
import { showAlert } from './alert';

export const updatePassword = async (
  oldPassword: string,
  newPassword: string,
  newPasswordConfirm: string
) => {
  try {
    const url = '/api/v1/users/update-password';
    const res = await axios.patch(
      url,
      { oldPassword, newPassword, newPasswordConfirm },
      {
        withCredentials: true
      }
    );
    if (res.status === 200) {
      showAlert('success', 'Password updated successfully');
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(err);
      showAlert('error', err.response?.data?.message || err.message);
    } else {
      showAlert('error', 'unexpected error');
    }
  }
};

export const updateData = async (data: FormData) => {
  try {
    const url = '/api/v1/users/update-me';
    const res = await axios.patch(url, data, {
      withCredentials: true
    });
    if (res.status === 200) {
      showAlert('success', 'Data updated successfully');
      // Reload so the header and photo show the new data
      window.setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(err);
      showAlert('error', err.response?.data?.message || err.message);
    } else {
      showAlert('error', 'unexpected error');
    }
  }
};
