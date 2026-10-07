import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';
import { adminRepository } from '../../../data/repositories/adminRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

interface ModuleDecision {
  module: string;
  code: string;
  grade: string;
  decision: 'approved' | 'rejected' | 'pending';
}

const initialModules: ModuleDecision[] = [
  { module: 'Data Structures & Algorithms', code: 'CS201', grade: 'A+', decision: 'approved' },
  { module: 'Object-Oriented Programming (OOP)', code: 'CS204', grade: 'A', decision: 'approved' },
  { module: 'Software Architecture & Design', code: 'SE302', grade: 'A-', decision: 'pending' },
];

const rejectionReasons = [
  'Transcript grade in module does not meet A/A- university threshold',
  'Student ID registration number not verifiable in faculty database',
  'ID image was blurred, obstructed, or expired',
  'Suspension or disciplinary record flagged by University Board',
  'Module syllabus does not align with current semester curriculum',
];

export default function TutorApplicationDetailsScreen({ navigation, route }: Props) {
  const applicationId = route?.params?.applicationId || '';
  const applicantName = route?.params?.name || 'Tutor applicant';
  const applicantDegree = route?.params?.degree || '—';
  const applicantUni = [route?.params?.university, route?.params?.faculty].filter(Boolean).join(' • ') || '—';
  const applicantCode = route?.params?.studentId || '—';
  const applicantEmail = route?.params?.email || '—';
  const applicantRate = typeof route?.params?.hourlyRate === 'number' ? `LKR ${route.params.hourlyRate} / hr` : '—';
  const submittedDate = route?.params?.submittedDate || '—';
  const realApplication = /^[a-f\d]{24}$/i.test(applicationId);
  const [modules, setModules] = useState<ModuleDecision[]>(
    Array.isArray(route?.params?.modules) && route.params.modules.length
      ? route.params.modules.map((name: string, index: number) => ({ module: name, code: `module-${index}`, grade: '—', decision: 'pending' as const }))
      : initialModules,
  );
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(rejectionReasons[0]);
  const [customNote, setCustomNote] = useState('');

  const toggleModuleDecision = (index: number, newDecision: 'approved' | 'rejected') => {
    const updated = [...modules];
    updated[index].decision = updated[index].decision === newDecision ? 'pending' : newDecision;
    setModules(updated);
  };

  const handleCommitApproval = async () => {
    if (!realApplication) {
      Alert.alert('No application', 'Open a tutor from the applications list.');
      return;
    }
    const approvedCount = modules.filter((m) => m.decision === 'approved').length;
    try {
      await adminRepository.setVerification(applicationId, 'approved');
      Alert.alert(
        'Tutor approved',
        `${approvedCount} of ${modules.length} modules marked for ${applicantName}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Not saved', 'The approval could not be stored.');
    }
  };

  const handleConfirmRejection = async () => {
    setRejectModalVisible(false);
    if (!realApplication) {
      Alert.alert('No application', 'Open a tutor from the applications list.');
      return;
    }
    try {
      await adminRepository.setVerification(applicationId, 'rejected');
      Alert.alert(
        'Application rejected',
        `${applicantName} was marked rejected. ${selectedReason}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Not saved', 'The rejection could not be stored.');
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Audit</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Applicant Summary Hero */}
        <View style={styles.applicantCard}>
          <View style={styles.applicantTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{applicantName.charAt(0) || 'T'}</Text>
            </View>
            <View style={styles.applicantMeta}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>QUEUED APPLICATION: {applicationId}</Text>
              </View>
              <Text style={styles.applicantName}>{applicantName}</Text>
              <Text style={styles.applicantDegree}>{applicantDegree}</Text>
              <Text style={styles.applicantUni}>{applicantUni}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Registration ID</Text>
              <Text style={styles.detailVal}>{applicantCode}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hourly Rate</Text>
              <Text style={styles.detailVal}>{applicantRate}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Official Email</Text>
              <Text style={styles.detailVal}>{applicantEmail}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Submitted</Text>
              <Text style={styles.detailVal}>{submittedDate}</Text>
            </View>
          </View>
        </View>

        {/* Attached Verification Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submitted Evidence & Documents</Text>
          <Text style={styles.sectionSubtitle}>
            Tap any document to open high-resolution review mode.
          </Text>

          <View style={styles.docsList}>
            {/* Doc 1 */}
            <TouchableOpacity
              style={styles.docItem}
              onPress={() =>
                navigation.navigate('DocumentReview', {
                  documentType: 'Student ID Card (Front)',
                  fileName: 'id_card_front.jpg',
                })
              }
            >
              <View style={styles.docIconWrap}>
                <Text style={styles.docIcon}>🪪</Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>University ID Card (Front)</Text>
                <Text style={styles.docMeta}>id_card_front.jpg • Verified 98.4% Match</Text>
              </View>
              <Text style={styles.viewDocArrow}>Review 🔍</Text>
            </TouchableOpacity>

            {/* Doc 2 */}
            <TouchableOpacity
              style={styles.docItem}
              onPress={() =>
                navigation.navigate('DocumentReview', {
                  documentType: 'Official Academic Transcript',
                  fileName: 'transcript_se_2023.pdf',
                })
              }
            >
              <View style={[styles.docIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.docIcon}>📜</Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>Faculty Academic Transcript</Text>
                <Text style={styles.docMeta}>transcript_se_2023.pdf • 4.2 MB Official PDF</Text>
              </View>
              <Text style={styles.viewDocArrow}>Review 🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Module-Specific Decision Matrix (FR05 & FR06) */}
        <View style={styles.section}>
          <View style={styles.modSectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Module-Specific Decisions</Text>
              <Text style={styles.sectionSubtitle}>
                FR05: Approve or reject per module based on transcript grades.
              </Text>
            </View>
            <View style={styles.frPill}>
              <Text style={styles.frPillText}>FR05 & FR06</Text>
            </View>
          </View>

          <View style={styles.moduleDecisionList}>
            {modules.map((m, idx) => (
              <View key={m.code} style={styles.decisionCard}>
                <View style={styles.decisionTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modCardName}>{m.module}</Text>
                    <Text style={styles.modCardMeta}>
                      Module Code: {m.code} • Certified Grade: <Text style={styles.gradeBold}>{m.grade}</Text>
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.currentStatusTag,
                      m.decision === 'approved' && { backgroundColor: '#ECFDF5' },
                      m.decision === 'rejected' && { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currentStatusText,
                        m.decision === 'approved' && { color: colors.success },
                        m.decision === 'rejected' && { color: colors.error },
                      ]}
                    >
                      {m.decision.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Approve / Reject Buttons per module */}
                <View style={styles.decisionBtnRow}>
                  <TouchableOpacity
                    style={[
                      styles.decisionBtn,
                      m.decision === 'approved' && styles.approveBtnActive,
                    ]}
                    onPress={() => toggleModuleDecision(idx, 'approved')}
                  >
                    <Text
                      style={[
                        styles.decisionBtnText,
                        m.decision === 'approved' && styles.decisionBtnTextActive,
                      ]}
                    >
                      ✓ Approve Module
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.decisionBtn,
                      m.decision === 'rejected' && styles.rejectBtnActive,
                    ]}
                    onPress={() => toggleModuleDecision(idx, 'rejected')}
                  >
                    <Text
                      style={[
                        styles.decisionBtnText,
                        m.decision === 'rejected' && styles.decisionBtnTextActive,
                      ]}
                    >
                      ✕ Decline Module
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Global Action Controls */}
        <View style={styles.actionControls}>
          <TouchableOpacity
            style={styles.approveAllBtn}
            onPress={handleCommitApproval}
            activeOpacity={0.85}
          >
            <Text style={styles.approveAllBtnText}>Confirm Module Decisions  ✓</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectAppBtn}
            onPress={() => setRejectModalVisible(true)}
          >
            <Text style={styles.rejectAppBtnText}>Reject Entire Application (Specify Reason)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FR06: Rejection Reason Selection Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Select Rejection Reason (FR06)</Text>
            <Text style={styles.modalSub}>
              Choose the verified justification. This explanation will be provided to the applicant.
            </Text>

            <ScrollView style={{ maxHeight: 250 }}>
              {rejectionReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason && styles.reasonOptionActive,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonOptionText,
                      selectedReason === reason && styles.reasonOptionTextActive,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.customNoteLabel}>Additional Compliance Remarks (Optional):</Text>
            <TextInput
              style={styles.customNoteInput}
              placeholder="e.g. Please resubmit transcript with official registrar seal."
              placeholderTextColor={colors.textLight}
              value={customNote}
              onChangeText={setCustomNote}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRejectBtn}
                onPress={handleConfirmRejection}
              >
                <Text style={styles.confirmRejectBtnText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  container: {
    paddingHorizontal: 20,
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
    backgroundColor: colors.white,
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
  applicantCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
    shadowColor: '#244369',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  applicantTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  applicantMeta: {
    flex: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
  },
  applicantDegree: {
    fontSize: 12,
    color: colors.text,
    marginTop: 1,
  },
  applicantUni: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  detailItem: {
    width: '50%',
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 1,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 10,
    marginTop: 2,
  },
  docsList: {
    gap: 8,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  docIcon: {
    fontSize: 18,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  docMeta: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  viewDocArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  modSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  frPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  frPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  moduleDecisionList: {
    gap: 10,
  },
  decisionCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  decisionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  modCardMeta: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  gradeBold: {
    fontWeight: '800',
    color: colors.primary,
  },
  currentStatusTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textLight,
  },
  decisionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  approveBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  rejectBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  decisionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  decisionBtnTextActive: {
    fontWeight: '800',
  },
  actionControls: {
    marginTop: 6,
    gap: 10,
  },
  approveAllBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  approveAllBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  rejectAppBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectAppBtnText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 43, 103, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 14,
  },
  reasonOption: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  reasonOptionActive: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  reasonOptionText: {
    fontSize: 12,
    color: colors.text,
  },
  reasonOptionTextActive: {
    color: colors.error,
    fontWeight: '700',
  },
  customNoteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 10,
    marginBottom: 6,
  },
  customNoteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  confirmRejectBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.error,
  },
  confirmRejectBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
});
