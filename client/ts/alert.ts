/* eslint-disable */
'use strict';
export const hideAlert = () => {
  const alertEl = document.querySelector('.alert');
  if (alertEl) {
    alertEl.remove();
  }
};
type alertMessage = {
  success: string;
};
export const showAlert = (type: 'success' | 'error', message: string) => {
  const alertEl = document.createElement('div');
  alertEl.classList.add('alert', `alert--${type}`);
  alertEl.innerText = message;
  document.body.insertAdjacentElement('beforebegin', alertEl);
  setTimeout(hideAlert, 3000);
};
