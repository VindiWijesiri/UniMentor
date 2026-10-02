import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodPerson } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateSquad'>;

export default function CreateSquadScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => (step === 'invite' ? setStep('details') : navigation.goBack())}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{step === 'details' ? 'Create Study Squad' : 'Invite & Study Setup'}</Text>
          <Text style={styles.brand}>UniMentor</Text>
        </View>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setStep('details')}>
            <Text style={[styles.tab, step === 'details' && styles.tabOn]}>
              {step === 'invite' ? '✓  ' : ''}{step === 'invite' ? 'Group Details' : 'Squad Details'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('invite')}>
            <Text style={[styles.tab, step === 'invite' && styles.tabOn]}>
              {step === 'invite' ? 'Peers & Tutors' : 'Peers & Mentors'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {step === 'details' ? (
          <>
            <View style={styles.iconBox}>
              <Text style={styles.iconGlyph}>📘</Text>
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
                <Text style={styles.check}>{selected.includes(person._id) ? '✓' : '+'}</Text>
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
                  <Text style={styles.meta}>Verified tutor · {person.rating || 4.8} ★ · 120+ sessions</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 30, marginRight: 8 },
  heroTitle: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '900' },
  brand: { color: yellow, fontSize: 12, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 16, marginTop: 12 },
  tab: { color: '#9BB0D0', fontWeight: '800' },
  tabOn: { color: yellow },
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
