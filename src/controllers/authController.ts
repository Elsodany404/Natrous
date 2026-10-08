import crypto, { type BinaryLike } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import User, { type IUser } from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import Email from '../utils/email.js';

export interface authRequest extends Request {
  user?: any;
}
const signToken = (id: Types.ObjectId) => {
  const secret = process.env.JWT_SECRET_KEY as string;
  const expire = process.env.JWT_EXPIRE_DATE as any;

  if (!secret || !expire) throw new Error('JWT env missing');

  return jwt.sign({ id }, secret, {
    expiresIn: expire
  });
};

export const createSendToken = function (
  user: IUser,
  req: Request,
  statusCode: number,
  res: Response
) {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE_DATE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };
  res.cookie('jwt', token, cookieOptions);
  (user as any).password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
export const signUp = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, passwordConfirm } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm
  });
  try {
    const mailObj = new Email(user, `${req.protocol}://${req.get('host')}/me`);
    await mailObj.sendWelcome();
  } catch (err: unknown) {
    console.error('Welcome email could not be sent:', err);
  }
  createSendToken(user, req, 200, res);
});
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    // if the email and password exist in the req
    if (!email || !password) {
      return next(new AppError('Insert your email and password', 400));
    }
    // if the user exist
    const user = await User.findOne({
      email
    }).select('+password');
    if (
      !user ||
      !(await (user as any).correctPassword(password, user.password))
    ) {
      return next(new AppError('Incorrect email or password', 401));
    }
    try {
      const mailObj = new Email(
        user,
        `${req.protocol}://${req.get('host')}/me`
      );
      await mailObj.sendSignInNotice();
    } catch (err: unknown) {
      console.error('Sign-in notification could not be sent:', err);
    }
    // sending token
    createSendToken(user, req, 200, res);
  }
);

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // ✅ 1. Get token either from header or cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // ✅ 2. If no token, reject
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // ✅ 3. Verify token
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error('JWT secret not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as JwtPayload;
    // ✅ 4. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }
    // ✅ 5. Check if user changed password after token issued
    if (decoded.iat && currentUser.checkPasswordChanged(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }
    // ✅ 6. Grant access to protected route
    (req as authRequest).user = currentUser;
    res.locals.user = currentUser;
    next();
  }
);

export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;
  // ✅ 1. Get token either from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  try {
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error('JWT secret not defined');
    }
    // ✅ 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as JwtPayload;

    const currentUser: IUser | null = await User.findById(decoded.id);
    // ✅ 5. Check if user changed password after token issued
    if (
      decoded.iat &&
      currentUser &&
      currentUser.checkPasswordChanged(decoded.iat)
    ) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }
    (req as authRequest).user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err: unknown) {
    console.log(err);
    next();
  }
};

export const roleRestrictions = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as authRequest).user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // (email) sent via body
    // check if the user exits
    const user = await User.findOne({
      email: req.body.email
    });
    if (!user) {
      return next(
        new AppError('There is no user with this email address', 404)
      );
    }
    // creating token
    // set resetPasswordToken, set resetPasswordTokenExpires
    const resetToken = user.createResetPasswordToken();
    await user.save({
      validateBeforeSave: false
    }); // turn off validation of all props
    // sending email with reset token
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
    // if there is any error of the block itself
    try {
      const mailObj = new Email(user, resetURL);
      await mailObj.send(
        'passwordReset',
        'Reset password token valid for 10 min'
      );
      res.status(200).json({
        status: 'success',
        token: 'url to reset password sent to your email'
      });
    } catch (err: unknown) {
      console.log(err);
      (user as any).resetPasswordToken = undefined;
      (user as any).resetPasswordExpires = undefined;
      await user.save({
        validateBeforeSave: false
      });
      next(
        new AppError(
          `There was an error sending the email. Try again later!`,
          500
        )
      );
    }
  }
);
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
      return next(
        new AppError('please provide new password and confirm it!', 400)
      );
    }
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token as BinaryLike)
      .digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    });
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined;
    await user.save();

    createSendToken(user, req, 200, res);
  }
);

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(200).json({
    status: 'success'
  });
});
export const updateUserPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // req.user from protect authorization middleware
    // req.body.password

    // check for user existant
    const { oldPassword, newPassword, newPasswordConfirm } = req.body;
    const user = await User.findById((req as authRequest).user.id).select(
      '+password'
    );
    if (!user) {
      return next(new AppError('Please login again!', 404));
    }
    // check if the password sent was corrected
    if (!(await user.correctPassword(oldPassword, user.password))) {
      return next(new AppError('Current password is incorrect!', 400));
    }
    // check if the password and confirm password was equal via pre hook
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();
    // create new token and send it to the user
    createSendToken(user, req, 200, res);
  }
);
