import { Response, NextFunction } from 'express';
import Assessment, { IQuestion } from '../models/Assessment';
import Submission from '../models/Submission';
import { AuthRequest } from '../middleware/auth';
import { notifyUser } from '../utils/notify';

const USER_FIELDS = 'name email role';

function maxScore(questions: IQuestion[]): number {
  return questions.reduce((sum, question) => sum + (question.points || 0), 0);
}

function studentView(assessment: { toJSON: () => Record<string, unknown>; questions: IQuestion[] }, hideAnswers: boolean) {
  const json = assessment.toJSON();
  if (!hideAnswers) return json;
  json.questions = assessment.questions.map((question) => ({
    type: question.type,
    prompt: question.prompt,
    points: question.points,
    options: question.options,
    pairLefts: question.pairs?.map((pair) => pair.left),
    pairRights: question.pairs?.map((pair) => pair.right).sort(),
    orderItems: question.orderItems ? [...question.orderItems].sort() : undefined,
    starterCode: question.starterCode,
    rubric: question.rubric,
    buckets: question.buckets,
    tokenLabels: question.tokens?.map((token) => token.label).sort(),
    scenario: question.scenario,
  }));
  return json;
}

function autoScore(question: IQuestion, answer: Record<string, unknown>): number | null {
  if (question.type === 'mcq') {
    return answer.selectedIndex === question.correctIndex ? question.points : 0;
  }
  if (question.type === 'true_false') {
    return answer.booleanValue === question.correctBoolean ? question.points : 0;
  }
  if (question.type === 'short_answer' || question.type === 'fill_blank') {
    const text = String(answer.text ?? '').trim().toLowerCase();
    const ok = (question.acceptedAnswers ?? []).some((item) => item.trim().toLowerCase() === text);
    return ok ? question.points : 0;
  }
  if (question.type === 'matching') {
    const matches = (answer.matches as { left: string; right: string }[]) ?? [];
    const expected = question.pairs ?? [];
    const ok =
      expected.length > 0 &&
      expected.every((pair) =>
        matches.some((match) => match.left === pair.left && match.right === pair.right)
      );
    return ok ? question.points : 0;
  }
  if (question.type === 'ordering') {
    const order = (answer.order as string[]) ?? [];
    const expected = question.orderItems ?? [];
    const ok = expected.length > 0 && expected.every((item, index) => order[index] === item);
    return ok ? question.points : 0;
  }
  if (question.type === 'drag_drop') {
    const placements = (answer.placements as { label: string; bucket: string }[]) ?? [];
    const expected = question.tokens ?? [];
    const ok =
      expected.length > 0 &&
      expected.every((token) =>
        placements.some((item) => item.label === token.label && item.bucket === token.bucket)
      );
    return ok ? question.points : 0;
  }
  return null;
}

export async function listAssessments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mine = req.query.mine === 'true';
    const filter: Record<string, unknown> = {};
    if (mine || req.userRole === 'mentor' || req.userRole === 'admin') {
      if (mine) filter.mentorId = req.userId;
      if (req.userRole === 'student') filter.published = true;
    } else {
      filter.published = true;
    }
    const assessments = await Assessment.find(filter)
      .populate('mentorId', USER_FIELDS)
      .sort({ dueAt: 1, createdAt: -1 });
    const hide = req.userRole === 'student';
    res.json(assessments.map((item) => studentView(item, hide)));
  } catch (err) {
    next(err);
  }
}

export async function getAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('mentorId', USER_FIELDS);
    if (!assessment) {
      res.status(404).json({ message: 'Assessment not found.' });
      return;
    }
    const hide =
      req.userRole === 'student' && String((assessment.mentorId as { _id?: unknown })._id ?? assessment.mentorId) !== req.userId;
    res.json(studentView(assessment, hide));
  } catch (err) {
    next(err);
  }
}

export async function createAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = (req.body.questions ?? []) as IQuestion[];
    if (!req.body.title || !req.body.subject) {
      res.status(400).json({ message: 'Title and subject are required.' });
      return;
    }
    if (!questions.length) {
      res.status(400).json({ message: 'Add at least one question.' });
      return;
    }
    const assessment = await Assessment.create({
      mentorId: req.userId,
      title: req.body.title,
      subject: req.body.subject,
      module: req.body.module,
      instructions: req.body.instructions,
      durationMinutes: req.body.durationMinutes ?? 30,
      dueAt: req.body.dueAt,
      published: req.body.published !== false,
      questions,
    });
    res.status(201).json(await assessment.populate('mentorId', USER_FIELDS));
  } catch (err) {
    next(err);
  }
}

