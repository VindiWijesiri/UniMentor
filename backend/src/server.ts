import app from './app';
import { connectDB } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ?? 5000;

async function bootstrap() {
  await connectDB();
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 UniMentor API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
