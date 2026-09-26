import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import mentorRoutes from './routes/mentorRoutes';
import sessionRoutes from './routes/sessionRoutes';
import userRoutes from './routes/userRoutes';
import learningRoutes from './routes/learningRoutes';
import materialRoutes from './routes/materialRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import goalRoutes from './routes/goalRoutes';
import groupRoutes from './routes/groupRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import complaintRoutes from './routes/complaintRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/complaints', complaintRoutes);

app.use(errorHandler);

export default app;
