export type UserRole = 'student' | 'mentor' | 'lic' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
  subjects?: string[];
  rating?: number;
  createdAt?: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Student',
  mentor: 'Mentor',
  lic: 'LIC',
  admin: 'Admin',
};
