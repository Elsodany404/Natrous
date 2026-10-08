import {} from 'express';
import Tour from '../models/tourModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import Booking from '../models/bookingModel.js';
import {} from './authController.js';
export const getOverview = catchAsync(async (req, res) => {
    const tours = await Tour.find();
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});
export const getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({
        slug: req.params.slug
    }).populate('reviews');
    if (!tour) {
        return next(new AppError('There is no tour with this name', 404));
    }
    res.status(200).render('tour', {
        title: tour.slug,
        tour
    });
});
export const getMostPopularTours = catchAsync(async (req, res, next) => {
    const popularTours = await Tour.find()
        .sort({ ratingsAverage: -1 })
        .limit(3);
    if (!popularTours || popularTours.length === 0) {
        return next(new AppError('There are no tours', 404));
    }
    res.status(200).render('home', {
        title: 'Most Popular Tours',
        tours: popularTours
    });
});
export const getLogin = catchAsync(async (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
});
export const getSignup = catchAsync(async (req, res) => {
    res.status(200).render('signup', {
        title: 'sign up'
    });
});
export const getProfile = catchAsync(async (req, res) => {
    res.status(200).render('profile', {
        title: 'profile'
    });
});
export const getMyBookings = catchAsync(async (req, res) => {
    const bookings = await Booking.find({ user: req.user.id });
    const tourIDs = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });
    res.status(200).render('overview', {
        title: 'My tours',
        tours
    });
});
