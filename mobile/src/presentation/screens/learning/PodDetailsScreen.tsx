import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
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
import type { PodConversation } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { SvgChevronLeft } from '../../components/common/SvgIcons';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'PodDetails'>;

export default function PodDetailsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const conversationId = route.params?.conversationId || '';
  const [item, setItem] = useState<PodConversation | null>(null);
  const [title, setTitle] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!conversationId) return;
    let active = true;
    podRepository.get(conversationId)
      .then((conversation) => {
        if (!active) return;
        setItem(conversation);
        setTitle(conversation.title);
        setModuleCode(conversation.meta.moduleCode || '');
        setSubtitle(conversation.meta.subtitle || '');
        setGoal(conversation.meta.assessmentHint || '');
      })
      .catch(() => { if (active) Alert.alert('Could not load this chat.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [conversationId]);

  useFocusEffect(useCallback(() => load(), [load]));

  const group = item?.type === 'group';
  const mentor = item?.participants?.find((person) => person.role === 'mentor');

  const save = async () => {
    if (!conversationId || !title.trim()) {
      Alert.alert('A group name is required.');
      return;
    }
    setSaving(true);
    try {
      const updated = await podRepository.update(conversationId, {
        title: title.trim(),
        moduleCode: moduleCode.trim(),
        subtitle: subtitle.trim(),
        goal: goal.trim(),
      });
      setItem(updated);
      Alert.alert('Group updated');
    } catch {
      Alert.alert('Could not update this group.');
    } finally {
      setSaving(false);
    }
  };

  const book = () => {
    if (mentor) {
      const subject = (item?.meta.moduleCode || moduleCode).trim();
      navigation.navigate('MainTabs', {
        screen: 'Bookings',
        params: {
          screen: 'BookSession',
          params: {
            mentor: {
              _id: mentor._id,
              name: mentor.name,
              email: mentor.email,
              role: 'mentor',
              subjects: subject ? [subject] : [],
            },
            initialMode: group ? 'group' : '1-on-1',
          },
        },
      });
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Bookings', params: { screen: 'FindMentor' } });
  };

  const openProfile = (person: NonNullable<PodConversation['participants']>[number]) => {
    if (person.role === 'mentor') {
      navigation.navigate('TutorProfile', {
        mentor: { _id: person._id, name: person.name, email: person.email, role: 'mentor', subjects: [] } as any,
      });
      return;
    }
    Alert.alert(person.name, `${person.role === 'student' ? 'Student' : person.role}\n${person.email}`);
  };

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor={navy} translucent />
      <View style={[styles.header, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <SvgChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group ? 'Group details' : 'Chat profile'}</Text>
      </View>
      {loading || !item ? (
        <ActivityIndicator color={navy} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.name}>{item.title}</Text>
          <Text style={styles.meta}>{item.participantCount} people · {item.category}</Text>

          {group ? (
            <View style={styles.card}>
              <Text style={styles.label}>Group name</Text>
              <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor="#8B98AE" />
              <Text style={styles.label}>Module code</Text>
              <TextInput value={moduleCode} onChangeText={setModuleCode} style={styles.input} placeholderTextColor="#8B98AE" />
              <Text style={styles.label}>Short description</Text>
              <TextInput value={subtitle} onChangeText={setSubtitle} style={styles.input} placeholderTextColor="#8B98AE" />
              <Text style={styles.label}>Study goal</Text>
              <TextInput value={goal} onChangeText={setGoal} style={[styles.input, styles.area]} multiline placeholderTextColor="#8B98AE" />
              <TouchableOpacity style={[styles.primary, saving && { opacity: 0.6 }]} onPress={() => void save()} disabled={saving}>
                <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save group'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>About</Text>
              <Text style={styles.meta}>{item.meta.subtitle || 'Direct chat'}</Text>
            </View>
          )}

          <Text style={styles.section}>People</Text>
          {(item.participants ?? []).map((person) => (
            <TouchableOpacity key={person._id} style={styles.person} onPress={() => openProfile(person)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{person.initials}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.meta}>{person.role} · View profile</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.primary} onPress={book}>
            <Text style={styles.primaryText}>Book a session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('StudyMaterials', { conversationId })}>
            <Text style={styles.secondaryText}>Materials from this chat</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  header: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 40 },
  name: { color: ink, fontSize: 22, fontWeight: '900' },
  meta: { color: muted, marginTop: 4, fontWeight: '700' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#E6EAF2' },
  label: { color: ink, fontWeight: '800', marginTop: 8, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E6EAF2', paddingHorizontal: 12, minHeight: 44, color: ink },
  area: { minHeight: 90, textAlignVertical: 'top', paddingTop: 10 },
  section: { color: ink, fontSize: 16, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  person: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E6EAF2' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: navy, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  personName: { color: ink, fontWeight: '800' },
  primary: { backgroundColor: yellow, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryText: { color: navy, fontWeight: '900', fontSize: 15 },
  secondary: { borderWidth: 1, borderColor: '#D7DEEA', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 10, backgroundColor: '#FFF' },
  secondaryText: { color: navy, fontWeight: '800' },
});
