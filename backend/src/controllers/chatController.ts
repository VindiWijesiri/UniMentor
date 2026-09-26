import { Response, NextFunction } from 'express';
import ChatMessage from '../models/ChatMessage';
import StudyGroup from '../models/StudyGroup';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { notifyUser } from '../utils/notify';

const USER_FIELDS = 'name email role';

function peerId(message: { senderId: unknown; recipientId?: unknown }, me: string): string {
  const sender = String(message.senderId);
  const recipient = String(message.recipientId ?? '');
  return sender === me ? recipient : sender;
}

export async function getInbox(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const me = req.userId as string;
    const direct = await ChatMessage.find({
      groupId: { $exists: false },
      $or: [{ senderId: me }, { recipientId: me }],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('senderId', USER_FIELDS)
      .populate('recipientId', USER_FIELDS);

    const seen = new Set<string>();
    const conversations = [];
    for (const message of direct) {
      const other = peerId(
        { senderId: (message.senderId as { _id?: unknown })._id ?? message.senderId, recipientId: (message.recipientId as { _id?: unknown })?._id ?? message.recipientId },
        me
      );
      if (!other || seen.has(other)) continue;
      seen.add(other);
      const participant = await User.findById(other).select(USER_FIELDS);
      if (!participant) continue;
      conversations.push({
        participant,
        lastMessage: message,
      });
    }

    const groups = await StudyGroup.find({
      $or: [{ ownerId: me }, { memberIds: me }, { mentorIds: me }],
    });
    for (const group of groups) {
      const lastMessage = await ChatMessage.findOne({ groupId: group._id })
        .sort({ createdAt: -1 })
        .populate('senderId', USER_FIELDS);
      conversations.push({
        group: { _id: group._id, name: group.name, subject: group.subject },
        lastMessage,
      });
    }

    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

export async function getDirectThread(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const me = req.userId as string;
    const other = req.params.participantId;
    const messages = await ChatMessage.find({
      groupId: { $exists: false },
      $or: [
        { senderId: me, recipientId: other },
        { senderId: other, recipientId: me },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', USER_FIELDS);
    await ChatMessage.updateMany({ senderId: other, recipientId: me, read: false }, { read: true });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

export async function sendDirect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = String(req.body.body ?? '').trim();
    if (!body) {
      res.status(400).json({ message: 'Message body is required.' });
      return;
    }
    const message = await ChatMessage.create({
      senderId: req.userId,
      recipientId: req.params.participantId,
      body,
    });
    await notifyUser({
      userId: req.params.participantId,
      title: 'New message',
      body,
      type: 'chat',
      relatedId: String(req.userId),
    });
    res.status(201).json(await message.populate('senderId', USER_FIELDS));
  } catch (err) {
    next(err);
  }
}

export async function getGroupThread(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await ChatMessage.find({ groupId: req.params.groupId })
      .sort({ createdAt: 1 })
      .populate('senderId', USER_FIELDS);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

export async function sendGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = String(req.body.body ?? '').trim();
    if (!body) {
      res.status(400).json({ message: 'Message body is required.' });
      return;
    }
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
      res.status(404).json({ message: 'Group not found.' });
      return;
    }
    const message = await ChatMessage.create({
      senderId: req.userId,
      groupId: group._id,
      body,
    });
    res.status(201).json(await message.populate('senderId', USER_FIELDS));
  } catch (err) {
    next(err);
  }
}
