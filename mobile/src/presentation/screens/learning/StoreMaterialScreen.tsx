import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { libraryRepository } from '../../../data/repositories/libraryRepository';
import { podRepository } from '../../../data/repositories/podRepository';
import type { LibraryKind } from '../../../domain/entities/Library';
import type { PodConversation } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'StoreMaterial'>;

const kinds: { key: LibraryKind; label: string }[] = [
  { key: 'pdf', label: 'PDF' },
  { key: 'video', label: 'Video' },
  { key: 'image', label: 'Image' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'audio', label: 'Audio' },
  { key: 'code', label: 'Code' },
  { key: 'text', label: 'Text' },
];

export default function StoreMaterialScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<LibraryKind>('pdf');
  const [title, setTitle] = useState('');
  const [moduleCode, setModuleCode] = useState('IT2040');
  const [moduleName, setModuleName] = useState('Data Structures');
  const [body, setBody] = useState('');
  const [conversationId, setConversationId] = useState(route.params?.conversationId ?? '');
  const [conversations, setConversations] = useState<PodConversation[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);

  const upload = async () => {
    try {
      const picker = await import('expo-image-picker');
      const permission = await picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access is needed to upload an image or video.');
        return;
      }
      const result = await picker.launchImageLibraryAsync({
        mediaTypes: kind === 'video' ? ['videos'] : ['images'],
        quality: 0.4,
        base64: kind !== 'video',
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const name = asset.fileName || (kind === 'video' ? 'video' : 'image');
      setFileName(name);
      if (!title.trim()) setTitle(name.replace(/\.[^.]+$/, ''));
      if (asset.base64) {
        setFileContent(`data:image/jpeg;base64,${asset.base64}`);
        setKind('image');
      } else {
        setFileContent(name);
        setKind('video');
      }
    } catch {
      Alert.alert('Could not open the photo library.');
    }
  };

  useFocusEffect(useCallback(() => {
    podRepository.list('all').then(setConversations).catch(() => {});
  }, []));

  const save = async () => {
    if (!title.trim() || (!body.trim() && !fileContent)) {
      Alert.alert('Add a title and either upload a file or paste the content.');
      return;
    }
    setSaving(true);
    try {
      const storedBody = body.trim() || (kind === 'image' ? 'Image' : fileName || 'Uploaded file');
      const payload: Record<string, unknown> = {
        title: title.trim(),
        kind,
        source: conversationId ? 'group' : 'library',
        moduleCode,
        moduleName,
        body: kind === 'image' ? storedBody : storedBody,
        subtitle: fileName ? `Uploaded ${fileName}` : `Stored ${kind} resource`,
        conversationId: conversationId || undefined,
        files: fileContent ? [{ name: fileName || `${kind}-file`, language: kind, content: fileContent }] : undefined,
      };
      if (kind === 'quiz') {
        payload.questions = [
          { prompt: body.trim() || title.trim(), options: ['True', 'False', 'Depends on the graph', 'Not enough data'], answer: 0 },
        ];
      }
      if (kind === 'code' && body.trim()) {
        payload.files = [{ name: fileName || 'notes.txt', language: 'text', content: body.trim() }];
      }
      const item = await libraryRepository.create(payload);
      if (conversationId) {
        try {
          await podRepository.send(conversationId, title.trim(), { kind: 'file', materialId: item._id });
        } catch {
          // The material is already stored even if the chat note could not be sent.
        }
      }
      navigation.replace('StudyMaterialDetail', { id: item._id });
    } catch {
      Alert.alert('Could not store this material.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.heroTitle}>Store Material</Text>
              <View style={styles.libraryPill}><Text style={styles.libraryText}>LIBRARY</Text></View>
            </View>
            <Text style={styles.sub}>Saved to MongoDB and visible in Chat Pod + dashboards</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Material type</Text>
        <View style={styles.row}>
          {kinds.map((item) => (
            <TouchableOpacity key={item.key} style={[styles.chip, kind === item.key && styles.chipOn]} onPress={() => setKind(item.key)}>
              <Text style={[styles.chipText, kind === item.key && styles.chipTextOn]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Binary Trees cheatsheet" placeholderTextColor="#8B98AE" />
        <Text style={styles.label}>Module</Text>
        <TextInput value={moduleCode} onChangeText={setModuleCode} style={styles.input} />
        <TextInput value={moduleName} onChangeText={setModuleName} style={styles.input} />
        <Text style={styles.label}>Attach to Chat Pod (optional)</Text>
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
        <TouchableOpacity style={styles.upload} onPress={() => void upload()}>
          <Text style={styles.uploadText}>{fileName ? `Uploaded: ${fileName}` : 'Upload image or video'}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>PDF, quiz, audio, code, and text are saved from the box below. Images and videos come from your photo library.</Text>
        <Text style={styles.label}>Content to store</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          style={[styles.input, styles.area]}
          multiline
          placeholder="Paste notes, transcript, code, or a quiz prompt..."
          placeholderTextColor="#8B98AE"
        />
        <TouchableOpacity style={[styles.primary, saving && { opacity: 0.6 }]} onPress={() => void save()} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? 'Storing...' : 'Store in library'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 30, marginRight: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  libraryPill: { backgroundColor: yellow, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  libraryText: { color: navy, fontSize: 10, fontWeight: '900' },
  sub: { color: '#C5D4EB', fontSize: 11, marginTop: 3 },
  body: { padding: 16, paddingBottom: 40 },
  label: { color: ink, fontWeight: '800', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E6EAF2', paddingHorizontal: 12, minHeight: 46, color: ink, marginBottom: 8 },
  area: { minHeight: 140, textAlignVertical: 'top', paddingTop: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: '#D7DEEA', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF' },
  chipOn: { backgroundColor: navy, borderColor: navy },
  chipText: { color: ink, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: '#FFF' },
  upload: { borderWidth: 1, borderColor: navy, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 8, backgroundColor: '#FFF' },
  uploadText: { color: navy, fontWeight: '800' },
  hint: { color: muted, fontSize: 12, marginTop: 8, lineHeight: 18 },
  primary: { backgroundColor: yellow, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryText: { color: navy, fontWeight: '900', fontSize: 15 },
});
