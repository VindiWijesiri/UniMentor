import { Response, NextFunction } from 'express';
import User, { IEnrolledModule } from '../models/User';
import Session from '../models/Session';
import { GoalPlan } from '../models/goalPlan';
import { AuthRequest } from '../middleware/auth';

const DEMO_MENTOR_PREFIX = 'mentor-';

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
    const allowedFields = [
      'name', 'bio', 'profilePicture', 'subjects', 'degreeProgramme', 'academicYear', 'semester',
      'hourlyRate', 'availability', 'availabilitySlots', 'languages', 'teachingMode', 'lessonTypes',
      'qualification', 'experience',
    ];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.hourlyRate !== undefined) {
      const rate = Number(updates.hourlyRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 20000) {
        res.status(400).json({ message: 'Hourly rate must be between 0 and 20,000 LKR.' });
        return;
      }
      updates.hourlyRate = rate;
    }
    if (updates.availabilitySlots !== undefined && !Array.isArray(updates.availabilitySlots)) {
      res.status(400).json({ message: 'Availability slots must be a list.' });
      return;
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

export async function getStudentDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Student account not found.' });
      return;
    }

    const storedModules = user.enrolledModules ?? [];
    const enrolledModules = storedModules.filter((module) => !String(module.mentor?.id ?? '').startsWith(DEMO_MENTOR_PREFIX));
    if (enrolledModules.length !== storedModules.length) {
      user.enrolledModules = enrolledModules;
      await user.save();
    }

    const [goalCount, completedSessions, openSessions, dbMentors, sessions] = await Promise.all([
      GoalPlan.countDocuments({
        studentId: user._id,
        seedKey: { $nin: ['goal-weekly', 'goal-graph', 'goal-oop'] },
      }),
      Session.countDocuments({ studentId: user._id, status: 'completed', seedKey: { $exists: false } }),
      Session.countDocuments({
        studentId: user._id,
        status: { $in: ['pending', 'confirmed'] },
        seedKey: { $exists: false },
      }),
      User.find({ role: 'mentor' })
        .select('name email subjects rating reviewCount profilePicture bio hourlyRate experience sessionCount')
        .limit(12),
      Session.find({
        studentId: user._id,
        status: { $in: ['pending', 'confirmed'] },
        seedKey: { $exists: false },
      }).sort({ scheduledAt: 1 }).limit(6).populate('mentorId', 'name profilePicture'),
    ]);

    const availableMentors = dbMentors.map((mentor) => ({
      id: String(mentor._id),
      name: mentor.name,
      roleTitle: mentor.experience || 'Tutor',
      rating: mentor.rating ?? 0,
      reviewCount: mentor.reviewCount ?? 0,
      avatar: mentor.profilePicture || '',
      subjects: mentor.subjects || [],
      isVerified: true,
      activeStudentsCount: mentor.sessionCount ?? 0,
      hourlyRate: mentor.hourlyRate ?? 0,
      email: mentor.email,
      bio: mentor.bio || '',
    }));

    const upcomingSessions = sessions.map((session) => {
      const mentor = session.mentorId as { name?: string } | undefined;
      return {
        _id: session._id,
        subject: session.subject,
        scheduledAt: session.scheduledAt,
        status: session.status,
        isLive: Boolean(session.isLive),
        moduleCode: session.moduleCode || '',
        mentorName: mentor && typeof mentor === 'object' ? mentor.name || '' : '',
      };
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name || 'Student',
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
        degreeProgramme: user.degreeProgramme || '',
        academicYear: user.academicYear || '',
        semester: user.semester || '',
      },
      academicStats: {
        goals: goalCount,
        plans: goalCount,
        dueTests: openSessions,
        done: completedSessions,
      },
      deadlineAlert: null,
      liveSession: null,
      upcomingSessions,
      quickLaunchpad: [],
      enrolledModules,
      availableMentors,
    });
  } catch (err) {
    next(err);
  }
}

