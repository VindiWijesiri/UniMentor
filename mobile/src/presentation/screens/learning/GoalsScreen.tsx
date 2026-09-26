import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Goal } from '../../../domain/entities/Goal';
import { apiError } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Goals'> };

export default function GoalsScreen({ navigation }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    learningRepository
      .goals()
      .then(setGoals)
      .catch((err) => setError(apiError(err)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout title="My learning goals" showBack activeTab="Learning" onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Create study goal" onPress={() => navigation.navigate('CreateGoal')} />
      <View style={styles.mt}>
        <PrimaryButton label="Improvement history" onPress={() => navigation.navigate('ImprovementHistory')} />
      </View>
      {goals.map((item) => (
        <TouchableOpacity key={item._id} onPress={() => navigation.navigate('GoalProgress', { goalId: item._id })}>
          <Card style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.subject} · {item.progress}% · {item.status}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${item.progress}%` }]} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
      {!goals.length ? <EmptyState text="Create a goal to start tracking hours." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  mt: { marginTop: 10 },
  card: { marginTop: 12 },
  title: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.gold },
});
