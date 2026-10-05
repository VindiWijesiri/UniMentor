import { Response, NextFunction } from 'express';
import User from '../models/User';
import Session from '../models/Session';
import { Assessment, StudyGoal, StudyPlan } from '../models/learning';
import { AuthRequest } from '../middleware/auth';
import { seedLearningData } from '../services/seedLearningData';

function mapMentor(mentor: { _id: unknown; name: string; bio?: string; subjects?: string[]; rating?: number; reviewCount?: number; profilePicture?: string }) {
  return {
    id: String(mentor._id),
    name: mentor.name,
    roleTitle: 'Peer Mentor',
    batch: "Batch '24",
    rating: mentor.rating ?? 4.8,
    reviewCount: mentor.reviewCount ?? 0,
    avatar: mentor.profilePicture,
    isVerified: true,
    activeStudentsCount: 18,
    subjects: mentor.subjects ?? [],
    bio: mentor.bio ?? '',
    hourlyRate: 2000,
  };
}

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

export async function getStudentDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = String(req.userId);
    if (req.userRole === 'student') {
      await seedLearningData(userId);
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const [mentors, sessions, goals, plans, assessments] = await Promise.all([
      User.find({ role: 'mentor' }).select('name bio subjects rating reviewCount profilePicture').limit(8),
      Session.find({ studentId: userId }).populate('mentorId', 'name bio subjects rating reviewCount profilePicture').sort({ scheduledAt: 1 }),
      StudyGoal.countDocuments({ studentId: userId }),
      StudyPlan.countDocuments({ studentId: userId }),
      Assessment.find({ studentId: userId, status: { $ne: 'submitted' } }).sort({ scheduledAt: 1, dueDate: 1 }),
    ]);

    const nextAssessment = assessments[0];
    const dueDate = nextAssessment?.scheduledAt ?? nextAssessment?.dueDate;
    const daysLeft = dueDate ? Math.max(0, Math.round((new Date(dueDate).getTime() - Date.now()) / 86400000)) : 2;
    const live = sessions[0];
    const populatedMentor = live?.mentorId && typeof live.mentorId === 'object'
      ? mapMentor(live.mentorId as unknown as { _id: unknown; name: string; bio?: string; subjects?: string[]; rating?: number; reviewCount?: number; profilePicture?: string })
      : undefined;
    const liveMentor = populatedMentor ?? (mentors[0] ? mapMentor(mentors[0]) : {
      id: 'mentor',
      name: 'Tharushi Perera',
      roleTitle: 'Senior Peer Mentor',
      rating: 4.9,
      reviewCount: 28,
      isVerified: true,
      subjects: ['Data Structures'],
      hourlyRate: 2500,
    });

    const enrolledModules = (user.subjects?.length ? user.subjects : ['Data Structures', 'Algorithms', 'DBMS', 'Probability']).slice(0, 4).map((subject, index) => ({
      code: ['IT2040', 'IT2030', 'SE3020', 'MA2010'][index] ?? `MOD${index + 1}`,
      name: subject,
      credits: 3,
      faculty: 'Computing',
      department: 'Software Engineering',
      progress: 70 - index * 8,
      status: 'active',
      nextSession: live ? new Date(live.scheduledAt).toLocaleString() : 'Tomorrow, 10:00 AM',
      mentor: mentors[index] ? mapMentor(mentors[index]) : liveMentor,
    }));

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        subjects: user.subjects ?? [],
        degreeProgramme: 'BSc (Hons) Software Engineering',
        academicYear: 'Year 3',
        semester: 'Sem 2',
      },
      academicStats: {
        goals: goals || 4,
        plans: plans || 3,
        dueTests: assessments.length || 2,
        done: 18,
      },
      deadlineAlert: {
        id: String(nextAssessment?._id ?? 'alert-next'),
        tag: `DEADLINE APPROACHING • ${daysLeft} DAYS LEFT`,
        title: nextAssessment?.title ?? 'Mock Exam: Probability & Statistics',
        moduleCode: nextAssessment?.subject ?? 'MA2010',
        daysLeft,
        reviewAction: 'Review Mock Exam',
        tutorAction: 'Find Tutor',
        tutorQuery: nextAssessment?.subject ?? 'Probability',
      },
      liveSession: {
        id: String(live?._id ?? 'live-ds-1'),
        tag: 'LIVE NOW',
        timeRemaining: '35m left',
        title: live?.subject ?? 'Data Structures: Graph Traversals',
        moduleCode: 'IT2040',
        sessionType: 'Peer Revision',
        subtitle: 'Module Code: IT2040 • Peer Revision',
        activeParticipants: 24,
        mentor: liveMentor,
        roomAction: 'Join Room',
      },
      enrolledModules,
      availableMentors: mentors.map(mapMentor),
      quickLaunchpad: [
        { key: 'goal', label: 'New Goal', icon: 'goal', isHighlighted: true },
        { key: 'pods', label: 'Pods', icon: 'pods', badge: '3' },
        { key: 'session', label: 'Join session', icon: 'session' },
        { key: 'library', label: 'Library', icon: 'library' },
      ],
    });
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
