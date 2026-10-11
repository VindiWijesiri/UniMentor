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
];

export async function seedDemoAccounts(): Promise<void> {
  for (const account of DEMO_ACCOUNTS) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      let changed = false;
      if (existing.role !== account.role) {
        existing.role = account.role;
        changed = true;
      }
      if (/demo/i.test(existing.name)) {
        existing.name = account.name;
        changed = true;
      }
      if (account.email === 'student@unimentor.dev' && !existing.degreeProgramme) {
        existing.degreeProgramme = 'BSc (Hons) in Software Engineering';
        existing.academicYear = existing.academicYear || 'Year 2';
        changed = true;
      }
      if (changed) await existing.save();
      continue;
    }
    await User.create({
      ...account,
      password: DEMO_PASSWORD,
    });
    console.log(`✅ Demo account ready: ${account.email} (${account.role})`);
  }
}
