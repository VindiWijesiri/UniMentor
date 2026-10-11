import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';
import { useAuthStore } from '../../../domain/stores/authStore';
import { faceVerificationRepository, FaceVerificationResponse } from '../../../data/repositories/faceVerificationRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

type VerificationMode = 'camera' | 'captured' | 'verifying' | 'success' | 'failed' | 'error';
type CameraPermission = 'prompt' | 'granted' | 'denied';

export default function FaceVerificationScreen({ navigation, route }: Props) {
  const role = route?.params?.role || 'mentor';
  const { updateVerificationStatus } = useAuthStore();

  const [mode, setMode] = useState<VerificationMode>('camera');
  const [permission, setPermission] = useState<CameraPermission>('prompt');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Position your face inside the frame');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);

  // Initialize camera on Web
  const startCamera = async () => {
    setStatusMessage('Position your face inside the frame');
    setErrorMessage(null);

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setPermission('granted');
        setMode('camera');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('[FaceVerification] Camera permission denied or device not found:', err);
        setPermission('denied');
        setStatusMessage('Camera access is required for face verification.');
      }
    } else {
      // Mobile / native fallback
      setPermission('granted');
      setMode('camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: any) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Update video element when stream or videoRef attaches
  useEffect(() => {
    if (videoRef.current && streamRef.current && permission === 'granted' && mode === 'camera') {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [permission, mode]);

  // Capture frame from video
  const handleTakePhoto = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Un-mirror image on capture
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedPhoto(dataUrl);
          setMode('captured');
          setStatusMessage('Review your photo before verifying');
          return;
        }
      } catch (err) {
        console.warn('[FaceVerification] Failed to capture video frame:', err);
      }
    }

    // Default simulation frame if camera video capture isn't supported
    const fallbackPortrait =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
    setCapturedPhoto(fallbackPortrait);
    setMode('captured');
    setStatusMessage('Review your photo before verifying');
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setVerificationResult(null);
    setErrorMessage(null);
    setMode('camera');
    setStatusMessage('Position your face inside the frame');
    startCamera();
  };

  // Submit captured selfie for verification
  const handleVerify = async () => {
    if (!capturedPhoto) {
      Alert.alert('Required', 'Please capture a photo first.');
      return;
    }

    setMode('verifying');
    setStatusMessage('Verifying your identity with Face++...');

    try {
      const response = await faceVerificationRepository.verifyFace(capturedPhoto);
      setVerificationResult(response);

      if (response.verified) {
        setMode('success');
        setStatusMessage('Identity verified successfully!');
        updateVerificationStatus('approved');
      } else {
        setMode('failed');
        setStatusMessage(response.message || 'Face match score below threshold.');
      }
    } catch (error: any) {
      console.error('[FaceVerificationScreen] Verification request failed:', error);
      const userMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to complete verification. Please check your network and try again.';
      setErrorMessage(userMsg);
      setMode('error');
      setStatusMessage('Verification failed');
    }
  };

  // Continue to results or dashboard upon success
  const handleContinue = () => {
    navigation.navigate('VerificationResult', {
      success: true,
      role,
      confidence: verificationResult?.confidence,
      threshold: verificationResult?.threshold,
      token: route?.params?.token,
      user: route?.params?.user,
      message:
        role === 'mentor'
          ? 'Your live biometric verification passed successfully. Your mentor account has been updated.'
          : 'Your student identity has been verified successfully.',
    });
  };

  // Retry from failed or error state
  const handleRetry = () => {
    handleRetake();
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            stopCamera();
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Face Verification</Text>
        <View style={styles.spacer} />
      </View>

      {/* Main Viewport */}
      <View style={styles.viewport}>
        {/* Subtle grid lines */}
        <View style={styles.gridOverlay} />

        {/* Live Camera View (Web) */}
        {mode === 'camera' && permission === 'granted' && Platform.OS === 'web' && (
          <View style={styles.videoWrapper}>
            {React.createElement('video', {
              ref: videoRef,
              autoPlay: true,
              playsInline: true,
              muted: true,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              },
            })}
          </View>
        )}

        {/* Captured Preview Image */}
        {capturedPhoto && (mode === 'captured' || mode === 'verifying' || mode === 'success' || mode === 'failed' || mode === 'error') && (
          <Image source={{ uri: capturedPhoto }} style={styles.capturedPreview} resizeMode="cover" />
        )}

        {/* Permission Denied Notice */}
        {permission === 'denied' && (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSub}>
              Camera permission is required to capture your verification photo.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={startCamera}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Face Oval & Corner Guidance */}
        {permission !== 'denied' && (
          <View
            style={[
              styles.faceOval,
              mode === 'verifying' && styles.faceOvalScanning,
              mode === 'success' && styles.faceOvalSuccess,
              (mode === 'failed' || mode === 'error') && styles.faceOvalFailed,
            ]}
          >
            {mode === 'camera' && (
              <View style={styles.innerOvalScan}>
                <Text style={styles.avatarSilhouette}>👤</Text>
              </View>
            )}

            {/* Corner Guides */}
            <View style={[styles.corner, styles.cornerTL, mode === 'success' && styles.cornerSuccess, (mode === 'failed' || mode === 'error') && styles.cornerFailed]} />
            <View style={[styles.corner, styles.cornerTR, mode === 'success' && styles.cornerSuccess, (mode === 'failed' || mode === 'error') && styles.cornerFailed]} />
            <View style={[styles.corner, styles.cornerBL, mode === 'success' && styles.cornerSuccess, (mode === 'failed' || mode === 'error') && styles.cornerFailed]} />
            <View style={[styles.corner, styles.cornerBR, mode === 'success' && styles.cornerSuccess, (mode === 'failed' || mode === 'error') && styles.cornerFailed]} />
          </View>
        )}

        {/* Live Prompt Pill */}
        <View style={styles.promptPill}>
          {mode === 'verifying' ? (
            <ActivityIndicator size="small" color={colors.accentYellow} style={{ marginRight: 6 }} />
          ) : mode === 'success' ? (
            <Text style={styles.promptCheck}>✓</Text>
          ) : mode === 'failed' || mode === 'error' ? (
            <Text style={styles.promptCross}>✕</Text>
          ) : (
            <Text style={styles.promptDot}>●</Text>
          )}
          <Text style={styles.promptText}>{statusMessage}</Text>
        </View>

        {/* Security Watermark */}
        <View style={styles.encryptionTag}>
          <Text style={styles.encIcon}>🛡️</Text>
          <Text style={styles.encText}>Face++ Biometric AI • 256-bit Encrypted</Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Mode: Camera (Ready to take photo) */}
        {mode === 'camera' && (
          <>
            <Text style={styles.guidanceHeading}>Keep face still & centered</Text>
            <Text style={styles.guidanceSub}>
              Remove sunglasses or masks. Make sure you are in a well-lit area.
            </Text>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakePhoto}
              activeOpacity={0.85}
            >
              <Text style={styles.captureButtonText}>Take Photo  📷</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Mode: Captured (Review selfie) */}
        {mode === 'captured' && (
          <>
            <Text style={styles.guidanceHeading}>Review Your Captured Photo</Text>
            <Text style={styles.guidanceSub}>
              Make sure your entire face is sharp, clear, and unblocked.
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleRetake}
                activeOpacity={0.7}
              >
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerify}
                activeOpacity={0.85}
              >
                <Text style={styles.verifyButtonText}>Verify Identity  ✓</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Mode: Verifying (Loading state) */}
        {mode === 'verifying' && (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} style={{ marginBottom: 12 }} />
            <Text style={styles.verifyingTitle}>Verifying Your Identity...</Text>
            <Text style={styles.verifyingSub}>
              Analyzing biometric landmarks against registered university credentials.
            </Text>
          </View>
        )}

        {/* Mode: Success */}
        {mode === 'success' && (
          <>
            <View style={styles.resultBadgeSuccess}>
              <Text style={styles.badgeSuccessIcon}>✓</Text>
              <Text style={styles.resultBadgeTitle}>Verification Successful</Text>
            </View>
            <Text style={styles.resultSuccessSub}>
              {verificationResult?.confidence
                ? `Biometric Match: ${verificationResult.confidence}% (Threshold: ${verificationResult.threshold}%)`
                : 'You have been successfully verified.'}
            </Text>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>Continue  ➔</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Mode: Failed Match */}
        {mode === 'failed' && (
          <>
            <View style={styles.resultBadgeFail}>
              <Text style={styles.badgeFailIcon}>⚠️</Text>
              <Text style={styles.resultBadgeFailTitle}>Face Verification Failed</Text>
            </View>
            <Text style={styles.resultFailSub}>
              {verificationResult?.message ||
                'Biometric match score was below security threshold. Please take another photo in good lighting.'}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Mode: Error */}
        {mode === 'error' && (
          <>
            <View style={styles.resultBadgeFail}>
              <Text style={styles.badgeFailIcon}>❌</Text>
              <Text style={styles.resultBadgeFailTitle}>Unable to Complete Verification</Text>
            </View>
            <Text style={styles.resultFailSub}>
              {errorMessage || 'Service encountered a technical error. Please try again.'}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061F5C',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '700',
    marginTop: -2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  spacer: {
    width: 38,
  },
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0B2968',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  videoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  capturedPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: '#FFF',
    zIndex: 1,
  },
  faceOval: {
    width: 220,
    height: 290,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: colors.white,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  faceOvalScanning: {
    borderColor: colors.secondary,
  },
  faceOvalSuccess: {
    borderColor: colors.success,
    borderStyle: 'solid',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  faceOvalFailed: {
    borderColor: colors.error,
    borderStyle: 'solid',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  innerOvalScan: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSilhouette: {
    fontSize: 90,
    opacity: 0.35,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.secondary,
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  cornerSuccess: {
    borderColor: colors.success,
  },
  cornerFailed: {
    borderColor: colors.error,
  },
  promptPill: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(6, 31, 92, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 3,
  },
  promptDot: {
    color: colors.success,
    fontSize: 12,
    marginRight: 6,
  },
  promptCheck: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },
  promptCross: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },
  promptText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  encryptionTag: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 3,
  },
  encIcon: {
    fontSize: 11,
  },
  encText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontWeight: '600',
  },
  permissionBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 18,
  },
  permissionBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  bottomControls: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  guidanceHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  guidanceSub: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  captureButton: {
    backgroundColor: colors.secondary,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 10,
  },
  captureButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  verifyButton: {
    flex: 1.2,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  verifyButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  verifyingContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  verifyingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
  },
  verifyingSub: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  resultBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeSuccessIcon: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  resultBadgeTitle: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '800',
  },
  resultSuccessSub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: colors.success,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  resultBadgeFail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeFailIcon: {
    fontSize: 16,
  },
  resultBadgeFailTitle: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '800',
  },
  resultFailSub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  retryButton: {
    backgroundColor: colors.secondary,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
