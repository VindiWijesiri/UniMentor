import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { card, ink, line, navy, orange } from '../assessments/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AddGoalAssessment'>;
const TYPES = ['Exam', 'Assignment', 'Quiz'] as const;

export default function AddGoalAssessmentScreen({ navigation, route }: Props) {
  const [name, setName] = useState('Bellman-Ford Mock');
  const [type, setType] = useState<(typeof TYPES)[number]>('Quiz');
  const [dateLabel, setDateLabel] = useState('18 Oct 2026');
  const [timeLabel, setTimeLabel] = useState('09:00');
  const [totalMarks, setTotalMarks] = useState('100');
  const [targetMark, setTargetMark] = useState('85');
  const [weight, setWeight] = useState('10');

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Add Assessment" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>Linked: IT2040 - Graph Traversals</Text>
        <Text style={styles.title}>Add assessment to goal</Text>
        <Text style={styles.step}>Step 2 of 2</Text>
        <Field label="Assessment name" value={name} onChangeText={setName} />
        <Text style={styles.label}>Assessment type</Text>
        <View style={styles.types}>
          {TYPES.map((item) => (
            <TouchableOpacity key={item} style={[styles.type, type === item && styles.typeOn]} onPress={() => setType(item)}>
              <Text style={[styles.typeText, type === item && styles.typeTextOn]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          <View style={styles.flex}><Field label="Date" value={dateLabel} onChangeText={setDateLabel} /></View>
          <View style={styles.flex}><Field label="Time" value={timeLabel} onChangeText={setTimeLabel} /></View>
        </View>
        <Text style={styles.label}>Marks and weighting · +3.4% GPA target</Text>
        <View style={styles.row}>
          <View style={styles.flex}><Field label="Total marks" value={totalMarks} onChangeText={setTotalMarks} /></View>
          <View style={styles.flex}><Field label="Target mark" value={targetMark} onChangeText={setTargetMark} /></View>
          <View style={styles.flex}><Field label="Weight %" value={weight} onChangeText={setWeight} /></View>
        </View>
        <Text style={styles.note}>Exam reminders stay on. Tutor prep is linked to Tharushi Perera.</Text>
        <OrangeButton
          label="Save assessment to goal"
          onPress={async () => {
            try {
              await learningRepository.addGoalAssessment(route.params.goalId, {
                name, type, dateLabel, timeLabel, totalMarks: Number(totalMarks), targetMark: Number(targetMark), weight: Number(weight),
              });
              navigation.goBack();
            } catch {
              Alert.alert('Not saved', 'Add a name and try again.');
            }
          }}
        />
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel and discard</Text></TouchableOpacity>
      </ScrollView>
    </AssessmentScreen>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  flex: { flex: 1 },
  kicker: { color: navy, fontWeight: '800' },
  title: { color: ink, fontSize: 24, fontWeight: '800', marginTop: 4 },
  step: { color: orange, fontWeight: '800', marginVertical: 8 },
  label: { color: navy, fontWeight: '800', marginBottom: 6, marginTop: 8 },
  field: { marginBottom: 4 },
  input: { backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 12, padding: 12, color: ink },
  types: { flexDirection: 'row', gap: 8 },
  type: { flex: 1, borderWidth: 1, borderColor: line, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: card },
  typeOn: { backgroundColor: navy, borderColor: navy },
  typeText: { color: navy, fontWeight: '800' },
  typeTextOn: { color: '#fff' },
  row: { flexDirection: 'row', gap: 8 },
  note: { color: navy, marginVertical: 12, lineHeight: 18 },
  cancel: { color: navy, fontWeight: '800', textAlign: 'center', marginTop: 12 },
});
