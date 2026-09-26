export interface Material {
  _id: string;
  mentorId: { _id: string; name: string; email: string } | string;
  title: string;
  subject: string;
  module?: string;
  description: string;
  resourceUrl?: string;
  price: number;
  published: boolean;
  createdAt?: string;
}
