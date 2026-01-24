import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alert';

const toPaymentGateway = async (tourId: string) => {
  try {
    // You can still load Stripe (optional, for Elements or future use)
    await loadStripe(process.env.STRIPE_PUBLIC_KEY!);

    // Get checkout session (which now returns a `url`, not `session.id`)
    const res = await axios.get(
      `https://m5wshhrk-3000.uks1.devtunnels.ms/api/v1/bookings/checkout-session/${tourId}`
    );

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
