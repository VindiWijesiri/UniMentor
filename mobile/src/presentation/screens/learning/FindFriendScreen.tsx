import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodPerson } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import StackFooterBar from '../../navigation/StackFooterBar';
import { ice, ink, muted, navy, pageBg, secondaryBlue, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'FindFriend'>;

export default function FindFriendScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<PodPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState('');

  const search = useCallback((value: string) => {
    setLoading(true);
    podRepository.people(value.trim() || undefined)
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), query ? 280 : 0);
    return () => clearTimeout(timer);
  }, [query, search]);

  const openChat = async (person: PodPerson) => {
    if (starting) return;
    setStarting(person._id);
    try {
      const conversation = await podRepository.startDirect(person._id);
      navigation.replace('PodThread', { conversationId: conversation._id });
    } catch {
      Alert.alert('Could not start this chat.');
    } finally {
      setStarting('');
    }
  };

  return (
    <View style={styles.page}>
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity style={styles.backCircle} onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Chat with Friend</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or user ID"
            placeholderTextColor="#8B98AE"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => search(query)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={() => search(query)}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.info}>Find anyone in UniMentor by name, email, or user ID.</Text>
      </View>

      {loading ? (
        <View style={styles.state}><ActivityIndicator color={navy} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {people.length === 0 ? (
            <Text style={styles.empty}>No users match that name or ID.</Text>
          ) : people.map((person) => (
            <TouchableOpacity key={person._id} style={styles.card} onPress={() => void openChat(person)} activeOpacity={0.88}>
              <View style={[styles.avatar, person.role === 'mentor' && styles.avatarGold]}>
                <Text style={[styles.avatarText, person.role === 'mentor' && styles.avatarTextDark]}>{person.initials}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{person.name}</Text>
                <Text style={styles.meta}>ID · {person.userCode ?? person._id.slice(-8)}</Text>
                <Text style={styles.role}>{person.role === 'mentor' ? 'Tutor' : 'Student'} · {person.email}</Text>
              </View>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{starting === person._id ? '...' : 'Chat'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <StackFooterBar navigation={navigation} active="Learning" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  backCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  back: { color: '#FFF', fontSize: 26, marginTop: -2 },
  heroTitle: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: '800' },
  brandRow: { flexDirection: 'row' },
  brandUni: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  brandMentor: { color: '#F5A623', fontSize: 16, fontWeight: '800' },
  search: {
    marginTop: 12, backgroundColor: '#FFF', borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 12, minHeight: 42,
  },
  searchIcon: { color: muted, fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, color: ink, fontSize: 13, paddingVertical: 8 },
  searchBtn: { backgroundColor: yellow, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  searchBtnText: { color: navy, fontWeight: '900', fontSize: 12 },
  infoBar: { backgroundColor: ice, paddingHorizontal: 16, paddingVertical: 10 },
  info: { color: secondaryBlue, fontSize: 12, fontWeight: '700' },
  body: { padding: 14, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 13, marginBottom: 10,
    borderWidth: 1, borderColor: '#E6EAF2', flexDirection: 'row', alignItems: 'center',
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: navy, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarGold: { backgroundColor: yellow },
  avatarText: { color: '#FFF', fontWeight: '900' },
  avatarTextDark: { color: navy },
  copy: { flex: 1, minWidth: 0 },
  name: { color: ink, fontSize: 15, fontWeight: '900' },
  meta: { color: navy, fontSize: 11, fontWeight: '800', marginTop: 3 },
  role: { color: muted, fontSize: 11, marginTop: 2 },
  cta: { backgroundColor: yellow, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  ctaText: { color: navy, fontWeight: '900', fontSize: 12 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: muted, marginTop: 36 },
});
