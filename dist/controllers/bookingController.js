import Stripe from 'stripe';
import {} from 'express';
import * as handlerFactory from './handlerFactory.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import Tour from '../models/tourModel.js';
import AppError from '../utils/AppError.js';
import {} from './authController.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const createBooking = handlerFactory.createOne(Booking);
export const deleteBooking = handlerFactory.deleteOne(Booking);
export const getAllBookings = handlerFactory.getAll(Booking);
export const updateBooking = handlerFactory.updateOne(Booking);
export const getBooking = handlerFactory.getOne(Booking, 'user tour');
export const createCheckoutSession = async (req, res) => {
    try {
        const { tourID } = req.params;
        if (!tourID) {
            // This should never happen if your route is correct,
            // but TS needs the check to know it's a string
            throw new AppError('Tour ID is missing', 400);
        }
        const tour = await Tour.findById(tourID);
        if (!tour)
            throw new AppError('Tour not found', 404);
        const baseUrl = process.env.DEV_TUNNEL_URL || `${req.protocol}://${req.get('host')}`;
        if (!tour)
            throw new AppError('There is problem when  allocating tour', 400);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${baseUrl}/my-bookings`,
            cancel_url: `${baseUrl}/tour/${tour.slug}`,
            customer_email: req.user.email,
            client_reference_id: tourID,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: tour.name,
                            ...(tour.summary && { description: tour.summary }),
                            images: [`${baseUrl}/img/tours/${tour.imageCover}`]
                        },
                        unit_amount: tour.price * 100
                    },
                    quantity: 1
                }
            ]
        });
        // Return the URL directly
        res.status(200).json({ status: 'success', url: session.url });
    }
    catch (error) {
        if (error instanceof Error) {
            console.log('ERROR 💥', error.message);
            console.log('STACK 🧩', error.stack);
            res.status(500).json({ status: 'error', message: error.message });
        }
        else {
            console.log('UNKNOWN ERROR 💥', error);
            res
                .status(500)
                .json({ status: 'error', message: 'Something went wrong' });
        }
    }
};
const createBookingCheckout = async (session) => {
    console.log('Creating booking in the database');
    // Fetch the full session with line items from Stripe
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items']
    });
    // Check client_reference_id exists
    const tour = fullSession.client_reference_id;
    if (!tour)
        throw new AppError('Tour reference missing from session', 400);
    // Find user
    const user = await User.findOne({ email: fullSession.customer_email });
    if (!user)
        throw new AppError('User not found', 400);
    // Make sure line items exist
    const lineItem = fullSession.line_items?.data[0];
    if (!lineItem || !lineItem.price?.unit_amount)
        throw new AppError('Problem with line items in session', 400);
    const price = lineItem.price.unit_amount / 100;
    await Booking.create({ tour, user, price });
    console.log('✅ Booking was created');
};
export const webhookCheckout = async (req, res) => {
    console.log('✅ Webhook was received successfully');
    const signature = req.headers['stripe-signature'];
    try {
        const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('🎉 Mission completed respect!!!!');
        console.log('📦 Event type:', event.type);
        if (event.type === 'checkout.session.completed') {
            await createBookingCheckout(event.data.object);
        }
    }
    catch (err) {
        if (err instanceof Error) {
            console.error('❌ Stripe webhook error:', err.message);
            return res.status(400).send(`Webhook error: ${err.message}`);
        }
        else {
            console.error('unexpected error occurred');
        }
    }
    res.status(200).json({ received: true });
};