export async function registerModule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, name, credits, faculty, department, mentor } = req.body;

    if (!code || !name) {
      res.status(400).json({ message: 'Module code and name are required.' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (!user.enrolledModules) {
      user.enrolledModules = [];
    }

    const exists = user.enrolledModules.some((m) => m.code.toUpperCase() === code.toUpperCase());
    if (exists) {
      res.status(400).json({ message: `Module ${code} is already registered.` });
      return;
    }

    const newModule: IEnrolledModule = {
      code: code.toUpperCase(),
      name,
      credits: credits || 3,
      faculty,
      department,
      progress: 0,
      status: 'active',
      nextSession: '',
      ...(mentor?.id && !String(mentor.id).startsWith(DEMO_MENTOR_PREFIX) ? { mentor } : {}),
    };

    user.enrolledModules.push(newModule);
    await user.save();

    res.status(201).json({
      message: 'Module successfully registered!',
      enrolledModules: user.enrolledModules,
    });
  } catch (err) {
    next(err);
  }
}

export async function assignMentorToModule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.params;
    const { mentor } = req.body;

    if (!mentor || !mentor.name) {
      res.status(400).json({ message: 'Mentor details are required.' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const targetModule = user.enrolledModules?.find(
      (m) => m.code.toUpperCase() === code.toUpperCase()
    );

    if (!targetModule) {
      res.status(404).json({ message: `Registered module ${code} not found.` });
      return;
    }

    targetModule.mentor = {
      id: mentor.id,
      name: mentor.name,
      roleTitle: mentor.roleTitle || 'Senior Peer Mentor',
      batch: mentor.batch || "Batch '24",
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      avatar: mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}`,
      isVerified: mentor.isVerified ?? true,
      activeStudentsCount: mentor.activeStudentsCount || 20,
    };

    await user.save();

    res.json({
      message: 'Mentor assigned successfully!',
      enrolledModules: user.enrolledModules,
    });
  } catch (err) {
    next(err);
  }
}

export async function dropModule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.params;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.enrolledModules = (user.enrolledModules || []).filter(
      (m) => m.code.toUpperCase() !== code.toUpperCase()
    );

    await user.save();

    res.json({
      message: `Module ${code} dropped.`,
      enrolledModules: user.enrolledModules,
    });
  } catch (err) {
    next(err);
  }
}

export async function addStudentGoal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (!user.academicStats) {
      user.academicStats = { goals: 4, plans: 3, dueTests: 2, done: 18 };
    }

    user.academicStats.goals = (user.academicStats.goals || 0) + 1;
    await user.save();

    res.json({
      message: 'Goal added!',
      academicStats: user.academicStats,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateModuleProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.params;
    const { progress, nextSession } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const mod = user.enrolledModules?.find(
      (m) => m.code.toUpperCase() === code.toUpperCase()
    );

    if (!mod) {
      res.status(404).json({ message: `Module ${code} not found.` });
      return;
    }

    if (progress !== undefined) {
      mod.progress = Math.min(100, Math.max(0, Number(progress)));
    }
    if (nextSession !== undefined) {
      mod.nextSession = String(nextSession);
    }

    await user.save();
    res.json({
      message: 'Module updated!',
      enrolledModules: user.enrolledModules,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeSubjectOrInterest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { subject } = req.params;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.subjects = (user.subjects || []).filter(
      (s) => s.toLowerCase() !== decodeURIComponent(subject).toLowerCase()
    );

    await user.save();
    res.json({
      message: 'Subject removed.',
      subjects: user.subjects,
    });
  } catch (err) {
    next(err);
  }
}

export async function getShortlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json(user.shortlistedMentors || []);
  } catch (err) {
    next(err);
  }
}

export async function addToShortlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mentorId, name, avatar, hourlyRate, rating, subjects, priority, notes } = req.body;
    if (!mentorId || !name) {
      res.status(400).json({ message: 'mentorId and name are required.' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.shortlistedMentors = user.shortlistedMentors || [];
    const existingIndex = user.shortlistedMentors.findIndex((m) => m.mentorId === mentorId);

    if (existingIndex > -1) {
      user.shortlistedMentors[existingIndex].priority = priority || user.shortlistedMentors[existingIndex].priority;
      user.shortlistedMentors[existingIndex].notes = notes !== undefined ? notes : user.shortlistedMentors[existingIndex].notes;
    } else {
      user.shortlistedMentors.push({
        mentorId,
        name,
        avatar,
        hourlyRate: Number(hourlyRate) || 2000,
        rating: Number(rating) || 4.8,
        subjects: Array.isArray(subjects) ? subjects : [],
        priority: priority || 'Considering',
        notes: notes || '',
        savedAt: new Date(),
      });
    }

    await user.save();
    res.status(201).json({
      message: 'Tutor saved to shortlist.',
      shortlist: user.shortlistedMentors,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateShortlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mentorId } = req.params;
    const { priority, notes } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.shortlistedMentors = user.shortlistedMentors || [];
    const item = user.shortlistedMentors.find((m) => m.mentorId === mentorId);
    if (!item) {
      res.status(404).json({ message: 'Shortlisted tutor not found.' });
      return;
    }

    if (priority) item.priority = priority;
    if (notes !== undefined) item.notes = notes;

    await user.save();
    res.json({
      message: 'Shortlist entry updated.',
      shortlist: user.shortlistedMentors,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeFromShortlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mentorId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.shortlistedMentors = (user.shortlistedMentors || []).filter((m) => m.mentorId !== mentorId);
    await user.save();
    res.json({
      message: 'Tutor removed from shortlist.',
      shortlist: user.shortlistedMentors,
    });
  } catch (err) {
    next(err);
  }
}

