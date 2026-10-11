import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';
import { documentRepository, DocumentKind } from '../../../data/repositories/documentRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

type UploadedDoc = { fileName: string; previewUri?: string };

export default function VerifyIdentityScreen({ navigation, route }: Props) {
  const role = route?.params?.role || 'mentor';

  const [idFront, setIdFront] = useState<UploadedDoc | null>(null);
  const [idBack, setIdBack] = useState<UploadedDoc | null>(null);
  const [transcript, setTranscript] = useState<UploadedDoc | null>(null);
  const [saving, setSaving] = useState<DocumentKind | null>(null);
  const [pickerKind, setPickerKind] = useState<DocumentKind | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    documentRepository.mine()
      .then((docs) => {
        docs.forEach((doc) => {
          storeUpload(doc.kind, { fileName: doc.fileName || `${doc.kind}.jpg`, previewUri: doc.image });
        });
      })
      .catch(() => undefined);
  }, []);

  const storeUpload = (kind: DocumentKind, uploaded: UploadedDoc | null) => {
    if (kind === 'front') setIdFront(uploaded);
    if (kind === 'back') setIdBack(uploaded);
    if (kind === 'transcript') setTranscript(uploaded);
  };

  const pickPhoto = (kind: DocumentKind) => {
    setFormError('');
    setPickerKind(kind);
  };

  const capture = async (kind: DocumentKind, source: 'camera' | 'library') => {
    setPickerKind(null);
    const picker = await import('expo-image-picker');
    const permission = source === 'camera'
      ? await picker.requestCameraPermissionsAsync()
      : await picker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera or photo access to upload this document.');
      return;
    }
    const result = source === 'camera'
      ? await picker.launchCameraAsync({ base64: true, quality: 0.4, allowsEditing: true })
      : await picker.launchImageLibraryAsync({ base64: true, quality: 0.4, mediaTypes: ['images'] });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    let image = '';
    if (asset.base64) {
      const mime = asset.mimeType && asset.mimeType.startsWith('image/') ? asset.mimeType : 'image/jpeg';
      image = `data:${mime};base64,${asset.base64}`;
    } else if (asset.uri) {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read the selected photo.'));
        reader.readAsDataURL(blob);
      });
    }
    if (!image.startsWith('data:image/')) {
      setFormError('Choose a photo file for this document.');
      return;
    }
    if (image.length > 8_000_000) {
      Alert.alert('Photo too large', 'Choose a smaller photo and try again.');
      return;
    }
    const fileName = asset.fileName || `${kind}.jpg`;
    setSaving(kind);
    try {
      const saved = await documentRepository.save(kind, image, fileName);
      storeUpload(kind, { fileName: saved.fileName || fileName, previewUri: image });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'The photo could not be stored.';
      setFormError(message);
      Alert.alert('Upload failed', message);
    } finally {
      setSaving(null);
    }
  };

  const handleProceed = () => {
    if (!idFront || !idBack) {
      setFormError('Upload both the front and back of your university ID.');
      return;
    }
    if (role === 'mentor' && !transcript) {
      setFormError('Upload a photo of your academic transcript.');
      return;
    }
    navigation.navigate('FaceVerification', {
      role,
      token: route?.params?.token,
      user: route?.params?.user,
    });
  };

  const renderSlot = (kind: DocumentKind, uploaded: UploadedDoc | null, emptyLabel: string) => {
    if (saving === kind) {
      return (
        <View style={styles.uploadArea}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.uploadText}>Saving photo…</Text>
        </View>
      );
    }
    if (uploaded) {
      return (
        <View style={styles.uploadedRow}>
          {uploaded.previewUri ? <Image source={{ uri: uploaded.previewUri }} style={styles.preview} /> : null}
          <View style={styles.statusPill}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.uploadedFileName} numberOfLines={1}>{uploaded.fileName}</Text>
          </View>
          <TouchableOpacity onPress={() => pickPhoto(kind)}>
            <Text style={styles.replaceText}>Replace</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.uploadArea} onPress={() => pickPhoto(kind)}>
        <Text style={styles.uploadIcon}>📷</Text>
        <Text style={styles.uploadText}>{emptyLabel}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Identity</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
          <Text style={styles.stepText}>Step 3 of 4: Document Verification</Text>
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <Text style={styles.heading}>University Identity Verification</Text>
        <Text style={styles.subheading}>
          To maintain high academic trust and student safety, we verify all university credentials against official university records.
        </Text>

        {/* Document 1: ID Front */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Text style={styles.docIcon}>🪪</Text>
            <View style={styles.docTextWrap}>
              <Text style={styles.docTitle}>Student / Staff ID Card (Front)</Text>
              <Text style={styles.docDesc}>Must show your photo, full name, and registration ID.</Text>
            </View>
          </View>
          {renderSlot('front', idFront, 'Tap to capture or upload the front')}
        </View>

        {/* Document 2: ID Back */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Text style={styles.docIcon}>💳</Text>
            <View style={styles.docTextWrap}>
              <Text style={styles.docTitle}>Student / Staff ID Card (Back)</Text>
              <Text style={styles.docDesc}>Must show barcode or valid academic year endorsement.</Text>
            </View>
          </View>
          {renderSlot('back', idBack, 'Tap to capture or upload the back')}
        </View>

        {/* Document 3: Transcript (for Tutors) */}
        {role === 'mentor' && (
          <View style={styles.docCard}>
            <View style={styles.docHeader}>
              <Text style={styles.docIcon}>📜</Text>
              <View style={styles.docTextWrap}>
                <Text style={styles.docTitle}>Academic Results / Transcript</Text>
                <Text style={styles.docDesc}>Proof of A/A+ grades in the modules you requested to teach.</Text>
              </View>
            </View>
            {renderSlot('transcript', transcript, 'Upload a photo of your results')}
          </View>
        )}

        {/* Tips Box */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsHeading}>Tips for Quick Verification</Text>
          <View style={styles.tipItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.tipText}>Place your card on a flat surface with good lighting</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.tipText}>Check that all text and your photo are sharp and glare-free</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.tipText}>Must match the official university domain you registered with</Text>
          </View>
        </View>

        {/* Encryption badge */}
        <View style={styles.securityBadge}>
          <Text style={styles.lockBadgeIcon}>🔒</Text>
          <Text style={styles.securityBadgeText}>
            256-bit AES military-grade encryption. Documents are viewed only by authorized faculty compliance admins.
          </Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.continueButton, saving ? { opacity: 0.6 } : null]}
          onPress={handleProceed}
          activeOpacity={0.85}
          disabled={!!saving}
        >
          <Text style={styles.continueButtonText}>Continue to Face Verification  →</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={pickerKind !== null} transparent animationType="fade" onRequestClose={() => setPickerKind(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerKind(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Add a document photo</Text>
            <Text style={styles.modalCopy}>Use a clear photo. It is stored with your tutor application for admin review.</Text>
            <TouchableOpacity style={styles.modalPrimary} onPress={() => pickerKind && capture(pickerKind, 'library')}>
              <Text style={styles.modalPrimaryText}>Choose from photos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondary} onPress={() => pickerKind && capture(pickerKind, 'camera')}>
              <Text style={styles.modalSecondaryText}>Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPickerKind(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backArrow: {
    fontSize: 24,
    color: colors.navy,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  headerSpacer: {
    width: 38,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  formError: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
    marginBottom: 20,
  },
  docCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 14,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  docTextWrap: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  docDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
    lineHeight: 15,
  },
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D9FA',
    gap: 8,
  },
  preview: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.success,
  },
  uploadedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  replaceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  uploadIcon: {
    fontSize: 22,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  tipsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tipsHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    color: colors.primary,
    fontWeight: '900',
  },
  tipText: {
    fontSize: 12,
    color: colors.textLight,
    flex: 1,
    lineHeight: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  lockBadgeIcon: {
    fontSize: 16,
  },
  securityBadgeText: {
    fontSize: 11,
    color: '#15803D',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  continueButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  modalTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '800',
  },
  modalCopy: {
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  modalPrimary: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPrimaryText: {
    color: '#061E47',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondary: {
    backgroundColor: '#061E47',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSecondaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  modalCancel: {
    textAlign: 'center',
    color: colors.textLight,
    fontWeight: '700',
    paddingVertical: 8,
  },
});
