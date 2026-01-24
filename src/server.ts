// server.js
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import mongoose from 'mongoose';

dotenv.config({
  path: './config.env'
}); // Load env vars first

const options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.cert')
};

// use top-level await for dynamic import
const { default: app } = await import('./app.js');

// connect database
try {
  await mongoose.connect(
    process.env.DATABASE!.replace(
      '<db_password>',
      process.env.DATABASE_PASSWORD!
    )
  );
  console.log(':) Database connected');

  https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS Server running on https://localhost:3000');
  });
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(':( DB connection failed:', err.message);
  } else {
    console.log('somthing went wrong when connecting to database');
  }
}
