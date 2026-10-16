import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as authController from '../controllers/authController.js';

const bookingRouter = express.Router({ mergeParams: true });

// Every booking route requires a logged-in user
bookingRouter.use(authController.protect);

bookingRouter
  .route('/checkout-session/:tourID')
  .get(bookingController.createCheckoutSession);

// Managing bookings directly is restricted to admins and lead guides
bookingRouter.use(authController.roleRestrictions('admin', 'lead-guide'));

bookingRouter
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
export default bookingRouter;
