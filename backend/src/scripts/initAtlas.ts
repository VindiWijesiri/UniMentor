import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Session from '../models/Session';
import Material from '../models/Material';
import Assessment from '../models/Assessment';
import Goal from '../models/Goal';
import Settings from '../models/Settings';
import { connectDB } from '../config/db';

dotenv.config();

async function init() {
  await connectDB();

  await User.createIndexes();
  await Session.createIndexes();
  await Material.createIndexes();
  await Assessment.createIndexes();
  await Settings.getApp();

  const accounts = [
    {
      name: 'Demo Student',
      email: 'student@unimentor.dev',
      password: 'password123',
      role: 'student' as const,
    },
    {
      name: 'Demo Mentor',
      email: 'mentor@unimentor.dev',
      password: 'password123',
      role: 'mentor' as const,
      bio: 'Peer tutor for computing modules.',
      subjects: ['Data Structures', 'OOP', 'Probability'],
    },
    {
      name: 'Demo LIC',
      email: 'lic@unimentor.dev',
      password: 'password123',
      role: 'lic' as const,
      bio: 'Academic integrity officer.',
    },
    {
      name: 'Demo Admin',
      email: 'admin@unimentor.dev',
      password: 'password123',
      role: 'admin' as const,
    },
  ];

  for (const account of accounts) {
    if (!(await User.findOne({ email: account.email }))) {
      await User.create(account);
      console.log('Created', account.email);
    }
  }

  const student = await User.findOne({ email: 'student@unimentor.dev' });
  const mentor = await User.findOne({ email: 'mentor@unimentor.dev' });

  if (student && mentor && !(await Material.findOne({ title: 'Graph Traversal Notes' }))) {
    await Material.create({
      mentorId: mentor._id,
      title: 'Graph Traversal Notes',
      subject: 'Data Structures',
      module: 'IT2040',
      description: 'BFS, DFS and when to use each on campus exam questions.',
      resourceUrl: 'https://en.wikipedia.org/wiki/Graph_traversal',
      price: 0,
      published: true,
    });
  }

  if (mentor && !(await Assessment.findOne({ title: 'OOP Polymorphism Quiz' }))) {
    await Assessment.create({
      mentorId: mentor._id,
      title: 'OOP Polymorphism Quiz',
      subject: 'Object Oriented Programming',
      module: 'CS2010',
      instructions: 'Choose the best answer. Auto-graded on submit.',
      durationMinutes: 20,
      published: true,
      questions: [
        {
          type: 'mcq',
          prompt: 'Which statement best describes polymorphism?',
          points: 2,
          options: [
            'A class can have only one method',
            'The same interface can have many implementations',
            'Objects cannot inherit fields',
            'All methods must be static',
          ],
          correctIndex: 1,
        },
        {
          type: 'true_false',
          prompt: 'Method overriding happens at runtime in Java.',
          points: 1,
          correctBoolean: true,
        },
        {
          type: 'short_answer',
          prompt: 'Name the OOP pillar that hides internal details.',
          points: 2,
          acceptedAnswers: ['encapsulation', 'Encapsulation'],
        },
      ],
    });
  }

  if (student && !(await Goal.findOne({ title: 'Graph BFS Exercises' }))) {
    await Goal.create({
      studentId: student._id,
      title: 'Graph BFS Exercises',
      subject: 'Data Structures',
      module: 'IT2040',
      targetHours: 6,
      logs: [{ date: new Date(), minutes: 90, note: 'Worked through lecture examples' }],
    });
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
