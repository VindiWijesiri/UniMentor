import { Response, NextFunction } from 'express';
import Goal from '../models/Goal';
import { AuthRequest } from '../middleware/auth';

function progressOf(goal: { logs: { minutes: number }[]; targetHours: number }): number {
  const hours = goal.logs.reduce((sum, log) => sum + log.minutes, 0) / 60;
  if (!goal.targetHours) return 0;
  return Math.min(100, Math.round((hours / goal.targetHours) * 100));
}

export async function listGoals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.userRole === 'student' ? req.userId : (req.query.studentId as string) ?? req.userId;
    const goals = await Goal.find({ studentId }).sort({ createdAt: -1 });
    res.json(goals.map((goal) => ({ ...goal.toJSON(), progress: progressOf(goal) })));
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.userRole !== 'student') {
      res.status(403).json({ message: 'Only students can create learning goals.' });
      return;
    }
    const goal = await Goal.create({
      studentId: req.userId,
      title: req.body.title,
      subject: req.body.subject,
      module: req.body.module,
      targetDate: req.body.targetDate,
      targetHours: req.body.targetHours ?? 10,
    });
    res.status(201).json({ ...goal.toJSON(), progress: 0 });
  } catch (err) {
    next(err);
  }
}

export async function logGoalProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      res.status(404).json({ message: 'Goal not found.' });
      return;
    }
    if (String(goal.studentId) !== req.userId) {
      res.status(403).json({ message: 'Not authorised to update this goal.' });
      return;
    }
    const minutes = Number(req.body.minutes);
    if (!minutes || minutes < 1) {
      res.status(400).json({ message: 'Minutes studied are required.' });
      return;
    }
    goal.logs.push({ date: req.body.date ? new Date(req.body.date) : new Date(), minutes, note: req.body.note });
    const progress = progressOf(goal);
    if (progress >= 100) goal.status = 'completed';
    await goal.save();
    res.json({ ...goal.toJSON(), progress });
  } catch (err) {
    next(err);
  }
}

export async function getGoal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      res.status(404).json({ message: 'Goal not found.' });
      return;
    }
    if (String(goal.studentId) !== req.userId && req.userRole !== 'lic' && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Not authorised to view this goal.' });
      return;
    }
    res.json({ ...goal.toJSON(), progress: progressOf(goal) });
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      res.status(404).json({ message: 'Goal not found.' });
      return;
    }
    if (String(goal.studentId) !== req.userId) {
      res.status(403).json({ message: 'Not authorised to update this goal.' });
      return;
    }
    const allowed = ['title', 'subject', 'module', 'targetDate', 'targetHours', 'status'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (goal as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }
    await goal.save();
    res.json({ ...goal.toJSON(), progress: progressOf(goal) });
  } catch (err) {
    next(err);
  }
}
