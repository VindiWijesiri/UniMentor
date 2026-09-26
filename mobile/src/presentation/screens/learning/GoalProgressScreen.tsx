import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Goal } from '../../../domain/entities/Goal';
import { apiError, formatWhen } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, FieldLabel, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'GoalProgress'>;

export default function GoalProgressScreen({ route }: Props) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [minutes, setMinutes] = useState('30');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    learningRepository.getGoal(route.params.goalId).then(setGoal).catch((err) => Alert.alert('Error', apiError(err)));
  }, [route.params.goalId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const log = async () => {
    setLoading(true);
    try {
      setGoal(await learningRepository.logGoal(route.params.goalId, Number(minutes) || 30, note));
      setNote('');
    } catch (err) {
      Alert.alert('Could not log', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Log progress" showBack activeTab="Learning">
      {goal ? (
        <Card>
          <Badge text={goal.status} tone={goal.status === 'completed' ? 'success' : 'orange'} />
          <Text style={styles.title}>{goal.title}</Text>
          <Text style={styles.meta}>{goal.subject} · {goal.progress}%</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${goal.progress}%` }]} />
          </View>
        </Card>
      ) : null}
      <FieldLabel text="Minutes studied" />
      <TextInput style={inputStyle} value={minutes} onChangeText={setMinutes} keyboardType="numeric" />
      <FieldLabel text="Note" />
      <TextInput style={[inputStyle, styles.area]} value={note} onChangeText={setNote} multiline />
      <PrimaryButton label="Save log" onPress={log} loading={loading} />
      <Text style={styles.section}>History</Text>
      {goal?.logs?.slice().reverse().map((item, index) => (
        <Card key={`${item.date}-${index}`} style={styles.mb}>
          <Text style={styles.cardTitle}>{item.minutes} minutes</Text>
          <Text style={styles.meta}>{formatWhen(item.date)} {item.note ? `· ${item.note}` : ''}</Text>
        </Card>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.navy, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  track: { height: 8, backgroundColor: colors.border, borderRadius: 8, marginTop: 12, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.gold },
  area: { minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  section: { marginTop: 20, fontWeight: '800', color: colors.navy, fontSize: 16, marginBottom: 8 },
  mb: { marginBottom: 8 },
  cardTitle: { fontWeight: '800', color: colors.navy },
});
