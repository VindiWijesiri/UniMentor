import app from './app';
import { connectDB } from './config/db';
import { ensureAssessmentCatalog } from './services/seedAssessmentWork';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ?? 5000;

async function bootstrap() {
  await connectDB();
  try {
    await ensureAssessmentCatalog();
  } catch (error) {
    console.error('Assessment catalog seed failed:', error);
  }
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 UniMentor API running on http://localhost:${PORT} (bound to 0.0.0.0)`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
