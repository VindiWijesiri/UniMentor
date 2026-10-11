import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlanCode, StudentPlan } from '../models/studentPlan';

const CATALOG = [
  {
    code: 'free' as const,
    name: 'Free',
    priceLkr: 0,
    period: 'forever',
    tagline: 'Look through tutors and book one session.',
    features: ['Browse tutors', '1 session booking', 'Learning materials'],
  },
  {
    code: 'plus' as const,
    name: 'Student Plus',
    priceLkr: 1490,
    period: 'month',
    tagline: 'More bookings, chat, and study pods.',
    features: ['8 session bookings', 'Tutor chat', 'Study pods', 'Priority matching'],
  },
  {
    code: 'pro' as const,
    name: 'Student Pro',
    priceLkr: 2990,
    period: 'month',
    tagline: 'Full mentoring, live rooms, and unlimited bookings.',
    features: ['Unlimited bookings', 'Live rooms', 'All study materials', 'Priority support'],
  },
];

function isPlanCode(value: unknown): value is PlanCode {
  return value === 'free' || value === 'plus' || value === 'pro';
}

function catalogItem(code: PlanCode) {
  return CATALOG.find((plan) => plan.code === code)!;
}

async function currentFor(userId: string) {
  const row = await StudentPlan.findOne({ studentId: userId });
  if (!row) return null;
  return {
    code: row.code,
    name: catalogItem(row.code).name,
    priceLkr: catalogItem(row.code).priceLkr,
    chosenAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPlans(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const current = await currentFor(String(req.userId));
    res.json({ plans: CATALOG, current });
  } catch (error) {
    next(error);
  }
}

export async function choosePlan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = String(req.userId);
    if (!isPlanCode(req.body.code)) {
      res.status(400).json({ message: 'Choose Free, Student Plus, or Student Pro.' });
      return;
    }
    const existing = await StudentPlan.findOne({ studentId: userId });
    if (existing) {
      res.status(409).json({ message: 'You already have a plan. Switch it instead.' });
      return;
    }
    const row = await StudentPlan.create({ studentId: userId, code: req.body.code });
    const plan = catalogItem(row.code);
    res.status(201).json({
      code: row.code,
      name: plan.name,
      priceLkr: plan.priceLkr,
      chosenAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePlan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = String(req.userId);
    if (!isPlanCode(req.body.code)) {
      res.status(400).json({ message: 'Choose Free, Student Plus, or Student Pro.' });
      return;
    }
    const row = await StudentPlan.findOne({ studentId: userId });
    if (!row) {
      res.status(404).json({ message: 'Choose a plan first.' });
      return;
    }
    row.code = req.body.code;
    await row.save();
    const plan = catalogItem(row.code);
    res.json({
      code: row.code,
      name: plan.name,
      priceLkr: plan.priceLkr,
      chosenAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function removePlan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const removed = await StudentPlan.findOneAndDelete({ studentId: String(req.userId) });
    if (!removed) {
      res.status(404).json({ message: 'No plan to remove.' });
      return;
    }
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
}
