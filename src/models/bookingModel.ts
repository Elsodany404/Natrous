import mongoose, { Document, Types } from 'mongoose';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  tour: Types.ObjectId;
  user: Types.ObjectId;
  price: number;
  paid: boolean;
  createdAt: Date;
}
const bookingSchema = new mongoose.Schema<IBooking>({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'booking must belong to a tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'booking must belong to a user']
  },
  price: {
    type: Number,
    required: [true, 'booking must have price']
  },
  paid: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});
// bookingSchema.pre(/^find/, function (next) {
//   this.populate('user').populate({ path: 'tour', select: 'name' });
//   next();
// });
const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;
