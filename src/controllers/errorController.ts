import { type Request, type Response } from 'express';
import AppError from '../utils/AppError.js';

const handleJWTVerification = () => new AppError('Invalid token', 404);
const handleExpiredJWT = () => new AppError('jwt expired', 404);

interface AppErrorType extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: number;
  path?: string;
  value?: string;
  errors?: Record<string, { message: string }>;
}
const handleValidationError = (err: AppErrorType) => {
  const { errors } = err;
  if (!errors) throw new AppError('there is problem finding exact error', 400);
  const errorMessages: string[] = [];
  Object.values(errors).forEach((obj) => {
    errorMessages.push(obj.message);
  });
  const message = errorMessages.join('. ');
  return new AppError(message, 400);
};
const handleDuplicateKeyError = (err: AppErrorType) => {
  const matches = err.message.match(/"([^"]*)"/g) || [];
  const message = `Duplicate key error: ${matches.join(', ')}`;
  return new AppError(message, 400);
};
const handleCastError = (err: AppErrorType) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400); // bad request
};

const sendProdError = (err: AppErrorType, req: Request, res: Response) => {
  if ((req as any).originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        isOperational: true
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'somthing went wrong'
      });
    }
  } else {
    if (err.isOperational) {
      console.error('ERROR 💥', err);
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      });
    } else {
      console.error('ERROR 💥', err);
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
      });
    }
  }
};
const sendDevError = (err: AppErrorType, req: Request, res: Response) => {
  if ((req as any).originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      err: err,
      stack: err.stack
    });
  } else {
    console.error('ERROR 💥', err);
    return res
      .status(err.statusCode)
      .render('error', { title: 'Somthing went wrong', msg: err.message });
  }
};

const globalErrorHandler = (err: AppErrorType, req: Request, res: Response) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(Object.getPrototypeOf(err));
    Object.assign(error, err);
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'ValidationError') {
      error = handleValidationError(err);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTVerification();
    }
    if (err.name === 'TokenExpiredError') {
      error = handleExpiredJWT();
    }
    sendProdError(error, req, res);
  }
};
export default globalErrorHandler;
