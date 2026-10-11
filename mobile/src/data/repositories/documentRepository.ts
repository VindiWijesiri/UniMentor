import apiClient from '../api/apiClient';

export type DocumentKind = 'front' | 'back' | 'transcript';
export type DocumentReviewStatus = 'pending' | 'approved' | 'reupload';

export type StoredDocument = {
  kind: DocumentKind;
  fileName: string;
  status: DocumentReviewStatus;
  image?: string;
};

export type DocumentBundle = {
  user: {
    name: string;
    email: string;
    studentId?: string;
    university?: string;
    faculty?: string;
    degreeProgramme?: string;
  };
  documents: StoredDocument[];
};

export const documentRepository = {
  async save(kind: DocumentKind, image: string, fileName: string) {
    const response = await apiClient.post('/users/documents', { kind, image, fileName }, { timeout: 45000 });
    return response.data as { kind: DocumentKind; fileName: string; status: DocumentReviewStatus };
  },
  async get(userId: string, full = false) {
    const response = await apiClient.get<DocumentBundle>(`/users/${userId}/documents`, {
      params: full ? { full: '1' } : undefined,
      timeout: full ? 30000 : 10000,
    });
    return response.data;
  },
  async review(userId: string, kind: DocumentKind, status: 'approved' | 'reupload') {
    const response = await apiClient.patch(`/users/${userId}/documents/${kind}`, { status });
    return response.data as { kind: DocumentKind; status: DocumentReviewStatus };
  },
};
