import mongoose, { Document, Types } from 'mongoose';
// import slugify from 'slugify';

export interface ITour extends Document {
  _id: Types.ObjectId;
  name: string;
  price: number;
  ratingAverage?: number;
  ratingsQuantity?: number;
  duration: number;
  maxGroupSize?: number;
  difficulty?: 'easy' | 'medium' | 'difficult';
  slug?: string;
  description: string;
  summary?: string;
  imageCover: string;
  images?: string[];
  createdAt?: Date;
  secretTour?: boolean;

  startLocation?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    description?: string;
  };

  locations?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    discription?: string; // typo in schema, but keeping as is
    day?: number;
  }[];

  startDates?: Date[];

  guides?: Types.ObjectId[]; // references to User
}

const tourSchema = new mongoose.Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      maxlength: [40, 'Name must be at most 40 character'],
      minlength: [10, 'Name must be at least 10 character']
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be at least 1 star'],
      max: [5, 'rating must be at most 5 stars']
    },
    ratingsQuantity: Number,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
      type: Number,
      default: 5
    },
    difficulty: {
      type: String,
      trim: true,
      default: 'medium',
      enum: {
        message: 'difficulty must be easy, medium and difficult',
        values: ['easy', 'medium', 'difficult']
      }
    },
    slug: String,
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have description']
    },
    summary: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover photo']
    },
    images: [String],
    createdAt: {
      type: Date,
      select: false,
      default: Date.now()
    },
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        discription: String,
        day: Number
      }
    ],
    startDates: [Date],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);
tourSchema.index({
  price: 1,
  ratingAverage: -1
});
tourSchema.index({
  startLocation: '2dsphere'
});
tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});
// tourSchema.pre('save', function (this: ITour, next) {
//   this.slug = slugify(this.name, {
//     lower: true
//   });
//   next();
// });
// appling embedding guides
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(
//         async (id) => await User.findById(id)
//     );
//     this.guides = await Promise.all(guidesPromises);
// });
tourSchema.pre(/^find/, function (this: mongoose.Query<ITour, ITour>, next) {
  this.populate('guides');
  next();
});
tourSchema.pre(/^find/, function (this: mongoose.Query<ITour, ITour>, next) {
  this.find({
    secretTour: {
      $ne: true
    }
  });
  next();
});
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });
const Tour = mongoose.model<ITour>('Tour', tourSchema);
export default Tour;
