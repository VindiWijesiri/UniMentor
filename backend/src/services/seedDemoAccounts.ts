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
    name: 'Sample Tutor',
    email: 'mentor@unimentor.dev',
    role: 'mentor' as const,
    bio: 'Sample tutor for software engineering, data structures, and algorithms.',
    subjects: ['Data Structures', 'Algorithms', 'Software Architecture', 'OOP'],
    rating: 4.8,
    reviewCount: 16,
    hourlyRate: 2000,
    experience: 'Peer tutor, Year 4',
    qualification: 'Undergraduate Teaching Assistant',
    isVerified: true,
    verificationStatus: 'verified' as const,
    accountStatus: 'active' as const,
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
