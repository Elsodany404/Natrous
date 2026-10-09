import express from 'express';
import * as viewController from '../controllers/viewController.js';
import * as authController from '../controllers/authController.js';
import * as bookingController from '../controllers/bookingController.js';

const viewRouter = express.Router();

viewRouter.route('/login').get(viewController.getLogin);
viewRouter.route('/sign-up').get(viewController.getSignup);
viewRouter
  .route('/')
  .get(authController.isLoggedIn, viewController.getMostPopularTours);

viewRouter
  .route('/overview')
  .get(authController.isLoggedIn, viewController.getOverview);

viewRouter
  .route('/tour/:slug')
  .get(authController.isLoggedIn, viewController.getTour);
export default viewRouter;
viewRouter.route('/me').get(authController.protect, viewController.getProfile);
viewRouter
  .route('/my-bookings')
  .get(
    authController.protect,
    bookingController.createBookingCheckout,
    viewController.getMyBookings
  );
