/* eslint-disable */
import { login, logout, signup } from './login-signup';
import { createMap } from './leaflet';
import { updateData, updatePassword } from './updateData';
import toPaymentGateway from './payment';
import '../sass/app.scss';

document.addEventListener('DOMContentLoaded', () => {
  const loginFormEl = document.querySelector('.form--login');
  const updatePasswordFormEl = document.querySelector('.form-user-settings');
  const updateDataFormEl = document.querySelector('.form-user-data');
  const signupFormEl = document.querySelector('.form--signup');
  const logOutBtn = document.querySelector('.nav__el--logout');
  const mapEl = document.getElementById('map');
  const bookBtn = document.getElementById('bookingBtn');
  const reviewsEl = document.querySelector('.reviews');
  const reviewControls = document.querySelectorAll<HTMLButtonElement>(
    '[data-review-direction]'
  );
  const navigationToggleEl = document.getElementById(
    'navi-toggle'
  ) as HTMLInputElement | null;

  if (reviewsEl && reviewControls.length) {
    const reviewCards = reviewsEl.querySelectorAll('.reviews__card');
    const updateReviewControls = () => {
      const maxScrollLeft = reviewsEl.scrollWidth - reviewsEl.clientWidth;
      const previousControl = document.querySelector<HTMLButtonElement>(
        '[data-review-direction="previous"]'
      );
      const nextControl = document.querySelector<HTMLButtonElement>(
        '[data-review-direction="next"]'
      );

      if (previousControl) previousControl.disabled = reviewsEl.scrollLeft <= 0;
      if (nextControl)
        nextControl.disabled = reviewsEl.scrollLeft >= maxScrollLeft - 1;
    };

    reviewControls.forEach((control) => {
      control.addEventListener('click', () => {
        const firstCard = reviewCards[0];
        if (!firstCard) return;

        const cardGap = parseFloat(getComputedStyle(reviewsEl).columnGap) || 0;
        const direction = control.dataset.reviewDirection === 'next' ? 1 : -1;
        reviewsEl.scrollBy({
          left: direction * (firstCard.getBoundingClientRect().width + cardGap),
          behavior: 'smooth',
        });
      });
    });

    reviewsEl.addEventListener('scroll', updateReviewControls);
    window.addEventListener('resize', updateReviewControls);
    updateReviewControls();
  }

  document.querySelectorAll('.navigation__link').forEach((navigationLink) => {
    navigationLink.addEventListener('click', () => {
      if (navigationToggleEl) navigationToggleEl.checked = false;
    });
  });

  if (loginFormEl) {
    const emailInputEl = document.getElementById(
      'email'
    ) as HTMLInputElement | null;
    const passwordInputEl = document.getElementById(
      'password'
    ) as HTMLInputElement | null;
    if (emailInputEl && passwordInputEl) {
      loginFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        login(emailInputEl.value, passwordInputEl.value);
      });
    }
  }
  if (updatePasswordFormEl) {
    const currentPasswordEl = document.getElementById(
      'password-current'
    ) as HTMLInputElement | null;
    const newPasswordEl = document.getElementById(
      'new-password'
    ) as HTMLInputElement | null;
    const confirmNewPasswordEl = document.getElementById(
      'new-password-confirm'
    ) as HTMLInputElement | null;
    if (currentPasswordEl && newPasswordEl && confirmNewPasswordEl) {
      updatePasswordFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updatePassword(
          true,
          currentPasswordEl.value,
          newPasswordEl.value,
          confirmNewPasswordEl.value
        );
        currentPasswordEl.value = '';
        newPasswordEl.value = '';
        confirmNewPasswordEl.value = '';
      });
    }
  }
  if (updateDataFormEl) {
    const nameInputEl = document.getElementById(
      'name'
    ) as HTMLInputElement | null;
    const emailInputEl = document.getElementById(
      'email'
    ) as HTMLInputElement | null;
    const photoInputEl = document.getElementById(
      'photo'
    ) as HTMLInputElement | null;

    if (!nameInputEl || !emailInputEl || !photoInputEl) return;

    updateDataFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();

      const form = new FormData();
      form.append('name', nameInputEl.value);
      form.append('email', emailInputEl.value);

      const photo = photoInputEl.files?.[0];
      if (photo) form.append('photo', photo);

      await updateData();

      nameInputEl.value = '';
      emailInputEl.value = '';
    });
  }

  if (signupFormEl) {
    const nameInputEl = document.getElementById(
      'name'
    ) as HTMLInputElement | null;
    const confirmPasswordInputEl = document.getElementById(
      'confirmPassword'
    ) as HTMLInputElement | null;
    const emailInputEl = document.getElementById(
      'email'
    ) as HTMLInputElement | null;
    const passwordInputEl = document.getElementById(
      'password'
    ) as HTMLInputElement | null;
    if (
      !nameInputEl ||
      !confirmPasswordInputEl ||
      !emailInputEl ||
      !passwordInputEl
    )
      return;
    signupFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      signup(
        emailInputEl.value,
        nameInputEl.value,
        passwordInputEl.value,
        confirmPasswordInputEl.value
      );
    });
  }
  if (logOutBtn) {
    try {
      logOutBtn.addEventListener('click', () => {
        logout();
      });
    } catch (err) {
      console.error(err);
    }
  }
  if (mapEl) {
    try {
      const locationsStr = mapEl.dataset.locations;
      if (locationsStr) {
        const locations = JSON.parse(locationsStr);
        setTimeout(() => {
          createMap(locations);
        }, 300);
      }
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }
  if (bookBtn) {
    bookBtn.addEventListener('click', function async(e) {
      e.preventDefault();
      const target = e.currentTarget as HTMLButtonElement;
      target.innerText = 'processing...';
      const tourId = target.dataset.tourId;
      if (!tourId) return;
      toPaymentGateway(tourId);
    });
  }
});
