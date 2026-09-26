import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { FieldLabel, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'MaterialEditor'>;

export default function MaterialEditorScreen({ navigation, route }: Props) {
  const existing = route.params?.material;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [moduleName, setModuleName] = useState(existing?.module ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [resourceUrl, setResourceUrl] = useState(existing?.resourceUrl ?? '');
  const [price, setPrice] = useState(String(existing?.price ?? 0));
  const [published, setPublished] = useState(existing?.published ?? true);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await learningRepository.saveMaterial(
        {
          title,
          subject,
          module: moduleName,
          description,
          resourceUrl,
          price: Number(price) || 0,
          published,
        },
        existing?._id
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    try {
      await learningRepository.deleteMaterial(existing._id);
      navigation.popToTop();
    } catch (err) {
      Alert.alert('Could not delete', apiError(err));
    }
  };

  return (
    <ScreenLayout title={existing ? 'Edit material' : 'New material'} showBack activeTab="Learning">
      <FieldLabel text="Title" />
      <TextInput style={[inputStyle, styles.gap]} value={title} onChangeText={setTitle} />
      <FieldLabel text="Subject" />
      <TextInput style={[inputStyle, styles.gap]} value={subject} onChangeText={setSubject} />
      <FieldLabel text="Module" />
      <TextInput style={[inputStyle, styles.gap]} value={moduleName} onChangeText={setModuleName} />
      <FieldLabel text="Description" />
      <TextInput style={[inputStyle, styles.area]} value={description} onChangeText={setDescription} multiline />
      <FieldLabel text="Resource URL" />
      <TextInput style={[inputStyle, styles.gap]} value={resourceUrl} onChangeText={setResourceUrl} autoCapitalize="none" />
      <FieldLabel text="Price (LKR, 0 = free)" />
      <TextInput style={[inputStyle, styles.gap]} value={price} onChangeText={setPrice} keyboardType="numeric" />
      <View style={styles.row}>
        <Text style={styles.pub}>Published</Text>
        <Switch value={published} onValueChange={setPublished} trackColor={{ true: colors.gold }} />
      </View>
      <PrimaryButton label="Save" onPress={save} loading={loading} />
      {existing ? (
        <View style={styles.mt}>
          <SecondaryButton label="Delete" onPress={remove} />
        </View>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 12 },
  area: { minHeight: 90, textAlignVertical: 'top', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pub: { fontWeight: '700', color: colors.navy },
  mt: { marginTop: 12 },
});
