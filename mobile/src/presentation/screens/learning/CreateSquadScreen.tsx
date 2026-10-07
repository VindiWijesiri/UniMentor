import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodPerson } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import StackFooterBar from '../../navigation/StackFooterBar';
import { SvgBook, SvgCheck, SvgChevronLeft, SvgStar } from '../../components/common/SvgIcons';
import { ice, ink, muted, navy, pageBg, yellow } from './learningTheme';


type Props = NativeStackScreenProps<AppStackParamList, 'CreateSquad'>;

export default function CreateSquadScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const [step, setStep] = useState<'details' | 'invite'>('details');
  const [title, setTitle] = useState('IT2040 DSA Advanced Squad');
  const [moduleCode, setModuleCode] = useState('IT2040 · Data Structures & Algorithms');
  const [goal, setGoal] = useState('Focusing on tree traversals, shortest path algorithms, recursion and preparing for mid-term lab exams together.');
  const [people, setPeople] = useState<PodPerson[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  useFocusEffect(useCallback(() => {
    podRepository.people().then(setPeople).catch(() => {});
  }, []));

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const students = useMemo(
    () => people.filter((person) => person.role === 'student' && person.name.toLowerCase().includes(query.trim().toLowerCase())),
    [people, query],
  );
  const tutors = useMemo(
    () => people.filter((person) => person.role === 'mentor'),
    [people],
  );

  const create = async () => {
    if (!title.trim()) {
      Alert.alert('Group title is required');
      return;
    }
    setCreating(true);
    try {
      const conversation = await podRepository.createSquad({
        title: title.trim(),
        moduleCode,
        goal,
        participantIds: selected,
      });
      navigation.replace('PodThread', { conversationId: conversation._id });
    } catch {
      Alert.alert('Could not create the squad. Check your connection.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => (step === 'invite' ? setStep('details') : navigation.goBack())}
              activeOpacity={0.7}
            >
              <SvgChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {step === 'details' ? 'Create Study Squad' : 'Invite & Setup'}
            </Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <View style={styles.stepper}>
          <TouchableOpacity style={styles.step} onPress={() => setStep('details')} activeOpacity={0.85}>
            <View style={styles.dotOn}>
              {step === 'invite'
                ? <SvgCheck size={11} color={navy} strokeWidth={3} />
                : <Text style={styles.dotNum}>1</Text>}
            </View>
            <Text style={styles.stepOn}>
              {step === 'invite' ? 'Group Details' : 'Squad Details'}
            </Text>
          </TouchableOpacity>
          <View style={[styles.rail, step === 'invite' && styles.railOn]} />
          <TouchableOpacity style={styles.step} onPress={() => setStep('invite')} activeOpacity={0.85}>
            <View style={step === 'invite' ? styles.dotOn : styles.dotOff}>
              <Text style={step === 'invite' ? styles.dotNum : styles.dotNumOff}>2</Text>
            </View>
            <Text style={step === 'invite' ? styles.stepOn : styles.stepOff}>
              {step === 'invite' ? 'Peers & Tutors' : 'Peers & Mentors'}
            </Text>
          </TouchableOpacity>
        </View>

      <ScrollView contentContainerStyle={styles.body}>
        {step === 'details' ? (
          <>
            <View style={styles.iconBox}>
              <SvgBook size={26} color={navy} />
              <Text style={styles.iconHint}>SQUAD ICON{'\n'}Tap to customize avatar, color, or module badge</Text>
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Group Title</Text>
              <Text style={styles.counter}>{title.length}/50</Text>
            </View>
            <TextInput value={title} onChangeText={(value) => setTitle(value.slice(0, 50))} style={styles.input} maxLength={50} />
            <Text style={styles.label}>Target University Modules</Text>
            <TextInput value={moduleCode} onChangeText={setModuleCode} style={styles.input} />
            <View style={styles.faculty}><Text style={styles.facultyText}>Faculty · Generating</Text></View>
            <Text style={styles.label}>Study Goals & Objective</Text>
            <TextInput value={goal} onChangeText={setGoal} style={[styles.input, styles.area]} multiline />
            <TouchableOpacity style={styles.primary} onPress={() => setStep('invite')}>
              <Text style={styles.primaryText}>Next: Add Peers & Mentors</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>Invite Peer Students</Text>
              <Text style={styles.added}>{selected.filter((id) => students.some((person) => person._id === id) || people.find((person) => person._id === id)?.role === 'student').length} Added</Text>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or Student ID (e.g. IT21...)"
              placeholderTextColor="#8B98AE"
              style={styles.input}
            />
            {students.map((person) => (
              <TouchableOpacity key={person._id} style={styles.person} onPress={() => toggle(person._id)}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{person.initials}</Text></View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{person.name}</Text>
                  <Text style={styles.meta}>{person.email}</Text>
                </View>
                {selected.includes(person._id) ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2FBE8', alignItems: 'center', justifyContent: 'center' }}>
                    <SvgCheck size={14} color="#15803D" strokeWidth={3} />
                  </View>
                ) : (
                  <Text style={styles.check}>+</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => void Share.share({ message: `Join my UniMentor squad “${title.trim()}”. Open Chat Pod to start revising together.` })}
            >
              <Text style={styles.linkText}>Copy Link</Text>
            </TouchableOpacity>
            <Text style={styles.section}>Peer Tutors & Rates</Text>
            {tutors.map((person) => (
              <TouchableOpacity key={person._id} style={[styles.person, selected.includes(person._id) && styles.personOn]} onPress={() => toggle(person._id)}>
                <View style={[styles.avatar, styles.avatarGold]}><Text style={[styles.avatarText, { color: navy }]}>{person.initials}</Text></View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{person.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <Text style={styles.meta}>Verified tutor · {person.rating || 4.8}</Text>
                    <SvgStar size={11} color={yellow} fill={yellow} />
                    <Text style={styles.meta}>· 120+ sessions</Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.rate}>LKR 1,500</Text>
                  <Text style={styles.rateHint}>/ student</Text>
                  <Text style={styles.check}>{selected.includes(person._id) ? 'Selected' : 'Invite'}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.primary, creating && styles.primaryOff]} onPress={() => void create()} disabled={creating}>
              <Text style={styles.primaryText}>{creating ? 'Creating squad...' : 'Create Group & Send Invites'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <StackFooterBar navigation={navigation} active="Learning" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
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
    flex: 1,
    marginRight: 8,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandMentor: {
    color: yellow,
    fontSize: 20,
    fontWeight: '800',
  },
  stepper: {
    backgroundColor: ice,
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rail: { flex: 1, height: 2, backgroundColor: '#8EA0C2', marginHorizontal: 10, borderRadius: 1 },
  railOn: { backgroundColor: yellow },
  dotOn: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: yellow,
    alignItems: 'center', justifyContent: 'center',
  },
  dotOff: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: ice,
    borderWidth: 1.5, borderColor: '#C4D4EE',
    alignItems: 'center', justifyContent: 'center',
  },
  dotNum: { color: navy, fontSize: 11, fontWeight: '900' },
  dotNumOff: { color: '#C5D0E4', fontSize: 11, fontWeight: '800' },
  dotCheck: { color: '#FFF', fontSize: 12, fontWeight: '900', marginTop: -1 },
  stepOn: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  stepOff: { color: '#9BB0D0', fontSize: 12, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40 },
  iconBox: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6EAF2', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconGlyph: { fontSize: 28 },
  iconHint: { color: muted, fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 18 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: ink, fontWeight: '800', marginBottom: 6, marginTop: 10 },
  counter: { color: muted, fontSize: 12, fontWeight: '700', marginTop: 10 },
  input: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E6EAF2', paddingHorizontal: 12, minHeight: 46, color: ink },
  area: { minHeight: 110, textAlignVertical: 'top', paddingTop: 12 },
  faculty: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  facultyText: { color: '#4338CA', fontSize: 11, fontWeight: '800' },
  primary: { backgroundColor: yellow, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  primaryOff: { opacity: 0.6 },
  primaryText: { color: navy, fontWeight: '900', fontSize: 15 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { color: ink, fontWeight: '900', fontSize: 15, marginTop: 8, marginBottom: 8 },
  added: { color: '#15803D', fontWeight: '800', fontSize: 12 },
  person: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E6EAF2' },
  personOn: { borderColor: yellow, backgroundColor: '#FFFBEB' },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: navy, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarGold: { backgroundColor: yellow },
  avatarText: { color: '#FFF', fontWeight: '900' },
  copy: { flex: 1 },
  name: { color: ink, fontWeight: '900' },
  meta: { color: muted, fontSize: 12, marginTop: 2 },
  check: { color: navy, fontWeight: '900', textAlign: 'right' },
  rate: { color: ink, fontWeight: '900', textAlign: 'right' },
  rateHint: { color: muted, fontSize: 10, textAlign: 'right' },
  linkBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  linkText: { color: '#2563EB', fontWeight: '800' },
});
