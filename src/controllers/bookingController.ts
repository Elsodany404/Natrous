import Stripe from 'stripe';
import { type Request, type Response, type NextFunction } from 'express';
import * as handlerFactory from './handlerFactory.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import Tour from '../models/tourModel.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { type authRequest } from './authController.js';

let stripe: Stripe | undefined;
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new AppError('Stripe is not configured', 503);
  stripe ??= new Stripe(secretKey);
  return stripe;
};
export const createBooking = handlerFactory.createOne(Booking);
export const deleteBooking = handlerFactory.deleteOne(Booking);
export const getAllBookings = handlerFactory.getAll(Booking);
export const updateBooking = handlerFactory.updateOne(Booking);
export const getBooking = handlerFactory.getOne(Booking, 'user tour');

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { tourID } = req.params;
    if (!tourID) {
      throw new AppError('Tour ID is missing', 400);
    }
    const tour = await Tour.findById(tourID);
    if (!tour) throw new AppError('Tour not found', 404);
    const baseUrl =
      process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const { user } = req as authRequest;

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      // Stripe replaces {CHECKOUT_SESSION_ID} with the real session id
      success_url: `${baseUrl}/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/tour/${tour.slug}`,
      customer_email: user.email,
      client_reference_id: tourID,
      metadata: { tourID, userID: String(user.id) },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tour.name,
              ...(tour.summary && { description: tour.summary }),
              images: [`${baseUrl}/img/tours/${tour.imageCover}`]
            },
            unit_amount: Math.round(tour.price * 100)
          },
          quantity: 1
        }
      ]
    });

    res.status(200).json({ status: 'success', url: session.url });
  } catch (error: unknown) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : 'Something went wrong';
    console.error('ERROR 💥', error);
    res.status(statusCode).json({ status: 'error', message });
  }
};

// Creates the booking for a paid checkout session. Safe to call more than
// once for the same session (webhook + success redirect).
const createBookingFromSession = async (sessionId: string) => {
  const existing = await Booking.findOne({ stripeSessionId: sessionId });
  if (existing) return existing;

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid')
    throw new AppError('Payment has not been completed', 400);

  const tour = session.metadata?.tourID ?? session.client_reference_id;
  if (!tour) throw new AppError('Tour reference missing from session', 400);

  let user = session.metadata?.userID;
  if (!user) {
    const userDoc = await User.findOne({ email: session.customer_email });
    if (!userDoc) throw new AppError('User not found', 400);
    user = userDoc.id;
  }

  if (session.amount_total == null)
    throw new AppError('Problem with session amount', 400);
  const price = session.amount_total / 100;

  try {
    return await Booking.create({
      tour,
      user,
      price,
      stripeSessionId: sessionId
    });
  } catch (err) {
    // Duplicate key: the other path created it at the same time
    if ((err as { code?: number }).code === 11000)
      return Booking.findOne({ stripeSessionId: sessionId });
    throw err;
  }
};

// Runs on /my-bookings?session_id=... after Stripe redirects back
export const createBookingCheckout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.query.session_id;
    if (typeof sessionId !== 'string' || !sessionId) return next();

    const booking = await createBookingFromSession(sessionId);
    if (
      booking &&
      String(booking.user) !== String((req as authRequest).user.id)
    )
      return next(new AppError('This booking belongs to another user', 403));

    // Drop the query string so a refresh doesn't hit Stripe again
    res.redirect(req.originalUrl.split('?')[0] ?? '/my-bookings');
  }
);

export const webhookCheckout = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
  if (!webhookSecret || typeof signature !== 'string')
    return res.status(400).send('Webhook not configured');

  try {
    const event: Stripe.Event = getStripe().webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      await createBookingFromSession(event.data.object.id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unexpected error';
    console.error('❌ Stripe webhook error:', message);
    return res.status(400).send(`Webhook error: ${message}`);
  }

  res.status(200).json({ received: true });
};
