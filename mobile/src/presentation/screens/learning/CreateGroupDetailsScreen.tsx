import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { FieldLabel, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateGroupDetails'>;

export default function CreateGroupDetailsScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const next = () => {
    if (!name.trim() || !subject.trim()) {
      Alert.alert('Missing details', 'Name and subject are required.');
      return;
    }
    navigation.navigate('CreateGroupMembers', { name, subject, description });
  };

  return (
    <ScreenLayout title="Create study group" showBack activeTab="Learning">
      <FieldLabel text="Group name" />
      <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="DSA Revision Squad" />
      <FieldLabel text="Subject" />
      <TextInput style={[inputStyle, styles.gap]} value={subject} onChangeText={setSubject} />
      <FieldLabel text="Description" />
      <TextInput style={[inputStyle, styles.area]} value={description} onChangeText={setDescription} multiline />
      <PrimaryButton label="Next: invite peers" onPress={next} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 12 },
  area: { minHeight: 90, textAlignVertical: 'top', marginBottom: 16 },
});
