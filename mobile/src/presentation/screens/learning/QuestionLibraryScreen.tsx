import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Question } from '../../../domain/entities/Assessment';
import { apiError } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Item = {
  assessmentId: string;
  assessmentTitle: string;
  subject: string;
  index: number;
  question: Question;
};

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'QuestionLibrary'> };

export default function QuestionLibraryScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      learningRepository
        .questionLibrary()
        .then(setItems)
        .catch((err) => setError(apiError(err)));
    }, [])
  );

  const reuse = async (item: Item) => {
    try {
      await learningRepository.createAssessment({
        title: `${item.assessmentTitle} (reuse)`,
        subject: item.subject,
        published: true,
        durationMinutes: 20,
        questions: [item.question],
      });
      Alert.alert('Reused', 'Published a new assessment with this question.');
    } catch (err) {
      Alert.alert('Could not reuse', apiError(err));
    }
  };

  return (
    <ScreenLayout title="Question library" showBack activeTab="Learning">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Create new MCQ" onPress={() => navigation.navigate('AssessmentBuilder', { type: 'mcq' })} />
      {items.map((item, index) => (
        <TouchableOpacity key={`${item.assessmentId}-${index}`} onPress={() => reuse(item)}>
          <Card style={styles.card}>
            <Badge text={item.question.type.replace('_', ' ')} tone="orange" />
            <Text style={styles.title}>{item.question.prompt}</Text>
            <Text style={styles.meta}>{item.assessmentTitle} · {item.subject} · {item.question.points} pts</Text>
            <Text style={styles.link}>Tap to publish as a new assessment</Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!items.length ? <EmptyState text="No saved questions yet. Create an assessment first." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  card: { marginTop: 12 },
  title: { fontWeight: '800', color: colors.navy, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  link: { color: colors.info, marginTop: 8, fontWeight: '700' },
});
