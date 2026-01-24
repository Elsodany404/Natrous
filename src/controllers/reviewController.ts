// import catchAsync from '../utils/catchAsync.js';
import { type Request } from 'express';
import Review from '../models/reviewModel.js';
import type { authRequest } from './authController.js';
import * as handlerFactory from './handlerFactory.js';

export const getAllReviews = handlerFactory.getAll(Review);
export const createReview = handlerFactory.createOne(Review);
export const deleteReview = handlerFactory.deleteOne(Review);

export const checkReviewUserTour = (req: Request) => {
  if (!req.body.user) req.body.user = (req as authRequest).user;
  if (!req.body.tour) req.body.tour = req.params.tourId;
};
