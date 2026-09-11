import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Session from '../models/Session';
import { connectDB } from '../config/db';

dotenv.config();

async function init() {
  await connectDB();

  await User.createIndexes();
  await Session.createIndexes();

  const studentEmail = 'student@unimentor.dev';
  const mentorEmail = 'mentor@unimentor.dev';

  if (!(await User.findOne({ email: studentEmail }))) {
    await User.create({
      name: 'Demo Student',
      email: studentEmail,
      password: 'password123',
      role: 'student',
    });
    console.log('Created demo student:', studentEmail);
  }

  if (!(await User.findOne({ email: mentorEmail }))) {
    await User.create({
      name: 'Demo Mentor',
      email: mentorEmail,
      password: 'password123',
      role: 'mentor',
      bio: 'Helps with computer science and maths.',
      subjects: ['Computer Science', 'Maths'],
    });
    console.log('Created demo mentor:', mentorEmail);
  }

  const dbName = mongoose.connection.db?.databaseName;
  const collections = (await mongoose.connection.db?.listCollections().toArray()) ?? [];
  console.log('Database:', dbName);
  console.log(
    'Collections:',
    collections.map((c) => c.name).join(', ') || '(none)'
  );

  await mongoose.disconnect();
  console.log('Atlas database is ready.');
}

init().catch(async (err) => {
  console.error('Failed to initialize Atlas database:', err.message);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
