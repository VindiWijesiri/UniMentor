import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { QuestionType } from '../../../domain/entities/Assessment';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'AssessmentCreate'> };

const TYPES: { type: QuestionType; label: string; help: string }[] = [
  { type: 'mcq', label: 'MCQ quiz', help: 'Single-correct multiple choice' },
  { type: 'true_false', label: 'True / False', help: 'Binary statements' },
  { type: 'short_answer', label: 'Short answer', help: 'Accepted keywords' },
  { type: 'matching', label: 'Matching pairs', help: 'Term to definition' },
  { type: 'fill_blank', label: 'Fill in the blanks', help: 'Exact accepted answers' },
  { type: 'ordering', label: 'Ordering / sequencing', help: 'Put steps in order' },
  { type: 'essay', label: 'Essay + rubric', help: 'Manual grading' },
  { type: 'coding', label: 'Coding challenge', help: 'Starter code + review' },
  { type: 'file', label: 'File / project', help: 'URL or pack upload' },
  { type: 'drag_drop', label: 'Drag and drop', help: 'Sort tokens into buckets' },
  { type: 'case_study', label: 'Scenario / case study', help: 'Narrative plus written response' },
];

export default function AssessmentCreateScreen({ navigation }: Props) {
  return (
    <ScreenLayout title="Create assessment" showBack activeTab="Learning">
      <Text style={styles.help}>Choose a question type. Each type has its own builder and is stored as a live assessment students can take.</Text>
      {TYPES.map((item) => (
        <TouchableOpacity key={item.type} onPress={() => navigation.navigate('AssessmentBuilder', { type: item.type })}>
          <Card style={styles.card}>
            <Text style={styles.title}>{item.label}</Text>
            <Text style={styles.meta}>{item.help}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  help: { color: colors.muted, marginBottom: 12 },
  card: { marginBottom: 10 },
  title: { fontWeight: '800', color: colors.navy, fontSize: 16 },
  meta: { color: colors.muted, marginTop: 4 },
});
