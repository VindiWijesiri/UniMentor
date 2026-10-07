import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../domain/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import type { AppTabParamList } from '../../navigation/AppNavigator';
import StackFooterBar from '../../navigation/StackFooterBar';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = {
  navigation: any;
  route?: any;
};
type FieldKey = 'faculty' | 'department' | 'programme' | 'academicYear' | 'semester'
  | 'module' | 'topic';
type FieldConfig = {
  key: FieldKey;
  label: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
};
type DepartmentConfig = { programmes: string[]; modules: string[] };
type AcademicCatalog = Record<string, Record<string, DepartmentConfig>>;

const academicCatalog: AcademicCatalog = {
  Computing: {
    'Computer Science': {
      programmes: ['BSc (Hons) in Computer Science', 'BSc (Hons) in Artificial Intelligence'],
      modules: ['Data Structures', 'Algorithms', 'DBMS', 'Machine Learning', 'Artificial Intelligence', 'Computer Architecture'],
    },
    'Software Engineering': {
      programmes: ['BSc (Hons) in Software Engineering', 'BSc (Hons) in Computer Systems Engineering'],
      modules: ['OOP', 'Software Architecture', 'Software Quality Assurance', 'Mobile App Development', 'DevOps'],
    },
    'Information Technology': {
      programmes: ['BSc (Hons) in Information Technology', 'BSc (Hons) in Information Systems'],
      modules: ['Programming Fundamentals', 'Web Development', 'Cloud Computing', 'Computer Networks', 'IT Project Management'],
    },
    'Data Science': {
      programmes: ['BSc (Hons) in Data Science', 'BSc (Hons) in Data Analytics'],
      modules: ['Data Mining', 'Machine Learning', 'Statistics for Data Science', 'Big Data Analytics', 'Python for Data Science'],
    },
    Cybersecurity: {
      programmes: ['BSc (Hons) in Cybersecurity', 'BSc (Hons) in Network Security'],
      modules: ['Network Security', 'Ethical Hacking', 'Digital Forensics', 'Cryptography', 'Secure Software Development'],
    },
  },
  Engineering: {
    'Civil Engineering': {
      programmes: ['BSc (Hons) in Civil Engineering', 'BEng (Hons) in Civil Engineering'],
      modules: ['Structural Analysis', 'Geotechnical Engineering', 'Fluid Mechanics', 'Surveying', 'Construction Management'],
    },
    'Mechanical Engineering': {
      programmes: ['BSc (Hons) in Mechanical Engineering', 'BEng (Hons) in Mechanical Engineering'],
      modules: ['Thermodynamics', 'Engineering Mechanics', 'Fluid Dynamics', 'Manufacturing Technology', 'Machine Design'],
    },
    'Electrical & Electronic Engineering': {
      programmes: ['BSc (Hons) in Electrical & Electronic Engineering', 'BEng (Hons) in Electronic Engineering'],
      modules: ['Circuit Theory', 'Digital Electronics', 'Power Systems', 'Control Systems', 'Signal Processing'],
    },
    'Mechatronics Engineering': {
      programmes: ['BSc (Hons) in Mechatronics Engineering', 'BEng (Hons) in Robotics & Automation'],
      modules: ['Robotics', 'Embedded Systems', 'Industrial Automation', 'Control Engineering', 'Sensors & Instrumentation'],
    },
  },
  Business: {
    'Business Management': {
      programmes: ['BSc (Hons) in Business Management', 'BA (Hons) in Business Administration'],
      modules: ['Principles of Management', 'Business Strategy', 'Organizational Behaviour', 'Entrepreneurship', 'Operations Management'],
    },
    'Accounting & Finance': {
      programmes: ['BSc (Hons) in Accounting & Finance', 'BSc (Hons) in Finance'],
      modules: ['Financial Accounting', 'Management Accounting', 'Corporate Finance', 'Auditing', 'Taxation'],
    },
    Marketing: {
      programmes: ['BSc (Hons) in Marketing Management', 'BA (Hons) in Digital Marketing'],
      modules: ['Marketing Management', 'Consumer Behaviour', 'Digital Marketing', 'Brand Management', 'Market Research'],
    },
    'Human Resource Management': {
      programmes: ['BSc (Hons) in Human Resource Management', 'BA (Hons) in Human Resource Management'],
      modules: ['Human Resource Management', 'Employment Law', 'Performance Management', 'Talent Management', 'Organizational Psychology'],
    },
    'Business Analytics': {
      programmes: ['BSc (Hons) in Business Analytics', 'BSc (Hons) in Business Information Systems'],
      modules: ['Business Statistics', 'Data Visualization', 'Business Intelligence', 'Decision Analytics', 'Predictive Analytics'],
    },
  },
  Architecture: {
    Architecture: {
      programmes: ['BArch (Hons) in Architecture', 'BSc (Hons) in Architecture'],
      modules: ['Architectural Design', 'Building Technology', 'History of Architecture', 'Environmental Design', 'Professional Practice'],
    },
    'Quantity Surveying': {
      programmes: ['BSc (Hons) in Quantity Surveying', 'BSc (Hons) in Commercial Management'],
      modules: ['Construction Measurement', 'Cost Planning', 'Construction Economics', 'Contract Administration', 'Project Management'],
    },
    'Interior Architecture': {
      programmes: ['BA (Hons) in Interior Architecture', 'BSc (Hons) in Interior Design'],
      modules: ['Interior Design Studio', 'Materials & Finishes', 'Lighting Design', 'Furniture Design', 'Digital Visualization'],
    },
    'Urban Planning': {
      programmes: ['BSc (Hons) in Urban Planning', 'Bachelor of Landscape Architecture'],
      modules: ['Urban Design', 'Planning Law', 'Sustainable Cities', 'Landscape Design', 'GIS for Planning'],
    },
  },
  'Humanities & Sciences': {
    'Mathematics & Statistics': {
      programmes: ['BSc (Hons) in Mathematics', 'BSc (Hons) in Statistics'],
      modules: ['Calculus', 'Linear Algebra', 'Probability', 'Applied Statistics', 'Discrete Mathematics'],
    },
    Psychology: {
      programmes: ['BSc (Hons) in Psychology', 'BA (Hons) in Counselling Psychology'],
      modules: ['Cognitive Psychology', 'Developmental Psychology', 'Research Methods', 'Social Psychology', 'Counselling Skills'],
    },
    'English & Linguistics': {
      programmes: ['BA (Hons) in English', 'BA (Hons) in Linguistics'],
      modules: ['Academic Writing', 'English Literature', 'Sociolinguistics', 'Communication Skills', 'Language Teaching'],
    },
    Biotechnology: {
      programmes: ['BSc (Hons) in Biotechnology', 'BSc (Hons) in Biomedical Science'],
      modules: ['Molecular Biology', 'Genetics', 'Biochemistry', 'Microbiology', 'Bioinformatics'],
    },
  },
};

