import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { libraryRepository } from '../../../data/repositories/libraryRepository';
import { podRepository } from '../../../data/repositories/podRepository';
import type { LibraryKind, LibrarySource } from '../../../domain/entities/Library';
import type { PodConversation } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';
import PageHeader from '../../components/PageHeader';

type Props = NativeStackScreenProps<AppStackParamList, 'StoreMaterial'>;

const kinds: { key: LibraryKind; label: string }[] = [
  { key: 'pdf', label: 'PDF Notes' },
  { key: 'video', label: 'Video' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'audio', label: 'Audio' },
  { key: 'code', label: 'Code' },
];

const sources: { key: LibrarySource; label: string }[] = [
  { key: 'library', label: 'Library' },
  { key: 'session', label: 'Tutor session' },
  { key: 'live', label: 'Live' },
  { key: 'group', label: 'Study group' },
];

export default function StoreMaterialScreen({ navigation, route }: Props) {
  const [kind, setKind] = useState<LibraryKind>('pdf');
  const [source, setSource] = useState<LibrarySource>(route.params?.conversationId ? 'group' : 'library');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [duration, setDuration] = useState('');
  const [sizeLabel, setSizeLabel] = useState('');
  const [body, setBody] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState(0);
  const [conversationId, setConversationId] = useState(route.params?.conversationId ?? '');
  const [conversations, setConversations] = useState<PodConversation[]>([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    podRepository.list('all').then(setConversations).catch(() => {});
  }, []));

  const save = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Add a title and the material content to store.');
      return;
    }
    const quizOptions = options.map((option) => option.trim()).filter(Boolean);
    if (kind === 'quiz' && quizOptions.length < 2) {
      Alert.alert('A quiz needs at least two answer choices.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        kind,
        source: conversationId && source === 'library' ? 'group' : source,
        moduleCode: moduleCode.trim(),
        moduleName: moduleName.trim(),
        body: body.trim(),
        durationLabel: duration.trim() || undefined,
        sizeLabel: sizeLabel.trim() || undefined,
        conversationId: conversationId || undefined,
      };
      if (kind === 'quiz') {
        payload.questions = [{ prompt: body.trim(), options: quizOptions, answer: Math.min(answer, quizOptions.length - 1) }];
        payload.questionCount = 1;
      }
      if (kind === 'code') {
        payload.files = [{ name: 'notes.txt', language: 'text', content: body.trim() }];
      }
      if (kind === 'pdf' && sizeLabel.trim()) {
        const pages = Number(sizeLabel.replace(/[^\d]/g, ''));
        if (pages) payload.pageCount = pages;
      }
      await libraryRepository.create(payload);
      navigation.replace('StudyMaterials', conversationId ? { conversationId } : undefined);
    } catch {
      Alert.alert('Could not store this material.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Store Material" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Material type</Text>
        <View style={styles.row}>
          {kinds.map((item) => (
            <TouchableOpacity key={item.key} style={[styles.chip, kind === item.key && styles.chipOn]} onPress={() => setKind(item.key)}>
              <Text style={[styles.chipText, kind === item.key && styles.chipTextOn]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Where it belongs</Text>
        <View style={styles.row}>
          {sources.map((item) => (
            <TouchableOpacity key={item.key} style={[styles.chip, source === item.key && styles.chipOn]} onPress={() => setSource(item.key)}>
              <Text style={[styles.chipText, source === item.key && styles.chipTextOn]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Binary trees cheatsheet" placeholderTextColor="#8B98AE" />
        <Text style={styles.label}>Short description</Text>
        <TextInput value={subtitle} onChangeText={setSubtitle} style={styles.input} placeholder="What this covers" placeholderTextColor="#8B98AE" />
        <Text style={styles.label}>Module code</Text>
        <TextInput value={moduleCode} onChangeText={setModuleCode} style={styles.input} placeholder="IT2040" placeholderTextColor="#8B98AE" autoCapitalize="characters" />
        <Text style={styles.label}>Module name</Text>
        <TextInput value={moduleName} onChangeText={setModuleName} style={styles.input} placeholder="Data Structures" placeholderTextColor="#8B98AE" />
        {(kind === 'video' || kind === 'audio') ? (
          <>
            <Text style={styles.label}>Length</Text>
            <TextInput value={duration} onChangeText={setDuration} style={styles.input} placeholder="12:40" placeholderTextColor="#8B98AE" />
          </>
        ) : null}
        <Text style={styles.label}>{kind === 'pdf' ? 'Pages or size' : 'Size label'}</Text>
        <TextInput value={sizeLabel} onChangeText={setSizeLabel} style={styles.input} placeholder={kind === 'pdf' ? '12 pages' : 'Optional'} placeholderTextColor="#8B98AE" />
        <Text style={styles.label}>Attach to Chat Pod</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <TouchableOpacity style={[styles.chip, !conversationId && styles.chipOn]} onPress={() => setConversationId('')}>
            <Text style={[styles.chipText, !conversationId && styles.chipTextOn]}>Library only</Text>
          </TouchableOpacity>
          {conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation._id}
              style={[styles.chip, conversationId === conversation._id && styles.chipOn]}
              onPress={() => setConversationId(conversation._id)}
            >
              <Text style={[styles.chipText, conversationId === conversation._id && styles.chipTextOn]} numberOfLines={1}>{conversation.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.label}>{kind === 'quiz' ? 'Question' : 'Content to store'}</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          style={[styles.input, styles.area]}
          multiline
          placeholder={kind === 'quiz' ? 'Write the question' : 'Paste notes, a transcript, a link, or code'}
          placeholderTextColor="#8B98AE"
        />
        {kind === 'quiz' ? (
          <>
            <Text style={styles.label}>Answer choices</Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <TouchableOpacity style={[styles.answer, answer === index && styles.answerOn]} onPress={() => setAnswer(index)}>
                  <Text style={[styles.answerText, answer === index && styles.chipTextOn]}>{index + 1}</Text>
                </TouchableOpacity>
                <TextInput
                  value={option}
                  onChangeText={(value) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}
                  style={[styles.input, styles.optionInput]}
                  placeholder={`Choice ${index + 1}`}
                  placeholderTextColor="#8B98AE"
                />
              </View>
            ))}
            <Text style={styles.hint}>Tap a number to mark the correct choice.</Text>
          </>
        ) : null}
        <TouchableOpacity style={[styles.primary, saving && { opacity: 0.6 }]} onPress={() => void save()} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? 'Storing...' : 'Store in library'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  body: { padding: 16, paddingBottom: 40 },
  label: { color: ink, fontWeight: '800', marginBottom: 6, marginTop: 10 },
  hint: { color: muted, fontSize: 12, marginTop: 4 },
  input: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E6EAF2', paddingHorizontal: 12, minHeight: 46, color: ink, marginBottom: 8 },
  area: { minHeight: 140, textAlignVertical: 'top', paddingTop: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: '#D7DEEA', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF' },
  chipOn: { backgroundColor: navy, borderColor: navy },
  chipText: { color: ink, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: '#FFF' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionInput: { flex: 1, marginBottom: 8 },
  answer: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#D7DEEA', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  answerOn: { backgroundColor: navy, borderColor: navy },
  answerText: { color: ink, fontWeight: '900' },
  primary: { backgroundColor: yellow, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryText: { color: navy, fontWeight: '900', fontSize: 15 },
});
