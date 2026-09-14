import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const conversationKey = (firstId: string, secondId: string) =>
  [firstId, secondId].sort().join(':');

export async function getChatInbox(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = String(req.userId);
    const messages = await ChatMessage.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    }).sort({ createdAt: -1 });

    const latestByConversation = new Map<string, typeof messages[number]>();
    messages.forEach((message) => {
      if (!latestByConversation.has(message.conversationKey)) {
        latestByConversation.set(message.conversationKey, message);
      }
    });

    const latestMessages = [...latestByConversation.values()];
    const participantIds = latestMessages.map((message) =>
      String(message.sender) === currentUserId ? message.receiver : message.sender);
    const participants = await User.find({ _id: { $in: participantIds } })
      .select('name email role profilePicture subjects bio rating reviewCount');
    const participantMap = new Map(participants.map((participant) => [String(participant._id), participant]));

    const conversations = latestMessages.map((message) => {
      const participantId = String(message.sender) === currentUserId
        ? String(message.receiver)
        : String(message.sender);
      return {
        participant: participantMap.get(participantId),
        lastMessage: message,
        unreadCount: messages.filter((item) =>
          item.conversationKey === message.conversationKey
          && String(item.receiver) === currentUserId
          && !item.read).length,
      };
    }).filter(({ participant }) => Boolean(participant));

    res.json(conversations);
  } catch (error) {
    next(error);
  }
}

async function validateParticipant(currentUserId: string, participantId: string) {
  if (!mongoose.isValidObjectId(participantId) || currentUserId === participantId) return null;
  const [currentUser, participant] = await Promise.all([
    User.findById(currentUserId).select('role'),
    User.findById(participantId).select('role name profilePicture'),
  ]);
  if (!currentUser || !participant || currentUser.role === participant.role) return null;
  return participant;
}

export async function getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = String(req.userId);
    const participant = await validateParticipant(currentUserId, req.params.participantId);
    if (!participant) {
      res.status(404).json({ message: 'This chat participant is not available.' });
      return;
    }

    const key = conversationKey(currentUserId, req.params.participantId);
    const messages = await ChatMessage.find({ conversationKey: key }).sort({ createdAt: 1 }).limit(300);

    await ChatMessage.updateMany(
      { conversationKey: key, receiver: currentUserId, read: false },
      { $set: { read: true } },
    );
    res.json(messages);
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = String(req.userId);
    const participantId = req.params.participantId;
    const text = String(req.body.text ?? '').trim();

    if (!text || text.length > 2000) {
      res.status(400).json({ message: 'Message must contain 1 to 2000 characters.' });
      return;
    }
    const participant = await validateParticipant(currentUserId, participantId);
    if (!participant) {
      res.status(404).json({ message: 'This chat participant is not available.' });
      return;
    }

    const message = await ChatMessage.create({
      conversationKey: conversationKey(currentUserId, participantId),
      sender: currentUserId,
      receiver: participantId,
      text,
    });
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
}
