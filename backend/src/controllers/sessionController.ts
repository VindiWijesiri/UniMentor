import { Response, NextFunction } from 'express';
import Session from '../models/Session';
import { AuthRequest } from '../middleware/auth';

export async function getMySessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await Session.find({
      $or: [{ studentId: req.userId }, { mentorId: req.userId }],
    })
      .populate('mentorId', 'name email')
      .populate('studentId', 'name email')
      .sort({ scheduledAt: 1 });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function bookSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mentorId, subject, scheduledAt, notes } = req.body;

    const session = await Session.create({
      mentorId,
      studentId: req.userId,
      subject,
      scheduledAt,
      notes,
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function cancelSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    const isOwner =
      String(session.studentId) === req.userId || String(session.mentorId) === req.userId;
    if (!isOwner) {
      res.status(403).json({ message: 'Not authorised to cancel this session.' });
      return;
    }

    session.status = 'cancelled';
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function updateSessionStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
}
