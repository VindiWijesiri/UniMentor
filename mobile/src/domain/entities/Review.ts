export interface Review {
  _id: string;
  tutor: string | { _id?: string; name?: string; subjects?: string[]; profilePicture?: string };
  student: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
