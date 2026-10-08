/* eslint-disable */
'use strict';
import { showAlert } from './alert';
import axios, { AxiosError } from 'axios';
export const login = async (email: string, password: string) => {
  try {
    const res = await axios.post(
      '/api/v1/users/login',
      {
        email,
        password
      },
      {
        withCredentials: true
      }
    );
    if (res.status === 200) {
      showAlert('success', 'login successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      showAlert('error', err.response?.data.message || err.message);
    } else {
      showAlert('error', 'unexpected error');
    }
  }
};
export const signup = async (
  email: string,
  name: string,
  password: string,
  passwordConfirm: string
) => {
  try {
    const res = await axios.post(
      '/api/v1/users/sign-up',
      {
        email,
        password,
        name,
        passwordConfirm
      },
      {
        withCredentials: true
      }
    );
    if (res.status === 200) {
      showAlert('success', 'signup successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      showAlert('error', err.response?.data.message || err.message);
    } else {
      showAlert('error', 'unexpected error');
    }
  }
};
export const logout = async () => {
  try {
    const res = await axios.post('/api/v1/users/logout');
    if (res.status === 200) {
      showAlert('success', 'Logged out');
      location.assign('/'); // redirects to homepage
    }
  } catch (err: unknown) {
    showAlert('error', 'Logout failed');
  }
};
