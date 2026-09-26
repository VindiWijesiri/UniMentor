import { Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export async function listNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === 'all') {
      await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
      res.json({ ok: true });
      return;
    }
    await Notification.updateOne({ _id: req.params.id, userId: req.userId }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
