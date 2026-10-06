import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

export default function VerifyIdentityScreen({ navigation, route }: Props) {
  const role = route?.params?.role || 'mentor';

  const [idFront, setIdFront] = useState<string | null>('id_card_front.jpg');
  const [idBack, setIdBack] = useState<string | null>('id_card_back.jpg');
  const [transcript, setTranscript] = useState<string | null>('official_transcript_2023.pdf');

  const handleSimulateUpload = (doc: 'front' | 'back' | 'transcript') => {
    if (doc === 'front') setIdFront('id_card_front.jpg');
    if (doc === 'back') setIdBack('id_card_back.jpg');
    if (doc === 'transcript') setTranscript('official_transcript_2023.pdf');
    Alert.alert('Document Attached', 'Document has been uploaded and encrypted.');
  };

  const handleProceed = () => {
    if (!idFront || !idBack) {
      Alert.alert('Required', 'Please upload both front and back of your University ID card.');
      return;
    }
    navigation.navigate('FaceVerification', { role });
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
          {idFront ? (
            <View style={styles.uploadedRow}>
              <View style={styles.statusPill}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.uploadedFileName}>{idFront}</Text>
              </View>
              <TouchableOpacity onPress={() => setIdFront(null)}>
                <Text style={styles.replaceText}>Replace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={() => handleSimulateUpload('front')}
            >
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Tap to Capture or Upload Front</Text>
            </TouchableOpacity>
          )}
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
          {idBack ? (
            <View style={styles.uploadedRow}>
              <View style={styles.statusPill}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.uploadedFileName}>{idBack}</Text>
              </View>
              <TouchableOpacity onPress={() => setIdBack(null)}>
                <Text style={styles.replaceText}>Replace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={() => handleSimulateUpload('back')}
            >
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Tap to Capture or Upload Back</Text>
            </TouchableOpacity>
          )}
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
            {transcript ? (
              <View style={styles.uploadedRow}>
                <View style={[styles.statusPill, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.checkIcon, { color: colors.primary }]}>✓</Text>
                  <Text style={[styles.uploadedFileName, { color: colors.navy }]}>{transcript}</Text>
                </View>
                <TouchableOpacity onPress={() => setTranscript(null)}>
                  <Text style={styles.replaceText}>Replace</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadArea}
                onPress={() => handleSimulateUpload('transcript')}
              >
                <Text style={styles.uploadIcon}>📄</Text>
                <Text style={styles.uploadText}>Upload PDF or Scan of Results</Text>
              </TouchableOpacity>
            )}
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
        <TouchableOpacity style={styles.continueButton} onPress={handleProceed} activeOpacity={0.85}>
          <Text style={styles.continueButtonText}>Continue to Face Verification  →</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  statusPill: {
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
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
