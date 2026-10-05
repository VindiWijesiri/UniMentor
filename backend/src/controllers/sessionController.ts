import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session';
import User from '../models/User';
import Payment from '../models/Payment';
import { notify } from '../services/notify';
import { AuthRequest } from '../middleware/auth';

export async function getMySessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let sessions = await Session.find({
      $or: [{ studentId: req.userId }, { mentorId: req.userId }],
    })
      .populate('mentorId', 'name email profilePicture experience')
      .populate('studentId', 'name email')
      .sort({ scheduledAt: 1 });

    // Seed default mentoring sessions for the user if none exist yet
    if (sessions.length === 0 && req.userId && req.userRole === 'student') {
      const mentors = await User.find({ role: 'mentor' }).limit(4);
      if (mentors.length > 0) {
        const seedSessions = [
          {
            studentId: req.userId,
            mentorId: mentors[0]._id,
            subject: 'Data Structures: Tree & Graph Traversals',
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow 10:00 AM
            status: 'confirmed',
            notes: 'Exam revision and solving past paper recursion & traversal problems with peer mentor.',
          },
          {
            studentId: req.userId,
            mentorId: mentors[1]?._id || mentors[0]._id,
            subject: 'Software Architecture: Microservices & Design Patterns',
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // In 2 days
            status: 'pending',
            notes: 'Guidance on Factory, Singleton, and Dependency Injection pattern implementation.',
          },
          {
            studentId: req.userId,
            mentorId: mentors[2]?._id || mentors[0]._id,
            subject: 'Mobile App Development: State Management & Navigation',
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // In 3 days
            status: 'confirmed',
            notes: 'Hands-on debugging session for React Native state persistence and routing.',
          },
          {
            studentId: req.userId,
            mentorId: mentors[0]._id,
            subject: 'DBMS: Complex SQL Queries & Indexing',
            scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            status: 'completed',
            notes: 'Covered query optimization, B-Tree indexes, and normalized database schema design.',
          },
        ];

        await Session.insertMany(seedSessions);

        sessions = await Session.find({
          $or: [{ studentId: req.userId }, { mentorId: req.userId }],
        })
          .populate('mentorId', 'name email profilePicture experience')
          .populate('studentId', 'name email')
          .sort({ scheduledAt: 1 });
      }
    }

    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function bookSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.userRole !== 'student') {
      res.status(403).json({ message: 'Only students can book a tutor.' });
      return;
    }

    const { mentorId, subject, scheduledAt, notes, durationMin } = req.body;
    if (!mongoose.isValidObjectId(mentorId)) {
      res.status(400).json({ message: 'Choose a registered tutor.' });
      return;
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) {
      res.status(400).json({ message: 'That tutor is not available to book.' });
      return;
    }

    const when = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (Number.isNaN(when.getTime())) {
      res.status(400).json({ message: 'Choose a valid session time.' });
      return;
    }

    const session = await Session.create({
      mentorId: mentor._id,
      studentId: req.userId,
      subject: subject || 'Peer Mentoring Session',
      scheduledAt: when,
      notes,
      durationMin: Number(durationMin) > 0 ? Number(durationMin) : 60,
      status: 'pending',
    });

    const student = await User.findById(req.userId).select('name');
    await notify(mentor._id, {
      kind: 'booking',
      title: 'New booking request',
      body: `${student?.name || 'A student'} asked for ${session.subject}.`,
      refId: String(session._id),
    });

    const populated = await Session.findById(session._id)
      .populate('mentorId', 'name email profilePicture experience hourlyRate')
      .populate('studentId', 'name email');

    res.status(201).json(populated || session);
  } catch (err) {
    next(err);
  }
}

export async function cancelSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID format.' });
      return;
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    const isOwner =
      String(session.studentId) === req.userId ||
      String(session.mentorId) === req.userId ||
      req.userRole === 'admin' || req.userRole === 'lic';

    if (!isOwner) {
      res.status(403).json({ message: 'Not authorised to cancel this session.' });
      return;
    }

    session.status = 'cancelled';
    await session.save();

    const populated = await Session.findById(session._id)
      .populate('mentorId', 'name email profilePicture experience')
      .populate('studentId', 'name email');

    res.json(populated || session);
  } catch (err) {
    next(err);
  }
}

