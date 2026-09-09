export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'mentor';
  profilePicture?: string;
  bio?: string;
  createdAt: string;
}
