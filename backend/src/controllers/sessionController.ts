import { Response, NextFunction } from 'express';
import Session from '../models/Session';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { notifyUser } from '../utils/notify';
import { presentSession } from '../utils/sessionView';

const USER_FIELDS = 'name email role profilePicture subjects bio rating';

async function loadSession(id: string) {
  return Session.findById(id).populate('mentorId', USER_FIELDS).populate('studentId', USER_FIELDS);
}

export async function getMySessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await Session.find({
      $or: [{ studentId: req.userId }, { mentorId: req.userId }],
    })
      .populate('mentorId', USER_FIELDS)
      .populate('studentId', USER_FIELDS)
      .sort({ scheduledAt: 1 });

    res.json(sessions.map((session) => presentSession(session, req.userId)));
  } catch (err) {
    next(err);
  }
}

export async function getSessionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await loadSession(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }
    const studentId = String((session.studentId as { _id?: unknown })._id ?? session.studentId);
    const mentorId = String((session.mentorId as { _id?: unknown })._id ?? session.mentorId);
    if (studentId !== req.userId && mentorId !== req.userId && req.userRole !== 'admin' && req.userRole !== 'lic') {
      res.status(403).json({ message: 'Not authorised to view this booking.' });
      return;
    }
    res.json(presentSession(session, req.userId));
  } catch (err) {
    next(err);
  }
}

export async function bookSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.userRole !== 'student') {
      res.status(403).json({ message: 'Only students can book a session.' });
      return;
    }
    const { mentorId, subject, scheduledAt, notes } = req.body;
    if (!mentorId || !subject || !scheduledAt) {
      res.status(400).json({ message: 'Mentor, subject and time are required.' });
      return;
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      res.status(404).json({ message: 'Mentor not found.' });
      return;
    }

    const session = await Session.create({
      mentorId,
      studentId: req.userId,
      subject,
      scheduledAt,
      notes,
    });
    const populated = await loadSession(String(session._id));
    await notifyUser({
      userId: String(mentor._id),
      title: 'New booking request',
      body: `${req.body.studentName ?? 'A student'} booked ${subject}. Verify attendance when they arrive.`,
      type: 'booking',
      relatedId: String(session._id),
    });
    res.status(201).json(presentSession(populated ?? session, req.userId));
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
    const otherId = String(session.studentId) === req.userId ? String(session.mentorId) : String(session.studentId);
    await notifyUser({
      userId: otherId,
      title: 'Booking cancelled',
      body: `${session.subject} was cancelled.`,
      type: 'booking',
      relatedId: String(session._id),
    });
    const populated = await loadSession(String(session._id));
    res.json(presentSession(populated ?? session, req.userId));
  } catch (err) {
    next(err);
  }
}

export async function updateSessionStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      res.status(400).json({ message: 'Invalid status.' });
      return;
    }
    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }
    const isOwner =
      String(session.studentId) === req.userId || String(session.mentorId) === req.userId;
    if (!isOwner && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Not authorised to update this session.' });
      return;
    }
    session.status = status;
    await session.save();
    const populated = await loadSession(String(session._id));
    res.json(presentSession(populated ?? session, req.userId));
  } catch (err) {
    next(err);
  }
}

export async function verifySession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.userRole !== 'mentor' && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Only mentors can verify a booking.' });
      return;
    }
    const { code } = req.body as { code?: string };
    if (!code) {
      res.status(400).json({ message: 'Verification code is required.' });
      return;
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }
    if (String(session.mentorId) !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'You can only verify your own bookings.' });
      return;
    }
    if (session.status === 'cancelled') {
      res.status(400).json({ message: 'This booking was cancelled.' });
      return;
    }
    if (session.verificationCode !== String(code).trim()) {
      res.status(400).json({ message: 'Incorrect verification code.' });
      return;
    }

    session.status = session.status === 'completed' ? 'completed' : 'confirmed';
    session.verifiedAt = new Date();
    await session.save();
    await notifyUser({
      userId: String(session.studentId),
      title: 'Booking verified',
      body: `${session.subject} attendance was verified. You can start the session.`,
      type: 'booking',
      relatedId: String(session._id),
    });
    const populated = await loadSession(String(session._id));
    res.json(presentSession(populated ?? session, req.userId));
  } catch (err) {
    next(err);
  }
}
