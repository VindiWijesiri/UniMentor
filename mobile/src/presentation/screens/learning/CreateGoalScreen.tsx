import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { apiError } from '../../../shared/format';
import { inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { FieldLabel, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateGoal'>;

export default function CreateGoalScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [hours, setHours] = useState('8');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const goal = await learningRepository.createGoal({
        title,
        subject,
        module: moduleName,
        targetHours: Number(hours) || 8,
        targetDate: targetDate || undefined,
      });
      navigation.replace('GoalProgress', { goalId: goal._id });
    } catch (err) {
      Alert.alert('Could not create', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Create study goal" showBack activeTab="Learning">
      <FieldLabel text="Goal title" />
      <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="e.g. Graph BFS exercises" />
      <FieldLabel text="Subject" />
      <TextInput style={[inputStyle, styles.gap]} value={subject} onChangeText={setSubject} />
      <FieldLabel text="Module / problem area" />
      <TextInput style={[inputStyle, styles.gap]} value={moduleName} onChangeText={setModuleName} />
      <FieldLabel text="Target hours" />
      <TextInput style={[inputStyle, styles.gap]} value={hours} onChangeText={setHours} keyboardType="numeric" />
      <FieldLabel text="Target date (YYYY-MM-DD)" />
      <TextInput style={[inputStyle, styles.gap]} value={targetDate} onChangeText={setTargetDate} />
      <PrimaryButton label="Save goal" onPress={save} loading={loading} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 12 },
});
