import { type Request, type Response, type NextFunction } from 'express';
import Tour from '../models/tourModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import Booking from '../models/bookingModel.js';
import { type authRequest } from './authController.js';

export const getOverview = catchAsync(async (req: Request, res: Response) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

export const getTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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
  }
);
export const getLogin = catchAsync(async (req: Request, res: Response) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});
export const getSignup = catchAsync(async (req: Request, res: Response) => {
  res.status(200).render('signup', {
    title: 'sign up'
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  res.status(200).render('profile', {
    title: 'profile'
  });
});
export const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const bookings = await Booking.find({ user: (req as authRequest).user.id });
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My tours',
    tours
  });
});
