// server.js
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import mongoose from 'mongoose';

dotenv.config({
  path: ['./config.env', './.env', './atlas-credentials.env']
}); // Load env vars first

// use top-level await for dynamic import
const { default: app } = await import('./app.js');

// connect database
const isDevelopment = process.env.NODE_ENV === 'development';
try {
  const databaseUri = process.env.MONGODB_URI ?? process.env.DATABASE;
  if (databaseUri) {
    await mongoose.connect(
      databaseUri.replace('<db_password>', process.env.DATABASE_PASSWORD ?? '')
    );
    console.log(':) Database connected');
  } else if (!isDevelopment) {
    throw new Error(
      'MONGODB_URI or DATABASE must be configured outside development mode'
    );
  }
} catch (err: unknown) {
  if (!isDevelopment) {
    console.error(':( DB connection failed:', err);
    process.exitCode = 1;
  } else {
    console.error(':( Database unavailable; starting without database:', err);
  }
}

if (isDevelopment) {
  app.listen(3000, () => {
    console.log('HTTP Server running on http://localhost:3000');
  });
} else {
  const options = {
    key: fs.readFileSync('cert/server.key'),
    cert: fs.readFileSync('cert/server.cert')
  };

  https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS Server running on https://localhost:3000');
  });
}
