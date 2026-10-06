import React, { useEffect, useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';
import { documentRepository, DocumentKind, DocumentReviewStatus } from '../../../data/repositories/documentRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

const KIND_LABEL: Record<DocumentKind, string> = {
  front: 'University ID Card (Front)',
  back: 'University ID Card (Back)',
  transcript: 'Academic Transcript',
};

function statusLabel(status?: DocumentReviewStatus) {
  if (status === 'approved') return 'Approved';
  if (status === 'reupload') return 'Re-upload requested';
  if (status === 'pending') return 'Waiting for review';
  return 'Not uploaded';
}

export default function DocumentReviewScreen({ navigation, route }: Props) {
  const device = useDeviceFrame();
  const userId = String(route?.params?.userId || '');
  const kind: DocumentKind = route?.params?.kind === 'back' || route?.params?.kind === 'transcript' ? route.params.kind : 'front';
  const docType = route?.params?.documentType || KIND_LABEL[kind];
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('No file');
  const [status, setStatus] = useState<DocumentReviewStatus | undefined>();
  const [profile, setProfile] = useState({ name: '—', studentId: '—', university: '—', faculty: '—', email: '—' });

  useEffect(() => {
    if (!/^[a-f\d]{24}$/i.test(userId)) {
      setLoading(false);
      return;
    }
    documentRepository.get(userId, true)
      .then((bundle) => {
        const doc = bundle.documents.find((item) => item.kind === kind);
        setImage(doc?.image || null);
        setFileName(doc?.fileName || 'No file');
        setStatus(doc?.status);
        setProfile({
          name: bundle.user.name || '—',
          studentId: bundle.user.studentId || '—',
          university: bundle.user.university || '—',
          faculty: bundle.user.faculty || bundle.user.degreeProgramme || '—',
          email: bundle.user.email || '—',
        });
      })
      .catch(() => Alert.alert('Could not load', 'The uploaded document did not come back from the server.'))
      .finally(() => setLoading(false));
  }, [userId, kind]);

  const saveReview = async (next: 'approved' | 'reupload') => {
    if (!/^[a-f\d]{24}$/i.test(userId)) {
      Alert.alert('No applicant', 'Open this from a tutor application.');
      return;
    }
    if (!image) {
      Alert.alert('Nothing to review', 'This applicant has not uploaded that document.');
      return;
    }
    setSaving(true);
    try {
      await documentRepository.review(userId, kind, next);
      Alert.alert(
        next === 'approved' ? 'Document approved' : 'Re-upload requested',
        next === 'approved' ? `${fileName} is marked approved.` : 'The applicant was asked to send a clearer photo.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Not saved', 'The review did not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{docType}</Text>
          <Text style={styles.headerSub}>{fileName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Document Inspection Canvas */}
        <View style={styles.canvasCard}>
          {/* Zoom & Rotate toolbar */}
          <View style={styles.toolBar}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setZoomLevel((z) => Math.max(z - 15, 70))}
            >
              <Text style={styles.toolBtnText}>- Zoom</Text>
            </TouchableOpacity>
            <Text style={styles.zoomText}>{zoomLevel}%</Text>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setZoomLevel((z) => Math.min(z + 15, 160))}
            >
              <Text style={styles.toolBtnText}>+ Zoom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setRotation((r) => (r + 90) % 360)}
            >
              <Text style={styles.toolBtnText}>↻ Rotate ({rotation}°)</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.documentViewport,
              { transform: [{ scale: zoomLevel / 100 }, { rotate: `${rotation}deg` }] },
            ]}
          >
            {loading ? <ActivityIndicator color={colors.primary} /> : image ? (
              <Image source={{ uri: image }} style={styles.photo} resizeMode="contain" />
            ) : (
              <Text style={styles.emptyPhoto}>
                {/^[a-f\d]{24}$/i.test(userId) ? 'No photo uploaded for this document.' : 'Open a tutor application to review a real upload.'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.ocrSection}>
          <View style={styles.ocrHeader}>
            <View>
              <Text style={styles.ocrTitle}>Account on file</Text>
              <Text style={styles.ocrSub}>{statusLabel(status)} • compare this with the photo</Text>
            </View>
          </View>

          <View style={styles.ocrTable}>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Name</Text>
              <Text style={styles.ocrVal}>{profile.name}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Registration number</Text>
              <Text style={styles.ocrVal}>{profile.studentId}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>University</Text>
              <Text style={styles.ocrVal}>{profile.university}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Faculty</Text>
              <Text style={styles.ocrVal}>{profile.faculty}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Email</Text>
              <Text style={styles.ocrVal}>{profile.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.flagBtn}
            onPress={() => saveReview('reupload')}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.flagBtnText}>Flag for Re-upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => saveReview('approved')}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.approveBtnText}>Approve Document</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTextWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textLight,
  },
  headerSpacer: {
    width: 38,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  canvasCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
    overflow: 'hidden',
  },
  toolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 14,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  documentViewport: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    padding: 16,
    marginVertical: 10,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: 280,
  },
  emptyPhoto: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.navy,
    paddingBottom: 8,
    marginBottom: 12,
  },
  uniCrest: {
    fontSize: 26,
  },
  uniName: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.navy,
    letterSpacing: 0.5,
  },
  facultySub: {
    fontSize: 9,
    color: colors.textLight,
  },
  cardBody: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoBox: {
    width: 70,
    height: 85,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSilhouette: {
    fontSize: 40,
  },
  cardData: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.navy,
    marginBottom: 4,
  },
  cardField: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 8,
  },
  barcode: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '900',
    color: colors.text,
  },
  officialStamp: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ rotate: '-6deg' }],
  },
  stampText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.error,
  },
  ocrSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  ocrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  ocrIcon: {
    fontSize: 22,
  },
  ocrTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  ocrSub: {
    fontSize: 10,
    color: colors.textLight,
  },
  confidenceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  ocrTable: {
    gap: 8,
  },
  ocrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  ocrKey: {
    fontSize: 11,
    color: colors.textLight,
  },
  ocrVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flagBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  flagBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  approveBtn: {
    flex: 1.3,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
