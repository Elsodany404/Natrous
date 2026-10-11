// server.js
import dotenv from 'dotenv';
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
        await mongoose.connect(databaseUri.replace('<db_password>', process.env.DATABASE_PASSWORD ?? ''));
        console.log(':) Database connected');
    }
    else if (!isDevelopment) {
        throw new Error('MONGODB_URI or DATABASE must be configured outside development mode');
    }
}
catch (err) {
    if (!isDevelopment) {
        console.error(':( DB connection failed:', err);
        process.exitCode = 1;
    }
    else {
        console.error(':( Database unavailable; starting without database:', err);
    }
}
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`HTTP Server running on port ${port}`);
});
