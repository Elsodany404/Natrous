import mongoose, { Document, Types, Query } from 'mongoose';
import Tour from './tourModel.js';
// --------------------- SCHEMA ---------------------
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        trim: true,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be at least 1 star'],
        max: [5, 'Rating must be at most 5 stars'],
        set: (val) => Math.round(val * 10) / 10
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// --------------------- STATIC METHODS ---------------------
reviewSchema.statics.calcRatingOnReviews = async function (tourId) {
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
    }
    else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingAverage: 4.5,
            ratingQuantity: 0
        });
    }
};
// --------------------- DOCUMENT MIDDLEWARE ---------------------
// After saving a review, recalc tour ratings
reviewSchema.post('save', async function () {
    await this.constructor.calcRatingOnReviews(this.tour);
});
// --------------------- QUERY MIDDLEWARE ---------------------
// Before findOneAndUpdate / findOneAndDelete: store doc
reviewSchema.pre(/^findOneAnd/, async function (next) {
    const doc = await this.clone().findOne(); // clone to avoid "already executed" errors
    this.r = doc;
    next();
});
// After findOneAndUpdate / findOneAndDelete: recalc tour ratings
reviewSchema.post(/^findOneAnd/, async function () {
    if (this.r) {
        await this.r.constructor.calcRatingOnReviews(this.r.tour);
    }
});
// Automatically populate user on find queries
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});
// --------------------- MODEL ---------------------
const Review = mongoose.model('Review', reviewSchema);
export default Review;