export async function updateAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      res.status(404).json({ message: 'Assessment not found.' });
      return;
    }
    if (String(assessment.mentorId) !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Not authorised to edit this assessment.' });
      return;
    }
    const allowed = ['title', 'subject', 'module', 'instructions', 'durationMinutes', 'dueAt', 'published', 'questions'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (assessment as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }
    await assessment.save();
    res.json(await assessment.populate('mentorId', USER_FIELDS));
  } catch (err) {
    next(err);
  }
}

export async function submitAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.userRole !== 'student') {
      res.status(403).json({ message: 'Only students can submit assessments.' });
      return;
    }
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment || !assessment.published) {
      res.status(404).json({ message: 'Assessment not found.' });
      return;
    }
    const existing = await Submission.findOne({ assessmentId: assessment._id, studentId: req.userId });
    if (existing) {
      res.status(409).json({ message: 'You already submitted this assessment.' });
      return;
    }

    const answers = (req.body.answers ?? []) as Record<string, unknown>[];
    let score = 0;
    let pendingManual = false;
    assessment.questions.forEach((question, index) => {
      const answer = answers.find((item) => Number(item.questionIndex) === index) ?? {};
      const earned = autoScore(question, answer);
      if (earned === null) pendingManual = true;
      else score += earned;
    });

    const submission = await Submission.create({
      assessmentId: assessment._id,
      studentId: req.userId,
      answers,
      score: pendingManual ? undefined : score,
      maxScore: maxScore(assessment.questions),
      status: pendingManual ? 'submitted' : 'graded',
      autoGraded: !pendingManual,
    });

    await notifyUser({
      userId: String(assessment.mentorId),
      title: pendingManual ? 'Submission needs grading' : 'Assessment submitted',
      body: `${assessment.title} was submitted.`,
      type: 'assessment',
      relatedId: String(submission._id),
    });

    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
}

export async function listSubmissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.query.mine === 'true' || req.userRole === 'student') {
      const mine = await Submission.find({ studentId: req.userId })
        .populate({ path: 'assessmentId', populate: { path: 'mentorId', select: USER_FIELDS } })
        .sort({ createdAt: -1 });
      res.json(mine);
      return;
    }
    if (req.userRole === 'lic' || req.userRole === 'admin') {
      const filter: Record<string, unknown> = {};
      if (req.query.studentId) filter.studentId = req.query.studentId;
      if (req.query.status) filter.status = req.query.status;
      const submissions = await Submission.find(filter)
        .populate('studentId', USER_FIELDS)
        .populate('assessmentId')
        .sort({ createdAt: -1 });
      res.json(submissions);
      return;
    }
    const assessments = await Assessment.find({ mentorId: req.userId }).select('_id');
    const ids = assessments.map((item) => item._id);
    const pending = req.query.status === 'submitted';
    const filter: Record<string, unknown> = { assessmentId: { $in: ids } };
    if (pending) filter.status = 'submitted';
    const submissions = await Submission.find(filter)
      .populate('studentId', USER_FIELDS)
      .populate('assessmentId')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    next(err);
  }
}

export async function gradeSubmission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const submission = await Submission.findById(req.params.id).populate('assessmentId');
    if (!submission) {
      res.status(404).json({ message: 'Submission not found.' });
      return;
    }
    const assessment = submission.assessmentId as unknown as { mentorId: unknown; title: string };
    if (String(assessment.mentorId) !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Not authorised to grade this submission.' });
      return;
    }
    submission.score = Number(req.body.score);
    submission.feedback = req.body.feedback;
    submission.status = 'graded';
    await submission.save();
    await notifyUser({
      userId: String(submission.studentId),
      title: 'Assessment graded',
      body: `${assessment.title}: ${submission.score}/${submission.maxScore}`,
      type: 'assessment',
      relatedId: String(submission._id),
    });
    res.json(submission);
  } catch (err) {
    next(err);
  }
}

export async function questionLibrary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const assessments = await Assessment.find({ mentorId: req.userId }).sort({ updatedAt: -1 });
    const items = assessments.flatMap((assessment) =>
      assessment.questions.map((question, index) => ({
        assessmentId: assessment._id,
        assessmentTitle: assessment.title,
        subject: assessment.subject,
        module: assessment.module,
        index,
        question,
      }))
    );
    res.json(items);
  } catch (err) {
    next(err);
  }
}
