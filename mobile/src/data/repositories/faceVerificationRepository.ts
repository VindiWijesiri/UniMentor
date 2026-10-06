import apiClient from '../api/apiClient';

export interface FaceVerificationResponse {
  success: boolean;
  verified: boolean;
  confidence: number;
  threshold: number;
  status: 'verified' | 'failed' | 'error';
  message: string;
  verificationId?: string;
}

export interface VerificationStatusResponse {
  verificationStatus: string;
  isVerified: boolean;
  faceVerifiedAt?: string;
  latestAttempt?: {
    status: string;
    confidence: number;
    threshold: number;
    createdAt: string;
  } | null;
}

export const faceVerificationRepository = {
  /**
   * Upload captured selfie for face comparison
   * Supports base64 data string, Blob, or React Native file object
   */
  async verifyFace(
    selfieData: string | Blob | { uri: string; name: string; type: string }
  ): Promise<FaceVerificationResponse> {
    if (typeof selfieData === 'string') {
      // Sent as base64 string payload
      const response = await apiClient.post<FaceVerificationResponse>(
        '/face-verification/verify',
        { selfie: selfieData }
      );
      return response.data;
    }

    // Sent as FormData multipart upload
    const formData = new FormData();
    if (selfieData instanceof Blob) {
      formData.append('selfie', selfieData, 'selfie.jpg');
    } else {
      // React Native file format { uri, name, type }
      formData.append('selfie', selfieData as any);
    }

    const response = await apiClient.post<FaceVerificationResponse>(
      '/face-verification/verify',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getStatus(): Promise<VerificationStatusResponse> {
    const response = await apiClient.get<VerificationStatusResponse>('/face-verification/status');
    return response.data;
  },

  async getHistory(): Promise<{ history: any[] }> {
    const response = await apiClient.get<{ history: any[] }>('/face-verification/history');
    return response.data;
  },
};
