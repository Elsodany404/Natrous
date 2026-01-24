import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import validator from 'validator';
import mongoose, { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordLastModificationTime: Date;
  resetPasswordToken: string;
  resetPasswordExpires: Date;
  role: 'admin' | 'user' | 'lead-guide' | 'guide';
  active: boolean;
  photo?: string;

  // instance methods
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  checkPasswordChanged(JWTTimeStamp: number): boolean;
  createResetPasswordToken(): string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please insert correct email']
    },
    photo: String,
    password: {
      type: String,
      required: [true, 'Please insert a password'],
      min: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      // Create and Save only
      validate: {
        validator: function (pw) {
          return pw === this.password;
        },
        message: 'Please confirm password correctly'
      }
    },
    passwordLastModificationTime: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    role: {
      type: String,
      enum: ['admin', 'user', 'lead-guide', 'guide'],
      default: 'user'
    },
    active: {
      type: Boolean,
      default: true
    }
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
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password!, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordLastModificationTime = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.correctPassword = function (
  candidatePassword: string,
  userPassword: string
) {
  return bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.checkPasswordChanged = function (JWTTimeStamp: number) {
  if (this.passwordLastModificationTime) {
    // Convert modification time to seconds
    const changedTimestamp = parseInt(
      String(this.passwordLastModificationTime.getTime() / 1000),
      10
    );
    return JWTTimeStamp < changedTimestamp;
  }
  return false;
};
userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
// this here refer to query
userSchema.pre(
  /^find/,
  async function (this: mongoose.Query<IUser, IUser>, next) {
    this.find({
      active: {
        $ne: false
      }
    });
    next();
  }
);

const User = mongoose.model<IUser>('User', userSchema);
export default User;
// name, email, photo, password, passwordConfirm;
