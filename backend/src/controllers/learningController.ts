import { Response, NextFunction } from 'express';
import Goal from '../models/Goal';
import Session from '../models/Session';
import Assessment from '../models/Assessment';
import Submission from '../models/Submission';
import Material from '../models/Material';
import Complaint from '../models/Complaint';
import Notification from '../models/Notification';
import Settings from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { presentSession } from '../utils/sessionView';

const USER_FIELDS = 'name email role profilePicture';

function weekBuckets(logs: { date: Date; minutes: number }[]) {
  const days = [0, 0, 0, 0, 0, 0, 0];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay() + 1);
  for (const log of logs) {
    const date = new Date(log.date);
    if (date >= start) {
      const index = (date.getDay() + 6) % 7;
      days[index] += log.minutes;
    }
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => ({
    label,
    minutes: days[index],
  }));
}

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const unreadAlerts = await Notification.countDocuments({ userId: req.userId, read: false });
    const sessions = await Session.find({
      $or: [{ studentId: req.userId }, { mentorId: req.userId }],
      status: { $ne: 'cancelled' },
    })
      .populate('mentorId', USER_FIELDS)
      .populate('studentId', USER_FIELDS)
      .sort({ scheduledAt: 1 })
      .limit(8);

    if (req.userRole === 'student') {
      const goals = await Goal.find({ studentId: req.userId }).sort({ createdAt: -1 });
      const logs = goals.flatMap((goal) => goal.logs);
      const assessments = await Assessment.find({ published: true }).sort({ dueAt: 1 }).limit(6);
      const submissions = await Submission.find({ studentId: req.userId });
      const submittedIds = new Set(submissions.map((item) => String(item.assessmentId)));
      const materials = await Material.find({ published: true }).sort({ updatedAt: -1 }).limit(4);
      res.json({
        role: req.userRole,
        unreadAlerts,
        weekHours: weekBuckets(logs),
        weeklyTargetHours: goals.reduce((sum, goal) => sum + (goal.status === 'active' ? goal.targetHours : 0), 0) || 20,
        goals: goals.slice(0, 6).map((goal) => {
          const minutes = goal.logs.reduce((sum, log) => sum + log.minutes, 0);
          return {
            ...goal.toJSON(),
            progress: Math.min(100, Math.round((minutes / (goal.targetHours * 60 || 1)) * 100)),
          };
        }),
        sessions: sessions.map((session) => presentSession(session, req.userId)),
        assessments: assessments
          .filter((item) => !submittedIds.has(String(item._id)))
          .map((item) => ({
            _id: item._id,
            title: item.title,
            subject: item.subject,
            module: item.module,
            dueAt: item.dueAt,
            durationMinutes: item.durationMinutes,
            published: item.published,
            questions: item.questions.map((question) => ({
              type: question.type,
              prompt: question.prompt,
              points: question.points,
            })),
          })),
        continueMaterial: materials[0] ?? null,
        materials,
        submissions,
      });
      return;
    }

    if (req.userRole === 'mentor') {
      const pendingVerify = sessions.filter((session) => session.status === 'pending');
      const myAssessments = await Assessment.find({ mentorId: req.userId });
      const pendingSubmissions = await Submission.find({
        assessmentId: { $in: myAssessments.map((item) => item._id) },
        status: 'submitted',
      })
        .populate('studentId', USER_FIELDS)
        .populate('assessmentId')
        .sort({ createdAt: -1 });
      const materials = await Material.find({ mentorId: req.userId }).sort({ createdAt: -1 });
      res.json({
        role: req.userRole,
        unreadAlerts,
        sessions: sessions.map((session) => presentSession(session, req.userId)),
        pendingVerify: pendingVerify.map((session) => presentSession(session, req.userId)),
        pendingSubmissions,
        assessments: myAssessments,
        materials,
      });
      return;
    }

    if (req.userRole === 'lic') {
      const complaints = await Complaint.find().sort({ createdAt: -1 }).limit(20).populate('reporterId', USER_FIELDS);
      res.json({
        role: req.userRole,
        unreadAlerts,
        openComplaints: complaints.filter((item) => item.status === 'open' || item.status === 'reviewing').length,
        complaints,
      });
      return;
    }

    const settings = await Settings.getApp();
    const materials = await Material.find().populate('mentorId', USER_FIELDS).sort({ price: -1 });
    const complaints = await Complaint.countDocuments({ status: { $in: ['open', 'reviewing'] } });
    res.json({
      role: req.userRole,
      unreadAlerts,
      materialPriceCap: settings.materialPriceCap,
      materials,
      openComplaints: complaints,
      sessions: sessions.map((session) => presentSession(session, req.userId)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.userRole === 'student' ? req.userId : (req.query.studentId as string) ?? req.userId;
    const submissions = await Submission.find({ studentId })
      .populate('assessmentId')
      .sort({ createdAt: -1 });
    const goals = await Goal.find({ studentId }).sort({ createdAt: -1 });
    res.json({
      submissions,
      goals: goals.map((goal) => ({
        ...goal.toJSON(),
        progress: Math.min(
          100,
          Math.round((goal.logs.reduce((sum, log) => sum + log.minutes, 0) / (goal.targetHours * 60 || 1)) * 100)
        ),
      })),
    });
  } catch (err) {
    next(err);
  }
}
