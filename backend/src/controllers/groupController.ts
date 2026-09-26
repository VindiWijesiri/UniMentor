import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import StudyGroup from '../models/StudyGroup';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { notifyUser } from '../utils/notify';

const USER_FIELDS = 'name email role';
const MATERIAL_FIELDS = 'title subject module price published';

async function presentGroup(group: InstanceType<typeof StudyGroup>) {
  return group.populate([
    { path: 'ownerId', select: USER_FIELDS },
    { path: 'memberIds', select: USER_FIELDS },
    { path: 'mentorIds', select: USER_FIELDS },
    { path: 'materialIds', select: MATERIAL_FIELDS },
  ]);
}

export async function listGroups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await StudyGroup.find({
      $or: [{ ownerId: req.userId }, { memberIds: req.userId }, { mentorIds: req.userId }],
    })
      .populate('ownerId', USER_FIELDS)
      .populate('memberIds', USER_FIELDS)
      .populate('mentorIds', USER_FIELDS)
      .populate('materialIds', MATERIAL_FIELDS)
      .sort({ updatedAt: -1 });
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const memberIds: string[] = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    const mentorIds: string[] = Array.isArray(req.body.mentorIds) ? req.body.mentorIds : [];
    const materialIds: string[] = Array.isArray(req.body.materialIds) ? req.body.materialIds : [];
    const group = await StudyGroup.create({
      name: req.body.name,
      description: req.body.description,
      subject: req.body.subject,
      ownerId: req.userId,
      memberIds: Array.from(new Set([req.userId, ...memberIds])),
      mentorIds,
      materialIds,
      inviteCode: crypto.randomBytes(3).toString('hex').toUpperCase(),
    });
    for (const memberId of [...memberIds, ...mentorIds]) {
      if (memberId !== req.userId) {
        await notifyUser({
          userId: memberId,
          title: 'Study group invite',
          body: `You were added to ${group.name}.`,
          type: 'group',
          relatedId: String(group._id),
        });
      }
    }
    res.status(201).json(await presentGroup(group));
  } catch (err) {
    next(err);
  }
}

export async function joinGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = String(req.body.inviteCode ?? '').trim().toUpperCase();
    const group = await StudyGroup.findOne({ inviteCode: code });
    if (!group) {
      res.status(404).json({ message: 'Invalid invite code.' });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    if (user.role === 'mentor') {
      if (!group.mentorIds.some((id) => String(id) === req.userId)) group.mentorIds.push(user._id);
    } else if (!group.memberIds.some((id) => String(id) === req.userId)) {
      group.memberIds.push(user._id);
    }
    await group.save();
    res.json(await presentGroup(group));
  } catch (err) {
    next(err);
  }
}

export async function getGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      res.status(404).json({ message: 'Group not found.' });
      return;
    }
    res.json(await presentGroup(group));
  } catch (err) {
    next(err);
  }
}

export async function inviteMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      res.status(404).json({ message: 'Group not found.' });
      return;
    }
    if (String(group.ownerId) !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Only the group owner can invite members.' });
      return;
    }
    const memberIds: string[] = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    const mentorIds: string[] = Array.isArray(req.body.mentorIds) ? req.body.mentorIds : [];
    const materialIds: string[] = Array.isArray(req.body.materialIds) ? req.body.materialIds : [];
    for (const id of memberIds) {
      if (!group.memberIds.some((item) => String(item) === id)) group.memberIds.push(id as never);
    }
    for (const id of mentorIds) {
      if (!group.mentorIds.some((item) => String(item) === id)) group.mentorIds.push(id as never);
    }
    for (const id of materialIds) {
      if (!group.materialIds) group.materialIds = [];
      if (!group.materialIds.some((item) => String(item) === id)) group.materialIds.push(id as never);
    }
    await group.save();
    for (const memberId of [...memberIds, ...mentorIds]) {
      await notifyUser({
        userId: memberId,
        title: 'Study group invite',
        body: `You were added to ${group.name}.`,
        type: 'group',
        relatedId: String(group._id),
      });
    }
    res.json(await presentGroup(group));
  } catch (err) {
    next(err);
  }
}
