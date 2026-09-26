import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { USER_ROLES } from '../types/roles';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowedFields = ['name', 'bio', 'profilePicture', 'subjects'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = req.query.role as string | undefined;
    const q = ((req.query.q as string) ?? '').trim();
    const filter: Record<string, unknown> = {};
    if (role && (USER_ROLES as readonly string[]).includes(role)) {
      filter.role = role;
    }
    if (q) {
      filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    }
    const users = await User.find(filter).select('-password').sort({ name: 1 }).limit(80);
    res.json(users);
  } catch (err) {
    next(err);
  }
}
