import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import { xss } from 'express-xss-sanitizer';
import mongoSanitize from 'express-mongo-sanitize';

// Routers & Controllers
import globalErrorHandler from './controllers/errorController.js';
import * as bookingController from './controllers/bookingController.js';
import tourRouter from './routes/tourRouter.js';
import userRouter from './routes/userRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import bookingRouter from './routes/bookingRouter.js';
import viewRouter from './routes/viewRouter.js';
import AppError from './utils/AppError.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
app.enable('trust proxy');

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('tiny'));

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.fr']
      }
    }
  })
);
// Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after an hour'
  }
});
app.use('/api', limiter);

// Stripe webhook must be BEFORE body parser
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization must run after the body parser, otherwise req.body is
// still empty. Passwords are skipped so characters like & < > are not
// HTML-escaped before hashing (that would break existing logins).
app.use(
  xss({
    allowedKeys: [
      'password',
      'passwordConfirm',
      'oldPassword',
      'newPassword',
      'newPasswordConfirm'
    ]
  })
);
app.use(
  mongoSanitize({
    replaceWith: '_'
  })
);

// Enable CORS
app.use(cors());
app.options('*', cors());

// Compression (before static files so they are compressed too)
app.use(compression());

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/img/tours', express.static(path.join(__dirname, '../public/tours')));
app.use('/img/users', express.static(path.join(__dirname, '../public/users')));
app.use('/img', express.static(path.join(__dirname, '../src/client/img')));
app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('views', path.join(__dirname, '../src/views'));
app.set('view engine', 'pug');

// Routers
app.use('/', viewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(globalErrorHandler);

export default app;
