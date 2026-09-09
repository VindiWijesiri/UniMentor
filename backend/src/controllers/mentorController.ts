import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export async function searchMentors(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (req.query.q as string) ?? '';
    const regex = new RegExp(q, 'i');

    const mentors = await User.find({
      role: 'mentor',
      $or: [{ name: regex }, { subjects: regex }, { bio: regex }],
    }).select('-password');

    res.json(mentors);
  } catch (err) {
    next(err);
  }
}

export async function getMentorById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' }).select('-password');
    if (!mentor) {
      res.status(404).json({ message: 'Mentor not found.' });
      return;
    }
    res.json(mentor);
  } catch (err) {
    next(err);
  }
}
