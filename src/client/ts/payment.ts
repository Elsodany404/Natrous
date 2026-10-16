import axios from 'axios';
import { showAlert } from './alert';

// Resolves to true when the browser is being redirected to Stripe
const toPaymentGateway = async (tourId: string) => {
  try {
    const res = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);

    // Redirect directly to Stripe Checkout
    window.location.href = res.data.url;
    return true;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('Stripe checkout failed:', err);
      showAlert(
        'error',
        err.response?.data?.message || err.message || 'Payment failed'
      );
    } else {
      showAlert('error', 'unexpected error');
    }
    return false;
  }
};
export default toPaymentGateway;
