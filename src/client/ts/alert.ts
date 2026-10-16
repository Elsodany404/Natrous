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
  hideAlert();
  const alertEl = document.createElement('div');
  alertEl.classList.add('alert', `alert--${type}`);
  alertEl.innerText = message;
  // inside <body>, not before it
  document.body.insertAdjacentElement('afterbegin', alertEl);
  setTimeout(hideAlert, 3000);
};
