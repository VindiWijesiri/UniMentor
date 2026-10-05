import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import mentorRoutes from './routes/mentorRoutes';
import sessionRoutes from './routes/sessionRoutes';
import userRoutes from './routes/userRoutes';
import reviewRoutes from './routes/reviewRoutes';
import chatRoutes from './routes/chatRoutes';
import learningRoutes from './routes/learningRoutes';
import podRoutes from './routes/podRoutes';
import libraryRoutes from './routes/libraryRoutes';
import campusRoutes from './routes/campusRoutes';
import notificationRoutes from './routes/notificationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Detailed Request & Response logger for debugging mobile client calls
app.use((req, res, next) => {
  const start = Date.now();
  const hasAuth = !!req.headers.authorization;
  console.log(`\n📡 [BACKEND INCOMING] ${req.method} ${req.originalUrl}`);
  console.log(`   Origin IP: ${req.ip} | Authorization: ${hasAuth ? 'Bearer [token present]' : 'NONE'}`);
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '****';
    console.log(`   Body:`, JSON.stringify(safeBody));
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 [BACKEND OUTGOING] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/pod', podRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Global error handler — must be last
app.use(errorHandler);

export default app;
