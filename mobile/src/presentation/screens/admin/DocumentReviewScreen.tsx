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

export default function DocumentReviewScreen({ navigation, route }: Props) {
  const docType = route?.params?.documentType || 'University ID Card (Front)';
  const fileName = route?.params?.fileName || 'id_card_front.jpg';
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleApprove = () => {
    Alert.alert(
      'Document Verified',
      `Document "${fileName}" marked as authentic by compliance officer.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleFlagReupload = () => {
    Alert.alert(
      'Re-upload Requested',
      `A notification was sent requesting the applicant to submit a clearer copy of "${fileName}".`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.page}>
      {/* Top Header */}
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

          {/* Document Simulation Box */}
          <View
            style={[
              styles.documentViewport,
              { transform: [{ scale: zoomLevel / 100 }, { rotate: `${rotation}deg` }] },
            ]}
          >
            {/* Realistic University ID Card Layout */}
            <View style={styles.cardHeader}>
              <Text style={styles.uniCrest}>🏛️</Text>
              <View>
                <Text style={styles.uniName}>UNIVERSITY OF MORATUWA</Text>
                <Text style={styles.facultySub}>Faculty of Information Technology & Computing</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.photoBox}>
                <Text style={styles.photoSilhouette}>👩‍🏫</Text>
              </View>
              <View style={styles.cardData}>
                <Text style={styles.studentName}>DR. SARAH DE SILVA</Text>
                <Text style={styles.cardField}>REG: TUT/2021/042</Text>
                <Text style={styles.cardField}>ROLE: Peer Mentor / MSc Scholar</Text>
                <Text style={styles.cardField}>EXPIRY: DEC 2025</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.barcode}>||| | |||| | ||||| || | |||| ||</Text>
              <View style={styles.officialStamp}>
                <Text style={styles.stampText}>FACULTY SEAL</Text>
              </View>
            </View>
          </View>
        </View>

        {/* OCR Auto-Extraction Summary */}
        <View style={styles.ocrSection}>
          <View style={styles.ocrHeader}>
            <Text style={styles.ocrIcon}>🤖</Text>
            <View>
              <Text style={styles.ocrTitle}>OCR Extraction & Authenticity</Text>
              <Text style={styles.ocrSub}>AI verification against university registrar database</Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>99.1% Confidence</Text>
            </View>
          </View>

          <View style={styles.ocrTable}>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Verified Name</Text>
              <Text style={styles.ocrVal}>Dr. Sarah De Silva</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Registration Number</Text>
              <Text style={styles.ocrVal}>TUT/2021/042</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Enrollment Institution</Text>
              <Text style={styles.ocrVal}>University of Moratuwa</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Enrollment Status</Text>
              <Text style={[styles.ocrVal, { color: colors.success }]}>Active / Enrolled (Year 4)</Text>
            </View>
            <View style={styles.ocrRow}>
              <Text style={styles.ocrKey}>Tampering Detection</Text>
              <Text style={[styles.ocrVal, { color: colors.success }]}>0 Modifications Detected (Clean)</Text>
            </View>
          </View>
        </View>

        {/* Audit Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.flagBtn}
            onPress={handleFlagReupload}
            activeOpacity={0.85}
          >
            <Text style={styles.flagBtnText}>Flag for Re-upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={handleApprove}
            activeOpacity={0.85}
          >
            <Text style={styles.approveBtnText}>Approve Document  ✓</Text>
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