export async function updateSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID format.' });
      return;
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    const isOwner =
      String(session.studentId) === req.userId ||
      String(session.mentorId) === req.userId ||
      req.userRole === 'admin' || req.userRole === 'lic';

    if (!isOwner) {
      res.status(403).json({ message: 'Not authorised to update this session.' });
      return;
    }

    const { subject, scheduledAt, notes, status, mentorId } = req.body;
    if (subject) session.subject = subject.trim();
    if (scheduledAt) session.scheduledAt = new Date(scheduledAt);
    if (notes !== undefined) session.notes = notes.trim();
    if (status) session.status = status;
    if (mentorId && mongoose.isValidObjectId(mentorId)) {
      session.mentorId = mentorId;
    }

    await session.save();

    const populated = await Session.findById(session._id)
      .populate('mentorId', 'name email profilePicture experience')
      .populate('studentId', 'name email');

    res.json(populated || session);
  } catch (err) {
    next(err);
  }
}

export async function deleteSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID format.' });
      return;
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    const isOwner =
      String(session.studentId) === req.userId ||
      String(session.mentorId) === req.userId ||
      req.userRole === 'admin' || req.userRole === 'lic';

    if (!isOwner) {
      res.status(403).json({ message: 'Not authorised to delete this session.' });
      return;
    }

    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted successfully.', id: req.params.id });
  } catch (err) {
    next(err);
  }
}

export async function updateSessionStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID format.' });
      return;
    }

    const status = String(req.body.status || '');
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Status must be pending, confirmed, completed, or cancelled.' });
      return;
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    const isMentor = String(session.mentorId) === req.userId;
    const isStudent = String(session.studentId) === req.userId;
    const isStaff = req.userRole === 'admin' || req.userRole === 'lic';
    if (!isMentor && !isStudent && !isStaff) {
      res.status(403).json({ message: 'Not authorised to update this session.' });
      return;
    }
    if (isStudent && status !== 'cancelled') {
      res.status(403).json({ message: 'Students can cancel a booking. The tutor confirms it.' });
      return;
    }

    session.status = status as 'pending' | 'confirmed' | 'completed' | 'cancelled';
    if (req.body.scheduledAt) session.scheduledAt = new Date(req.body.scheduledAt);
    await session.save();

    const otherId = isMentor ? session.studentId : session.mentorId;
    const label = status === 'confirmed' ? 'Booking confirmed' : status === 'completed' ? 'Session completed' : status === 'cancelled' ? 'Booking cancelled' : 'Booking updated';
    await notify(otherId, {
      kind: status === 'completed' ? 'payment' : 'booking',
      title: label,
      body: session.subject,
      refId: String(session._id),
    });

    if (status === 'completed') {
      const mentor = await User.findById(session.mentorId).select('hourlyRate');
      const hours = Math.max(0.5, (session.durationMin || 60) / 60);
      const amountLkr = Math.round((mentor?.hourlyRate || 1800) * hours);
      await Payment.findOneAndUpdate(
        { sessionId: session._id },
        {
          sessionId: session._id,
          studentId: session.studentId,
          mentorId: session.mentorId,
          amountLkr,
          hours,
          status: 'due',
          subject: session.subject,
        },
        { upsert: true, new: true },
      );
    }

    const populated = await Session.findById(session._id)
      .populate('mentorId', 'name email profilePicture experience hourlyRate')
      .populate('studentId', 'name email');
    res.json(populated || session);
  } catch (err) {
    next(err);
  }
}

export async function setSessionLive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID format.' });
      return;
    }
    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }
    const isParty = String(session.mentorId) === req.userId || String(session.studentId) === req.userId;
    if (!isParty) {
      res.status(403).json({ message: 'Only the tutor and student can open this room.' });
      return;
    }
    const wasLive = session.isLive;
    if (String(session.mentorId) === req.userId) {
      session.isLive = Boolean(req.body.open);
      if (session.status === 'pending' && session.isLive) session.status = 'confirmed';
      await session.save();
    }
    if (!wasLive && session.isLive) {
      await notify(session.studentId, {
        kind: 'session',
        title: 'Your tutor is live',
        body: session.subject,
        refId: String(session._id),
      });
    }
    const populated = await Session.findById(session._id)
      .populate('mentorId', 'name email')
      .populate('studentId', 'name email');
    res.json(populated || session);
  } catch (err) {
    next(err);
  }
}
