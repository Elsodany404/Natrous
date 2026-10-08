import axios from 'axios';
import { showAlert } from './alert';

const toPaymentGateway = async (tourId: string) => {
  try {
    // Get checkout session (which now returns a `url`, not `session.id`)
    const res = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);

    // Redirect directly to Stripe Checkout
    window.location.href = res.data.url;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('Stripe checkout failed:', err);
      showAlert('error', err.message || 'Payment failed');
    } else {
      showAlert('error', 'unexpected error');
    }
  }
};
export default toPaymentGateway;
