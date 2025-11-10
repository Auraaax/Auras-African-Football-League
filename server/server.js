import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import adminRoutes from './routes/admin.js';
import visitorRoutes from './routes/visitor.js';
import authRoutes from './routes/auth.js';
import federationRoutes from './routes/federation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server directory explicitly so it works regardless of CWD
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/federation', federationRoutes);

const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Create server/.env with MONGODB_URI=...');
  process.exit(1);
}

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

// For Vercel serverless - ensure DB connection before handling requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1') {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Admin server running on http://localhost:${PORT}`));
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export for Vercel serverless
export default app;
