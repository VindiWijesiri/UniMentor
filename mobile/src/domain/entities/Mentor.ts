export interface Mentor {
  _id: string;
  name: string;
  email: string;
  subjects: string[];
  bio: string;
  rating: number;
  profilePicture?: string;
  role?: string;
}
