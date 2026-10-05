export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  profilePicture?: string;
  bio?: string;
  createdAt: string;
}
