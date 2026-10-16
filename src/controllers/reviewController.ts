import { type NextFunction, type Request, type Response } from 'express';
import Review from '../models/reviewModel.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import type { authRequest } from './authController.js';
import * as handlerFactory from './handlerFactory.js';

export const getAllReviews = handlerFactory.getAll(Review);
export const createReview = handlerFactory.createOne(Review);
export const deleteReview = handlerFactory.deleteOne(Review);

export const checkReviewUserTour = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user } = req as authRequest;
  // Only admins may post a review on behalf of another user
  if (!req.body.user || user.role !== 'admin') req.body.user = user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

// Users can only delete their own reviews, admins can delete any review
export const checkReviewOwner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as authRequest;
    if (user.role === 'admin') return next();

    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new AppError('No document found with that ID', 404));
    }
    // review.user is populated by the pre-find hook (null if the author is inactive)
    if (String(review.user?._id) !== String(user.id)) {
      return next(new AppError('You can only delete your own reviews', 403));
    }
    next();
  }
);
