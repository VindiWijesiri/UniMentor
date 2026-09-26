import { ISession } from '../models/Session';

export function presentSession(session: ISession, viewerId?: string) {
  const json = session.toJSON() as Record<string, unknown>;
  const studentId =
    typeof session.studentId === 'object' && session.studentId && '_id' in session.studentId
      ? String((session.studentId as { _id: unknown })._id)
      : String(session.studentId);

  if (viewerId && studentId !== viewerId) {
    delete json.verificationCode;
  }
  return json;
}
