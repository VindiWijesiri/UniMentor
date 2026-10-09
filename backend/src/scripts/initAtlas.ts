import { connectDB } from '../config/db';
import mongoose from 'mongoose';
import User from '../models/User';
import { LibraryMaterial } from '../models/library';
import { AssessmentPaper, CatalogMaterial } from '../models/assessmentWork';
import { GoalPlan } from '../models/goalPlan';
import {
  StudyWeek,
  StudyGoal,
  LearningActivity,
  StudyPlan,
  StudyMaterial,
  Assessment,
  Discussion,
  ChatPodMessage,
} from '../models/learning';
import { seedDemoAccounts } from '../services/seedDemoAccounts';
import { ensureAssessmentCatalog } from '../services/seedAssessmentWork';

const USER_ROLES = ['student', 'mentor', 'admin', 'lic'];
const ACCOUNT_STATUSES = ['active', 'pending', 'under_review', 'suspended', 'rejected', 'expired'];
const VERIFICATION_STATUSES = ['unverified', 'pending', 'under_review', 'verified', 'approved', 'rejected'];

const DEMO_PASSWORDS: Record<string, string> = {
  'student@unimentor.dev': 'password123',
  'admin@unimentor.dev': 'password123',
  'lic@unimentor.dev': 'password123',
  'lic.admin@unimentor.test': 'password123',
  'tharushi.perera@unimentor.test': 'Password123',
  'mentor@unimentor.dev': 'password123',
};

async function repairUsers(): Promise<void> {
  const users = mongoose.connection.collection('users');
  const role = await users.updateMany(
    { role: { $nin: USER_ROLES } },
    { $set: { role: 'student' } },
  );
  const account = await users.updateMany(
    { accountStatus: { $exists: true, $nin: ACCOUNT_STATUSES } },
    { $set: { accountStatus: 'active' } },
  );
  const verification = await users.updateMany(
    { verificationStatus: { $exists: true, $nin: VERIFICATION_STATUSES } },
    { $set: { verificationStatus: 'unverified' } },
  );
  console.log(
    `users repaired: role=${role.modifiedCount} accountStatus=${account.modifiedCount} verification=${verification.modifiedCount}`,
  );
}

async function unsetNullSeedKeys(collectionName: string): Promise<void> {
  const exists = await mongoose.connection.db?.listCollections({ name: collectionName }).hasNext();
  if (!exists) return;
  const result = await mongoose.connection.collection(collectionName).updateMany(
    { seedKey: null },
    { $unset: { seedKey: '' } },
  );
  if (result.modifiedCount) {
    console.log(`${collectionName}: unset null seedKey on ${result.modifiedCount} documents`);
  }
}

async function syncModel(name: string, sync: () => Promise<unknown>): Promise<void> {
  try {
    await sync();
    console.log(`indexes ok: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`indexes failed: ${name}: ${message}`);
  }
}

async function alignDemoPasswords(): Promise<void> {
  for (const [email, password] of Object.entries(DEMO_PASSWORDS)) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) continue;
    user.password = password;
    user.accountStatus = user.accountStatus && ACCOUNT_STATUSES.includes(user.accountStatus)
      ? user.accountStatus
      : 'active';
    await user.save();
  }
  console.log('demo account passwords aligned');
}

async function main(): Promise<void> {
  await connectDB();
  await repairUsers();
  for (const name of ['librarymaterials', 'assessmentpapers', 'catalogmaterials', 'goalplans', 'podconversations']) {
    await unsetNullSeedKeys(name);
  }

  await syncModel('User', () => User.syncIndexes());
  await syncModel('LibraryMaterial', () => LibraryMaterial.syncIndexes());
  await syncModel('AssessmentPaper', () => AssessmentPaper.syncIndexes());
  await syncModel('CatalogMaterial', () => CatalogMaterial.syncIndexes());
  await syncModel('GoalPlan', () => GoalPlan.syncIndexes());
  await syncModel('StudyWeek', () => StudyWeek.syncIndexes());
  await syncModel('StudyGoal', () => StudyGoal.syncIndexes());
  await syncModel('LearningActivity', () => LearningActivity.syncIndexes());
  await syncModel('StudyPlan', () => StudyPlan.syncIndexes());
  await syncModel('StudyMaterial', () => StudyMaterial.syncIndexes());
  await syncModel('Assessment', () => Assessment.syncIndexes());
  await syncModel('Discussion', () => Discussion.syncIndexes());
  await syncModel('ChatPodMessage', () => ChatPodMessage.syncIndexes());

  await seedDemoAccounts();
  await ensureAssessmentCatalog();
  await alignDemoPasswords();

  const counts = {
    users: await User.countDocuments(),
    mentors: await User.countDocuments({ role: 'mentor' }),
    students: await User.countDocuments({ role: 'student' }),
    papers: await AssessmentPaper.countDocuments(),
    catalog: await CatalogMaterial.countDocuments(),
  };
  console.log('database ready', counts);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('database repair failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
