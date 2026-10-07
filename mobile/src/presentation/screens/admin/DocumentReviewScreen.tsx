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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';
import { documentRepository, DocumentKind, StoredDocument } from '../../../data/repositories/documentRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

const KIND_TITLES: Record<DocumentKind, string> = {
  front: 'University ID Card (Front)',
  back: 'University ID Card (Back)',
  transcript: 'Academic Transcript',
};

export default function DocumentReviewScreen({ navigation, route }: Props) {
  const userId = String(route?.params?.userId || '');
  const kind = (route?.params?.kind || 'front') as DocumentKind;
  const docType = route?.params?.documentType || KIND_TITLES[kind] || 'Document';
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<{ name: string; email: string; studentId?: string; university?: string; faculty?: string; degreeProgramme?: string } | null>(null);
  const [document, setDocument] = useState<StoredDocument | null>(null);

  useEffect(() => {
    if (!/^[a-f\d]{24}$/i.test(userId)) {
      setLoading(false);
      return;
    }
    documentRepository.get(userId, true)
      .then((bundle) => {
        setAccount(bundle.user);
        setDocument(bundle.documents.find((item) => item.kind === kind) ?? null);
      })
      .catch(() => {
        setAccount(null);
        setDocument(null);
      })
      .finally(() => setLoading(false));
  }, [userId, kind]);

  const fileName = document?.fileName || route?.params?.fileName || 'No photo uploaded';

  const decide = async (status: 'approved' | 'reupload') => {
    if (!/^[a-f\d]{24}$/i.test(userId) || !document) {
      Alert.alert('No upload', 'This applicant has not stored a photo for this document.');
      return;
    }
    setSaving(true);
    try {
      await documentRepository.review(userId, kind, status);
      Alert.alert(
        status === 'approved' ? 'Document approved' : 'Re-upload requested',
        status === 'approved'
          ? `${fileName} is marked approved.`
          : `${account?.name || 'The applicant'} needs to send a clearer photo of ${docType}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Not saved', err?.response?.data?.message ?? 'The review could not be stored.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Document Inspection</Text>
          <Text style={styles.headerSub}>{fileName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.canvasCard}>
          <View style={styles.toolBar}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setZoomLevel((z) => Math.max(z - 15, 70))}>
              <Text style={styles.toolBtnText}>- Zoom</Text>
            </TouchableOpacity>
            <Text style={styles.zoomText}>{zoomLevel}%</Text>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setZoomLevel((z) => Math.min(z + 15, 160))}>
              <Text style={styles.toolBtnText}>+ Zoom</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setRotation((r) => (r + 90) % 360)}>
              <Text style={styles.toolBtnText}>↻ Rotate ({rotation}°)</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
          ) : document?.image ? (
            <Image
              source={{ uri: document.image }}
              resizeMode="contain"
              style={[styles.photo, { transform: [{ scale: zoomLevel / 100 }, { rotate: `${rotation}deg` }] }]}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No photo stored</Text>
              <Text style={styles.emptyText}>
                Open a tutor from the applications list after they upload an ID or transcript photo.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.ocrSection}>
          <Text style={styles.ocrTitle}>{docType}</Text>
          <Text style={styles.ocrSub}>Account details from the registration record. The photo above is the file that was uploaded.</Text>
          <View style={styles.ocrTable}>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Name</Text>
              <Text style={styles.ocrVal}>{account?.name || '—'}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Email</Text>
              <Text style={styles.ocrVal}>{account?.email || '—'}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Registration number</Text>
              <Text style={styles.ocrVal}>{account?.studentId || '—'}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>University</Text>
              <Text style={styles.ocrVal}>{account?.university || '—'}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Faculty / programme</Text>
              <Text style={styles.ocrVal}>{[account?.faculty, account?.degreeProgramme].filter(Boolean).join(' • ') || '—'}</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Review status</Text>
              <Text style={styles.ocrVal}>{document?.status || 'not uploaded'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.flagBtn} onPress={() => decide('reupload')} disabled={saving} activeOpacity={0.85}>
            <Text style={styles.flagBtnText}>Flag for Re-upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} onPress={() => decide('approved')} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.approveBtnText}>Approve Document  ✓</Text>}
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
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
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
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
  },
  photo: {
    width: '100%',
    height: 280,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  emptyBox: {
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
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
