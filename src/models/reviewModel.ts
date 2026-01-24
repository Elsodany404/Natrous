import mongoose, { Document, Types, Query } from 'mongoose';
import Tour from './tourModel.js';

// --------------------- DOCUMENT INTERFACE ---------------------
export interface IReview extends Document {
  _id: Types.ObjectId;
  review: string;
  rating: number;
  createdAt: Date;
  user: Types.ObjectId;
  tour: Types.ObjectId;
  [key: string]: any; // allows extra properties if needed
}

// --------------------- QUERY INTERFACE EXTENSION ---------------------
interface QueryWithReview extends Query<IReview, IReview> {
  r?: IReview | null;
}

// --------------------- MODEL INTERFACE ---------------------
interface ReviewModel extends mongoose.Model<IReview> {
  calcRatingOnReviews: (tourId: string | Types.ObjectId) => Promise<void>;
}

// --------------------- SCHEMA ---------------------
const reviewSchema = new mongoose.Schema<IReview>(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'Review cannot be empty']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating must be at most 5 stars'],
      set: (val: number) => Math.round(val * 10) / 10
    },
    createdAt: {
      type: Date,
      default: Date.now // do NOT call Date.now()
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --------------------- STATIC METHODS ---------------------
reviewSchema.statics.calcRatingOnReviews = async function (
  tourId: string | Types.ObjectId
) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        countReviews: { $sum: 1 },
        countAverage: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: stats[0].countAverage,
      ratingQuantity: stats[0].countReviews
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: 4.5,
      ratingQuantity: 0
    });
  }
};

// --------------------- DOCUMENT MIDDLEWARE ---------------------
// After saving a review, recalc tour ratings
reviewSchema.post('save', async function (this: IReview) {
  await (this.constructor as ReviewModel).calcRatingOnReviews(this.tour);
});

// --------------------- QUERY MIDDLEWARE ---------------------
// Before findOneAndUpdate / findOneAndDelete: store doc
reviewSchema.pre(/^findOneAnd/, async function (this: QueryWithReview, next) {
  const doc = await this.clone().findOne(); // clone to avoid "already executed" errors
  this.r = doc;
  next();
});

// After findOneAndUpdate / findOneAndDelete: recalc tour ratings
reviewSchema.post(/^findOneAnd/, async function (this: QueryWithReview) {
  if (this.r) {
    await (this.r.constructor as ReviewModel).calcRatingOnReviews(this.r.tour);
  }
});

// Automatically populate user on find queries
reviewSchema.pre(/^find/, function (this: Query<IReview, IReview>, next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// --------------------- MODEL ---------------------
const Review = mongoose.model<IReview, ReviewModel>('Review', reviewSchema);

export default Review;
