import React, { useMemo, useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppTabParamList } from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Home'>;
type FieldKey = 'faculty' | 'department' | 'programme' | 'academicYear' | 'semester'
  | 'module' | 'topic';
type FieldConfig = { key: FieldKey; label: string; placeholder: string; icon: string; tone: string };
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
  { key: 'faculty', label: 'Faculty', placeholder: 'Select faculty', icon: '▥', tone: '#E5F7EF' },
  { key: 'department', label: 'Department', placeholder: 'Select department', icon: '●', tone: '#FFF4D8' },
  { key: 'programme', label: 'Degree Programme', placeholder: 'Select programme', icon: '◆', tone: '#E2F7EF' },
  { key: 'academicYear', label: 'Academic Year', placeholder: 'Select academic year', icon: '▣', tone: '#FFF0E8' },
  { key: 'semester', label: 'Semester', placeholder: 'Select semester', icon: '▤', tone: '#FFE8EC' },
  { key: 'module', label: 'Module', placeholder: 'Select module', icon: '▦', tone: '#E1F4EE' },
  { key: 'topic', label: 'Topic', placeholder: 'Select topic', icon: '◎', tone: '#FFF4D8' },
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
      style={[styles.selectField, disabled && styles.selectFieldDisabled]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <View style={[styles.fieldIcon, { backgroundColor: field.tone }]}>
        <Text style={styles.fieldIconText}>{field.icon}</Text>
      </View>
      <View style={styles.fieldTextWrap}>
        <Text style={styles.fieldLabel} numberOfLines={1}>{field.label}</Text>
        <Text style={[styles.fieldValue, value && styles.fieldValueSelected]} numberOfLines={1}>
          {value || field.placeholder}
        </Text>
      </View>
      <Text style={styles.chevron}>⌄</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
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

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>U</Text></View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}><Text style={styles.brandStrong}>Uni</Text>Mentor</Text>
              <Text style={styles.brandTagline}>Learn Better. Go Further.</Text>
            </View>
            <TouchableOpacity style={styles.headerIcon}><Text style={styles.bell}>●</Text></TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroBody}>
            <View style={styles.heroCopy}>
              <View style={styles.stepPill}><Text style={styles.stepPillText}>Step 1 of 3</Text></View>
              <Text style={styles.heroTitle}>Find Your{`\n`}Academic Guidance</Text>
              <Text style={styles.heroSubtitle}>Tell us what you need help with and we'll match you with the right tutor.</Text>
            </View>
            <View style={styles.heroArt}>
              <Text style={styles.cap}>▰</Text>
              <Text style={styles.books}>▤</Text>
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
              <View style={[styles.sectionIcon, { backgroundColor: '#FFF4D8' }]}><Text style={styles.alertIcon}>!</Text></View>
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
              <View style={[styles.sectionIcon, { backgroundColor: '#FFF4D8' }]}><Text style={styles.star}>★</Text></View>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionTitle}>Popular Modules</Text>
                <Text style={styles.sectionSubtitle}>Explore commonly requested modules</Text>
              </View>
              <Text style={styles.seeAll}>See All →</Text>
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

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Search', values.module ? {
              initialQuery: values.module,
              faculty: values.faculty,
              department: values.department,
              programme: values.programme,
            } : undefined)}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>Continue  →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent visible={selectedField !== null} animationType="fade" onRequestClose={() => setSelectedField(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedField(null)}>
          <Pressable style={styles.optionSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select {activeField?.label || selectedField}</Text>
            {(selectedField ? fieldOptions[selectedField] : []).map((option) => (
              <TouchableOpacity key={option} style={styles.optionRow} onPress={() => selectOption(option)}>
                <Text style={styles.optionText}>{option}</Text>
                {selectedField && values[selectedField] === option && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const navy = '#062B67';
const blue = '#0D4F9E';
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' }, scrollContent: { paddingBottom: 16 },
  hero: { backgroundColor: navy, paddingHorizontal: 20, paddingBottom: 44, overflow: 'hidden' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 42, height: 34, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  brandMarkText: { color: navy, fontWeight: '900', fontSize: 22 }, brandCopy: { flex: 1, marginLeft: 10 },
  brandName: { color: '#FFF', fontSize: 24, fontWeight: '400' }, brandStrong: { fontWeight: '900' },
  brandTagline: { color: '#D7E6FA', fontSize: 11 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  bell: { color: '#FFD200', fontSize: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0B1F4C', borderWidth: 2, borderColor: '#416FA7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' }, heroBody: { flexDirection: 'row', marginTop: 18 },
  heroCopy: { flex: 1.3 }, stepPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(38,125,215,0.42)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 9 },
  stepPillText: { color: '#FFF', fontSize: 13, fontWeight: '600' }, heroTitle: { color: '#FFF', fontSize: 27, lineHeight: 32, fontWeight: '900' },
  heroSubtitle: { color: '#E1ECFA', fontSize: 13, lineHeight: 18, marginTop: 6, maxWidth: 260 },
  heroArt: { flex: 0.7, minHeight: 112, alignItems: 'center', justifyContent: 'center' },
  cap: { color: '#151A22', fontSize: 58, fontWeight: '900', transform: [{ rotate: '-8deg' }] }, books: { color: '#FFB700', fontSize: 55, marginTop: -24 },
  goalBubble: { position: 'absolute', right: -8, top: 2, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 10 },
  goalText: { color: navy, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  contentPanel: { marginTop: -26, backgroundColor: '#F7F9FC', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 14, paddingTop: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 8, marginBottom: 14 }, progressItem: { alignItems: 'center', width: 84 },
  progressCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E3E9F4', alignItems: 'center', justifyContent: 'center' }, progressCircleActive: { backgroundColor: '#093F9B' },
  progressNumber: { color: '#7282A4', fontSize: 17, fontWeight: '700' }, progressNumberActive: { color: '#FFF' },
  progressLabel: { color: '#8190AE', fontSize: 11, textAlign: 'center', marginTop: 6 }, progressLabelActive: { color: navy, fontWeight: '800' },
  progressLine: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F2', marginTop: 15, marginHorizontal: -8 }, progressLineActive: { backgroundColor: '#154DA5' },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 12, marginBottom: 10, shadowColor: '#244369', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, sectionIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  alertIcon: { color: '#F6A700', fontSize: 22, fontWeight: '900' },
  sectionHeadingCopy: { flex: 1 }, sectionTitle: { color: navy, fontSize: 16, fontWeight: '800' }, sectionSubtitle: { color: '#7585A5', fontSize: 12, marginTop: 2 },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 7 },
  selectField: { width: '49%', minHeight: 56, borderWidth: 1, borderColor: '#E0E6F0', borderRadius: 13, padding: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF' },
  selectFieldDisabled: { opacity: 0.55, backgroundColor: '#F4F6F9' },
  fieldIcon: { width: 34, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 7 }, fieldIconText: { color: '#087B59', fontWeight: '900', fontSize: 15 },
  fieldTextWrap: { flex: 1, minWidth: 0 }, fieldLabel: { color: navy, fontSize: 12, fontWeight: '800' }, fieldValue: { color: '#8795B4', fontSize: 11, marginTop: 4 }, fieldValueSelected: { color: blue, fontWeight: '600' }, chevron: { color: '#4F6290', fontSize: 18, marginLeft: 2, marginTop: -5 },
  popularCard: { backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 11, marginBottom: 10, shadowColor: '#244369', shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 }, popularHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, star: { color: '#FFB000', fontSize: 22 }, seeAll: { color: '#075A4D', fontSize: 12, fontWeight: '800' }, chipsRow: { paddingHorizontal: 12, gap: 8, marginTop: 8 }, chip: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7 }, chipText: { color: '#13221F', fontSize: 12, fontWeight: '700' },
  modulesHint: { color: '#8795B4', fontSize: 12, paddingVertical: 6 },
  continueButton: { backgroundColor: '#FFD200', borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginHorizontal: 1, shadowColor: '#E9B600', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, continueText: { color: navy, fontSize: 17, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(4,19,45,0.52)', justifyContent: 'flex-end' }, optionSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34 }, sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#D8DFEA', alignSelf: 'center', marginBottom: 16 }, sheetTitle: { color: navy, fontSize: 19, fontWeight: '800', marginBottom: 8 }, optionRow: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#EDF0F5', flexDirection: 'row', alignItems: 'center' }, optionText: { flex: 1, color: '#273550', fontSize: 15 }, check: { color: '#0A865D', fontSize: 18, fontWeight: '900' },
});
