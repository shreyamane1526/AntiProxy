import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/db.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import attendanceRoutes from './routes/attendance.js';
import analyticsRoutes from './routes/analytics.js';
import riskRoutes from './routes/risk.js';
import ruleRoutes from './routes/rules.js';
import notificationRoutes from './routes/notifications.js';
import timetablesRoutes from './routes/timetables.js';
import faceProfileRoutes from './routes/faceProfile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Express Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetables', timetablesRoutes);
app.use('/api/students', faceProfileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'AntiProxy Attendance Verification Engine',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
});

// Start Express Server
async function startServer() {
  await initDb();
  await seedDatabase();

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 AntiProxy Express Backend listening on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another node process.`);
      console.error(`   Run 'taskkill /F /PID <pid>' to free port ${PORT}.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
