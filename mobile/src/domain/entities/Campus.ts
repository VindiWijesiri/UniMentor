export type Campus = {
  _id: string;
  name: string;
  shortCode: string;
  city: string;
  country: string;
  address?: string;
  website?: string;
  faculties: string[];
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminUser?: string;
};

export type RegisterCampusInput = {
  name: string;
  shortCode: string;
  city: string;
  country: string;
  address?: string;
  website?: string;
  faculties?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string;
};