const academicYears = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
const semesters = ['Semester 1', 'Semester 2'];
const topics = ['Assignment support', 'Exam preparation', 'Practical help', 'Project guidance'];

const academicFields: FieldConfig[] = [
  { key: 'faculty', label: 'Faculty', placeholder: 'Select faculty', icon: 'business-outline', tone: '#FEF3C7' },
  { key: 'department', label: 'Department', placeholder: 'Select department', icon: 'git-branch-outline', tone: '#FFFDF0' },
  { key: 'programme', label: 'Degree Programme', placeholder: 'Select programme', icon: 'school-outline', tone: '#FEF3C7' },
  { key: 'academicYear', label: 'Academic Year', placeholder: 'Select academic year', icon: 'calendar-outline', tone: '#FFFDF0' },
  { key: 'semester', label: 'Semester', placeholder: 'Select semester', icon: 'layers-outline', tone: '#FEF3C7' },
  { key: 'module', label: 'Module', placeholder: 'Select module', icon: 'book-outline', tone: '#FFFDF0' },
  { key: 'topic', label: 'Topic', placeholder: 'Select topic', icon: 'bulb-outline', tone: '#FEF3C7' },
];

function SelectField({
  field,
  value,
  disabled,
  onPress,
}: {
  field: FieldConfig;
  value?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.selectField,
        disabled && styles.selectFieldDisabled,
        value ? styles.selectFieldFilled : null,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <View style={[styles.fieldIcon, { backgroundColor: field.tone }]}>
        <Ionicons name={field.icon} size={18} color="#061E47" />
      </View>
      <View style={styles.fieldTextWrap}>
        <Text style={styles.fieldLabel} numberOfLines={1}>
          {field.label} <Text style={styles.requiredStar}>*</Text>
        </Text>
        <Text style={[styles.fieldValue, value && styles.fieldValueSelected]} numberOfLines={1}>
          {value || field.placeholder}
        </Text>
      </View>
      {value ? (
        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
      ) : (
        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation, route }: Props) {
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const { user } = useAuthStore();
  const activeTab = route?.params?.fromTab || 'Home';
  const [selectedField, setSelectedField] = useState<FieldKey | null>(null);
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const activeField = useMemo(() => academicFields.find(({ key }) => key === selectedField), [selectedField]);
  const fieldOptions = useMemo<Record<FieldKey, string[]>>(() => {
    const facultyDepartments = values.faculty ? academicCatalog[values.faculty] : undefined;
    const departmentConfig = values.department ? facultyDepartments?.[values.department] : undefined;

    return {
      faculty: Object.keys(academicCatalog),
      department: facultyDepartments ? Object.keys(facultyDepartments) : [],
      programme: departmentConfig?.programmes ?? [],
      academicYear: academicYears,
      semester: semesters,
      module: departmentConfig?.modules ?? [],
      topic: topics,
    };
  }, [values.faculty, values.department]);

  const popularModules = useMemo(() => {
    if (fieldOptions.module.length > 0) return fieldOptions.module;
    if (!values.faculty) return [];
    return [...new Set(
      Object.values(academicCatalog[values.faculty]).flatMap(({ modules }) => modules),
    )];
  }, [fieldOptions.module, values.faculty]);

  const isFieldDisabled = (key: FieldKey) => {
    if (key === 'department') return !values.faculty;
    if (key === 'programme' || key === 'module') return !values.department;
    if (key === 'topic') return !values.module;
    return false;
  };

  const fieldWithContext = (field: FieldConfig): FieldConfig => {
    if (field.key === 'department' && !values.faculty) {
      return { ...field, placeholder: 'Select faculty first' };
    }
    if ((field.key === 'programme' || field.key === 'module') && !values.department) {
      return { ...field, placeholder: 'Select department first' };
    }
    if (field.key === 'topic' && !values.module) {
      return { ...field, placeholder: 'Select module first' };
    }
    return field;
  };

  const selectOption = (option: string) => {
    if (!selectedField) return;
    setValues((current) => {
      const next = { ...current, [selectedField]: option };

      if (selectedField === 'faculty') {
        delete next.department;
        delete next.programme;
        delete next.module;
        delete next.topic;
      } else if (selectedField === 'department') {
        delete next.programme;
        delete next.module;
        delete next.topic;
      } else if (selectedField === 'module') {
        delete next.topic;
      }

      return next;
    });
    setSelectedField(null);
  };

  const missingFields = useMemo(() => {
    return academicFields.filter((f) => !values[f.key]);
  }, [values]);

  const isFormComplete = missingFields.length === 0;

  const handleContinue = () => {
    if (!isFormComplete) {
      const missingLabels = missingFields.map((f) => f.label);
      Alert.alert(
        'Required Fields Incomplete',
        `Please select all academic fields before proceeding to find your mentor:\n\n• ${missingLabels.join('\n• ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('Bookings', {
      screen: 'FindMentor',
      params: {
        initialQuery: values.module,
        faculty: values.faculty,
        department: values.department,
        programme: values.programme,
        academicYear: values.academicYear,
        semester: values.semester,
        topic: values.topic,
      },
    });
  };

  return (
    <View style={styles.page}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            {navigation.canGoBack?.() ? (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Academic Guidance</Text>
          </View>
          <View style={styles.brandRowTop}>
            <Text style={styles.brandUniTop}>Uni</Text>
            <Text style={styles.brandMentorTop}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.heroBody}>
            <View style={styles.heroCopy}>
              <View style={styles.stepPill}><Text style={styles.stepPillText}>Step 1 of 3</Text></View>
              <Text style={styles.heroTitle}>Find Your{`\n`}Academic Guidance</Text>
              <Text style={styles.heroSubtitle}>Tell us what you need help with and we'll match you with the right tutor.</Text>
            </View>
            <View style={styles.heroArt}>
              <Ionicons name="school" size={42} color="#F59E0B" />
              <Ionicons name="book" size={28} color="#FFFFFF" style={{ marginTop: 2 }} />
              <View style={styles.goalBubble}><Text style={styles.goalText}>Your Goals{`\n`}Our Support</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.contentPanel}>
          <View style={styles.progressRow}>
            {['Academic Details', 'Find Tutors', 'Confirm'].map((label, index) => (
              <React.Fragment key={label}>
                <View style={styles.progressItem}>
                  <View style={[styles.progressCircle, index === 0 && styles.progressCircleActive]}>
                    <Text style={[styles.progressNumber, index === 0 && styles.progressNumberActive]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.progressLabel, index === 0 && styles.progressLabelActive]}>{label}</Text>
                </View>
                {index < 2 && <View style={[styles.progressLine, index === 0 && styles.progressLineActive]} />}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeadingRow}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FFF4D8' }]}>
                <Ionicons name="layers" size={16} color="#D97706" />
              </View>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionTitle}>Select Your Academic Structure</Text>
                <Text style={styles.sectionSubtitle}>Choose the details that best match your studies.</Text>
              </View>
            </View>
            <View style={styles.fieldsGrid}>
              {academicFields.map((field) => {
                const contextualField = fieldWithContext(field);
                return (
                  <SelectField
                    key={field.key}
                    field={contextualField}
                    value={values[field.key]}
                    disabled={isFieldDisabled(field.key)}
                    onPress={() => setSelectedField(field.key)}
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.popularCard}>
            <View style={styles.popularHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FFF4D8' }]}>
                <Ionicons name="star" size={15} color="#F59E0B" />
              </View>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionTitle}>Popular Modules</Text>
                <Text style={styles.sectionSubtitle}>Explore commonly requested modules</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Bookings', { screen: 'FindMentor' })}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={styles.seeAll}>See All</Text>
                <Ionicons name="arrow-forward" size={13} color="#0B2754" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {popularModules.length > 0 ? popularModules.map((module, index) => (
                <TouchableOpacity
                  key={module}
                  style={[styles.chip, { backgroundColor: ['#DDF5E6', '#DDF8F1', '#FFF3D4', '#FFF0C8', '#E9F0E1'][index % 5] }]}
                  onPress={() => setValues((current) => ({ ...current, module, topic: undefined }))}
                >
                  <Text style={styles.chipText}>{module}</Text>
                </TouchableOpacity>
              )) : (
                <Text style={styles.modulesHint}>Select a faculty to see relevant modules</Text>
              )}
            </ScrollView>
          </View>

          {/* Validation Status Indicator */}
          <View style={styles.validationRow}>
            <Ionicons
              name={isFormComplete ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={isFormComplete ? '#16A34A' : '#D97706'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.validationText, isFormComplete ? styles.validationTextComplete : styles.validationTextPending]}>
              {isFormComplete
                ? 'All fields selected! Ready to find your mentor.'
                : `Please select all fields (${academicFields.length - missingFields.length}/${academicFields.length} selected)`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, !isFormComplete && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={isFormComplete ? 0.85 : 0.65}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.continueText, !isFormComplete && styles.continueTextDisabled]}>
                {isFormComplete ? 'Continue' : `Complete All Fields (${academicFields.length - missingFields.length}/${academicFields.length})`}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={!isFormComplete ? '#94A3B8' : '#0B2754'}
                style={{ marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StackFooterBar navigation={navigation} active={activeTab} />

      <Modal transparent visible={selectedField !== null} animationType="fade" onRequestClose={() => setSelectedField(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedField(null)}>
          <Pressable style={styles.optionSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select {activeField?.label || selectedField}</Text>
            {(selectedField ? fieldOptions[selectedField] : []).map((option) => (
              <TouchableOpacity key={option} style={styles.optionRow} onPress={() => selectOption(option)}>
                <Text style={styles.optionText}>{option}</Text>
                {selectedField && values[selectedField] === option && (
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const navy = '#061E47';
const blue = '#0B2754';
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  headerBar: {
    backgroundColor: navy,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUniTop: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandMentorTop: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: { paddingBottom: 36 },
  hero: { backgroundColor: navy, paddingHorizontal: 20, paddingBottom: 44, overflow: 'hidden' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 42, height: 34, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  brandMarkText: { color: navy, fontWeight: '900', fontSize: 22 }, brandCopy: { flex: 1, marginLeft: 10 },
  brandName: { color: '#FFF', fontSize: 24, fontWeight: '400' }, brandStrong: { fontWeight: '900' },
  brandTagline: { color: '#D7E6FA', fontSize: 11 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  bell: { color: '#FBBF24', fontSize: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0B2754', borderWidth: 2, borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' }, heroBody: { flexDirection: 'row', marginTop: 18 },
  heroCopy: { flex: 1.3 }, stepPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(245, 158, 11, 0.16)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 9 },
  stepPillText: { color: '#FBBF24', fontSize: 13, fontWeight: '700' }, heroTitle: { color: '#FFF', fontSize: 27, lineHeight: 32, fontWeight: '900' },
  heroSubtitle: { color: '#E1ECFA', fontSize: 13, lineHeight: 18, marginTop: 6, maxWidth: 260 },
  heroArt: { flex: 0.7, minHeight: 112, alignItems: 'center', justifyContent: 'center' },
  cap: { color: '#0B2754', fontSize: 58, fontWeight: '900', transform: [{ rotate: '-8deg' }] }, books: { color: '#F59E0B', fontSize: 55, marginTop: -24 },
  goalBubble: { position: 'absolute', right: -8, top: 2, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 10 },
  goalText: { color: navy, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  contentPanel: { marginTop: -26, backgroundColor: '#F4F7FB', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 14, paddingTop: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 8, marginBottom: 14 }, progressItem: { alignItems: 'center', width: 84 },
  progressCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }, progressCircleActive: { backgroundColor: '#061E47' },
  progressNumber: { color: '#64748B', fontSize: 17, fontWeight: '700' }, progressNumberActive: { color: '#FBBF24' },
  progressLabel: { color: '#64748B', fontSize: 11, textAlign: 'center', marginTop: 6 }, progressLabelActive: { color: navy, fontWeight: '800' },
  progressLine: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginTop: 15, marginHorizontal: -8 }, progressLineActive: { backgroundColor: '#061E47' },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, sectionIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  alertIcon: { color: '#F59E0B', fontSize: 22, fontWeight: '900' },
  sectionHeadingCopy: { flex: 1 }, sectionTitle: { color: navy, fontSize: 16, fontWeight: '800' }, sectionSubtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 7 },
  selectField: { width: '49%', minHeight: 56, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 13, padding: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF' },
  selectFieldDisabled: { opacity: 0.55, backgroundColor: '#F8FAFC' },
  fieldIcon: { width: 34, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 7 }, fieldIconText: { color: '#D97706', fontWeight: '900', fontSize: 15 },
  fieldTextWrap: { flex: 1, minWidth: 0 }, fieldLabel: { color: navy, fontSize: 12, fontWeight: '800' }, fieldValue: { color: '#64748B', fontSize: 11, marginTop: 4 }, fieldValueSelected: { color: navy, fontWeight: '700' }, chevron: { color: '#94A3B8', fontSize: 18, marginLeft: 2, marginTop: -5 },
  popularCard: { backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 11, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' }, popularHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, star: { color: '#F59E0B', fontSize: 22 }, seeAll: { color: '#F59E0B', fontSize: 12, fontWeight: '800' }, chipsRow: { paddingHorizontal: 12, gap: 8, marginTop: 8 }, chip: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7 }, chipText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  modulesHint: { color: '#64748B', fontSize: 12, paddingVertical: 6 },
  continueButton: { backgroundColor: '#F59E0B', borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginHorizontal: 1, shadowColor: '#F59E0B', shadowOpacity: 0.32, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  continueButtonDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0, elevation: 0 },
  continueText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  continueTextDisabled: { color: '#94A3B8', fontSize: 15, fontWeight: '700' },
  validationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: 6, paddingHorizontal: 12 },
  validationText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  validationTextPending: { color: '#D97706' },
  validationTextComplete: { color: '#16A34A' },
  requiredStar: { color: '#EF4444', fontSize: 12, fontWeight: '900' },
  selectFieldFilled: { borderColor: '#F59E0B', backgroundColor: '#FFFDF0' },
  fieldCheck: { color: '#16A34A', fontSize: 14, fontWeight: '900', marginLeft: 3 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6,30,71,0.52)', justifyContent: 'flex-end' }, optionSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34 }, sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 16 }, sheetTitle: { color: navy, fontSize: 19, fontWeight: '800', marginBottom: 8 }, optionRow: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }, optionText: { flex: 1, color: '#0F172A', fontSize: 15 }, check: { color: '#22C55E', fontSize: 18, fontWeight: '900' },
});
