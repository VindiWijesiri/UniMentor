import Notification from '../models/Notification';

export async function notifyUser(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
  relatedId?: string;
}): Promise<void> {
  if (!params.userId) return;
  await Notification.create({
    userId: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    relatedId: params.relatedId,
  });
}
