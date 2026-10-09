import User from '../models/User';

const DEMO_PASSWORD = 'password123';

const DEMO_ACCOUNTS = [
  {
    name: 'Nethmi Silva',
    email: 'student@unimentor.dev',
    role: 'student' as const,
    bio: 'Demo undergraduate student account.',
  },
  {
    name: 'Campus Admin',
    email: 'admin@unimentor.dev',
    role: 'admin' as const,
    bio: 'Demo campus administrator for UniMentor.',
  },
  {
    name: 'Faculty LIC',
    email: 'lic@unimentor.dev',
    role: 'lic' as const,
    bio: 'Demo Lecturer-in-Charge for assessment review.',
  },
  {
    name: 'Faculty LIC',
    email: 'lic.admin@unimentor.test',
    role: 'lic' as const,
    bio: 'Campus admin and lecturer-in-charge reviewer.',
  },
  {
    name: 'Alex Ferreira',
    email: 'alex.f@unimentor.lk',
    role: 'mentor' as const,
    bio: 'Senior distinction peer tutor specializing in SQL query optimization and database design.',
    subjects: ['Database Management Systems', 'Data Structures & Algorithms'],
    rating: 4.9,
    reviewCount: 48,
    hourlyRate: 2500,
    experience: 'Senior Peer Mentor',
    sessionCount: 38,
    availability: 'Weekdays 3:00 - 6:00 PM',
  },
  {
    name: 'Tharushi Perera',
    email: 'tharushi.p@unimentor.lk',
    role: 'mentor' as const,
    bio: 'Specialist in Graph Algorithms, BFS/DFS, and Tree Traversals.',
    subjects: ['Data Structures & Algorithms', 'Object Oriented Programming'],
    rating: 4.9,
    reviewCount: 38,
    hourlyRate: 2200,
    experience: 'Senior Peer Mentor',
    sessionCount: 24,
    availability: 'Flexible Evenings',
  },
  {
    name: 'Shenal Perera',
    email: 'shenal.p@unimentor.lk',
    role: 'mentor' as const,
    bio: 'Specialized in React Native, cross-platform apps, and cloud integration. Fluent in English, Sinhala & Tamil.',
    subjects: ['Mobile Application Development', 'Web Development & Cloud'],
    rating: 4.9,
    reviewCount: 38,
    hourlyRate: 2400,
    experience: 'Senior Peer Mentor',
    sessionCount: 31,
    availability: 'Fridays & Weekends',
  },
  {
    name: 'Kaveen De Silva',
    email: 'kaveen.d@unimentor.lk',
    role: 'mentor' as const,
    bio: 'Expert in Clean Architecture, Enterprise Design Patterns, and Microservices.',
    subjects: ['Software Architecture & Design', 'Web Development & Cloud'],
    rating: 4.8,
    reviewCount: 29,
    hourlyRate: 2600,
    experience: 'Lead Peer Mentor',
    sessionCount: 29,
    availability: 'Weekdays & Evenings',
  },
  {
    name: 'Sanduni Fernando',
    email: 'sanduni.f@unimentor.lk',
    role: 'mentor' as const,
    bio: 'Experienced peer tutor in Database Normalization, ERDs, and ML Data Pipelines.',
    subjects: ['Database Management Systems', 'Machine Learning Systems'],
    rating: 4.95,
    reviewCount: 44,
    hourlyRate: 2200,
    experience: 'Peer Tutor',
    sessionCount: 35,
    availability: 'Tuesdays & Thursdays',
  },
  {
    name: 'Dr. Asanka Perera',
    email: 'asanka.p@unimentor.lk',
    role: 'mentor' as const,
    bio: 'Faculty Academic Mentor with deep expertise in Probability, Combinatorics, and Stats. Fluent in English, Sinhala and Tamil.',
    subjects: ['Probability & Statistics', 'Discrete Mathematics'],
    rating: 5.0,
    reviewCount: 52,
    hourlyRate: 4500,
    experience: 'Faculty Academic Mentor',
    sessionCount: 60,
    availability: 'Weekend Sessions',
  },
];

export async function seedDemoAccounts(): Promise<void> {
  for (const account of DEMO_ACCOUNTS) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      if (existing.role !== account.role) {
        existing.role = account.role;
        await existing.save();
      }
      continue;
    }
    await User.create({
      ...account,
      password: DEMO_PASSWORD,
    });
    console.log(`✅ Demo account ready: ${account.email} (${account.role})`);
  }
}
